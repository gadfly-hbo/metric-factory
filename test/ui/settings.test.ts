import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 设置页：模型配置写入 .env.local（保留未知行），key 不回显明文
async function startUi() {
  const dir = mkdtempSync(join(tmpdir(), "mf-set-"));
  const envFile = join(dir, ".env.local");
  const server = createUiServer({ authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"), templatesDir: "templates", workspaceDir: dir, envFilePath: envFile  });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}`, dir, envFile };
}

const post = (base: string, path: string, params: Record<string, string>, redirect: RequestRedirect = "follow") =>
  fetch(`${base}${path}`, { method: "POST", body: new URLSearchParams(params), headers: { "content-type": "application/x-www-form-urlencoded" }, redirect });

test("GET /settings：未配置状态与表单", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/settings`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("未配置");
  expect(html).toContain('action="/settings/save"');
  server.close();
});

test("POST /settings/save：写 .env.local（含 provider key 映射），页面打码不回显明文", async () => {
  const { server, base, envFile } = await startUi();
  const res = await post(base, "/settings/save", { model: "openai/gpt-4o", api_key: "sk-secret-abcd1234", base_url: "" });
  expect([200, 302, 303]).toContain(res.status);
  const text = readFileSync(envFile, "utf8");
  expect(text).toContain("MF_LLM_MODEL=openai/gpt-4o");
  expect(text).toContain("OPENAI_API_KEY=sk-secret-abcd1234");
  expect(text).not.toContain("MF_LLM_BASE_URL=");

  const html = await (await fetch(`${base}/settings`)).text();
  expect(html).toContain("openai/gpt-4o");
  expect(html).toContain("****1234");
  expect(html).not.toContain("sk-secret-abcd1234"); // 明文永不回显
  server.close();
});

test("POST /settings/save：坏 model 422 且零写盘", async () => {
  const { server, base, envFile } = await startUi();
  const res = await post(base, "/settings/save", { model: "gpt-4o", api_key: "" });
  expect(res.status).toBe(422);
  expect(await res.text()).toContain("provider/model-id");
  expect(existsSync(envFile)).toBe(false);
  server.close();
});

test("GET /settings：配置主备链时显示 主 (+N 备)（G9）", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(
    envFile,
    [
      "MF_LLM_MODEL=minimax-cn/MiniMax-M3",
      "MINIMAX_CN_API_KEY=sk-minimax-local-9999",
      "MF_LLM_FALLBACK_MODELS=xiaomi-token-plan-cn/mimo-v2.6-flash"
    ].join("\n"),
    "utf8"
  );
  const res = await fetch(`${base}/settings`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("minimax-cn/MiniMax-M3");
  expect(html).toContain("(+1 备)");
  expect(html).toContain("****9999");
  server.close();
});

test("POST /settings/save：保留 .env.local 中用户手写的其他行；clear 只删管理键", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(envFile, "MY_CUSTOM_LINE=keep\n", "utf8");
  await post(base, "/settings/save", { model: "anthropic/claude-sonnet-4", api_key: "sk-ant-xyz-9999" });
  let text = readFileSync(envFile, "utf8");
  expect(text).toContain("MY_CUSTOM_LINE=keep");
  expect(text).toContain("ANTHROPIC_API_KEY=sk-ant-xyz-9999");

  const res = await post(base, "/settings/clear", {});
  expect([200, 302, 303]).toContain(res.status);
  text = readFileSync(envFile, "utf8");
  expect(text).toContain("MY_CUSTOM_LINE=keep");
  expect(text).not.toContain("MF_LLM_MODEL");
  expect(text).not.toContain("ANTHROPIC_API_KEY");
  server.close();
});

// ---- T3 · 写侧降级（G5/G6）+ UI 零配置（G3）----

test("空模型保存 = 清除覆盖（G6）：管理键全清、303 指向 ?cleared=1、忽略 key/baseUrl 输入", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(
    envFile,
    ["MF_LLM_MODEL=minimax-cn/MiniMax-M3", "MINIMAX_CN_API_KEY=sk-old", "MF_LLM_BASE_URL=https://gw/v1"].join("\n"),
    "utf8"
  );
  const res = await post(base, "/settings/save", { model: "", api_key: "sk-ignored", base_url: "https://ignored/v1" }, "manual");
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toContain("cleared=1");
  const after = readFileSync(envFile, "utf8");
  expect(after).not.toContain("MF_LLM_MODEL");
  expect(after).not.toContain("MINIMAX_CN_API_KEY");
  expect(after).not.toContain("MF_LLM_BASE_URL");
  server.close();
});

test("模型+空 key 保存只写模型（G6「留空则不修改」延续）", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(envFile, "MINIMAX_CN_API_KEY=sk-keep\n", "utf8");
  const res = await post(base, "/settings/save", { model: "minimax-cn/MiniMax-M3", api_key: "", base_url: "" }, "manual");
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toContain("saved=1");
  const after = readFileSync(envFile, "utf8");
  expect(after).toContain("MF_LLM_MODEL=minimax-cn/MiniMax-M3");
  expect(after).toContain("MINIMAX_CN_API_KEY=sk-keep");
  server.close();
});

test("422 不回填表单值（G9c：value 永空，违例值只在错误信息引用内）", async () => {
  const { server, base } = await startUi();
  const res = await post(base, "/settings/save", { model: "gpt-4o", api_key: "", base_url: "" });
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("gpt-4o"); // 错误信息引用违例值（escapeHtml 后引号转义）
  expect(html).not.toContain('value="gpt-4o"');
  server.close();
});

test("保存/清除横幅一次性（?saved=1 / ?cleared=1）", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(envFile, "MF_LLM_MODEL=minimax-cn/MiniMax-M3\nMINIMAX_CN_API_KEY=sk-m\n", "utf8");
  const withBanner = await fetch(`${base}/settings?saved=1`);
  expect(await withBanner.text()).toContain("已保存");
  const bare = await fetch(`${base}/settings`);
  const html = await bare.text();
  expect(html).not.toContain("已保存");
  expect(html).not.toContain("已清除");
  server.close();
});

test("遮蔽警告（G5）：.env.local 值被进程环境覆盖的键点名，需先 unset", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(envFile, "MF_LLM_MODEL=minimax-cn/MiniMax-M3\nMINIMAX_CN_API_KEY=sk-shadowed\n", "utf8");
  process.env.MINIMAX_CN_API_KEY = "sk-process-wins";
  try {
    const res = await fetch(`${base}/settings`);
    const html = await res.text();
    expect(html).toContain("遮蔽警告");
    expect(html).toContain("MINIMAX_CN_API_KEY");
    expect(html).toContain("需先 unset");
  } finally {
    delete process.env.MINIMAX_CN_API_KEY;
  }
  server.close();
});

test("UI 零配置（G3）：auth.json 有候选 key 即默认链就绪，无需任何手配", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-set-auto-"));
  const envFile = join(dir, ".env.local");
  const authJson = join(dir, "auth.json");
  writeFileSync(authJson, JSON.stringify({ "minimax-cn": { key: "sk-auto-mm" }, moonshot: { key: "sk-ms" } }), "utf8");
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: authJson });
  const port = await listenUi(server, 0);
  const res = await fetch(`http://127.0.0.1:${port}/settings`);
  const html = await res.text();
  expect(html).toContain("minimax-cn/MiniMax-M3");
  expect(html).toContain("****"); // 打码，无明文
  expect(html).not.toContain("sk-auto-mm");
  server.close();
});

// ---- T4 · 读侧「查看」面（G9/D9 + 契约 S1/S2/S5）----

async function startUiWithAuth(authContent: string | null) {
  const dir = mkdtempSync(join(tmpdir(), "mf-set-view-"));
  const envFile = join(dir, ".env.local");
  const authJson = join(dir, "auth.json");
  if (authContent !== null) writeFileSync(authJson, authContent, "utf8");
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: authJson });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}`, dir, envFile, authJson };
}

test("S1 零配置全链：默认链自动启用行 + 全链表格（来源标签+打码）+ 链外凭据提示", async () => {
  const { server, base } = await startUiWithAuth(
    JSON.stringify({ "minimax-cn": { key: "sk-auto-1111" }, "xiaomi-token-plan-cn": { key: "sk-mimo-2222" }, moonshot: { key: "sk-ms-3333" } })
  );
  const html = await (await fetch(`${base}/settings`)).text();
  expect(html).toContain("默认链自动启用（未手动设置 MF_LLM_MODEL）");
  expect(html).toContain("minimax-cn/MiniMax-M3");
  expect(html).toContain("xiaomi-token-plan-cn/mimo-v2.6-flash");
  expect(html).toContain("自动发现 · pi CLI");
  expect(html).toContain("****1111");
  expect(html).toContain("****2222");
  expect(html).toContain("另检测到 1 个 pi CLI 凭据：moonshot");
  expect(html).not.toContain("sk-auto-1111"); // 永不明文
  server.close();
});

test("S2 部分发现：缺 key 备候选行「缺失（调用时自动跳过）」、密钥 —", async () => {
  const { server, base } = await startUiWithAuth(JSON.stringify({ "minimax-cn": { key: "sk-only-9999" } }));
  const html = await (await fetch(`${base}/settings`)).text();
  expect(html).toContain("minimax-cn/MiniMax-M3");
  expect(html).toContain("缺失（调用时自动跳过）");
  server.close();
});

test("S5 配置错误：状态卡原文摘要 + 链卡仍画误配行与网关行", async () => {
  const { server, base, envFile } = await startUiWithAuth(null);
  writeFileSync(envFile, "MF_LLM_MODEL=minimax-cn/MiniMax-M3\nMINIMAX_CN_API_KEY=sk-bad-7777\nMF_LLM_BASE_URL=https://gw/v1\n", "utf8");
  const html = await (await fetch(`${base}/settings`)).text();
  expect(html).toContain("配置错误");
  expect(html).toContain("MF_LLM_BASE_URL 对其不生效");
  expect(html).toContain("https://gw/v1");
  expect(html).toContain("****7777");
  server.close();
});

test("H 分支（G7）：LLM 状态面三态（A2：SPA 经 /api/llm-status 读取）", async () => {
  // H1 就绪·自动发现
  const ready = await startUiWithAuth(JSON.stringify({ "minimax-cn": { key: "sk-h1-1111" } }));
  const readyStatus = await (await fetch(`${ready.base}/api/llm-status`)).json();
  expect(readyStatus.mode).toBe("configured");
  expect(readyStatus.raw).toBe("configured");
  ready.server.close();
  // H3 未配置（灰态）
  const bare = await startUiWithAuth(null);
  const bareStatus = await (await fetch(`${bare.base}/api/llm-status`)).json();
  expect(bareStatus.mode).toBe("none");
  expect(bareStatus.raw).toBe("unconfigured");
  bare.server.close();
  // H4 配置错误（红态：raw 保留 error，供设置页呈现原因）
  const broken = await startUiWithAuth(null);
  writeFileSync(broken.envFile, "MF_LLM_MODEL=minimax-cn/MiniMax-M3\nMF_LLM_BASE_URL=https://gw/v1\n", "utf8");
  const brokenStatus = await (await fetch(`${broken.base}/api/llm-status`)).json();
  expect(brokenStatus.raw).toBe("error");
  broken.server.close();
});

// ---- REVIEW cycle 1 修复（F1/F2：契约钉死结构）----

test("R1：422 重渲染带 aria 关联（id=settings-issues + aria-invalid + aria-describedby）", async () => {
  const { server, base } = await startUi();
  const res = await post(base, "/settings/save", { model: "gpt-4o", api_key: "", base_url: "" });
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain('id="settings-issues"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="settings-issues"');
  server.close();
});

test("R2：S5 错误态工厂报错经 error-list role=alert 容器呈现", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(envFile, "MF_LLM_MODEL=minimax-cn/MiniMax-M3\nMF_LLM_BASE_URL=https://gw/v1\n", "utf8");
  const html = await (await fetch(`${base}/settings`)).text();
  expect(html).toMatch(/<ul class="error-list"[^>]*role="alert">[\s\S]*?MF_LLM_BASE_URL 对其不生效/);
  server.close();
});

// ---- T5 · 统计卡（契约 ST1-ST5 + F1 透传）----

function statsWorkspace(auditLines: string[], budgetTasks: Record<string, unknown>): { dir: string; envFile: string; restoreDataDir(): void } {
  const dir = mkdtempSync(join(tmpdir(), "mf-stats-ui-"));
  const dataDir = join(dir, "data");
  mkdirSync(dataDir, { recursive: true });
  if (auditLines.length > 0) writeFileSync(join(dataDir, "model-audit.jsonl"), `${auditLines.join("\n")}\n`, "utf8");
  if (Object.keys(budgetTasks).length > 0) {
    writeFileSync(join(dataDir, "model-budget.json"), JSON.stringify({ version: 1, tasks: budgetTasks }), "utf8");
  }
  const envFile = join(dir, ".env.local");
  writeFileSync(envFile, `MF_DATA_DIR=${dataDir}\n`, "utf8");
  // ②A 优先级 process > env-file：setup 注入的进程级变量会遮蔽 fixture——测试在进程层指回 fixture
  const prev = process.env.MF_DATA_DIR;
  process.env.MF_DATA_DIR = dataDir;
  return { dir, envFile, restoreDataDir: () => { if (prev === undefined) delete process.env.MF_DATA_DIR; else process.env.MF_DATA_DIR = prev; } };
}

function auditLine(taskId: string, provider: string, model: string, at: string, kind = "model.finished"): string {
  return JSON.stringify({ version: "1.0", taskId, runId: "r", sequence: 1, kind, at, provider, model, contextVersions: {} });
}

test("ST1 正常：两行汇总 chip + 按模型表（含合计勾稽与用途拆分）+ 留存脚注", async () => {
  const { dir, envFile, restoreDataDir } = statsWorkspace(
    [auditLine("mf:generate-1", "minimax-cn", "MiniMax-M3", new Date().toISOString())],
    { "mf:generate-1": { configuration: "c", limits: {}, usage: { modelCalls: 1, inputTokens: 1000, outputTokens: 500, reservedOutputTokens: 0 } } }
  );
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: join(dir, "no-auth.json") });
  const port = await listenUi(server, 0);
  const html = await (await fetch(`http://127.0.0.1:${port}/settings`)).text();
  expect(html).toContain("调用统计");
  expect(html).toContain('minimax-cn/MiniMax-M3');
  expect(html).toContain("1,500");
  expect(html).not.toContain("<p>今日 <span"); // RB5：无纯文本前缀，标签唯一在 chip
  expect(html).not.toContain("<p>累计 <span");
  expect(html).toContain("generate 次数");
  expect(html).toContain("合计");
  expect(html).toContain("留存期内");
  expect(html).not.toContain("预算已用"); // 未配置上限恒无警告（负例 4）
  server.close();
  restoreDataDir();
});

