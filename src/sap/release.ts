// release：SAP 资产包版本发布（快照 + index 登记；PRD 决策 #1-#6 + GRILL G1/G3/G5/G10）
// 管线复用既有导出全链（loadInstance → 基模板 → materialize → 全量校验 → export gate → assembleSap →
// validateSapPackage），零第二套规则；发布动作 = 登记侧写盘（快照 + append-only index），SAP 包结构与契约冻结面零改动。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import { loadInstance, loadTemplate, type LoadError } from "../engine/loader.js";
import { materialize } from "../engine/materialize.js";
import { validateInstance } from "../engine/validate.js";
import { MappingSchema, type Mapping } from "../schema/mapping.js";
import type { Template } from "../schema/template.js";
import { assertExportable } from "../export/gate.js";
import { buildGenerator, packageIdFromInstancePath } from "../export/sap.js";
import { assembleSap } from "./assemble.js";
import { validateSapPackage } from "./validate.js";
import { canonicalize, contentFingerprint } from "./canonical.js";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
export const RELEASE_INDEX_FILENAME = "index.yaml";

export const ReleaseIndexEntrySchema = z.object({
  package: z.string().min(1),
  version: z.string().regex(SEMVER_RE),
  content_fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  package_fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  created_at: z.string().min(1),
  released_by: z.string().min(1),
  note: z.string(),
  file: z.string().min(1)
});

export const ReleaseIndexSchema = z.object({
  releases: z.array(ReleaseIndexEntrySchema).default([])
});

export type ReleaseIndexEntry = z.infer<typeof ReleaseIndexEntrySchema>;
export type ReleaseIndex = z.infer<typeof ReleaseIndexSchema>;

// 结构化信息：UI 按 rule 分流渲染 R4–R7（内联错误需要 value/createdAt，错误卡需要 issues/detail 行）
export interface ReleaseErrorInfo {
  /** R4：格式化 "[rule] path: message" 行（实例/模板/SAP 校验失败） */
  issues?: string[];
  /** R5：用户提交的非法版本原文 */
  value?: string;
  /** R6：既有发布的 package@version 与 created_at */
  packageId?: string;
  publishedVersion?: string;
  createdAt?: string;
  /** R7：index 解析/形状错误细节 */
  detail?: string;
}

export class ReleaseError extends Error {
  constructor(
    public readonly rule: string,
    message: string,
    public readonly info: ReleaseErrorInfo = {}
  ) {
    super(message);
    this.name = "ReleaseError";
  }
}

export interface ReleaseSameContentWarning {
  package: string;
  version: string;
  content_fingerprint: string;
}

export interface ReleaseResult {
  packageId: string;
  version: string;
  contentFingerprint: string;
  packageFingerprint: string;
  snapshotPath: string;
  indexPath: string;
  /** 追加后的 1 起算序号（R2 登记行「追加为第 N 条」） */
  indexEntryNumber: number;
  warning?: ReleaseSameContentWarning;
}

export interface ReleaseOptions {
  instancePath: string;
  /** 包版本（semver；位置参数，G1） */
  version: string;
  templatesDir: string;
  /** releases 基目录（CLI 默认 ./releases；UI 为实例工作区根下 releases/） */
  releasesDir: string;
  releasedBy: string;
  note?: string;
  /** 显式映射文件路径；缺省自动发现 <实例名>.mapping.yaml（与 export 同语义） */
  mappingPath?: string;
  /** ISO-8601；测试可冻结 */
  now: string;
  /** 覆盖 generator（测试可冻结；缺省 buildGenerator()） */
  generator?: string;
}

function formatLoadErrors(path: string, errors: LoadError[]): string {
  return errors.map((e) => `[schema] ${path} ${e.path}: ${e.message}`).join("\n");
}

// 与 cli/server 的模板目录扫描同语义：目录内任一模板损坏即 fail-closed（lint 门管目录健康）
async function findBaseTemplate(templatesDir: string, baseId: string): Promise<Template> {
  let entries: string[];
  try {
    entries = (await readdir(templatesDir)).filter((n) => n.endsWith(".yaml")).sort();
  } catch (e) {
    throw new ReleaseError("templates-dir", `无法读取模板目录 ${templatesDir}：${(e as Error).message}`);
  }
  for (const f of entries) {
    const path = join(templatesDir, f);
    const loaded = await loadTemplate(path);
    if (!loaded.ok) {
      throw new ReleaseError("template-invalid", formatLoadErrors(path, loaded.errors), {
        issues: loaded.errors.map((e) => `[schema] ${path} ${e.path}: ${e.message}`)
      });
    }
    if (loaded.template.template.id === baseId) return loaded.template;
  }
  throw new ReleaseError("base-template-missing", `找不到基模板 ${baseId}（目录：${templatesDir}）`);
}

// 映射装配与 export 同语义：显式路径 = 必填（损坏即错）；自动发现 = 损坏静默视为无映射
function loadMappingForRelease(mappingPath: string, required: boolean): Mapping {
  let doc: unknown;
  try {
    doc = parseYaml(readFileSync(mappingPath, "utf8"));
  } catch (e) {
    if (required) {
      throw new ReleaseError("mapping-invalid", `无法读取映射文件 ${mappingPath}：${(e as Error).message}`);
    }
    return { base: "", mappings: [] };
  }
  const parsed = MappingSchema.safeParse(doc);
  if (!parsed.success) {
    if (required) {
      const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new ReleaseError("mapping-invalid", `映射文件不合法 ${mappingPath}：${detail}`);
    }
    return { base: "", mappings: [] };
  }
  return parsed.data;
}

