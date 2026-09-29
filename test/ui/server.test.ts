import { spawn } from "node:child_process";
import { mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 切片 5：UI 基建（真实 server + fetch 边界）
async function startUi() {
  const server = createUiServer({ templatesDir: "templates" });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

test("GET /：工作台首页含模板入口与边界声明", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("模板库");
  expect(html).toContain("本机运行");
  expect(html).toContain("不联网");
  server.close();
});

test("GET /templates：六模板列表", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/templates`);
  expect(res.status).toBe(200);
  const html = await res.text();
  for (const id of ["ecommerce-marketplace", "saas-subscription", "content-community", "digital-marketing", "supply-chain-logistics", "cloud-cost"]) {
    expect(html).toContain(id);
  }
  server.close();
});

test("GET /templates/:id：指标字典表格与口径列", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/templates/ecommerce-marketplace`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("成交总额");
  expect(html).toContain("口径");
  expect(html).toContain("出处");
  expect(html).toContain("53");
  // 语义 chip 双通道：chip 类名与状态文字成对出现（type 值的 accent chip）
  expect(html).toContain('chip chip-accent">simple</span>');
  expect(html).toContain('chip chip-ok">模板出处</span>');
  const res404 = await fetch(`${base}/templates/nope`);
  expect(res404.status).toBe(404);
  server.close();
});

test("设计 token 落地：Xanthil 色板进入 CSS 变量", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/`);
  const html = await res.text();
  expect(html).toContain("#0f766e"); // accent
  expect(html).toContain("#f7f6f3"); // bg
  expect(html).toContain("#1f1e1b"); // text
  server.close();
});

test("仅监听 127.0.0.1", async () => {
  const { server } = await startUi();
  const addr = server.address();
  expect(addr).toBeTruthy();
  expect((addr as { address: string }).address).toBe("127.0.0.1");
  server.close();
});
