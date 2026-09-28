import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
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

test("跨模板匹配：订阅答案向量经 init 选中 SaaS 模板", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-saas-init-"));
  const r = run(["init", "--answers", "examples/saas-answers.yaml", "--out", outDir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("saas-subscription");

  const inst = parseYaml(readFileSync(join(outDir, "instance.yaml"), "utf8")) as { base: string };
  expect(inst.base).toBe("saas-subscription@0.1.0");
});

test("SaaS 实例走通 export 三格式（metricflow / excel / mermaid）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-saas-export-"));

  const mf = run(["export", "test/fixtures/instance-saas.yaml", "--format", "metricflow", "--out", outDir]);
  expect(mf.status, `stderr: ${mf.stderr}`).toBe(0);
  expect(existsSync(join(outDir, "metricflow.yaml"))).toBe(true);

  const xl = run(["export", "test/fixtures/instance-saas.yaml", "--format", "excel", "--out", outDir]);
  expect(xl.status, `stderr: ${xl.stderr}`).toBe(0);
  expect(existsSync(join(outDir, "metric-dictionary.xlsx"))).toBe(true);

  const md = run(["export", "test/fixtures/instance-saas.yaml", "--format", "mermaid", "--out", outDir]);
  expect(md.status, `stderr: ${md.stderr}`).toBe(0);
  const mermaid = readFileSync(join(outDir, "metric-tree.mmd"), "utf8");
  expect(mermaid).toContain("北极星");
  expect(mermaid).toContain("净收入留存");
});

test("SaaS 实例导出通过 MetricFlow JSON Schema 契约校验", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-saas-contract-"));
  const r = run(["export", "test/fixtures/instance-saas.yaml", "--format", "metricflow", "--out", outDir]);
  expect(r.status).toBe(0);

  const doc = parseYaml(readFileSync(join(outDir, "metricflow.yaml"), "utf8"));
  const ajv = new Ajv({ strict: false });
  const validate = ajv.compile(schema);
  expect(validate(doc), JSON.stringify(validate.errors)).toBe(true);
});

test("SaaS 实例通过 validate", () => {
  const r = run(["validate", "test/fixtures/instance-saas.yaml"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
});
