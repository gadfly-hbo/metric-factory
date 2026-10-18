import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 采用回执区块 UI e2e（真实 server + fetch；.flow/ui-contract.md RC0–RC6 + T 术语表 + G5）
// A1：回执区块自 /instance 迁入「04 检查与交付」视图（/instance/delivery），POST 重渲染同视图
// 期望值按 UI 契约逐字推导，不来自实现输出

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function setupWorkspace(withRegistry: boolean): { dir: string; inst: string; fingerprint: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-rcpt-ui-"));
  const inst = join(dir, "ecommerce-instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);
  let fingerprint = `sha256:${"e".repeat(64)}`;
  if (withRegistry) {
    const r = spawnSync(process.execPath, [bin, "release", inst, "1.0.0", "--out", join(dir, "releases")], {
      encoding: "utf8"
    });
    if (r.status !== 0) throw new Error(`release failed: ${r.stderr}`);
    const index = parseYaml(readFileSync(join(dir, "releases", "index.yaml"), "utf8"));
    fingerprint = index.releases[0].content_fingerprint;
  }
  return { dir, inst, fingerprint };
}

async function startUi(dir: string, inst: string) {
  const server = createUiServer({ authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"), templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local"), instancePath: inst  });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

function receiptYaml(fingerprint: string, overrides: Record<string, string> = {}): string {
  return `task_id: ${overrides.task_id ?? "task-2026-001"}
package:
  id: ${overrides.package_id ?? "ecommerce-instance"}
  version: 1.0.0
  content_fingerprint: ${fingerprint}
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

function post(base: string, yaml: string) {
  return fetch(`${base}/instance/receipts`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ receipt: yaml }).toString()
  });
}

test("RC0：工作区无 releases/ → 区块只有标题+说明+表单，无列表卡", async () => {
  const { dir, inst } = setupWorkspace(false);
  const { server, base } = await startUi(dir, inst);
  const html = await (await fetch(`${base}/instance/delivery`)).text();
  expect(html).toContain("采用回执");
  expect(html).toContain('action="/instance/receipts"');
  expect(html).toContain("回执 YAML（粘贴契约 §6.2 格式的采用回执，必填）");
  expect(html).not.toContain("已登记回执（");
  server.close();
});

test("RC1→RC3：空态 → 粘贴登记成功 200（列表置顶+对账一致徽标+表单清空），副本落盘", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);

  const before = await (await fetch(`${base}/instance/delivery`)).text();
  expect(before).toContain("当前包（ecommerce-instance）尚无采用回执");
  expect(before).toContain("也可用 CLI receipt add &lt;file&gt; 登记"); // 原始 HTML 中尖括号转义

  const res = await post(base, receiptYaml(fingerprint));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("已登记回执（1）");
  expect(html).toContain("对账一致");
  expect(html).toContain("task-2026-001");
  expect(html).not.toContain("task-2026-001\npackage:"); // 表单清空：textarea 不含粘贴原文
  expect(html).not.toContain(">task-2026-001\npackage:");

  const stored = parseYaml(
    readFileSync(join(dir, "releases", "receipts", "task-2026-001.receipt.yaml"), "utf8")
  );
  expect(stored.reconciliation.status).toBe("对账一致");
  expect(stored.received_at).toBeTruthy();
  server.close();
});

test("RC3m：指纹不一致 → 登记成功 200 + 对账不一致徽标（记录不拒绝）", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);
  const tampered = fingerprint.slice(0, -1) + (fingerprint.endsWith("0") ? "1" : "0");

  const res = await post(base, receiptYaml(tampered));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("已登记回执（1）");
  expect(html).toContain("对账不一致");
  expect(existsSync(join(dir, "releases", "receipts", "task-2026-001.receipt.yaml"))).toBe(true);
  server.close();
});

test("RC2 排序：received_at 倒序（后登记在前）", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);
  expect((await post(base, receiptYaml(fingerprint, { task_id: "task-early" }))).status).toBe(200);
  // 回拨首条 received_at 至固定过去时间，使两条次序可区分
  const stored1 = join(dir, "releases", "receipts", "task-early.receipt.yaml");
  writeFileSync(stored1, readFileSync(stored1, "utf8").replace(/received_at: .+/, "received_at: 2026-10-01T00:00:00.000Z"), "utf8");
  expect((await post(base, receiptYaml(fingerprint, { task_id: "task-late" }))).status).toBe(200);

  const html = await (await fetch(`${base}/instance/delivery`)).text();
  expect(html.indexOf("task-late")).toBeLessThan(html.indexOf("task-early"));
  server.close();
});

test("RC4：schema 违规 → 422 逐行 [receipt] + 值保留 + 零写盘", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);
  const bad = receiptYaml(fingerprint).replace("task_id: task-2026-001\n", "").replace("kind: missing_data", "kind: whatever");

  const res = await post(base, bad);
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("回执未通过校验（零写盘）");
  expect(html).toContain('id="receipt-issues"');
  expect(html).toContain("[receipt] task_id");
  expect(html).toContain("issues_found.0.kind");
  expect(html).toContain("kind: whatever");
  expect(existsSync(join(dir, "releases", "receipts"))).toBe(false);
  server.close();
});

test("RC5：重复登记 → 422 内联错误（T-12 含原 task_id 与已登记于），值保留", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);
  expect((await post(base, receiptYaml(fingerprint))).status).toBe(200);
  const before = readFileSync(join(dir, "releases", "receipts", "task-2026-001.receipt.yaml"), "utf8");

  const res = await post(base, receiptYaml(fingerprint));
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain('task_id &quot;task-2026-001&quot; 已登记于'); // 原始 HTML 中引号转义
  expect(html).toContain("不可重复登记（append-only）；如为新任务请更换 task_id。");
  expect(html).toContain('aria-invalid="true"');
  expect(readFileSync(join(dir, "releases", "receipts", "task-2026-001.receipt.yaml"), "utf8")).toBe(before);
  server.close();
});

test("RC6：index 损坏 → 422 错误卡（T-13 + git 恢复），列表照常渲染，零写盘", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);
  writeFileSync(join(dir, "releases", "index.yaml"), "releases: [ { broken", "utf8");

  const res = await post(base, receiptYaml(fingerprint));
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("登记被拒绝 · releases/index.yaml 不可用");
  expect(html).toContain("releases/index.yaml 缺失或损坏（");
  expect(html).toContain("请用 git 恢复后重试；登记不会自动重建或覆盖它。");
  expect(html).toContain('id="receipt-issues"');
  expect(existsSync(join(dir, "releases", "receipts"))).toBe(false);
  server.close();
});

test("G5：跨包回执登记成功但本包列表不新增；boundary 文案为 A1 版（O1）", async () => {
  const { dir, inst, fingerprint } = setupWorkspace(true);
  const { server, base } = await startUi(dir, inst);
  expect((await post(base, receiptYaml(fingerprint))).status).toBe(200);

  const res = await post(base, receiptYaml(fingerprint, { task_id: "task-other", package_id: "other-package" }));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("已登记回执（1）"); // 本包列表不新增
  expect(html).toContain("回执按包全局登记，此处仅展示当前包");

  const home = await (await fetch(`${base}/`)).text();
  expect(home).toContain("写操作仅限本地实例、模板库（导入/另存方法）、映射文件与 releases/ 发布登记");
  server.close();
});
