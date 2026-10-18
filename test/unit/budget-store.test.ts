import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, test } from "vitest";
import type { ModelConfig } from "pi-agent-runtime";
import { createPiClient, __testHooks } from "../../src/llm/pi-client.js";
import { createScriptedTransport } from "../../src/llm/scripted-transport.js";
import { createFileBudgetStore } from "../../src/llm/budget-store.js";

const MODEL: ModelConfig = {
  provider: "budget-provider",
  id: "b-1",
  protocol: "openai-completions",
  endpoint: "http://127.0.0.1/never",
  contextWindow: 128_000,
  maxOutputTokens: 8_192
};

beforeEach(() => {
  __testHooks.clearCache();
});

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), "mf-budget-"));
}

test("tokens 上限阻断（千分位 + env 择一）：complete() 抛四要素文案", async () => {
  const dirBig = tmpDir();
  // RB8/N-B：预置大用量账本（≥10⁴）实证千分位；仅 tokens 维度超限 → 出路只指 MF_LLM_BUDGET_TOKENS
  const { writeFileSync: wf } = await import("node:fs");
  wf(
    join(dirBig, "model-budget.json"),
    JSON.stringify({ version: 1, tasks: { "mf:generate-0-seed": { configuration: "c", limits: {}, usage: { modelCalls: 1, inputTokens: 2000000, outputTokens: 47513, reservedOutputTokens: 0 } } } }),
    "utf8"
  );
  const storeBig = createFileBudgetStore(dirBig, { maxTokens: 1000000 });
  const clientBig = createPiClient([{ model: MODEL, transport: createScriptedTransport(["x"]).transport }], { cacheKey: "budget-fmt", budgets: storeBig });
  const errBig = await clientBig.complete({ system: "s", user: "u" }).catch((e: Error) => e.message);
  expect(errBig).toContain("已用 2,047,513 / 上限 1,000,000");
  expect(errBig).toContain("（环境变量 MF_LLM_BUDGET_TOKENS）");
  expect(errBig).not.toContain("MF_LLM_BUDGET_CALLS");
});

test("tokens 上限阻断（运行时路径）：complete() 抛四要素文案（预算字样/已用 上限/账本路径/两条出路）", async () => {
  const dir = tmpDir();
  const store = createFileBudgetStore(dir, { maxTokens: 1 }); // 首调 settle 后即超
  const scripted = createScriptedTransport(["第一次出稿"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "budget-tokens",
    budgets: store
  });
  const first = await client.complete({ system: "s", user: "u" });
  expect(first.text).toBe("第一次出稿");
  await expect(client.complete({ system: "s", user: "u2" })).rejects.toThrow(/预算已耗尽/);
  await expect(client.complete({ system: "s", user: "u3" })).rejects.toThrow(/已用 \d[\d,]* \/ 上限 1/);
  await expect(client.complete({ system: "s", user: "u4" })).rejects.toThrow(/账本文件：/);
  await expect(client.complete({ system: "s", user: "u5" })).rejects.toThrow(/MF_LLM_BUDGET_TOKENS/);
  await expect(client.complete({ system: "s", user: "u6" })).rejects.toThrow(/删除账本文件/);
});

test("calls 上限阻断（按 attempt 计）：MF_LLM_BUDGET_CALLS=1 → 第二次调用被拒", async () => {
  const dir = tmpDir();
  const store = createFileBudgetStore(dir, { maxCalls: 1 });
  const scripted = createScriptedTransport(["a", "b"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "budget-calls",
    budgets: store
  });
  await client.complete({ system: "s", user: "1" });
  await expect(client.complete({ system: "s", user: "2" })).rejects.toThrow(/调用次数 已用 1 \/ 上限 1/);
});

test("settle 计量落盘：账本文件 usage 勾稽（input+output>0、modelCalls≥1），聚合随调用增长", async () => {
  const dir = tmpDir();
  const store = createFileBudgetStore(dir, {});
  const scripted = createScriptedTransport(["x", "y"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "budget-settle",
    budgets: store
  });
  await client.complete({ system: "s", user: "1" });
  const file = join(dir, "model-budget.json");
  expect(existsSync(file)).toBe(true);
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { tasks: Record<string, { usage: Record<string, number> }> };
  const usages = Object.values(parsed.tasks);
  expect(usages.length).toBeGreaterThanOrEqual(1);
  const total = usages.reduce((acc, t) => acc + (t.usage.inputTokens ?? 0) + (t.usage.outputTokens ?? 0), 0);
  expect(total).toBeGreaterThan(0);
  expect(usages.reduce((acc, t) => acc + (t.usage.modelCalls ?? 0), 0)).toBeGreaterThanOrEqual(1);
  const d1 = store.describeBudget();
  await client.complete({ system: "s", user: "2" });
  const d2 = store.describeBudget();
  expect(d2.usedCalls).toBeGreaterThan(d1.usedCalls);
  expect(d2.usedTokens).toBeGreaterThan(d1.usedTokens);
});

