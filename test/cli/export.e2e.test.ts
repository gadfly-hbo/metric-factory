import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runExport(instancePath: string, outDir: string, format = "metricflow") {
  return spawnSync(process.execPath, [bin, "export", instancePath, "--format", format, "--out", outDir], {
    encoding: "utf8"
  });
}

test("export metricflow：微调实例导出为双段 YAML，增删改生效", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-export-"));
  const r = runExport("test/fixtures/instance-ecommerce.yaml", outDir);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);

  const outPath = join(outDir, "metricflow.yaml");
  expect(existsSync(outPath)).toBe(true);

  const doc = parseYaml(readFileSync(outPath, "utf8")) as {
    semantic_models: {
      name: string;
      model: { ref: string };
      measures: { name: string; agg: string }[];
      dimensions: { name: string; type: string }[];
    }[];
    metrics: {
      name: string;
      label: string;
      type: string;
      description: string;
      type_params: { measure?: { name: string }; numerator?: { name: string }; denominator?: { name: string }; expr?: unknown };
    }[];
  };

  expect(doc.semantic_models.length).toBeGreaterThanOrEqual(1);
  const sm = doc.semantic_models[0]!;
  expect(sm.model.ref).toBeTruthy();
  expect(sm.measures.length).toBeGreaterThanOrEqual(1);
  expect(sm.dimensions.some((d) => d.type === "time")).toBe(true);

  // 53 个模板指标 − 1 removed(nps) + 1 手工 added = 53
  expect(doc.metrics.length).toBe(53);
  const names = doc.metrics.map((m) => m.name);
  expect(names).not.toContain("nps");
  expect(names).toContain("custom_gmv_excluding_gift");
  expect(new Set(names).size).toBe(names.length);

  // 修改生效：gmv 的新口径写进 description，且出处列（description 前缀）存在
  const gmv = doc.metrics.find((m) => m.name === "gmv")!;
  expect(gmv.description).toContain("公司财务口径 2026 版");
  expect(gmv.label).toBe("成交总额");

  // 引用一致性：simple/cumulative 指标的 measure 存在于 semantic model；ratio 的分子分母存在
  const measureNames = new Set(sm.measures.map((m) => m.name));
  for (const m of doc.metrics) {
    if (m.type_params?.measure?.name) {
      expect(measureNames.has(m.type_params.measure.name), `指标 ${m.name} 的 measure 缺失`).toBe(true);
    }
    if (m.type_params?.numerator?.name) {
      expect(measureNames.has(m.type_params.numerator.name), `指标 ${m.name} 的分子 measure 缺失`).toBe(true);
    }
    if (m.type_params?.denominator?.name) {
      expect(measureNames.has(m.type_params.denominator.name), `指标 ${m.name} 的分母 measure 缺失`).toBe(true);
    }
  }
});

test("fail-closed：未审核 LLM 指标阻断导出并给出明确报错", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-block-"));
  const r = runExport("test/fixtures/instance-llm-unreviewed.yaml", outDir);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("ai_suggested_magic_metric");
  expect(out).toContain("审核");
  expect(existsSync(join(outDir, "metricflow.yaml"))).toBe(false);
});

test("fail-closed 放行：origin=manual 与 origin=template 不受阻断", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-pass-"));
  const r = runExport("test/fixtures/instance-ecommerce.yaml", outDir);
  expect(r.status).toBe(0);
});