test("ST2 预算警告：tokens 上限 80% 以上 → warn chip + 上限小字", async () => {
  const { dir, envFile, restoreDataDir } = statsWorkspace(
    [auditLine("mf:generate-1", "minimax-cn", "MiniMax-M3", new Date().toISOString())],
    { "mf:generate-1": { configuration: "c", limits: {}, usage: { modelCalls: 1, inputTokens: 900, outputTokens: 100, reservedOutputTokens: 0 } } }
  );
  writeFileSync(envFile, `MF_DATA_DIR=${join(dir, "data")}\nMF_LLM_BUDGET_TOKENS=1000\n`, "utf8");
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: join(dir, "no-auth.json") });
  const port = await listenUi(server, 0);
  const html = await (await fetch(`http://127.0.0.1:${port}/settings`)).text();
  expect(html).toContain("预算已用 100%"); // 1000/1000
  expect(html).toContain("tokens 上限 1,000");
  server.close();
  restoreDataDir();
});

test("ST3 审计降级：token 总量照显（账本源）、模型列不可用、降级说明", async () => {
  const { dir, envFile, restoreDataDir } = statsWorkspace(
    [], // 审计文件缺失（降级形态：无归因）
    { "mf:generate-1": { configuration: "c", limits: {}, usage: { modelCalls: 2, inputTokens: 300, outputTokens: 200, reservedOutputTokens: 0 } } }
  );
  // 进程内降级标志：把 dataDir 置只读，向服务读取的同一路径写一次失败 append（账本只读仍可读）
  const dataDir = join(dir, "data");
  const { createJsonlAuditSink } = await import("../../src/llm/audit-sink.js");
  chmodSync(dataDir, 0o555);
  try {
    await createJsonlAuditSink(join(dataDir, "model-audit.jsonl")).append({ kind: "run.finished" } as never, undefined as never);
    const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: join(dir, "no-auth.json") });
    const port = await listenUi(server, 0);
    const html = await (await fetch(`http://127.0.0.1:${port}/settings`)).text();
    expect(html).toContain('class="chip chip-warn">审计降级</span>'); // RB8/N-D：chip 形断言
    expect(html).toContain("已降级为内存丢弃；模型调用不受影响（见下方说明）"); // RB6/B2'：一句说明
    expect(html).toContain('<span class="chip chip-queue">今日</span> 不可用（时间口径来自审计文件）'); // RB6/B3'
    expect(html).not.toContain("<p>今日 <span"); // RB5
    expect(html).toContain("不可用");
    expect(html).toContain("500"); // 账本 tokens 照显
    expect(html).toContain("按模型（累计，留存期内）："); // RB1：塌缩单行表在场
    expect(html).toMatch(/<td>不可用<\/td><td class="num">2<\/td><td class="num">500<\/td><td>不可用<\/td><td>不可用<\/td>/);
    expect(html).toContain("审计降级：审计 JSONL 写盘失败"); // SE-B 全句降级脚注
    expect(html).toContain("留存期内（审计文件 50MB"); // 留存脚注在场
    expect(html).not.toMatch(/minimax-cn[^"（]*MiniMax-M3<\/td>/); // 不给假模型行
    server.close();
  } finally {
    chmodSync(dataDir, 0o755);
    restoreDataDir();
  }
});

