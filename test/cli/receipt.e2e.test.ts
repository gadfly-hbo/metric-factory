import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

// receipt CLI e2e（进程边界；PRD 实现决策 #5/#6 + 契约 v0.3 §6.2）
// 期望值按契约/PRD 行为推导，不来自实现输出

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const ECOMMERCE = "test/fixtures/instance-ecommerce.yaml";

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): RunResult {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" }) as unknown as RunResult;
}

function setupRegistry(): { rel: string; fingerprint: string } {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-receipt-")), "releases");
  const r = runCli(["release", ECOMMERCE, "1.0.0", "--out", rel]);
  if (r.status !== 0) throw new Error(`release failed: ${r.stderr}`);
  const index = parseYaml(readFileSync(join(rel, "index.yaml"), "utf8"));
  return { rel, fingerprint: index.releases[0].content_fingerprint };
}

function receiptYaml(fingerprint: string, overrides: Record<string, string> = {}): string {
  return `task_id: ${overrides.task_id ?? "task-2026-001"}
package:
  id: instance-ecommerce
  version: 1.0.0
  content_fingerprint: ${overrides.fingerprint ?? fingerprint}
  package_fingerprint: sha256:${"c".repeat(64)}
adopted_metrics:
  - name: gmv
adopted_scenarios: []
issues_found:
  - kind: missing_data
    metric: refund_amount
    detail: 退款记录缺退款完成时间字段
computed_at: "2026-10-12T08:00:00.000Z"
`;
}

test("add：合法回执登记成功（对账一致），收编副本含供应侧字段 received_at/reconciliation", () => {
  const { rel, fingerprint } = setupRegistry();
  const file = join(rel, "..", "receipt-src.yaml");
  writeFileSync(file, receiptYaml(fingerprint), "utf8");

  const r = runCli(["receipt", "add", file, "--out", rel]);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("task-2026-001");
  expect(r.stdout).toContain("对账一致");

  const storedPath = join(rel, "receipts", "task-2026-001.receipt.yaml");
  expect(existsSync(storedPath)).toBe(true);
  const stored = parseYaml(readFileSync(storedPath, "utf8"));
  expect(stored.task_id).toBe("task-2026-001");
  expect(stored.received_at).toBeTruthy();
  expect(stored.reconciliation.status).toBe("对账一致");
  expect(stored.reconciliation.checked_at).toBeTruthy();
});

test("add：对账不一致（指纹篡改）→ 登记成功但状态对账不一致（记录不拒绝）", () => {
  const { rel, fingerprint } = setupRegistry();
  const tampered = fingerprint.slice(0, -1) + (fingerprint.endsWith("0") ? "1" : "0");
  const file = join(rel, "..", "receipt-tampered.yaml");
  writeFileSync(file, receiptYaml(tampered), "utf8");

  const r = runCli(["receipt", "add", file, "--out", rel]);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("对账不一致");

  const stored = parseYaml(readFileSync(join(rel, "receipts", "task-2026-001.receipt.yaml"), "utf8"));
  expect(stored.reconciliation.status).toBe("对账不一致");
});

test("add：重复 task_id → 拒绝（含原 task_id 与已登记时间），副本不变", () => {
  const { rel, fingerprint } = setupRegistry();
  const file = join(rel, "..", "receipt-src.yaml");
  writeFileSync(file, receiptYaml(fingerprint), "utf8");
  expect(runCli(["receipt", "add", file, "--out", rel]).status).toBe(0);
  const before = readFileSync(join(rel, "receipts", "task-2026-001.receipt.yaml"), "utf8");

  const r = runCli(["receipt", "add", file, "--out", rel]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("task-2026-001");
  expect(out).toContain("已登记于");
  expect(readFileSync(join(rel, "receipts", "task-2026-001.receipt.yaml"), "utf8")).toBe(before);
});

test("add：schema 违规 → [receipt] 逐行 + 零写盘", () => {
  const { rel, fingerprint } = setupRegistry();
  const bad = receiptYaml(fingerprint)
    .replace("task_id: task-2026-001\n", "")
    .replace("kind: missing_data", "kind: whatever");
  const file = join(rel, "..", "receipt-bad.yaml");
  writeFileSync(file, bad, "utf8");

  const r = runCli(["receipt", "add", file, "--out", rel]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("[receipt]");
  expect(out).toContain("task_id");
  expect(existsSync(join(rel, "receipts"))).toBe(false);
});

test("add：index 缺失 → index-missing 拒绝零写盘；index 损坏 → index-corrupt 拒绝（git 恢复指引）", () => {
  const missing = join(mkdtempSync(join(tmpdir(), "mf-receipt-noidx-")), "releases");
  const file = join(missing, "..", "receipt.yaml");
  writeFileSync(file, receiptYaml(`sha256:${"d".repeat(64)}`), "utf8");
  const r1 = runCli(["receipt", "add", file, "--out", missing]);
  expect(r1.status).not.toBe(0);
  expect(r1.stdout + r1.stderr).toContain("index-missing");
  expect(r1.stdout + r1.stderr).toContain("先在供应侧发布");
  expect(existsSync(join(missing, "receipts"))).toBe(false);

  const corrupt = join(mkdtempSync(join(tmpdir(), "mf-receipt-corrupt-")), "releases");
  mkdirSync(corrupt, { recursive: true });
  writeFileSync(join(corrupt, "index.yaml"), "releases: [ { broken", "utf8");
  const file2 = join(corrupt, "..", "receipt.yaml");
  writeFileSync(file2, receiptYaml(`sha256:${"d".repeat(64)}`), "utf8");
  const r2 = runCli(["receipt", "add", file2, "--out", corrupt]);
  expect(r2.status).not.toBe(0);
  expect(r2.stdout + r2.stderr).toContain("index-corrupt");
  expect(r2.stdout + r2.stderr).toContain("git 恢复");
});

test("list：received_at 倒序（后登记在前）；--package 过滤；空态文案", () => {
  const { rel, fingerprint } = setupRegistry();
  const f1 = join(rel, "..", "r1.yaml");
  writeFileSync(f1, receiptYaml(fingerprint, { task_id: "task-a" }), "utf8");
  const f2 = join(rel, "..", "r2.yaml");
  writeFileSync(f2, receiptYaml(fingerprint, { task_id: "task-b" }), "utf8");
  expect(runCli(["receipt", "add", f1, "--out", rel]).status).toBe(0);
  // 两条登记间隔 ≥2ms，保证 received_at 可区分（ISO 毫秒精度）
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  expect(runCli(["receipt", "add", f2, "--out", rel]).status).toBe(0);

  const list = runCli(["receipt", "list", "--out", rel]);
  expect(list.status).toBe(0);
  expect(list.stdout).toContain("task-a");
  expect(list.stdout).toContain("task-b");
  expect(list.stdout).toContain("对账一致");
  // G1 倒序：后登记的 task-b 在 task-a 之前
  expect(list.stdout.indexOf("task-b")).toBeLessThan(list.stdout.indexOf("task-a"));

  const filtered = runCli(["receipt", "list", "--out", rel, "--package", "other-package"]);
  expect(filtered.status).toBe(0);
  expect(filtered.stdout).toContain("无已登记回执");
});
