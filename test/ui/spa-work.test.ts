// A2 T4：work 四 stage 只读全景——产品端对 fixture 实例跑 oracle v01/02/03/05/06（组件级折叠骨架 + 几何锚）
// + DTO 派生面断言（pending/reviewPendingCount/delivered）。
import { test, expect, describe, beforeAll, afterAll } from "vitest";
import { createUiServer } from "../../src/ui/server.js";
import { mkdtemp, mkdir, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";

const repoRoot = path.resolve(__dirname, "../..");
const templatesDir = path.join(repoRoot, "templates");

let workspace: string;
let server: ReturnType<typeof createUiServer>;
let origin: string;
const FIXTURE_ID = "examples/blueprint-instance.yaml";

beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "mf-spa-work-"));
  await mkdir(path.join(workspace, "examples"), { recursive: true });
  await cp(path.join(repoRoot, "test/fixtures/instance-blueprint.yaml"), path.join(workspace, "examples", "blueprint-instance.yaml"));
  await cp(path.join(repoRoot, "test/fixtures/instance-operating-mirror.yaml"), path.join(workspace, "examples", "operating-mirror.yaml"));
  await cp(path.join(repoRoot, "test/fixtures/instance-strategy-mirror.yaml"), path.join(workspace, "examples", "strategy-mirror.yaml"));
  server = createUiServer({ workspaceDir: workspace, templatesDir });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

test("DTO 派生面：pending 约定键 / reviewPendingCount / delivered 缺省", async () => {
  const dto = await (await fetch(`${origin}/api/instances/${encodeURIComponent(FIXTURE_ID)}`)).json();
  // fixture 体系含退款与复购语义指标、无约定开关键 → 两问均待确认（不编造值）
  expect(dto.pending).toEqual({ refund: null, repeat: null });
  expect(dto.reviewPending).toEqual([]);
  expect(dto.delivered).toBeNull();
  expect(dto.confirmed).toBe(false); // 未复核
});

test("DTO 派生面：退款语义指标出现 pending.refund=null（独立工作区，不污染 oracle 工作区）", async () => {
  const ws2 = await mkdtemp(path.join(tmpdir(), "mf-spa-work2-"));
  await mkdir(path.join(ws2, "examples"), { recursive: true });
  await cp(path.join(repoRoot, "test/fixtures/instance-ecommerce.yaml"), path.join(ws2, "examples", "ecommerce-instance.yaml"));
  const s2 = createUiServer({ workspaceDir: ws2, templatesDir });
  await new Promise<void>((r) => s2.listen(0, "127.0.0.1", r));
  try {
    const base2 = `http://127.0.0.1:${(s2.address() as { port: number }).port}`;
    const dto = await (await fetch(`${base2}/api/instances/${encodeURIComponent("examples/ecommerce-instance.yaml")}`)).json();
    expect(dto.pending).toEqual({ refund: null, repeat: null }); // 退款与复购指标都在、无约定键 → 两问待确认
  } finally { s2.close(); }
});

describe.runIf(existsSync(path.join(repoRoot, "test/ui/baseline")))("work 视图 oracle 对照（镜像 fixture + 组件级折叠骨架）", () => {
  test("v01/v03（经营镜像）：总览组件形态与 demo 基线一致", { timeout: 200_000 }, async () => {
    expect.hasAssertions();
    const { runOracle } = await import("./oracle/flows.mjs");
    const results = await runOracle({
      base: origin, mode: "compare",
      viewFilter: "v01-operating-overview,v03-data-overview",
      openInstance: "examples/operating-mirror.yaml"
    });
    expect(results.ok, JSON.stringify(results, null, 2)).toBe(true);
    expect(results.views["v01-operating-overview"]).toBe("pass");
    expect(results.views["v03-data-overview"]).toBe("pass");
  });

  test("v02/v05/v06（战略镜像）：检查视图 + 窄屏总览/检查 与 demo 基线一致（390px 无横溢）", { timeout: 200_000 }, async () => {
    expect.hasAssertions();
    const { runOracle } = await import("./oracle/flows.mjs");
    const results = await runOracle({
      base: origin, mode: "compare",
      viewFilter: "v02-strategy-review,v05-strategy-overview-narrow,v06-review-narrow",
      openInstance: "examples/strategy-mirror.yaml"
    });
    expect(results.ok, JSON.stringify(results, null, 2)).toBe(true);
    for (const name of ["v02-strategy-review", "v05-strategy-overview-narrow", "v06-review-narrow"]) {
      expect(results.views[name], `视图 ${name}`).toBe("pass");
    }
  });
});