test("ST4 faux：整卡替换「不记账」，零数字零表格（历史真实数据亦不显示）", async () => {
  const { dir, envFile, restoreDataDir } = statsWorkspace(
    [auditLine("mf:generate-1", "minimax-cn", "MiniMax-M3", new Date().toISOString())],
    { "mf:generate-1": { configuration: "c", limits: {}, usage: { modelCalls: 1, inputTokens: 999, outputTokens: 999, reservedOutputTokens: 0 } } }
  );
  writeFileSync(envFile, `MF_DATA_DIR=${join(dir, "data")}\nMF_LLM_BACKEND=faux\n`, "utf8");
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: join(dir, "no-auth.json") });
  const port = await listenUi(server, 0);
  const html = await (await fetch(`http://127.0.0.1:${port}/settings`)).text();
  expect(html).toContain("faux 不记账");
  expect(html).not.toContain("1,998");
  expect(html).not.toContain("generate 次数");
  server.close();
  restoreDataDir();
});

test("ST5 空态：0 次 · 0 tokens + 暂无调用记录", async () => {
  const { dir, envFile, restoreDataDir } = statsWorkspace([], {});
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile, authJsonPath: join(dir, "no-auth.json") });
  const port = await listenUi(server, 0);
  const html = await (await fetch(`http://127.0.0.1:${port}/settings`)).text();
  expect(html).toContain('<span class="num">0</span> 次');
  expect(html).toContain('<span class="chip chip-queue">今日</span>');
  expect(html).toContain('<span class="chip chip-queue">累计</span>');
  expect(html).not.toContain("<p>今日 <span"); // RB5
  expect(html).not.toContain("<p>累计 <span");
  expect(html).toContain("暂无调用记录");
  expect(html).toContain("留存期内（审计文件 50MB"); // RB3：空态留存脚注保留
  server.close();
  restoreDataDir();
});
