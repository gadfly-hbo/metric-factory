import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

test("init --answers 非交互产出可加载实例且口径取值落盘", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-init-"));
  const r = spawnSync(
    process.execPath,
    [bin, "init", "--answers", "examples/ecommerce-answers.yaml", "--out", outDir],
    { encoding: "utf8", cwd: process.cwd() }
  );

  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("ecommerce-marketplace");

  const instancePath = join(outDir, "instance.yaml");
  expect(existsSync(instancePath)).toBe(true);

  const inst = parseYaml(readFileSync(instancePath, "utf8")) as {
    base: string;
    answers: { revenue_model: string };
    caliber_switches: Record<string, Record<string, boolean>>;
  };
  expect(inst.base).toBe("ecommerce-marketplace@0.1.0");
  expect(inst.answers.revenue_model).toBe("交易抽佣");
  // 问卷口径偏好覆盖模板默认值
  expect(inst.caliber_switches.gmv?.include_refund).toBe(true);
  expect(inst.caliber_switches.gmv?.include_shipping).toBe(false);
});
