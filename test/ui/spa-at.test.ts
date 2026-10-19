// A2 T8：验收总装——AT1（模板起点→蓝图→交付）/ AT4（指标体系流→口径确认→交付→另存模板）
// / 敌意注入 / C 表全量 grep 复检。
import { test, expect, beforeAll, afterAll } from "vitest";
import { createUiServer } from "../../src/ui/server.js";
import { mkdtemp, mkdir, cp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const repoRoot = path.resolve(__dirname, "../..");

// AT1 refine 载荷：为模板实例补蓝图
const FAUX_AT1 = JSON.stringify({
  blueprint: {
    title: "电商经营诊断体系",
    intent: "建设可复用体系",
    purpose: "每周复盘经营质量，定位增长与风险。",
    decision: "哪些变化需要进一步调查？",
    boundary: "诊断与监控；行动执行归业务负责人。",
    deliverable: "指标体系与诊断场景。",
    contexts: ["经营改善"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "增长保留了多少？", detail: "成交与退款。", metric_refs: ["gmv", "refund_rate"] }],
    hypotheses: [{ id: "h1", statement: "退款上升侵蚀增长。", judgment: "待验证假设", support: "退款队列。", counter: "季节性。", change_condition: "口径核验后重估。", verified: false }],
    evidence_plan: [{ id: "e1", name: "订单退款明细", kind: "内部数据", source: "订单系统", check: "同队列", insufficiency: "缺失不输出结论", status: "待获取" }],
    options: []
  },
  added_metrics: [],
  added_scenarios: []
});

// AT4 载荷：指标体系（建设可复用体系 + 6 指标 + 0 场景）
const FAUX_AT4 = JSON.stringify({
  blueprint: {
    title: "服饰电商经营指标体系",
    intent: "建设可复用体系",
    purpose: "每周复盘销售与客户质量，及时发现退款风险。",
    decision: "怎样衡量增长质量，哪些变化需要进一步调查？",
    boundary: "指标建设与监控；行动执行归业务负责人。",
    deliverable: "可维护的指标体系与复核要求。",
    contexts: ["经营改善"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "增长来自哪里，保留了多少？", detail: "成交、退款与净销售。", metric_refs: ["gmv", "net_sales", "refund_amount"] }],
    hypotheses: [{ id: "h1", statement: "退款和客户质量变化可能侵蚀增长质量。", judgment: "待验证假设", support: "口径一致组成项。", counter: "一次性因素。", change_condition: "核验后重估。", verified: false }],
    evidence_plan: [{ id: "e1", name: "订单退款明细", kind: "内部数据", source: "订单系统", check: "同队列同期间", insufficiency: "缺失不输出仿成功结论", status: "待获取" }],
    options: []
  },
  added_metrics: [
    { name: "gmv", display_name: "成交总额", type: "simple", definition: "成功支付订单的商品成交金额。", dimensions: [], time_grains: ["month"], owner_role: "运营" },
    { name: "net_sales", display_name: "净销售额", type: "simple", definition: "成交总额扣除已完成退款金额。", dimensions: [], time_grains: ["month"], owner_role: "财务" },
    { name: "refund_amount", display_name: "退款额", type: "simple", definition: "已完成退款的商品金额。", dimensions: [], time_grains: ["month"], owner_role: "客服" },
    { name: "order_count", display_name: "支付订单数", type: "simple", definition: "成功支付订单去重计数。", dimensions: [], time_grains: ["month"], owner_role: "运营" },
    { name: "repeat_buyer_count", display_name: "复购买家数", type: "simple", definition: "下单≥2次的去重买家数。", dimensions: [], time_grains: ["month"], owner_role: "增长" },
    { name: "buy_repeat_rate", display_name: "复购率", type: "simple", definition: "复购买家数÷下单用户数。", dimensions: [], time_grains: ["month"], owner_role: "增长" }
  ],
  added_scenarios: []
});

let workspace: string;
let templatesDir: string;
let server: ReturnType<typeof createUiServer>;
let origin: string;
let envFile: string;

beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "mf-spa-t8-"));
  templatesDir = await mkdtemp(path.join(tmpdir(), "mf-spa-t8-tpl-"));
  await mkdir(path.join(workspace, "examples"), { recursive: true });
  await cp(path.join(repoRoot, "templates"), templatesDir, { recursive: true });
  envFile = path.join(workspace, ".env.local");
  server = createUiServer({ workspaceDir: workspace, templatesDir, envFilePath: envFile });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

