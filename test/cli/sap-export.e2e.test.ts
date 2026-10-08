import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";
import { packageFingerprint } from "../../src/sap/canonical.js";

// SAP CLI 导出 e2e（进程边界：spawn dist/cli.js；PRD「CLI」段 + GRILL Q1 + D1）
// 期望值按契约 §3/§3.5/§4 与 PRD 字面推导，不来自实现输出

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const pkgVersion = (JSON.parse(readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8")) as { version: string }).version;
const ECOMMERCE = "test/fixtures/instance-ecommerce.yaml";

function runExport(instancePath: string, outDir: string, format = "sap") {
  return spawnSync(process.execPath, [bin, "export", instancePath, "--format", format, "--out", outDir], {
    encoding: "utf8"
  });
}

function readExported(outDir: string, name: string) {
  return parseYaml(readFileSync(join(outDir, name), "utf8")) as any;
}

test("export sap：契约段齐全（sap 0.1 / design_only / fingerprint / namespace mf. / generator），文件名 <实例名>.sap.yaml", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-sap-"));
  const r = runExport(ECOMMERCE, outDir);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("已导出");

  const outPath = join(outDir, "instance-ecommerce.sap.yaml");
  expect(existsSync(outPath)).toBe(true);
  const raw = readFileSync(outPath, "utf8");

  const doc = readExported(outDir, "instance-ecommerce.sap.yaml");
  expect(doc.sap).toBe("0.1");
  expect(doc.runtime_state).toBe("design_only");
  expect(doc.package.fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(doc.package.id).toBe("instance-ecommerce");
  expect(doc.package.namespace).toBe("mf.instance-ecommerce");
  const sha = process.env.MF_GIT_SHA;
  if (sha) {
    // 运行时覆盖通道：精确断言
    expect(doc.package.generator).toBe(`metric-factory@${pkgVersion}+${sha}`);
  } else {
    // 构建期注入或纯版本号兜底：断言格式（dist 烘焙 sha / src 直跑无 sha 两种上下文都合法）
    expect(doc.package.generator).toMatch(new RegExp(`^metric-factory@${pkgVersion.replace(/\./g, "\\.")}(\\+[0-9a-f]{7,40})?$`));
  }

  // 文件字节含契约字面（规范化序列化：非标量保守加双引号）
  expect(raw).toContain('sap: "0.1"');
  expect(raw).toContain("runtime_state: design_only");
  expect(raw).toContain("namespace: mf.instance-ecommerce");
  expect(raw).toContain('fingerprint: "sha256:');
  expect(raw).toContain('generator: "metric-factory@');

  // 指纹自引用一致：对落盘内容重算（置空规则）= 声明值
  expect(packageFingerprint(doc)).toBe(doc.package.fingerprint);

  // §3.5 review 段与维度透传；53 = 53 模板指标 − 1 removed + 1 added
  expect(doc.review.gate).toBe("metric-factory-export-gate");
  expect(doc.review.unreviewed).toEqual([]);
  expect(doc.metrics.length).toBe(53);
  expect(doc.dimensions.length).toBeGreaterThan(0);
  expect(doc.scenarios).toEqual([]);
  expect(doc.bindings).toEqual([]);
});

test("fail-closed：未审核 LLM 指标阻断 SAP 导出并给出明确报错（与三格式同一语义）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-sap-block-"));
  const r = runExport("test/fixtures/instance-llm-unreviewed.yaml", outDir);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("ai_suggested_magic_metric");
  expect(out).toContain("审核");
  expect(existsSync(join(outDir, "instance-llm-unreviewed.sap.yaml"))).toBe(false);
});

test("fail-closed 放行：origin=llm 但已审核（reviewed_by）的实例可导出 SAP", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-sap-pass-"));
  const r = runExport("test/fixtures/instance-llm-reviewed.yaml", outDir);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  expect(existsSync(join(outDir, "instance-llm-reviewed.sap.yaml"))).toBe(true);
});

test("指纹跨运行一致（忽略 created_at，GRILL Q1）：两次导出规范化语义内容深等、重算指纹相等", () => {
  const dirA = mkdtempSync(join(tmpdir(), "mf-sap-run-a-"));
  const dirB = mkdtempSync(join(tmpdir(), "mf-sap-run-b-"));
  const ra = runExport(ECOMMERCE, dirA);
  const rb = runExport(ECOMMERCE, dirB);
  expect(ra.status, `stderr: ${ra.stderr}`).toBe(0);
  expect(rb.status, `stderr: ${rb.stderr}`).toBe(0);

  const a = readExported(dirA, "instance-ecommerce.sap.yaml");
  const b = readExported(dirB, "instance-ecommerce.sap.yaml");
  // created_at 为契约 §3 必填时间戳，跨运行必然不同（不计入一致断言）
  expect(a.package.created_at).not.toBe(b.package.created_at);

  // 冻结时间戳后：语义内容深等，且指纹按冻结内容重算相等（对账可用）
  const freeze = (d: any) => {
    d.package.created_at = "FROZEN";
    d.review.exported_at = "FROZEN";
    d.package.fingerprint = packageFingerprint(d);
    return d;
  };
  expect(freeze(a)).toEqual(freeze(b));
});