test("解除：删除账本文件即恢复计数", async () => {
  const dir = tmpDir();
  const store = createFileBudgetStore(dir, { maxCalls: 1 });
  const scripted = createScriptedTransport(["a", "b", "c"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "budget-release",
    budgets: store
  });
  await client.complete({ system: "s", user: "1" });
  await expect(client.complete({ system: "s", user: "2" })).rejects.toThrow(/预算已耗尽/);
  rmSync(join(dir, "model-budget.json"));
  const again = await client.complete({ system: "s", user: "3" });
  expect(again.text).toBe("b"); // 阻断发生在 claim（transport 未消耗脚本项），脚本指针仍在第 2 项
});

test("缓存键并入上限值（D8）：同 dataDir 异 caps → 异缓存实例", async () => {
  const dir = tmpDir();
  const { createLlmClientFromEnv } = await import("../../src/llm/index.js");
  const base = { MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-b", MF_DATA_DIR: dir };
  createLlmClientFromEnv({ ...base, MF_LLM_BUDGET_TOKENS: "1000000" });
  const size1 = __testHooks.cacheSize();
  createLlmClientFromEnv({ ...base, MF_LLM_BUDGET_TOKENS: "2000000" });
  expect(__testHooks.cacheSize()).toBe(size1 + 1);
});

test("预算 env 急切校验（照 parseTimeoutMs 先例）：非法值点名拒绝", async () => {
  const { createLlmClientFromEnv } = await import("../../src/llm/index.js");
  const dir = tmpDir();
  expect(() =>
    createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-b", MF_DATA_DIR: dir, MF_LLM_BUDGET_TOKENS: "abc" })
  ).toThrow(/MF_LLM_BUDGET_TOKENS/);
  expect(() =>
    createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-b", MF_DATA_DIR: dir, MF_LLM_BUDGET_CALLS: "0" })
  ).toThrow(/MF_LLM_BUDGET_CALLS/);
});

test("per-op 锁并发安全：两 store 同路径并发变更，文件始终可解析且无交叉损坏", async () => {
  const dir = tmpDir();
  const s1 = createFileBudgetStore(dir, {});
  const s2 = createFileBudgetStore(dir, {});
  const t1 = createScriptedTransport(Array.from({ length: 8 }, (_, i) => `a${i}`));
  const t2 = createScriptedTransport(Array.from({ length: 8 }, (_, i) => `b${i}`));
  const c1 = createPiClient([{ model: MODEL, transport: t1.transport }], { cacheKey: "par-1", budgets: s1 });
  const c2 = createPiClient([{ model: { ...MODEL, id: "b-2" }, transport: t2.transport }], { cacheKey: "par-2", budgets: s2 });
  const jobs: Promise<unknown>[] = [];
  for (let i = 0; i < 8; i++) {
    jobs.push(c1.complete({ system: "s", user: `u${i}` }).catch(() => "ok-fail-allowed"));
    jobs.push(c2.complete({ system: "s", user: `v${i}` }).catch(() => "ok-fail-allowed"));
  }
  await Promise.all(jobs);
  const parsed = JSON.parse(readFileSync(join(dir, "model-budget.json"), "utf8"));
  expect(parsed.version).toBe(1);
  expect(Object.keys(parsed.tasks).length).toBeGreaterThanOrEqual(2);
  const d = s1.describeBudget();
  expect(d.usedCalls).toBe(16); // 两 client 各 8 次，一本账
});

test("budgetUsageWarning（G7）：≥80% 一行警告、未配置上限静默、<80% 静默", async () => {
  const { budgetUsageWarning } = await import("../../src/llm/index.js");
  const dir = tmpDir();
  const store = createFileBudgetStore(dir, { maxTokens: 100 });
  const scripted = createScriptedTransport(["w1", "w2"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "warn", budgets: store });
  await client.complete({ system: "s", user: "1" }); // settle 后 usedTokens = input+output（脚本各 1+1=2... 实际按 runtime 计量）
  const env = { MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-w", MF_DATA_DIR: dir, MF_LLM_BUDGET_TOKENS: "2" };
  const line = budgetUsageWarning(env);
  expect(line).toMatch(/WARNING 预算已用 \d+%/);
  expect(line).toMatch(/tokens 已用/);
  expect(budgetUsageWarning({ MF_DATA_DIR: dir })).toBeUndefined(); // 未配置上限
  const envLo = { MF_DATA_DIR: dir, MF_LLM_BUDGET_TOKENS: "100000000" };
  expect(budgetUsageWarning(envLo)).toBeUndefined(); // <80% 静默
});
