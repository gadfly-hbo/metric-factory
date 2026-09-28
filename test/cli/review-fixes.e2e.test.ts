import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

test("export 拒绝校验不过的实例（dangling dimension 不再静默进入产物）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-fix-b-"));
  const r = run(["export", "test/fixtures/instance-bad-dangling-dim.yaml", "--format", "excel", "--out", outDir]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("dangling-dimension");
  expect(out).toContain("unknown_dim");
});

test("init 拒绝口径目标不存在的 answers（写盘前拦截）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-fix-c-"));
  const r = run(["init", "--answers", "test/fixtures/answers-caliber-wrong-target.yaml", "--out", outDir]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("caliber-target");
  expect(out).toContain("no_such_metric");
});

test("derived 指标导出携带 metrics 输入清单（MetricFlow 契约）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-fix-f-"));
  const r = run(["export", "test/fixtures/instance-ecommerce.yaml", "--format", "metricflow", "--out", outDir]);
  expect(r.status).toBe(0);
  const doc = parseYaml(readFileSync(join(outDir, "metricflow.yaml"), "utf8")) as {
    metrics: { name: string; type: string; type_params: { expr?: string; metrics?: { name: string }[] } }[];
  };
  const gmv = doc.metrics.find((m) => m.name === "gmv")!;
  expect(gmv.type).toBe("derived");
  expect(gmv.type_params.metrics?.map((m) => m.name).sort()).toEqual(["aov", "cvr", "uv"]);
  // arr = mrr * 12：数字不进 metrics 清单
  const arr = doc.metrics.find((m) => m.name === "arr");
  if (arr && arr.type_params.expr) {
    expect(arr.type_params.metrics?.map((m) => m.name)).toEqual(["mrr"]);
  }
});

test("cumulative 指标按真实类型导出（type_params.measure）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-fix-i-"));
  const r = run(["export", "test/fixtures/instance-cumulative.yaml", "--format", "metricflow", "--out", outDir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  const doc = parseYaml(readFileSync(join(outDir, "metricflow.yaml"), "utf8")) as {
    metrics: { name: string; type: string; type_params: { measure?: { name: string } } }[];
  };
  const cum = doc.metrics.find((m) => m.name === "cumulative_gmv_quarter");
  expect(cum).toBeTruthy();
  expect(cum!.type).toBe("cumulative");
  expect(cum!.type_params.measure?.name).toBe("gmv");
});

test("mermaid 每个 category 仅一个 subgraph", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-fix-d-"));
  const r = run(["export", "test/fixtures/instance-ecommerce.yaml", "--format", "mermaid", "--out", outDir]);
  expect(r.status).toBe(0);
  const content = readFileSync(join(outDir, "metric-tree.mmd"), "utf8");
  for (const cat of ["规模", "质量", "结构", "效率", "旅程"]) {
    const count = content.split(`subgraph CAT_${cat}[`).length - 1;
    expect(count, `subgraph CAT_${cat} 出现 ${count} 次`).toBeLessThanOrEqual(1);
  }
});

test("diff 不再列出无变化的口径项", () => {
  const r = run(["diff", "test/fixtures/instance-ecommerce.yaml"]);
  expect(r.status).toBe(0);
  expect(r.stdout).not.toContain("false → false");
  expect(r.stdout).toContain("include_refund");
});

test("S1：删除派生指标输入后 validate 与 export 均拦截悬空 type_params 引用", () => {
  const v = run(["validate", "test/fixtures/instance-removed-derived-input.yaml"]);
  expect(v.status).not.toBe(0);
  const vOut = v.stdout + v.stderr;
  expect(vOut).toContain("type-params-ref");
  expect(vOut).toContain("gmv");

  const outDir = mkdtempSync(join(tmpdir(), "mf-s1-"));
  const e = run(["export", "test/fixtures/instance-removed-derived-input.yaml", "--format", "metricflow", "--out", outDir]);
  expect(e.status).not.toBe(0);
  expect(e.stdout + e.stderr).toContain("type-params-ref");
});

test("S2：cumulative 指标带 window 导出（MetricFlow 契约）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-s2-"));
  const r = run(["export", "test/fixtures/instance-cumulative.yaml", "--format", "metricflow", "--out", outDir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  const doc = parseYaml(readFileSync(join(outDir, "metricflow.yaml"), "utf8")) as {
    metrics: { name: string; type_params: { measure?: { name: string }; window?: string } }[];
  };
  const cum = doc.metrics.find((m) => m.name === "cumulative_gmv_quarter")!;
  expect(cum.type_params.measure?.name).toBe("gmv");
  expect(cum.type_params.window).toBe("1 year");
});
