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
  expect(out.text).toBe("faux 口径响应");
  expect(scripted.callCount()).toBe(1);
});

test("stop:'length'（恢复重试耗尽）映射为空字符串，落入解析失败桶", async () => {
  // modelRecovery.extraAttempts=1 → 首次 length 后再试一次，仍 length → INVALID_OUTPUT → ""
  const scripted = createScriptedTransport([{ stop: "length" }, { stop: "length" }]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-length" });
  const out = await client.complete({ system: "s", user: "u" });
  expect(out.text).toBe("");
  // G4：截断但出稿——真值照带（账本已记 tokens，统计/provenance 不留口径洞）
  expect(out.provider).toBe("test-provider");
  expect(out.model).toBe("t-1");
  expect(out.taskId).toMatch(/^mf:complete-/);
  expect(out.usage!.outputTokens).toBeGreaterThan(0);
});

test("transport 抛错映射为响亮失败，错误文案含 runtime reason", async () => {
  const scripted = createScriptedTransport([{ throw: new Error("boom") }, { throw: new Error("boom") }]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-error" });
  await expect(client.complete({ system: "s", user: "u" })).rejects.toThrow(/模型调用失败（/);
});

test("no-op audit sink：连续多次调用不抛错（防 AUDIT_FAILED 回归）", async () => {
  const scripted = createScriptedTransport(["一", "二", "三"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-audit" });
  expect((await client.complete({ system: "s", user: "1" })).text).toBe("一");
  expect((await client.complete({ system: "s", user: "2" })).text).toBe("二");
  expect((await client.complete({ system: "s", user: "3" })).text).toBe("三");
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
  expect(unique[0]).toMatch(/^mf:refine-\d+-[a-z0-9]{4}$/);
  expect(unique[1]).toMatch(/^mf:refine-\d+-[a-z0-9]{4}$/);
  expect(unique[2]).toMatch(/^mf:complete-\d+-[a-z0-9]{4}$/); // 缺省 caller
});

// ---- T1 · 真值管道（D1/D2/D5/G4/G5）----

test("真值透传：complete() 返回 usage/provider/model/taskId（onEvent 捕获）", async () => {
  const scripted = createScriptedTransport(["真值文本"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "t-truth" });
  const out = await client.complete({ system: "s", user: "u" });
  expect(out.text).toBe("真值文本");
  expect(out.provider).toBe("test-provider");
  expect(out.model).toBe("t-1");
  expect(out.taskId).toMatch(/^mf:complete-\d+-[a-z0-9]{4}$/);
  expect(out.usage).toMatchObject({ modelCalls: expect.any(Number), outputTokens: expect.any(Number) });
});

test("主备回退 provenance 真值：主候选 transport 失败 → 真值 = 备候选（D5 验收场景，无网络）", async () => {
  // 注意：普通 Error 穿透不触发回退（runtime 只认 ProviderFailure quota/rate-limit/unavailable/network）
  const failing = createScriptedTransport([{ providerFailure: "unavailable" }]);
  const backupModel: ModelConfig = { ...MODEL, provider: "backup-provider", id: "b-1" };
  const backup = createScriptedTransport(["备候选出稿"]);
  const client = createPiClient(
    [
      { model: MODEL, transport: failing.transport },
      { model: backupModel, transport: backup.transport }
    ],
    { cacheKey: "t-fallback" }
  );
  const out = await client.complete({ system: "s", user: "u" });
  expect(out.text).toBe("备候选出稿");
  expect(out.provider).toBe("backup-provider"); // 实际出稿真值，非链首标签
  expect(out.model).toBe("b-1");
  expect(failing.callCount()).toBe(1); // 主候选失败一次即回退（modelRecovery 预算跨候选共享，实证语义）
});

test("并发归因零串线：两 client（异模型）并发 complete，各归各的 provider（per-taskId 捕获）", async () => {
  const a = createScriptedTransport(["甲"]);
  const b = createScriptedTransport(["乙"]);
  const modelA: ModelConfig = { ...MODEL, provider: "pa", id: "m-a" };
  const modelB: ModelConfig = { ...MODEL, provider: "pb", id: "m-b" };
  const cA = createPiClient([{ model: modelA, transport: a.transport }], { cacheKey: "cc-a" });
  const cB = createPiClient([{ model: modelB, transport: b.transport }], { cacheKey: "cc-b" });
  const [ra, rb] = await Promise.all([
    cA.complete({ system: "s", user: "ua" }),
    cB.complete({ system: "s", user: "ub" })
  ]);
  expect(ra.text).toBe("甲");
  expect(ra.provider).toBe("pa");
  expect(ra.model).toBe("m-a");
  expect(rb.text).toBe("乙");
  expect(rb.provider).toBe("pb");
  expect(rb.model).toBe("m-b");
  expect(ra.taskId).not.toBe(rb.taskId);
});
