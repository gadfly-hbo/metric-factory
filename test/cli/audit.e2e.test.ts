import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

test("audit：examples 两实例零 ERROR 零 WARN（无误报基线）", () => {
  for (const p of ["examples/ecommerce-instance.yaml", "examples/saas-instance.yaml"]) {
    const r = run(["audit", p]);
    expect(r.status, `${p} stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout).toContain("PASS");
    expect(r.stdout).not.toContain("WARN");
    expect(r.stdout).not.toContain("ERROR");
  }
});

test("audit：坏实例分类命中且分级正确，ERROR 导致退出非 0", () => {
  const r = run(["audit", "test/fixtures/instance-audit-bad.yaml"]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("虚荣指标");
  expect(out).toContain("ad_click_count");
  expect(out).toContain("不完整");
  expect(out).toContain("no_dim_metric");
  expect(out).toContain("short_def_metric");
});

test("audit --json 输出结构化结果", () => {
  const r = run(["audit", "test/fixtures/instance-audit-bad.yaml", "--json"]);
  expect(r.status).not.toBe(0);
  const parsed = JSON.parse(r.stdout) as {
    findings: { rule: string; severity: string; metric: string; message: string }[];
  };
  expect(parsed.findings.length).toBeGreaterThanOrEqual(3);
  for (const f of parsed.findings) {
    expect(["ERROR", "WARN"]).toContain(f.severity);
    expect(f.metric.length).toBeGreaterThan(0);
  }
  expect(parsed.findings.some((f) => f.rule === "vanity" && f.severity === "WARN")).toBe(true);
  expect(parsed.findings.some((f) => f.severity === "ERROR")).toBe(true);
});
