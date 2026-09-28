import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runLint(target: string) {
  return spawnSync(process.execPath, [bin, "lint", target], { encoding: "utf8" });
}

test("lint 对合法种子模板通过", () => {
  const r = runLint("templates/ecommerce-marketplace.yaml");
  expect(r.status).toBe(0);
  expect(r.stdout).toContain("PASS");
});

test("lint 拒绝空口径并定位到指标", () => {
  const r = runLint("test/fixtures/bad-missing-definition.yaml");
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("definition");
});

test("lint 拒绝悬空维度引用并指明维度名", () => {
  const r = runLint("test/fixtures/bad-dangling-dimension.yaml");
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("dimension");
  expect(out).toContain("vip_level");
});

test("lint 拒绝缺失出处", () => {
  const r = runLint("test/fixtures/bad-missing-provenance.yaml");
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("provenance");
});

test("lint 拒绝 trees 引用不存在的指标", () => {
  const r = runLint("test/fixtures/bad-tree-ref.yaml");
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("nonexistent_metric");
});

test("lint 拒绝 type_params 引用不存在的指标", () => {
  const r = runLint("test/fixtures/bad-type-params-ref.yaml");
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("type-params-ref");
  expect(out).toContain("nonexistent_metric");
});
