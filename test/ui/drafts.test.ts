import { mkdtempSync, copyFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// AI 草案工坊全链路：faux backend（零网络确定性注入）
const FAUX_GENERATE = JSON.stringify([
  { name: "seckill_gmv", display_name: "秒杀 GMV", type: "simple", definition: "秒杀活动场次成交总额", dimensions: [], time_grains: ["day"], owner_role: "活动运营" }
]);
const FAUX_REFINE = JSON.stringify({ caliber: {}, modified: [], removed: ["nps"], added: [] });

function fauxWorkspace(fauxResponse: string): { dir: string; inst: string; envFile: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-draft-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);
  const envFile = join(dir, ".env.local");
  return { dir, inst, envFile };
}

async function startUi(dir: string, inst: string) {
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local"), instancePath: inst });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

const post = (base: string, path: string, params: Record<string, string>, manual = false) =>
  fetch(`${base}${path}`, { method: "POST", body: new URLSearchParams(params), headers: { "content-type": "application/x-www-form-urlencoded" }, redirect: manual ? "manual" : "follow" });

// 等待 job 出结果（faux 即时完成，轮询兜底异步时序）
async function waitJobDone(base: string, jobId: string): Promise<void> {
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${base}/drafts/jobs/${jobId}`, { redirect: "manual" });
    if (res.status === 303 || res.status === 422) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("job 未在 5s 内完成");
}

test("GET /drafts：faux 演示模式显示生成表单", async () => {
  const { dir, inst, envFile } = fauxWorkspace(FAUX_GENERATE);
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_GENERATE });
  const { server, base } = await startUi(dir, inst);
  const html = await (await fetch(`${base}/drafts`)).text();
  expect(html).toContain("生成候选指标");
  expect(html).toContain("演示模式");
  server.close();
});

test("generate → 草案落盘 → apply：合入实例并转审核，draft 文件清理", async () => {
  const { dir, inst, envFile } = fauxWorkspace(FAUX_GENERATE);
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_GENERATE });
  const { server, base } = await startUi(dir, inst);

  // 空 describe → 422
  const empty = await post(base, "/drafts/generate", { describe: "" });
  expect(empty.status).toBe(422);
  expect(await empty.text()).toContain("业务描述");

  const res = await post(base, "/drafts/generate", { describe: "我们是跨境电商，主打低价秒杀" }, true);
  expect(res.status).toBe(303);
  const jobId = res.headers.get("location")!.split("/").pop()!;
  await waitJobDone(base, jobId);

  const draftFile = join(dir, "draft.pending.yaml");
  expect(existsSync(draftFile)).toBe(true);
  const draft = parseYaml(readFileSync(draftFile, "utf8")) as { added: { name: string; provenance: { origin: string } }[] };
  expect(draft.added[0]!.name).toBe("seckill_gmv");
  expect(draft.added[0]!.provenance.origin).toBe("llm");

  // 草案工坊预览待采纳卡
  const page = await (await fetch(`${base}/drafts`)).text();
  expect(page).toContain("秒杀 GMV");
  expect(page).toContain("待采纳");

  // 采纳 → 303 /review；实例 added 增加且自动待审；draft 清理
  const apply = await post(base, "/drafts/apply", {}, true);
  expect(apply.status).toBe(303);
  expect(apply.headers.get("location")).toBe("/review");
  const doc = parseYaml(readFileSync(inst, "utf8")) as { added: { name: string; provenance: { reviewed_by?: string } }[] };
  expect(doc.added.some((a) => a.name === "seckill_gmv")).toBe(true);
  expect(doc.added.find((a) => a.name === "seckill_gmv")!.provenance.reviewed_by).toBeUndefined();
  expect(existsSync(draftFile)).toBe(false);

  const review = await (await fetch(`${base}/review`)).text();
  expect(review).toContain("seckill_gmv");
  server.close();
});

test("refine → removed 生效；冲突草案 apply 422 零写盘且 draft 保留", async () => {
  // generate 场景：faux 返回与模板同名指标 gmv → applyDraft added-conflict
  const conflict = JSON.stringify([
    { name: "gmv", display_name: "同名冲突", type: "simple", definition: "与模板 gmv 同名", dimensions: [], time_grains: ["day"], owner_role: "测试" }
  ]);
  const { dir, inst, envFile } = fauxWorkspace(conflict);
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: conflict });
  const { server, base } = await startUi(dir, inst);

  const before = readFileSync(inst, "utf8");
  const res = await post(base, "/drafts/generate", { describe: "测试冲突" }, true);
  const jobId = res.headers.get("location")!.split("/").pop()!;
  await waitJobDone(base, jobId);
  const apply = await post(base, "/drafts/apply", {});
  expect(apply.status).toBe(422);
  expect(await apply.text()).toContain("added-conflict");
  expect(readFileSync(inst, "utf8")).toBe(before); // 零写盘
  expect(existsSync(join(dir, "draft.pending.yaml"))).toBe(true); // 草案保留

  // 丢弃 → 文件删除
  const discard = await post(base, "/drafts/discard", {});
  expect([200, 302, 303]).toContain(discard.status);
  expect(existsSync(join(dir, "draft.pending.yaml"))).toBe(false);
  server.close();
});

test("refine 草案：removed nps 合入实例", async () => {
  const { dir, inst, envFile } = fauxWorkspace(FAUX_REFINE);
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_REFINE });
  const { server, base } = await startUi(dir, inst);

  const res = await post(base, "/drafts/refine", { instruction: "删掉 NPS" }, true);
  expect(res.status).toBe(303);
  const jobId = res.headers.get("location")!.split("/").pop()!;
  await waitJobDone(base, jobId);

  const apply = await post(base, "/drafts/apply", {}, true);
  expect(apply.status).toBe(303);
  const doc = parseYaml(readFileSync(inst, "utf8")) as { removed: string[] };
  expect(doc.removed).toContain("nps");
  server.close();
});

test("未配置模型：POST /drafts/generate 422 引导设置", async () => {
  const { dir, inst } = fauxWorkspace(FAUX_GENERATE);
  const { server, base } = await startUi(dir, inst);
  const res = await post(base, "/drafts/generate", { describe: "测试" });
  expect(res.status).toBe(422);
  expect(await res.text()).toContain("设置");
  server.close();
});