const api = (p: string, method: string, body?: unknown) =>
  fetch(`${origin}${p}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const { writeManagedEnv } = await import("../../src/ui/env-file.js");

async function createViaFaux(need: string): Promise<string> {
  const gen = await api("/api/instances/create-job", "POST", { need });
  const { jobId } = await gen.json();
  for (let i = 0; i < 50; i++) {
    const st = await (await fetch(`${origin}/api/jobs/${jobId}`)).json();
    if (st.status !== "running") { expect(st.status).toBe("done"); return st.instanceId; }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("faux job 超时");
}
async function refineToDone(id: string, instruction: string) {
  const job = await api(`/api/instances/${encodeURIComponent(id)}/refine-job`, "POST", { instruction });
  const { jobId } = await job.json();
  for (let i = 0; i < 50; i++) {
    const st = await (await fetch(`${origin}/api/jobs/${jobId}`)).json();
    if (st.status !== "running") { expect(st.status).toBe("done"); return; }
    await new Promise(r => setTimeout(r, 100));
  }
}

test("AT1：模板起点（fork 带基座）→ 助手补蓝图（提案采纳）→ 复核 → 交付（SAP 含 blueprint 段剥 review）", async () => {
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_AT1 });
  // 模板起点
  const created = await (await api("/api/templates/use", "POST", { templateId: "ecommerce-marketplace" }).then(r => r.json()));
  const id = created.instanceId as string;
  const doc0 = parseYaml(await readFile(path.join(workspace, id), "utf8"));
  expect(doc0.base).toContain("ecommerce-marketplace@");

  // 助手补蓝图（refine job → apply）
  await refineToDone(id, "为这套指标体系补经营诊断蓝图");
  const apply = await api(`/api/instances/${encodeURIComponent(id)}/apply-refine`, "POST", {});
  expect(apply.status).toBe(200);

  // 复核 → 交付
  const confirm = await api(`/api/instances/${encodeURIComponent(id)}/confirm-review`, "POST", { confirmed_by: "AT1 复核人" });
  expect(confirm.status).toBe(200);
  const deliver = await api(`/api/instances/${encodeURIComponent(id)}/deliver`, "POST", {});
  expect(deliver.status).toBe(201);

  // SAP 直链：blueprint 段随包、剥 review、含 base 模板指标
  const sap = await (await fetch(`${origin}/api/instances/${encodeURIComponent(id)}/export/sap`)).text();
  expect(sap).toContain("blueprint:");
  expect(sap).toContain("电商经营诊断体系");
  expect(sap).not.toMatch(/^.*review:.*confirmed_by/s);
});

test("AT4：指标体系流——NL 创建（6 指标）→ 口径确认（pending 归零）→ 复核 → 交付 → 另存指标模板", async () => {
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_AT4 });
  const id = await createViaFaux("建立服饰电商经营指标体系：净销售、退款、复购，每周复盘");
  let dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(id)}`)).json();
  expect(dto.metrics).toHaveLength(6);
  expect(dto.pending).toEqual({ refund: null, repeat: null }); // 退款/复购口径待确认
  expect(dto.engineReady).toBe(false);

  // 口径确认（U1-b）
  const resolve = await api(`/api/instances/${encodeURIComponent(id)}/resolve`, "POST", { refund: true, repeat: "90" });
  expect(resolve.status).toBe(200);
  dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(id)}`)).json();
  expect(dto.pending).toEqual({ refund: true, repeat: "90" });

  // faux 指标均 LLM 来源 → G7 审核行批准（reviewer 环境约定）再交付
  for (const m of dto.metrics) {
    const approve = await api(`/api/instances/${encodeURIComponent(id)}/approve-metric`, "POST", { name: m.id, reviewer: "AT4 审核人" });
    expect(approve.status).toBe(200);
  }
  // 复核 → 交付（0 场景 + 指标体系——引擎允许）
  const confirm = await api(`/api/instances/${encodeURIComponent(id)}/confirm-review`, "POST", { confirmed_by: "AT4 复核人" });
  expect(confirm.status).toBe(200);
  const deliver = await api(`/api/instances/${encodeURIComponent(id)}/deliver`, "POST", {});
  expect(deliver.status).toBe(201);

  // 另存指标模板（U1-a）
  const save = await api("/api/templates/user", "POST", {
    name: "服饰经营指标（AT4）",
    purpose: "AT4 另存",
    rows: dto.metrics.map((m: { name: string; description: string; group: string }) => ({ name: m.name, description: m.description, group: m.group }))
  });
  expect(save.status).toBe(201);
  const tpl = await (await fetch(`${origin}/api/templates`)).json();
  expect(tpl.templates.some((t: { name: string }) => t.name === "服饰经营指标（AT4）")).toBe(true);
});

test("敌意注入：LLM 输出含 HTML/事件属性 → 渲染转义（DOM 无注入元素）", async () => {
  const evil = JSON.parse(FAUX_AT4);
  evil.blueprint.title = 'x<img src=x onerror=alert(1)>"\'<script>';
  evil.blueprint.hypotheses[0].statement = "<svg onload=alert(2)>";
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: JSON.stringify(evil) });
  const id = await createViaFaux("注入测试");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${origin}/#work/${encodeURIComponent(id)}/overview`);
    await page.locator(".work-tabs").waitFor({ timeout: 20000 });
    const injected = await page.evaluate(() => document.querySelectorAll("img,[onerror],svg[onload]").length);
    expect(injected).toBe(0); // 全部被 esc() 转义为文本
    // 标题以纯文本呈现（含原始字符）
    const titleText = await page.locator(".system-title h1").textContent();
    expect(titleText).toContain("<img");
  } finally { await browser.close(); }
});

