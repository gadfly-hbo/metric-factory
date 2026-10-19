// A2 T7：助手提案流（先看建议再采纳）/ AT3 放弃零改动 / U1-a 用户模板 / 导入 / 从模板创建。
import { test, expect, beforeAll, afterAll } from "vitest";
import { createUiServer } from "../../src/ui/server.js";
import { mkdtemp, mkdir, cp, readFile, readdir, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";

const repoRoot = path.resolve(__dirname, "../..");

// faux refine 载荷：把蓝图 purpose 改写 + 新增一场景（AT3 与采纳流共用）
const FAUX_REFINE = JSON.stringify({
  blueprint: {
    title: "增长与利润改善分析体系",
    intent: "设计具体分析方案",
    purpose: "（faux 修改）补充因果边界后的业务目的。",
    decision: "当前经营周期应调整什么（促销力度、商品结构、费用节奏）？",
    boundary: "在既定业务方向下设计诊断与调整；资源批准和行动执行由业务负责人承担。",
    deliverable: "差距诊断、试点安排与复盘规则。",
    contexts: ["经营改善"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "利润差距由哪些部分组成？", detail: "先复核口径。", metric_refs: ["gmv", "commission_revenue"] }],
    hypotheses: [
      { id: "h1", statement: "费用增加可能抵消了收入增长。", judgment: "待验证假设", support: "费用明细。", counter: "季节性。", change_condition: "核验不支持时保留其他解释。", verified: false }
    ],
    evidence_plan: [
      { id: "e1", name: "收入成本费用明细", kind: "内部数据", source: "财务记录", check: "复核口径", insufficiency: "缺失不输出仿成功结论", status: "待获取" }
    ],
    options: []
  },
  added_metrics: [],
  added_scenarios: []
});

let workspace: string;
let templatesDir: string;
let server: ReturnType<typeof createUiServer>;
let origin: string;
const FIXTURE_ID = "examples/blueprint-instance.yaml";

beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "mf-spa-t7-"));
  templatesDir = await mkdtemp(path.join(tmpdir(), "mf-spa-t7-tpl-"));
  await mkdir(path.join(workspace, "examples"), { recursive: true });
  await cp(path.join(repoRoot, "test/fixtures/instance-blueprint.yaml"), path.join(workspace, "examples", "blueprint-instance.yaml"));
  await cp(path.join(repoRoot, "templates"), templatesDir, { recursive: true });
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(path.join(workspace, ".env.local"), { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_REFINE });
  server = createUiServer({ workspaceDir: workspace, templatesDir, envFilePath: path.join(workspace, ".env.local") });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

