// A2 T3：NL 创建流（composer → create-job → 轮询 → G1 自动落盘 → 进 work）。
// faux 确定性后端；API 面 + Playwright 真实 UI 全链。
import { test, expect, beforeAll, afterAll } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, readdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parse as parseYaml } from "yaml";

const FAUX_BP = JSON.stringify({
  blueprint: {
    title: "门店扩张选择分析体系",
    intent: "设计具体分析方案",
    purpose: "评估是否继续扩店，比较候选道路的收益与代价。",
    decision: "下一阶段是否继续扩店？",
    boundary: "不承诺资源投入；选址执行归运营。",
    deliverable: "候选道路比较与试点建议。",
    contexts: ["战略选择"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "现有店型是否值得复制？", detail: "看单店回收。", metric_refs: [] }],
    hypotheses: [
      { id: "h1", statement: "现有店型可回收。", support: "单店模型。", counter: "样本期太短。", change_condition: "回收期超阈值则放弃。" }
    ],
    evidence_plan: [
      { id: "e1", name: "单店回收模型", kind: "测算模型", source: "财务与运营记录", check: "复核假设参数", insufficiency: "缺失时只输出定性比较" }
    ],
    options: [
      { id: "expand", name: "选择性继续扩店", tradeoff: "占用资本；需证明店型可复制。" },
      { id: "hold", name: "暂停扩店优化存量", tradeoff: "放弃增长窗口。" }
    ]
  },
  added_metrics: [],
  added_scenarios: []
});

function startServer(dir: string) {
  const server = createUiServer({
    authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"),
    templatesDir: "templates",
    workspaceDir: dir,
    envFilePath: join(dir, ".env.local")
  });
  return { server, start: listenUi(server, 0) };
}

test("API：create-job 空需求 422；faux 生成自动落盘 system-*；workspace/instances 可读", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-spa-create-"));
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(join(dir, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_BP });
  const { server, start } = startServer(dir);
  const port = await start;
  const base = `http://127.0.0.1:${port}`;
  try {
    // 空需求 fail-closed
    const empty = await fetch(`${base}/api/instances/create-job`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ need: "  " }) });
    expect(empty.status).toBe(422);

    // 发起创建 job
    const gen = await fetch(`${base}/api/instances/create-job`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ need: "销售在增长，利润却下降，是否继续扩店？" }) });
    expect(gen.status).toBe(202);
    const { jobId } = await gen.json();
    expect(jobId).toBeTruthy();

    // 轮询至完成（faux 即时）
    let job: { status: string; instanceId: string | null; error?: string } | null = null;
    for (let i = 0; i < 50; i++) {
      job = await (await fetch(`${base}/api/jobs/${jobId}`)).json();
      if (job!.status !== "running") break;
      await new Promise(r => setTimeout(r, 100));
    }
    expect(job && job.status === "done").toBe(true);
    expect(job!.instanceId).toMatch(/^system-\d{8}-\d{6}\/instance\.yaml$/);

    // 落盘事实：目录 + instance.yaml（blank base + blueprint）
    const instPath = join(dir, job!.instanceId!);
    expect(existsSync(instPath)).toBe(true);
    const raw = await readFile(instPath, "utf8");
    const doc = parseYaml(raw);
    expect(doc.blueprint.title).toBe("门店扩张选择分析体系");
    expect(doc.base).toBeUndefined(); // D13 空白基座

    // workspace 列出 + DTO 可读
    const ws = await (await fetch(`${base}/api/workspace`)).json();
    expect(ws.systems.some((s: { id: string }) => s.id === job!.instanceId)).toBe(true);
    const dto = await (await fetch(`${base}/api/instances/${encodeURIComponent(job!.instanceId!)}`)).json();
    expect(dto.title).toBe("门店扩张选择分析体系");
    expect(dto.blueprint.options).toHaveLength(2);

    // 未知 job → 404 结构化
    const nf = await fetch(`${base}/api/jobs/00000000-0000-0000-0000-000000000000`);
    expect(nf.status).toBe(404);
  } finally {
    server.close();
  }
});

test("Playwright：一句话 → 生成中 → 自动进 work 总览（hash 路由/四 stage/助手栏）", { timeout: 150_000 }, async () => {
  expect.hasAssertions();
  const dir = mkdtempSync(join(tmpdir(), "mf-spa-create-ui-"));
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(join(dir, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_BP });
  const { server, start } = startServer(dir);
  const port = await start;
  const base = `http://127.0.0.1:${port}`;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + "/");
    await page.locator("#need").fill("销售在增长，利润却下降，是否继续扩店？");
    await page.locator('[data-action="generate"]').click();
    // 生成中视图（demo 形态）——faux 下很快穿越，断言终态 work
    await page.locator(".work-tabs").waitFor({ timeout: 20000 });
    expect(await page.locator(".work-tabs .tab").count()).toBe(4);
    await page.locator(".work-tabs [data-stage='overview'].active").waitFor({ state: "visible", timeout: 15_000 });
    // 标题 = faux 蓝图 title；hash 深链 #work/<id>/overview
    expect(await page.locator(".system-title h1").textContent()).toBe("门店扩张选择分析体系");
    expect(page.url()).toMatch(/#work\/system-\d{8}-\d{6}%2Finstance\.yaml\/overview$/);
    // 助手栏（demo 右侧栏形态）
    await page.locator(".assistant").waitFor({ state: "visible", timeout: 15_000 });
    // stage 切换照搬（review）
    await page.locator('.work-tabs [data-stage="review"]').click();
    await page.locator(".work-tabs [data-stage='review'].active").waitFor({ state: "visible", timeout: 15_000 });
    expect(page.url()).toMatch(/\/review$/);
    // 刷新恢复（hash 路由 → 同体系同 stage）
    await page.reload();
    await page.locator(".work-tabs").waitFor({ timeout: 20000 });
    await page.locator(".work-tabs [data-stage='review'].active").waitFor({ state: "visible", timeout: 15_000 });
    expect(await page.locator(".system-title h1").textContent()).toBe("门店扩张选择分析体系");
    // 落盘事实
    const entries = await readdir(dir);
    expect(entries.some(e => /^system-\d{8}-\d{6}$/.test(e))).toBe(true);
  } finally {
    await browser.close(); server.close();
  }
});

test("Playwright：生成失败态（faux 畸形输出）→ toast + 回 home，需求文本保留", { timeout: 150_000 }, async () => {
  expect.hasAssertions();
  const dir = mkdtempSync(join(tmpdir(), "mf-spa-create-err-"));
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(join(dir, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: "{not json" });
  const { server, start } = startServer(dir);
  const port = await start;
  const base = `http://127.0.0.1:${port}`;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + "/");
    await page.locator("#need").fill("帮我把经营问题拆清楚");
    await page.locator('[data-action="generate"]').click();
    // 失败 → toast（demo 语汇）+ 回 home + 需求保留
    await page.locator("#toast:not([hidden])").waitFor({ timeout: 30000 });
    expect(await page.locator("#toast").textContent()).toContain("生成未完成");
    expect(await page.locator("#need").inputValue()).toBe("帮我把经营问题拆清楚");
    // 零落盘
    const entries = await readdir(dir);
    expect(entries.some(e => e.startsWith("system-"))).toBe(false);
  } finally {
    await browser.close(); server.close();
  }
});
