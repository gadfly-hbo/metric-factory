import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

const BAD_INSTANCES: [string, string[]][] = [
  ["instance-bad-dangling-dim.yaml", ["dangling", "unknown_dim"]],
  ["instance-bad-empty-def.yaml", ["definition"]],
  ["instance-bad-provenance.yaml", ["template_ref"]],
  ["instance-llm-unreviewed.yaml", ["审核"]],
  ["instance-bad-modified-missing.yaml", ["修改目标"]]
];

test.each(BAD_INSTANCES)("validate 拒绝坏实例：%s", (fixture, keywords) => {
  const r = run(["validate", `test/fixtures/${fixture}`]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  for (const kw of keywords) {
    expect(out).toContain(kw);
  }
});

test("validate 通过合法实例", () => {
  const r = run(["validate", "test/fixtures/instance-ecommerce.yaml"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("PASS");
});

test("diff 输出 added/removed/modified/caliber 四段且与构造一致", () => {
  const r = run(["diff", "test/fixtures/instance-ecommerce.yaml"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  const out = r.stdout;
  expect(out).toContain("删除");
  expect(out).toContain("nps");
  expect(out).toContain("修改");
  expect(out).toContain("gmv");
  expect(out).toContain("新增");
  expect(out).toContain("custom_gmv_excluding_gift");
  expect(out).toContain("口径");
  expect(out).toContain("include_refund");
});

test("diff --json 输出可解析的结构化差异", () => {
  const r = run(["diff", "test/fixtures/instance-ecommerce.yaml", "--json"]);
  expect(r.status).toBe(0);
  const parsed = JSON.parse(r.stdout) as {
    base: string;
    removed: string[];
    modified: { name: string }[];
    added: { name: string }[];
    caliber: { metric: string; key: string; from: boolean; to: boolean }[];
  };
  expect(parsed.base).toBe("ecommerce-marketplace@0.1.0");
  expect(parsed.removed).toEqual(["nps"]);
  expect(parsed.modified.map((m) => m.name)).toContain("gmv");
  expect(parsed.added.map((a) => a.name)).toContain("custom_gmv_excluding_gift");
  expect(parsed.caliber).toContainEqual({ metric: "gmv", key: "include_refund", from: false, to: true });
});

test("fail-closed 矩阵：已审核 LLM 指标放行导出", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-matrix-"));
  const r = run(["export", "test/fixtures/instance-llm-reviewed.yaml", "--out", outDir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
});
