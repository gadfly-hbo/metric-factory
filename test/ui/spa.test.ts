// A2 T2：SPA 壳 + 读面 JSON API。
// 断言面：静态资产（含 style.css 与评审原型逐字节一致）、/api/workspace|templates|instances|llm-status
// 形状、Playwright 对真实服务跑 oracle v00/v04 视图骨架对照（demo 基线为判据）。
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createUiServer } from "../../src/ui/server.js";
import { mkdtemp, mkdir, writeFile, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const repoRoot = path.resolve(__dirname, "../..");
const templatesDir = path.join(repoRoot, "templates");

let workspace: string;
let server: ReturnType<typeof createUiServer>;
let origin: string;

beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "mf-spa-"));
  await mkdir(path.join(workspace, "examples"), { recursive: true });
  await cp(path.join(repoRoot, "test/fixtures/instance-blueprint.yaml"), path.join(workspace, "examples", "blueprint-instance.yaml"));
  server = createUiServer({ workspaceDir: workspace, templatesDir });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

afterAll(async () => { server.close(); });

describe("SPA 静态资产", () => {
  it("GET / 返回移植壳：真实边界标签 + api.js/app.js 引入，无 analysis-model", async () => {
    const html = await (await fetch(`${origin}/`)).text();
    expect(html).toContain("本地工作台 · 真实引擎");
    expect(html).toContain('src="api.js"');
    expect(html).toContain('src="app.js"');
    expect(html).not.toContain("analysis-model");
    expect(html).not.toContain("交互原型");
  });

  it("style.css 与评审原型逐字节一致（复刻硬保证）", async () => {
    const css = await (await fetch(`${origin}/style.css`)).text();
    const demoCss = await readFile(path.join(repoRoot, "test/fixtures/demo-anchor/style.css"), "utf8");
    expect(css).toBe(demoCss);
  });

  it("app.js 合成声明已换真话（T2 视图域 C 表 grep 复检；work 视图串随 T5/T6 替换）", async () => {
    const js = await (await fetch(`${origin}/app.js`)).text();
    for (const banned of ["合成演示", "交互原型", "刷新后会重置", "停止演示", "演示生成已停止", "演示指标表见完整方案"]) {
      expect(js, `禁串「${banned}」残留`).not.toContain(banned);
    }
  });

  it("/docs/guide 返回使用指南", async () => {
    const res = await fetch(`${origin}/docs/guide`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Metric Factory 工作台使用指南");
  });
});

describe("读面 JSON API", () => {
  it("GET /api/workspace 列出工作区实例（fixture 蓝图实例）", async () => {
    const data = await (await fetch(`${origin}/api/workspace`)).json();
    expect(data.systems).toHaveLength(1);
    const sys = data.systems[0];
    expect(sys.id).toBe("examples/blueprint-instance.yaml");
    expect(sys.hasBlueprint).toBe(true);
    expect(sys.metricCount).toBeGreaterThan(0);
    expect(typeof sys.title).toBe("string");
  });

  it("GET /api/templates 返回 7 行业 + 6 方法（含 demo 独有三方法）", async () => {
    const data = await (await fetch(`${origin}/api/templates`)).json();
    expect(data.templates).toHaveLength(7);
    expect(data.methodTemplates).toHaveLength(6);
    const methodIds = data.methodTemplates.map((m: { id: string }) => m.id).sort();
    expect(methodIds).toEqual([
      "association-vs-increment", "net-change", "profit-change-diagnosis",
      "repeat-review", "strategic-options-comparison", "weekly-review"
    ]);
    const card = data.methodTemplates.find((m: { id: string }) => m.id === "net-change");
    expect(card.roles).toHaveLength(4);
    expect(card.steps.map((s: { title: string }) => s.title)).toContain("拆成交侧与退款侧");
  });

  it("GET /api/instances/:id 返回 demo system 形状 DTO（LA1 映射）", async () => {
    const res = await fetch(`${origin}/api/instances/${encodeURIComponent("examples/blueprint-instance.yaml")}`);
    expect(res.status).toBe(200);
    const dto = await res.json();
    for (const key of ["id", "title", "goal", "source", "blueprint", "metrics", "scenes", "pending", "confirmed", "revision", "delivered", "chat", "proposal", "metricOnly"]) {
      expect(dto).toHaveProperty(key);
    }
    expect(dto.blueprint.questions[0]).toHaveProperty("metricRefs");
    expect(dto.blueprint.hypotheses[0]).toMatchObject({ text: expect.any(String), support: expect.any(String), counter: expect.any(String), change: expect.any(String), kind: expect.any(String), verified: expect.any(Boolean) });
    expect(dto.blueprint.evidence[0]).toMatchObject({ name: expect.any(String), source: expect.any(String), check: expect.any(String), failure: expect.any(String), status: expect.any(String) });
    expect(dto.metrics[0]).toMatchObject({ id: expect.any(String), name: expect.any(String), group: expect.any(String), description: expect.any(String), formula: expect.any(String), unit: expect.any(String) });
  });

  it("GET /api/instances/:id 未知实例 404 结构化错误", async () => {
    const res = await fetch(`${origin}/api/instances/${encodeURIComponent("nope/instance.yaml")}`);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toContain("实例不可读");
  });

  it("GET /api/llm-status 返回 mode", async () => {
    const data = await (await fetch(`${origin}/api/llm-status`)).json();
    expect(["faux", "configured", "none"]).toContain(data.mode);
  });
});

describe("Playwright 视图对照（demo 基线为判据）", () => {
  // 空工作区服务器：与 demo 初始状态对齐（recent 空、systems 0）——骨架对照的公平前提
  let emptyServer: ReturnType<typeof createUiServer>;
  let emptyOrigin: string;
  beforeAll(async () => {
    const emptyWs = await mkdtemp(path.join(tmpdir(), "mf-spa-empty-"));
    emptyServer = createUiServer({ workspaceDir: emptyWs, templatesDir });
    await new Promise<void>((r) => emptyServer.listen(0, "127.0.0.1", r));
    emptyOrigin = `http://127.0.0.1:${(emptyServer.address() as { port: number }).port}`;
  });
  afterAll(() => { emptyServer.close(); });

  it.runIf(existsSync(path.join(repoRoot, "test/ui/baseline")))(
    "v00 首页与 v04 方法库视图骨架/几何与 demo 基线一致",
    { timeout: 180_000 },
    async () => {
      expect.hasAssertions();
      const probe = await fetch(`${emptyOrigin}/api/workspace`);
      expect(probe.status).toBe(200);
      const { runOracle } = await import("./oracle/flows.mjs");
      const results = await runOracle({ base: emptyOrigin, mode: "compare", viewFilter: "v00-home,v04-library-methods" });
      expect(results.ok, JSON.stringify(results, null, 2)).toBe(true);
      expect(results.views["v00-home"]).toBe("pass");
      expect(results.views["v04-library-methods"]).toBe("pass");
      // B1/B3 行为断言（部分模式）：dialog 原生语义、Esc 焦点回归、skip-link
      expect(results.behavior).toMatchObject({ dialogOpensNative: true, escClosesDialog: true, focusReturnsToOpener: true, skipLinkPresent: true });
    }
  );
});
