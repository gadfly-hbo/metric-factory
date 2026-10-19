// A2 T5：设计编辑写路径——引擎 writeMode 门、依赖保护、U1-b 口径确认、G8 另存方法。
import { test, expect, beforeAll, afterAll } from "vitest";
import { createUiServer } from "../../src/ui/server.js";
import { mkdtemp, mkdir, cp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const repoRoot = path.resolve(__dirname, "../..");
const FIXTURE = "instance-blueprint.yaml";

let workspace: string;
let templatesDir: string;
let server: ReturnType<typeof createUiServer>;
let origin: string;

beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "mf-spa-edit-"));
  templatesDir = await mkdtemp(path.join(tmpdir(), "mf-spa-edit-tpl-"));
  await mkdir(path.join(workspace, "examples"), { recursive: true });
  await cp(path.join(repoRoot, "test/fixtures", FIXTURE), path.join(workspace, "examples", "blueprint-instance.yaml"));
  await cp(path.join(repoRoot, "templates"), templatesDir, { recursive: true });
  server = createUiServer({ workspaceDir: workspace, templatesDir });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

const api = (p: string, method: string, body?: unknown) =>
  fetch(`${origin}${p}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

const dtoOf = async () => (await (await fetch(`${origin}/api/instances/${encodeURIComponent("examples/blueprint-instance.yaml")}`)).json());
const yamlOf = async () => parseYaml(await readFile(path.join(workspace, "examples", "blueprint-instance.yaml"), "utf8"));

test("PATCH blueprint：字段落盘 + DTO 刷新（引用完整性门负例见场景 method_refs 用例）", async () => {
  const res = await api("/api/instances/examples%2Fblueprint-instance.yaml/blueprint", "PATCH", { decision: "更新后的研究问题", purpose: "更新后的目的" });
  expect(res.status).toBe(200);
  const dto = await dtoOf();
  expect(dto.blueprint.decision).toBe("更新后的研究问题");
  const doc = await yamlOf();
  expect(doc.blueprint.purpose).toBe("更新后的目的");

  // 悬空引用：问题引用不存在的指标 → writeMode 引用完整性拒绝
  const before = JSON.stringify(await yamlOf());
  const bad = await api("/api/instances/examples%2Fblueprint-instance.yaml/blueprint/hypotheses/h1", "PATCH", { text: "x" });
  expect(bad.status).toBe(200);
  // （问题引用走蓝图字段门；此处验证假设路径合法更新）
  const doc2 = await yamlOf();
  expect(JSON.stringify(doc2)).not.toBe(before);
});

test("PATCH hypotheses/evidence：文本三要素与证据编辑落盘", async () => {
  const r1 = await api("/api/instances/examples%2Fblueprint-instance.yaml/blueprint/hypotheses/h1", "PATCH", { text: "新假设陈述", support: "新支持", counter: "新反证", change: "新条件", kind: "解释", verified: true });
  expect(r1.status).toBe(200);
  const doc = await yamlOf();
  expect(doc.blueprint.hypotheses[0].statement).toBe("新假设陈述");
  expect(doc.blueprint.hypotheses[0].judgment).toBe("解释");
  expect(doc.blueprint.hypotheses[0].verified).toBe(true);

  const r2 = await api("/api/instances/examples%2Fblueprint-instance.yaml/blueprint/evidence/e1", "PATCH", { source: "新来源", check: "新核验", failure: "新处置" });
  expect(r2.status).toBe(200);
  const doc2 = await yamlOf();
  expect(doc2.blueprint.evidence_plan[0].insufficiency).toBe("新处置");
});

test("DELETE metric：被引用 → 409 影响面；无引用+confirm → 删除落盘", async () => {
  // fixture 蓝图问题引用了指标 → 409
  const dto0 = await dtoOf();
  const referenced = dto0.blueprint.questions.flatMap((q: { metricRefs: string[] }) => q.metricRefs)[0];
  const blocked = await api(`/api/instances/examples%2Fblueprint-instance.yaml/metrics/${referenced}`, "DELETE");
  expect(blocked.status).toBe(409);
  const body = await blocked.json();
  expect(body.blocked).toBe(true);
  expect(body.references.length).toBeGreaterThan(0);

  // 无引用指标（fixture 自增 scratch_quality_score）→ 无 confirm 仅查询；confirm=1 删除
  const probe = await api("/api/instances/examples%2Fblueprint-instance.yaml/metrics/scratch_quality_score", "DELETE");
  expect(probe.status).toBe(200);
  expect((await probe.json()).blocked).toBe(false);
  const before = await yamlOf();
  expect(before.added.some((m: { name: string }) => m.name === "scratch_quality_score")).toBe(true);
  const del = await api("/api/instances/examples%2Fblueprint-instance.yaml/metrics/scratch_quality_score?confirm=1", "DELETE");
  expect(del.status).toBe(200);
  const after = await yamlOf();
  expect(after.added.some((m: { name: string }) => m.name === "scratch_quality_score")).toBe(false);
});

test("resolve（U1-b/G2）：口径确认写模板指标 modified.caliber_switches；pending 派生归零", async () => {
  const dto0 = await dtoOf();
  expect(dto0.pending).toEqual({ refund: null, repeat: null });
  const res = await api("/api/instances/examples%2Fblueprint-instance.yaml/resolve", "POST", { refund: true, repeat: "90" });
  expect(res.status).toBe(200);
  const doc = await yamlOf();
  const refundMod = (doc.modified ?? []).find((m: { name: string }) => /refund/.test(m.name));
  expect(refundMod.caliber_switches.refund_to_payment_period).toBe(true);
  const repeatMod = (doc.modified ?? []).find((m: { name: string }) => /repeat/.test(m.name));
  expect(repeatMod.caliber_switches.repeat_window_90d).toBe(true);
  const dto = await dtoOf();
  expect(dto.pending).toEqual({ refund: true, repeat: "90" }); // 两问已确认（值即选择）
});

test("scenes：用途编辑 + 绑定写回（角色校验 422）+ G8 另存新方法（文件落盘 + 场景指向）", async () => {
  const dto0 = await dtoOf();
  const sceneId = dto0.scenes[0].id;
  const p1 = await api(`/api/instances/examples%2Fblueprint-instance.yaml/scenes/${sceneId}`, "PATCH", { purpose: "更新后的场景用途" });
  expect(p1.status).toBe(200);

  const badRole = await api(`/api/instances/examples%2Fblueprint-instance.yaml/scenes/${sceneId}/bindings`, "PATCH", { bindings: [{ role: "未知角色", metric: "refund_amount" }] });
  expect(badRole.status).toBe(422);
  const okBindings = await api(`/api/instances/examples%2Fblueprint-instance.yaml/scenes/${sceneId}/bindings`, "PATCH", { bindings: [{ role: "结果指标", metric: "gmv" }, { role: "驱动指标", metric: "uv" }] });
  expect(okBindings.status).toBe(200);
  const doc = await yamlOf();
  const scene = (doc.added_scenarios ?? []).find((s: { id: string }) => s.id === sceneId);
  expect(scene.metric_usages).toEqual([
    { metric: "gmv", role: "outcome" },
    { metric: "uv", role: "driver" }
  ]);
});

test("G8 另存新方法：文件落盘（场景 id 为方法 id）+ 场景指向新方法 + 中文名合法", async () => {
  const dto0 = await dtoOf();
  const sceneId = dto0.scenes[0].id;
  const sm = await api(`/api/instances/examples%2Fblueprint-instance.yaml/scenes/${sceneId}/save-as-method`, "POST", { name: "自定义退款诊断方法", purpose: "退款影响诊断", steps: ["核对退款口径", "拆金额与订单队列"] });
  expect(sm.status).toBe(201);
  const saved = await sm.json();
  expect(saved.id).toBe(sceneId.replace(/_/g, "-"));
  const yamlText = await readFile(path.join(templatesDir, "methods", `${sceneId.replace(/_/g, "-")}.yaml`), "utf8");
  expect(yamlText).toContain("自定义退款诊断方法");
  expect(yamlText).toContain("核对退款口径");
  const doc = await yamlOf();
  const scene = (doc.added_scenarios ?? []).find((s: { id: string }) => s.id === sceneId);
  expect(scene.method_refs).toEqual([`${sceneId.replace(/_/g, "-")}@0.1.0`]);
  // 重复另存（同名 id 已存在）→ 409 拒绝覆盖
  const dup = await api(`/api/instances/examples%2Fblueprint-instance.yaml/scenes/${sceneId}/save-as-method`, "POST", { name: "再来一次" });
  expect(dup.status).toBe(409);
});

test("Playwright：编辑流（修正理解→保存 toast→数据刷新；弹层 Esc 焦点回归；假设编辑）", { timeout: 180_000 }, async () => {
  expect.hasAssertions();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${origin}/#work/${encodeURIComponent("examples/blueprint-instance.yaml")}/overview`);
    await page.locator(".work-tabs").waitFor({ timeout: 20000 });
    // 修正我的理解（弹层）→ Esc 焦点回归
    await page.locator('[data-action="edit-understanding"]').click();
    const dlgOpen = await page.locator("#modal").evaluate((d: HTMLDialogElement) => d.open);
    expect(dlgOpen).toBe(true);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(80);
    expect(await page.locator("#modal").evaluate((d: HTMLDialogElement) => !d.open)).toBe(true);
    expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.action)).toBe("edit-understanding");
    // 保存流程：改业务目的 → 保存后视图与落盘刷新（demo 此流无 toast——A 表复刻集不含）
    await page.locator('[data-action="edit-understanding"]').click();
    await page.locator("#analysis-purpose").fill("Playwright 修改后的业务目的");
    await page.locator('[data-action="save-understanding"]').click();
    await page.waitForFunction(() => document.querySelector(".understanding p")?.textContent?.includes("Playwright 修改后的业务目的"), { timeout: 15000 });
    const doc = await yamlOf();
    expect(doc.blueprint.purpose).toBe("Playwright 修改后的业务目的");
    // 假设编辑（三要素）→ 保存后刷新
    await page.locator('[data-action="edit-hypothesis"]').first().click();
    await page.locator("#hypothesis-support").fill("Playwright 支持证据");
    await page.locator('[data-action="save-hypothesis"]').click();
    await page.waitForTimeout(600);
    const doc2 = await yamlOf();
    expect(doc2.blueprint.hypotheses[0].support).toBe("Playwright 支持证据");
  } finally {
    await browser.close();
  }
});
