import { spawn } from "node:child_process";
import { mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 切片 5：UI 基建（真实 server + fetch 边界）
async function startUi() {
  const server = createUiServer({ authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"), templatesDir: "templates"  });
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
  expect(html).toContain("凭据仅存本机");
  expect(html).toContain("创建实例"); // 工作流引导（Web 闭环）
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
  expect(html).toContain('chip chip-ok">正式 · 模板出处</span>');
  const res404 = await fetch(`${base}/templates/nope`);
  expect(res404.status).toBe(404);
  server.close();
});

test("设计 token 落地：全局「中文专业工作台」基线色板进入 CSS 变量", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/`);
  const html = await res.text();
  // 新基线（2026-10-09）：克制绿主动作 + 中性浅表面 + 语义状态色
  for (const token of ["--accent: #28674e", "--accent-strong: #20573f", "--accent-soft: #edf5ef",
    "--ok: #1a7f4b", "--warn: #8a5a10", "--fail: #c0392b",
    "--bg: #f5f6f8", "--border: #dfe3ea", "--text: #1d2433"]) {
    expect(html).toContain(token);
  }
  // 旧 09-28 橘色契约退场
  expect(html).not.toContain("#e8643a");
  // 语义状态色仍色+文字双通道（chip 类保留）
  expect(html).toContain("chip-ok");
  server.close();
});

test("仅监听 127.0.0.1", async () => {
  const { server } = await startUi();
  const addr = server.address();
  expect(addr).toBeTruthy();
  expect((addr as { address: string }).address).toBe("127.0.0.1");
  server.close();
});

test("杜邦树：公式算符、北极星与模块分组（模板页）", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/templates/ecommerce-marketplace`);
  const html = await res.text();
  // gmv = uv × cvr × aov → 两个乘法算符徽标
  expect((html.match(/data-op="×"/g) ?? []).length).toBeGreaterThanOrEqual(2);
  // 北极星徽标与决策指引
  expect(html).toContain("北极星候选");
  expect(html).toContain("交易平台优先 GMV");
  // 分模块折叠区
  expect(html).toContain("棵分解树");
  for (const cat of ["规模", "质量", "结构", "效率", "旅程"]) {
    expect(html).toContain(cat);
  }
  // 指标级公式 chip（ltv 不在电商；用 take_rate 分子分母在 saas——电商用 gmv 树根公式）
  expect(html).toContain("gmv = uv × cvr × aov");
  server.close();
});

test("杜邦树：实例页勾稽徽标（已修改/待审核/未入树）", async () => {
  const server = createUiServer({ authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"), templatesDir: "templates", instancePath: "test/fixtures/instance-ecommerce.yaml"  });
  const port = await listenUi(server, 0);
  const base = `http://127.0.0.1:${port}`;
  const html = await (await fetch(`${base}/instance`)).text();
  // fixture 修改了 gmv 口径 → 已修改徽标；删除了 nps → 树中无该节点
  expect(html).toContain("已修改");
  expect(html).not.toMatch(/t-id">nps</);
  // added 指标入「未入树」区
  expect(html).toContain("新增指标（未入树）");
  expect(html).toContain("custom_gmv_excluding_gift");
  server.close();
});