function readReleaseIndex(indexPath: string): ReleaseIndex {
  if (!existsSync(indexPath)) return { releases: [] };
  let doc: unknown;
  try {
    doc = parseYaml(readFileSync(indexPath, "utf8"));
  } catch (e) {
    throw new ReleaseError(
      "index-corrupt",
      `发布登记损坏，拒绝发布（fail-closed，不静默重建）：${indexPath}\n${(e as Error).message}\n请用 git 恢复该文件后重试`,
      { detail: (e as Error).message }
    );
  }
  const parsed = ReleaseIndexSchema.safeParse(doc);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ReleaseError(
      "index-corrupt",
      `发布登记形状非法，拒绝发布（fail-closed，不静默重建）：${indexPath}\n${detail}\n请用 git 恢复该文件后重试`,
      { detail }
    );
  }
  return parsed.data;
}

export async function releaseInstance(opts: ReleaseOptions): Promise<ReleaseResult> {
  // R3 路径安全：version 强制 semver（天然排除路径分隔符），写盘前拒绝
  if (!SEMVER_RE.test(opts.version)) {
    throw new ReleaseError(
      "invalid-version",
      `版本 "${opts.version}" 不是 semver（要求 ^\\d+\\.\\d+\\.\\d+$），拒绝发布`,
      { value: opts.version }
    );
  }

  const packageId = packageIdFromInstancePath(opts.instancePath);
  const indexPath = join(opts.releasesDir, RELEASE_INDEX_FILENAME);

  // G3：登记先读后写；损坏 → 拒绝，不静默重建
  const index = readReleaseIndex(indexPath);

  // 不可变：同 id@version 已存在 → 拒绝（内容相同也拒）
  const dup = index.releases.find((e) => e.package === packageId && e.version === opts.version);
  if (dup) {
    throw new ReleaseError(
      "duplicate-release",
      `${packageId}@${opts.version} 已发布于 ${dup.created_at}，请升级版本号（发布不可变：同 id@version 不可重复发布）`,
      { packageId, publishedVersion: dup.version, createdAt: dup.created_at }
    );
  }

  const loaded = await loadInstance(opts.instancePath);
  if (!loaded.ok) {
    throw new ReleaseError("instance-invalid", formatLoadErrors(opts.instancePath, loaded.errors), {
      issues: loaded.errors.map((e) => `[schema] ${opts.instancePath} ${e.path}: ${e.message}`)
    });
  }
  const instance = loaded.instance;

  const baseId = instance.base.split("@")[0]!;
  const base = await findBaseTemplate(opts.templatesDir, baseId);
  const materialized = materialize(base, instance);

  const mappingPath = opts.mappingPath ?? opts.instancePath.replace(/\.yaml$/, ".mapping.yaml");
  const mapping = loadMappingForRelease(mappingPath, Boolean(opts.mappingPath));
  if (mapping.mappings.length > 0) {
    const names = new Set(materialized.metrics.map((m) => m.name));
    materialized.mapping = mapping.mappings.filter((m) => names.has(m.metric));
  }

  const issues = validateInstance(materialized, base, instance);
  if (issues.length > 0) {
    const detail = issues.map((i) => `[${i.rule}] ${opts.instancePath} ${i.path}: ${i.message}`).join("\n");
    throw new ReleaseError("instance-validation", `实例校验未通过，拒绝发布（零写盘）：\n${detail}`, {
      issues: issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)
    });
  }

  assertExportable(materialized.metrics);

  const pkg = assembleSap(materialized, base, {
    packageId,
    version: opts.version,
    createdAt: opts.now,
    generator: opts.generator ?? buildGenerator(),
    bindings: materialized.mapping ?? [],
    instanceConceptRefs: instance.concept_refs
  });

  const sapIssues = validateSapPackage(pkg);
  if (sapIssues.length > 0) {
    const detail = sapIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`).join("\n");
    throw new ReleaseError("sap-validation", `SAP 包校验未通过，拒绝发布（零写盘）：\n${detail}`, {
      issues: sapIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)
    });
  }

  const cfp = contentFingerprint(pkg);
  const pfp = pkg.package.fingerprint;

  // G5：内容指纹与任意既有条目相同 → 允许但警告（无业务变化的无意义版本递增）
  const same = index.releases.find((e) => e.content_fingerprint === cfp);
  const warning: ReleaseSameContentWarning | undefined = same
    ? { package: same.package, version: same.version, content_fingerprint: cfp }
    : undefined;

  // 写盘：快照 → index 追加（append-only，不改写既有条目）
  const snapshotDir = join(opts.releasesDir, packageId);
  mkdirSync(snapshotDir, { recursive: true });
  const snapshotPath = join(snapshotDir, `${opts.version}.sap.yaml`);
  writeFileSync(snapshotPath, canonicalize(pkg), "utf8");

  index.releases.push({
    package: packageId,
    version: opts.version,
    content_fingerprint: cfp,
    package_fingerprint: pfp,
    created_at: opts.now,
    released_by: opts.releasedBy,
    note: opts.note ?? "",
    file: `${packageId}/${opts.version}.sap.yaml`
  });
  writeFileSync(indexPath, stringifyYaml(index), "utf8");

  return {
    packageId,
    version: opts.version,
    contentFingerprint: cfp,
    packageFingerprint: pfp,
    snapshotPath,
    indexPath,
    indexEntryNumber: index.releases.length,
    warning
  };
}
