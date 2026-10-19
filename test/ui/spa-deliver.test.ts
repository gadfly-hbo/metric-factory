// A2 T6：检查与交付——G7 审核行 / 复核确认（designIssues 零门）/ G3 自动版本交付 / same-content 阻断 / SAP 直链。
// AT2 零指标战略全流程（faux）。
import { test, expect, beforeAll, afterAll } from "vitest";
import { createUiServer } from "../../src/ui/server.js";
import { mkdtemp, mkdir, cp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const repoRoot = path.resolve(__dirname, "../..");

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

let workspace: string;
let templatesDir: string;
let server: ReturnType<typeof createUiServer>;
let origin: string;

beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "mf-spa-t6-"));
  templatesDir = await mkdtemp(path.join(tmpdir(), "mf-spa-t6-tpl-"));
  await cp(path.join(repoRoot, "templates"), templatesDir, { recursive: true });
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(path.join(workspace, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_BP });
  server = createUiServer({ workspaceDir: workspace, templatesDir, envFilePath: path.join(workspace, ".env.local") });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

const api = (p: string, method: string, body?: unknown) =>
  fetch(`${origin}${p}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

let systemId: string;

test("AT2 全流程：NL 创建（faux 零指标战略）→ 复核 → 交付 1.0.0 → same-content 拒绝", async () => {
  // 1. NL 创建 → 自动落盘
  const gen = await api("/api/instances/create-job", "POST", { need: "是否继续扩店？比较候选道路。" });
  expect(gen.status).toBe(202);
  const { jobId } = await gen.json();
  let job: { status: string; instanceId: string | null } | null = null;
  for (let i = 0; i < 50; i++) {
    job = await (await fetch(`${origin}/api/jobs/${jobId}`)).json();
    if (job!.status !== "running") break;
    await new Promise(r => setTimeout(r, 100));
  }
  expect(job && job.status === "done").toBe(true);
  systemId = job!.instanceId!;

  let dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(systemId)}`)).json();
  expect(dto.metrics).toHaveLength(0); // 零指标定性设计
  expect(dto.reviewPending).toHaveLength(0); // 无 LLM 指标 → 审核行空
  expect(dto.engineReady).toBe(false); // 未复核

  // 2. 复核确认（designIssues 零 → 通过）
  const confirm = await api(`/api/instances/${encodeURIComponent(systemId)}/confirm-review`, "POST", { confirmed_by: "测试复核人" });
  expect(confirm.status).toBe(200);
  dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(systemId)}`)).json();
  expect(dto.confirmed).toBe(true);
  expect(dto.engineReady).toBe(true); // 引擎交付门就绪

  // 3. 交付（G3 自动版本 1.0.0）
  const deliver = await api(`/api/instances/${encodeURIComponent(systemId)}/deliver`, "POST", {});
  expect(deliver.status).toBe(201);
  const result = await deliver.json();
  expect(result.version).toBe("1.0.0");
  // releases 落盘
  const indexDoc = parseYaml(await readFile(path.join(workspace, "releases", "index.yaml"), "utf8"));
  expect(indexDoc.releases).toHaveLength(1);
  expect(indexDoc.releases[0].version).toBe("1.0.0");

  // 4. same-content 二次交付 → 422 拒绝（demo 复刻串）
  const dup = await api(`/api/instances/${encodeURIComponent(systemId)}/deliver`, "POST", {});
  expect(dup.status).toBe(422);
  expect((await dup.json()).errors[0]).toContain("无需重复生成");

  // 5. 修改设计 → 复核失效 → 交付阻断（缺口门）
  const patch = await api(`/api/instances/${encodeURIComponent(systemId)}/blueprint`, "PATCH", { purpose: "更新后的目的（使复核失效）" });
  expect(patch.status).toBe(200);
  dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(systemId)}`)).json();
  expect(dto.confirmed).toBe(false); // stale
  expect(dto.engineReady).toBe(false);
  const blocked = await api(`/api/instances/${encodeURIComponent(systemId)}/deliver`, "POST", {});
  expect(blocked.status).toBe(422);

  // 6. SAP 直链导出（交付后仍可下载；未复核时被门阻断——先恢复复核再导）
  const reconfirm = await api(`/api/instances/${encodeURIComponent(systemId)}/confirm-review`, "POST", { confirmed_by: "测试复核人" });
  expect(reconfirm.status).toBe(200);
  const sap = await fetch(`${origin}/api/instances/${encodeURIComponent(systemId)}/export/sap`);
  expect(sap.status).toBe(200);
  const sapText = await sap.text();
  expect(sapText).not.toContain("prototype: true"); // C24：无合成标记
  expect(sapText).toContain("blueprint"); // 蓝图段随包
});

