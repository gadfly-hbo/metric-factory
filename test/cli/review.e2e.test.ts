import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[], opts: { env?: Record<string, string> } = {}) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", env: { ...process.env, ...opts.env } });
}

function tmpInstance(fixture: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mf-review-"));
  const p = join(dir, "instance.yaml");
  copyFileSync(`test/fixtures/${fixture}`, p);
  return p;
}

test("review --approve 写入审核人并放行导出（fail-closed 闭环）", () => {
  const inst = tmpInstance("instance-llm-unreviewed.yaml");

  const blocked = run(["export", inst, "--format", "metricflow", "--out", join(inst, "..")]);
  expect(blocked.status).not.toBe(0);

  const r = run(["review", inst, "--approve", "ai_suggested_magic_metric", "--reviewer", "张三"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("已批准");

  const doc = parseYaml(readFileSync(inst, "utf8")) as {
    added: { name: string; provenance: { reviewed_by?: string } }[];
  };
  const m = doc.added.find((a) => a.name === "ai_suggested_magic_metric")!;
  expect(m.provenance.reviewed_by).toBe("张三");

  const allowed = run(["export", inst, "--format", "metricflow", "--out", join(inst, "..")]);
  expect(allowed.status, `stderr: ${allowed.stderr}`).toBe(0);
  expect(existsSync(join(inst, "..", "metricflow.yaml"))).toBe(true);
});

test("review --reject 从实例移除指标", () => {
  const inst = tmpInstance("instance-llm-unreviewed.yaml");
  const r = run(["review", inst, "--reject", "ai_suggested_magic_metric"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  const doc = parseYaml(readFileSync(inst, "utf8")) as { added: { name: string }[] };
  expect(doc.added.map((a) => a.name)).not.toContain("ai_suggested_magic_metric");
});

test("review 列出待审项；无待审时提示且退出 0", () => {
  const list = run(["review", "test/fixtures/instance-llm-unreviewed.yaml"]);
  expect(list.status, `stderr: ${list.stderr}`).toBe(0);
  expect(list.stdout).toContain("ai_suggested_magic_metric");
  expect(list.stdout).toContain("未审核");

  const none = run(["review", "test/fixtures/instance-ecommerce.yaml"]);
  expect(none.status).toBe(0);
  expect(none.stdout).toContain("无待审");
});

test("review 默认审核人取 MF_REVIEWER", () => {
  const inst = tmpInstance("instance-llm-unreviewed.yaml");
  const r = run(["review", inst, "--approve", "ai_suggested_magic_metric"], { env: { MF_REVIEWER: "李四" } });
  expect(r.status).toBe(0);
  const doc = parseYaml(readFileSync(inst, "utf8")) as {
    added: { provenance: { reviewed_by?: string } }[];
  };
  expect(doc.added[0]!.provenance.reviewed_by).toBe("李四");
});

test("review --approve 不存在的指标时报错", () => {
  const inst = tmpInstance("instance-llm-unreviewed.yaml");
  const r = run(["review", inst, "--approve", "no_such", "--reviewer", "张三"]);
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("no_such");
});

test("generate --dry-run：零配置打印完整 prompt 与 token 估算", () => {
  const r = run([
    "generate", "test/fixtures/instance-ecommerce.yaml",
    "--describe", "我们是跨境电商平台，主打低价秒杀",
    "--dry-run"
  ]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("跨境电商平台，主打低价秒杀");
  expect(r.stdout).toContain("gmv");
  expect(r.stdout).toContain("JSON");
  expect(r.stdout).toMatch(/token/i);
});

test("S4：approve 非待审指标（manual / 已审核）被拒绝且不改写记录", () => {
  const inst = tmpInstance("instance-ecommerce.yaml");
  const r = run(["review", inst, "--approve", "custom_gmv_excluding_gift", "--reviewer", "张三"]);
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("不在待审列表");

  const inst2 = tmpInstance("instance-llm-reviewed.yaml");
  const r2 = run(["review", inst2, "--approve", "custom_gmv_excluding_gift", "--reviewer", "李四"]);
  expect(r2.status).not.toBe(0);
});
