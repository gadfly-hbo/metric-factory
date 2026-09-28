import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

test.each([
  ["examples/ecommerce-instance.yaml"],
  ["examples/saas-instance.yaml"]
])("示例实例通过 validate：%s", (instancePath) => {
  const r = spawnSync(process.execPath, [bin, "validate", instancePath], { encoding: "utf8" });
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("PASS");
});