test("C 表全量 grep 复检：SPA 静态资产零合成声明残留", async () => {
  const appJs = await (await fetch(`${origin}/app.js`)).text();
  const apiJs = await (await fetch(`${origin}/api.js`)).text();
  const html = await (await fetch(`${origin}/`)).text();
  const banned = ["交互原型", "合成演示", "刷新后重置", "刷新后会重置", "不会调用模型", "停止演示", "演示生成已停止",
    "演示设计版本", "下载演示设计包", "生成演示设计版本", "生成下一演示版本", "演示指标表", "此原型只演示", "此原型展示", "原型仅预览", "原型中的内置内容", "已触发演示设计包", "原型操作遇到问题", "合成示例", "合成指标", "演示快照", "合成交互演示",
    "本原型是合成设计", "当前原型没有真实业务事实核验", "此体系没有演示口径", "本原型展示表格识别", "当前原型"];
  for (const src of [appJs, apiJs, html]) {
    for (const b of banned) expect(src.includes(b), `禁串「${b}」残留`).toBe(false);
  }
});

test("F1 回归：我的体系视图渲染摘要（有实例工作区零崩溃）+ 已交付标签派生", { timeout: 180_000 }, async () => {
  expect.hasAssertions();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(origin + "/");
    await page.locator('.nav-primary [data-action="systems"]').click();
    await page.locator(".system-row").first().waitFor({ timeout: 15000 });
    expect(errors).toEqual([]);
    const row = await page.locator(".system-row p").first().textContent();
    expect(row).toMatch(/\d+ 个指标 · \d+ 个分析场景/);
    // 已交付体系（AT1 交付过）行 tag 派生
    const tags = await page.locator(".system-row .tag").allTextContents();
    expect(tags.some(t => /已交付 \d+\.\d+\.\d+/.test(t))).toBe(true);
  } finally { await browser.close(); }
});

test("F3 回归：生成中刷新回 home 且需求保留（G4）", { timeout: 180_000 }, async () => {
  expect.hasAssertions();
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_AT4 });
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(origin + "/");
    await page.locator("#need").fill("F3 生成中刷新保留需求测试");
    await page.locator('[data-action="generate"]').click();
    await page.waitForTimeout(300); // 生成中
    await page.reload();
    await page.locator("#need").waitFor({ timeout: 15000 });
    // 刷新后回 home（非 generating 深链）且需求文本保留
    expect(page.url()).not.toContain("#generating");
    expect(await page.locator("#need").inputValue()).toBe("F3 生成中刷新保留需求测试");
  } finally { await browser.close(); }
});