const L1_INSTANCE = `instance:
  created_at: "2026-10-08T00:00:00.000Z"
base: ecommerce-marketplace@0.1.0
answers:
  revenue_model: 交易抽佣
  user_structure: 双边市场
  core_loop: 交易
  caliber: {}
caliber_switches: {}
removed: []
modified: []
added:
  - name: l1_metric_a
    display_name: L1 指标甲
    type: simple
    definition: 带 L1 契约字段的测试指标甲
    dimensions: [channel]
    time_grains: [day]
    owner_role: 电商业务负责人
    caliber_switches: {}
    aggregation:
      allowed_dimensions: [channel]
      disallowed_dimensions: [region]
    statistic_object:
      id: concept-order
      version: 1.0.0
      source: protege:order@1.0.0
      role: statistic_object
    caliber_type: [refund_adjustment, fee_composition]
    provenance:
      origin: manual
      note: l1 fixture
    review:
      required: false
  - name: l1_metric_b
    display_name: L1 指标乙
    type: simple
    definition: 带 L1 契约字段的测试指标乙
    dimensions: [channel]
    time_grains: [day]
    owner_role: 电商业务负责人
    caliber_switches: {}
    statistic_object:
      id: concept-order
      version: 1.0.0
      source: protege:order@1.0.0
      role: dimension_semantics
    provenance:
      origin: manual
      note: l1 fixture
    review:
      required: false
  - name: l1_metric_c
    display_name: L1 指标丙
    type: simple
    definition: 带 L1 契约字段的测试指标丙
    dimensions: [channel]
    time_grains: [day]
    owner_role: 电商业务负责人
    caliber_switches: {}
    statistic_object:
      id: concept-order
      version: 1.0.0
      source: protege:order@1.0.0
      role: statistic_object
    provenance:
      origin: manual
      note: l1 fixture
    review:
      required: false
concept_refs:
  - id: concept-order
    version: 1.0.0
    source: protege:order@1.0.0
    role: dimension_semantics
`;

test("L1 字段与 concept_refs 随包传递：去重键 (id,version,role)，实例文件名 slugify 为包 id / 下载文件名", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mf-sap-l1-"));
  // 文件名含大写 / 空格 / 下划线：slugify（小写、非法字符→-、折叠连续 -）是包 id 约束的推论
  const instancePath = join(tmp, "L1 Shop_Instance.yaml");
  writeFileSync(instancePath, L1_INSTANCE, "utf8");
  const outDir = join(tmp, "out");

  const r = runExport(instancePath, outDir);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);

  const doc = readExported(outDir, "l1-shop-instance.sap.yaml");
  expect(doc.package.id).toBe("l1-shop-instance");
  expect(doc.package.namespace).toBe("mf.l1-shop-instance");

  // concept_refs = 实例级 ∪ 指标 statistic_object，按 (id,version,role) 去重（GRILL Q2）：
  // 乙与实例级引用同键（#dimension_semantics）被吞并，丙与甲同键（#statistic_object）被吞并 → 恰 2 条
  expect(doc.concept_refs.length).toBe(2);
  const keys = doc.concept_refs.map((ref: any) => `${ref.id}@${ref.version}#${ref.role ?? ""}`).sort();
  expect(keys).toEqual(["concept-order@1.0.0#dimension_semantics", "concept-order@1.0.0#statistic_object"]);

  // 指标条目携带 L1 契约字段（aggregation 两表 / caliber_type 枚举数组 / statistic_object 引用）
  const a = doc.metrics.find((m: any) => m.name === "l1_metric_a");
  expect(a.aggregation.allowed_dimensions).toEqual(["channel"]);
  expect(a.aggregation.disallowed_dimensions).toEqual(["region"]);
  expect(a.caliber_type).toEqual(["refund_adjustment", "fee_composition"]);
  expect(a.statistic_object).toMatchObject({ id: "concept-order", version: "1.0.0", role: "statistic_object" });
});

test("查重拒绝：物化指标重名 → 供应侧 duplicate-identity 非零退出", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mf-sap-dupe-"));
  const instancePath = join(tmp, "dupe-name.yaml");
  writeFileSync(
    instancePath,
    `instance:
  created_at: "2026-10-08T00:00:00.000Z"
base: ecommerce-marketplace@0.1.0
answers:
  revenue_model: 交易抽佣
  user_structure: 双边市场
  core_loop: 交易
  caliber: {}
caliber_switches: {}
removed: []
modified: []
added:
  - name: gmv
    display_name: 与模板重名的违规指标
    type: simple
    definition: 与基模板 gmv 重名，供应侧查重应拒绝
    dimensions: [channel]
    time_grains: [day]
    owner_role: 电商业务负责人
    caliber_switches: {}
    provenance:
      origin: manual
      note: duplicate name fixture
    review:
      required: false
`,
    "utf8"
  );
  const outDir = join(tmp, "out");
  const r = runExport(instancePath, outDir);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("gmv");
  expect(out).toContain("重名");
  expect(existsSync(join(outDir, "dupe-name.sap.yaml"))).toBe(false);
});

test("D1：未知格式错误串与 help 枚举串同步含 sap", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-sap-d1-"));
  const r = runExport(ECOMMERCE, outDir, "foo");
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("metricflow | excel | mermaid | sap");

  const help = spawnSync(process.execPath, [bin, "export", "--help"], { encoding: "utf8" });
  expect(help.status).toBe(0);
  expect(help.stdout).toContain("metricflow | excel | mermaid | sap");
});
