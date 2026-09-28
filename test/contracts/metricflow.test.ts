import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { Ajv } from "ajv";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const schema = JSON.parse(
  readFileSync(fileURLToPath(new URL("./metricflow.schema.json", import.meta.url)), "utf8")
) as object;

test("导出的 MetricFlow YAML 通过 JSON Schema 契约校验（100%）", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-contract-"));
  const r = spawnSync(
    process.execPath,
    [bin, "export", "test/fixtures/instance-ecommerce.yaml", "--format", "metricflow", "--out", outDir],
    { encoding: "utf8" }
  );
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);

  const doc = parseYaml(readFileSync(join(outDir, "metricflow.yaml"), "utf8"));
  const ajv = new Ajv({ strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(doc);
  expect(validate.errors ?? []).toEqual([]);
  expect(valid).toBe(true);
});
