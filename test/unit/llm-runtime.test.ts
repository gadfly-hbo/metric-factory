import { beforeEach, expect, test } from "vitest";
import type { AuditSink, ModelConfig } from "pi-agent-runtime";
import { createPiClient, __testHooks } from "../../src/llm/pi-client.js";
import { createScriptedTransport } from "../../src/llm/scripted-transport.js";

// 引擎缝（D2/D3/D6/D7/G4/G8）：LlmClient.complete() 经脚本化 ModelTransport 走真实 runtime 管线
const MODEL: ModelConfig = {
  provider: "test-provider",
  id: "t-1",
  protocol: "openai-completions",
  endpoint: "http://127.0.0.1/never",
  contextWindow: 128_000,
  maxOutputTokens: 8_192
};

beforeEach(() => {
  __testHooks.clearCache();
});

test("脚本化 transport 下 complete() 返回脚本文本且调用计数正确", async () => {
  const scripted = createScriptedTransport(["faux 口径响应"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "t-basic",
    caller: "generate"
  });
  const out = await client.complete({ system: "你是指标体系设计师", user: "描述业务" });
  expect(out).toBe("faux 口径响应");
  expect(scripted.callCount()).toBe(1);
});

test("stop:'length'（恢复重试耗尽）映射为空字符串，落入解析失败桶", async () => {
  // modelRecovery.extraAttempts=1 → 首次 length 后再试一次，仍 length → INVALID_OUTPUT → ""
  const scripted = createScriptedTransport([{ stop: "length" }, { stop: "length" }]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-length" });
  const out = await client.complete({ system: "s", user: "u" });
  expect(out).toBe("");
});

test("transport 抛错映射为响亮失败，错误文案含 runtime reason", async () => {
  const scripted = createScriptedTransport([{ throw: new Error("boom") }, { throw: new Error("boom") }]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-error" });
  await expect(client.complete({ system: "s", user: "u" })).rejects.toThrow(/模型调用失败（/);
});

test("no-op audit sink：连续多次调用不抛错（防 AUDIT_FAILED 回归）", async () => {
  const scripted = createScriptedTransport(["一", "二", "三"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-audit" });
  expect(await client.complete({ system: "s", user: "1" })).toBe("一");
  expect(await client.complete({ system: "s", user: "2" })).toBe("二");
  expect(await client.complete({ system: "s", user: "3" })).toBe("三");
});

test("runtime 进程级单例：同 cacheKey 复用、异 cacheKey 新实例（D3/G3 缓存键语义）", async () => {
  const s1 = createScriptedTransport(["a"]);
  const s2 = createScriptedTransport(["b"]);
  const s3 = createScriptedTransport(["c"]);
  const c1 = createPiClient([{ model: MODEL, transport: s1.transport }], { cacheKey: "k1" });
  await c1.complete({ system: "s", user: "u" });
  expect(__testHooks.cacheSize()).toBe(1);
  const c2 = createPiClient([{ model: MODEL, transport: s2.transport }], { cacheKey: "k1" });
  await c2.complete({ system: "s", user: "u" });
  expect(__testHooks.cacheSize()).toBe(1); // 同键复用
  const c3 = createPiClient([{ model: MODEL, transport: s3.transport }], { cacheKey: "k2" });
  await c3.complete({ system: "s", user: "u" });
  expect(__testHooks.cacheSize()).toBe(2); // 异键新实例
});

test("taskId 含 caller 前缀且进程内唯一（G4；经审计事件观察）", async () => {
  const seenTaskIds: string[] = [];
  const capture: AuditSink = {
    append: async (event) => {
      seenTaskIds.push(event.taskId);
    }
  };
  const scripted = createScriptedTransport(["x", "x", "x"]);
  const c1 = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "t-taskid",
    caller: "refine",
    auditSink: capture
  });
  await c1.complete({ system: "s", user: "1" });
  const c2 = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "t-taskid-2",
    caller: "refine",
    auditSink: capture
  });
  await c2.complete({ system: "s", user: "2" });
  const c3 = createPiClient([{ model: MODEL, transport: scripted.transport }], {
    cacheKey: "t-taskid-3",
    auditSink: capture
  });
  await c3.complete({ system: "s", user: "3" });

  const unique = [...new Set(seenTaskIds)];
  expect(unique.length).toBe(3); // 每次 complete 一个 taskId，跨 cacheKey 也唯一（全局自增）
  expect(unique[0]).toMatch(/^mf:refine-\d+$/);
  expect(unique[1]).toMatch(/^mf:refine-\d+$/);
  expect(unique[2]).toMatch(/^mf:complete-\d+$/); // 缺省 caller
});