test("G7 审核行：LLM 指标待审阻断交付；批准后解除", async () => {
  // 造一个含 LLM 待审指标的实例（faux 载荷带 added_metrics）
  const fauxWithMetric = JSON.stringify({
    blueprint: JSON.parse(FAUX_BP).blueprint,
    added_metrics: [{
      name: "store_revenue", display_name: "单店收入", type: "simple", definition: "门店合格收入。",
      dimensions: [], time_grains: ["month"], owner_role: "运营"
    }],
    added_scenarios: []
  });
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(path.join(workspace, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: fauxWithMetric });
  const gen = await api("/api/instances/create-job", "POST", { need: "单店贡献分析" });
  const { jobId } = await gen.json();
  let job: { status: string; instanceId: string | null } | null = null;
  for (let i = 0; i < 50; i++) {
    job = await (await fetch(`${origin}/api/jobs/${jobId}`)).json();
    if (job!.status !== "running") break;
    await new Promise(r => setTimeout(r, 100));
  }
  const mid = job!.instanceId!;
  let dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(mid)}`)).json();
  expect(dto.reviewPending).toHaveLength(1);
  expect(dto.reviewPending[0].name).toBe("store_revenue");
  expect(dto.engineReady).toBe(false); // 审核阻断

  // 拒绝路径 → 指标移除
  const reject = await api(`/api/instances/${encodeURIComponent(mid)}/reject-metric`, "POST", { name: "store_revenue" });
  expect(reject.status).toBe(200);
  dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(mid)}`)).json();
  expect(dto.reviewPending).toHaveLength(0);
  expect(dto.metrics).toHaveLength(0);

  // 再造待审 → 批准路径 → reviewed_by 写入
  await writeManagedEnv(path.join(workspace, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: fauxWithMetric });
  const gen2 = await api("/api/instances/create-job", "POST", { need: "单店贡献分析二" });
  const { jobId: j2 } = await gen2.json();
  let job2: { status: string; instanceId: string | null } | null = null;
  for (let i = 0; i < 50; i++) {
    job2 = await (await fetch(`${origin}/api/jobs/${j2}`)).json();
    if (job2!.status !== "running") break;
    await new Promise(r => setTimeout(r, 100));
  }
  const mid2 = job2!.instanceId!;
  const approve = await api(`/api/instances/${encodeURIComponent(mid2)}/approve-metric`, "POST", { name: "store_revenue", reviewer: "审核人甲" });
  expect(approve.status).toBe(200);
  const doc = parseYaml(await readFile(path.join(workspace, mid2), "utf8"));
  expect(doc.added[0].provenance.reviewed_by).toBe("审核人甲");
});

test("Playwright：AT2 复核 → 交付 → published 块 + 版本 + same-content toast（真实 UI）", { timeout: 240_000 }, async () => {
  expect.hasAssertions();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pageErrors: string[] = [];
    page.on("pageerror", e => pageErrors.push(e.message));
    // AT2 体系（第一测试的 systemId，已恢复复核有效）
    await page.goto(`${origin}/#work/${encodeURIComponent(systemId)}/review`);
    await page.locator(".work-tabs").waitFor({ timeout: 20000 });
    expect(pageErrors).toEqual([]);
    // 交付（G3 自动 next patch：1.0.0 → 1.0.1；内容已变且复核有效）
    await page.locator('[data-action="deliver"]').click();
    await page.waitForFunction(() => document.querySelector(".published dd")?.textContent === "1.0.1", { timeout: 20000 });
    // same-content 再交付 → toast 复刻串（等文案切换，避开首条成功 toast 的存活窗口）
    await page.locator('[data-action="deliver"]').click();
    await page.waitForFunction(() => document.querySelector("#toast")?.textContent?.includes("无需重复生成"), { timeout: 15000 });
    // releases 双版本
    const indexDoc = parseYaml(await readFile(path.join(workspace, "releases", "index.yaml"), "utf8"));
    expect(indexDoc.releases).toHaveLength(2);
    expect(indexDoc.releases[1].version).toBe("1.0.1");
  } finally {
    await browser.close();
  }
});
