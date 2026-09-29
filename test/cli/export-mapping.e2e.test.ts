import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { Ajv } from "ajv";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const schema = JSON.parse(
  readFileSync(fileURLToPath(new URL("../contracts/metricflow.schema.json", import.meta.url)), "utf8")
) as object;

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

test("映射实例导出：真实 model.ref 与列名，未映射指标占位并标注", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-expmap-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);

  // 数仓映射链路：draft → apply
  const draft = join(dir, "map-draft.yaml");
  expect(run(["map", inst, "--manifest", "test/fixtures/dbt-manifest.json", "--catalog", "test/fixtures/dbt-catalog.json", "--draft", draft]).status).toBe(0);
  expect(run(["map", inst, "--apply", draft, "--reviewer", "张三"]).status).toBe(0);

  const out = run(["export", inst, "--format", "metricflow", "--out", dir]);
  expect(out.status, `stderr: ${out.stderr}`).toBe(0);

  const raw = readFileSync(join(dir, "metricflow.yaml"), "utf8");
  const doc = parseYaml(raw) as {
    semantic_models: { name: string; model: { ref: string }; measures: { name: string; agg: string; expr: string }[] }[];
    metrics: { name: string; type_params: { measure?: { name: string } } }[];
  };

  // 真实模型引用：gmv 落在 fct_orders，measure expr 是真实列名而非占位
  const ordersModel = doc.semantic_models.find((s) => s.model.ref === "fct_orders");
  expect(ordersModel).toBeTruthy();
  const gmvMeasure = ordersModel!.measures.find((m) => m.name === "gmv");
  expect(gmvMeasure!.expr).toBe("gmv");

  // ref ∈ fixture 模型集；已映射 measure.expr ∈ 真实列集
  const modelNames = new Set(["fct_orders", "fct_traffic", "fct_payments", "dim_user", "mf_placeholder_ecommerce_marketplace"]);
  for (const sm of doc.semantic_models) {
    expect(modelNames.has(sm.model.ref), `ref ${sm.model.ref} 不在 manifest 模型集`).toBe(true);
  }
  const realColumns = new Set(["order_id", "gmv", "order_count", "aov", "uv", "pay_amount"]);
  for (const sm of doc.semantic_models) {
    if (sm.model.ref.startsWith("mf_placeholder")) continue;
    for (const m of sm.measures) {
      expect(realColumns.has(m.expr), `${sm.model.ref}.${m.name} 的 expr "${m.expr}" 不是真实列`).toBe(true);
    }
  }

  // 未映射指标仍导出（占位模型）且头部标注数量
  expect(raw).toMatch(/未映射/);
  const cvr = doc.metrics.find((m) => m.name === "cvr");
  expect(cvr).toBeTruthy();

  // 契约 schema 仍 100% 通过
  const ajv = new Ajv({ strict: false });
  const validate = ajv.compile(schema);
  expect(validate(doc), JSON.stringify(validate.errors)).toBe(true);
});

test("无映射文件时导出维持占位（向后兼容）", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-expmap2-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-saas.yaml", inst);
  const r = run(["export", inst, "--format", "metricflow", "--out", dir]);
  expect(r.status).toBe(0);
  const raw = readFileSync(join(dir, "metricflow.yaml"), "utf8");
  expect(raw).toContain("mf_placeholder_saas_subscription");
  expect(raw).not.toMatch(/未映射/);
});
