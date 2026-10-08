// SAP 0.1 语义资产包导出器（契约 §3/§3.5/§4；PRD「CLI」段管线冻结）
// 管线：现有 export gate（整批阻断）→ assembleSap → validateSapPackage（issues 非空即 throw，含 rule 列表）
// → canonicalize(包) 为文件内容。文件名 <packageId>.sap.yaml（CLI 侧 packageId = 实例文件名 slug）。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Exporter, ExportResult } from "./types.js";
import { assertExportable } from "./gate.js";
import { assembleSap } from "../sap/assemble.js";
import { validateSapPackage } from "../sap/validate.js";
import { canonicalize } from "../sap/canonical.js";
import type { ValidateIssue } from "../engine/validate.js";
import type { MaterializedInstance } from "../engine/materialize.js";
import type { Template, ConceptRef } from "../schema/template.js";

// 包 ID 约束（校验器 ^[a-z][a-z0-9-]*$）的推论：文件名 slug 化——小写、_ /空格/非法字符→-、折叠连续 -
export function slugifyPackageId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-");
}

export class SapExportValidationError extends Error {
  constructor(public readonly issues: ValidateIssue[]) {
    super(
      "SAP 包校验未通过（fail-closed，拒绝导出）：\n" +
        issues.map((i) => `  - [${i.rule}] ${i.path}: ${i.message}`).join("\n")
    );
    this.name = "SapExportValidationError";
  }
}

let cachedVersion: string | null = null;
// package.json version：从本模块向上找 name=metric-factory 的 package.json
// （dist 产物与 vitest 直跑 src 的相对深度不同，按名称定位两种上下文都正确）
function packageVersion(): string {
  if (cachedVersion !== null) return cachedVersion;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name?: string; version?: string };
      if (pkg.name === "metric-factory" && typeof pkg.version === "string" && pkg.version.length > 0) {
        cachedVersion = pkg.version;
        return cachedVersion;
      }
    } catch {
      // 本层无 package.json 或不是 metric-factory：继续向上
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("无法定位 metric-factory 的 package.json（SAP generator 版本未知）");
}

// PRD 回退语义：sha 正常由构建期注入（tsup define），此处读取 MF_GIT_SHA 环境回退，纯版本号兜底
export function buildGenerator(env: NodeJS.ProcessEnv = process.env): string {
  const sha = env.MF_GIT_SHA;
  return `metric-factory@${packageVersion()}${sha ? `+${sha}` : ""}`;
}

export interface SapExporterOptions {
  /** 物化实例的基模板（dimensions 透传来源） */
  template: Template;
  /** kebab-case 包 ID（CLI 侧 = 实例文件名 slug） */
  packageId: string;
  /** 实例级 concept_refs（随包传递，装配内与指标 statistic_object 并集去重） */
  instanceConceptRefs?: ConceptRef[];
}

export function createSapExporter(opts: SapExporterOptions): Exporter {
  return {
    format: "sap",
    async export(input: MaterializedInstance): Promise<ExportResult> {
      assertExportable(input.metrics);

      const pkg = assembleSap(input, opts.template, {
        packageId: opts.packageId,
        createdAt: new Date().toISOString(),
        generator: buildGenerator(),
        bindings: input.mapping ?? [],
        instanceConceptRefs: opts.instanceConceptRefs
      });

      const issues = validateSapPackage(pkg);
      if (issues.length > 0) {
        throw new SapExportValidationError(issues);
      }

      return { filename: `${opts.packageId}.sap.yaml`, content: canonicalize(pkg) };
    }
  };
}