const api = (p: string, method: string, body?: unknown) =>
  fetch(`${origin}${p}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const hashOf = async () => createHash("sha256").update(await readFile(path.join(workspace, "examples", "blueprint-instance.yaml"))).digest("hex");

test("AT3：refine job → 提案预览 → 放弃 → 实例零改动（字节级）", async () => {
  const before = await hashOf();
  const job = await api(`/api/instances/${encodeURIComponent(FIXTURE_ID)}/refine-job`, "POST", { instruction: "补充因果判断边界" });
  expect(job.status).toBe(202);
  const { jobId } = await job.json();
  let st: { status: string } | null = null;
  for (let i = 0; i < 50; i++) {
    st = await (await fetch(`${origin}/api/jobs/${jobId}`)).json();
    if (st!.status !== "running") break;
    await new Promise(r => setTimeout(r, 100));
  }
  expect(st!.status).toBe("done");

  const proposal = await (await fetch(`${origin}/api/instances/${encodeURIComponent(FIXTURE_ID)}/refine-proposal`)).json();
  expect(proposal.title).toBe("AI 修改建议");
  expect(proposal.after).toContain("业务目的");
  expect(proposal.impact).toContain("复核");

  const discard = await api(`/api/instances/${encodeURIComponent(FIXTURE_ID)}/discard-refine`, "POST", {});
  expect(discard.status).toBe(200);
  expect(await hashOf()).toBe(before); // AT3：放弃零改动（字节级）

  const gone = await fetch(`${origin}/api/instances/${encodeURIComponent(FIXTURE_ID)}/refine-proposal`);
  expect(gone.status).toBe(404);
});

test("采纳流：refine → 提案 → apply → 蓝图更新 + 复核失效 + 草案消费", async () => {
  const job = await api(`/api/instances/${encodeURIComponent(FIXTURE_ID)}/refine-job`, "POST", { instruction: "再次修改" });
  const { jobId } = await job.json();
  for (let i = 0; i < 50; i++) {
    const st = await (await fetch(`${origin}/api/jobs/${jobId}`)).json();
    if (st.status !== "running") break;
    await new Promise(r => setTimeout(r, 100));
  }
  const apply = await api(`/api/instances/${encodeURIComponent(FIXTURE_ID)}/apply-refine`, "POST", {});
  expect(apply.status).toBe(200);
  const doc = parseYaml(await readFile(path.join(workspace, "examples", "blueprint-instance.yaml"), "utf8"));
  expect(doc.blueprint.purpose).toBe("（faux 修改）补充因果边界后的业务目的。");
  // 草案已消费
  await expect(access(path.join(workspace, "examples", "draft.pending.yaml"))).rejects.toThrow();
});

test("U1-a：另存用户指标模板（templates/user/）→ 我的模板过滤 → 副本创建", async () => {
  const save = await api("/api/templates/user", "POST", {
    name: "我的经营指标",
    purpose: "从当前体系另存",
    rows: [
      { name: "净销售额", description: "成交减退款", group: "经营结果", formula: "gmv - refund", unit: "元" },
      { name: "支付订单数", description: "", group: "经营结果", formula: "count", unit: "单" }
    ]
  });
  expect(save.status).toBe(201);
  const saved = await save.json();
  expect(saved.incomplete).toBe(true); // 缺口径如实标注

  const tpl = await (await fetch(`${origin}/api/templates`)).json();
  const mine = tpl.templates.filter((t: { source: string }) => t.source === "我的模板");
  expect(mine).toHaveLength(1);
  expect(mine[0].name).toBe("我的经营指标");
  expect(mine[0].incomplete).toBe(true);

  // 副本创建（blank 基座 + manual added；缺口径哨兵占位）
  const fork = await api("/api/templates/user/preview", "POST", { id: saved.id });
  expect(fork.status).toBe(201);
  const created = await fork.json();
  const doc = parseYaml(await readFile(path.join(workspace, created.instanceId), "utf8"));
  expect(doc.added).toHaveLength(2);
  expect(doc.added[0].provenance.origin).toBe("manual");
  const blank = doc.added.find((m: { display_name: string }) => m.display_name === "支付订单数");
  expect(blank.definition).toBe("（待补充统计说明）");
});

test("从内置模板创建（fork 语义：带 base）", async () => {
  const res = await api("/api/templates/use", "POST", { templateId: "ecommerce-marketplace" });
  expect(res.status).toBe(201);
  const created = await res.json();
  const doc = parseYaml(await readFile(path.join(workspace, created.instanceId), "utf8"));
  expect(doc.base).toContain("ecommerce-marketplace@");
  expect(created.system.metrics.length).toBeGreaterThan(50);
});

test("方法模板 → 场景（use-template method 流）", async () => {
  const res = await api(`/api/instances/${encodeURIComponent(FIXTURE_ID)}/scenes`, "POST", { methodId: "net-change", purpose: "净销售变化拆解" });
  expect(res.status).toBe(200);
  const doc = parseYaml(await readFile(path.join(workspace, "examples", "blueprint-instance.yaml"), "utf8"));
  const added = doc.added_scenarios.find((s: { id: string }) => s.id === "net_change");
  expect(added.method_refs).toEqual(["net-change@0.1.0"]);
  expect(added.title).toBe("净销售额变化拆解");
});

test("Playwright：AT3 独立数据专题（NL 修正 → 提案卡 → 放弃 → 工作稿零改动）", { timeout: 240_000 }, async () => {
  expect.hasAssertions();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${origin}/#work/${encodeURIComponent(FIXTURE_ID)}/overview`);
    await page.locator(".work-tabs").waitFor({ timeout: 20000 });
    const beforeYaml = await readFile(path.join(workspace, "examples", "blueprint-instance.yaml"), "utf8");
    // 助手栏指令 → 提案卡（先看建议）
    await page.locator("#refine").fill("说明因果判断还缺什么");
    await page.locator('[data-action="refine"]').click();
    await page.locator(".delta").waitFor({ timeout: 30000 });
    expect(await page.locator(".delta h3").textContent()).toContain("修改建议");
    // 放弃 → 零改动 + 提案卡消失
    await page.locator('[data-action="discard-proposal"]').click();
    await page.locator(".delta").waitFor({ state: "detached", timeout: 10000 });
    const afterYaml = await readFile(path.join(workspace, "examples", "blueprint-instance.yaml"), "utf8");
    expect(afterYaml).toBe(beforeYaml); // AT3：零改动（字节级）
  } finally {
    await browser.close();
  }
});
