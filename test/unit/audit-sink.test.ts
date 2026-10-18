import { mkdtempSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, test } from "vitest";
import type { ModelConfig } from "pi-agent-runtime";
import { createPiClient, __testHooks } from "../../src/llm/pi-client.js";
import { createScriptedTransport } from "../../src/llm/scripted-transport.js";
import { createJsonlAuditSink, isAuditDegraded, resolveDataDir } from "../../src/llm/audit-sink.js";

const MODEL: ModelConfig = {
  provider: "audit-provider",
  id: "a-1",
  protocol: "openai-completions",
  endpoint: "http://127.0.0.1/never",
  contextWindow: 128_000,
  maxOutputTokens: 8_192
};

beforeEach(() => {
  __testHooks.clearCache();
});

test("事件链完整落盘：run.started→model.admitted→model.finished→run.finished，字段保真", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-audit-"));
  const file = join(dir, "model-audit.jsonl");
  const sink = createJsonlAuditSink(file);
  const scripted = createScriptedTransport(["审计文本"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "audit-chain", auditSink: sink });
  const out = await client.complete({ system: "s", user: "u" });
  expect(out.text).toBe("审计文本");
  const events = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  expect(events.map((e) => e.kind)).toEqual(["run.started", "model.admitted", "model.finished", "run.finished"]);
  for (const e of events) {
    expect(e.version).toBe("1.0");
    expect(e.taskId).toMatch(/^mf:complete-/);
    expect(e.provider).toBe("audit-provider");
    expect(e.model).toBe("a-1");
  }
});

test("惰性构造：仅建 sink 与 client 不落任何文件（D10 负测试）", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-audit-lazy-"));
  const file = join(dir, "nested/model-audit.jsonl");
  const sink = createJsonlAuditSink(file);
  createPiClient([{ model: MODEL, transport: createScriptedTransport(["x"]).transport }], { cacheKey: "audit-lazy", auditSink: sink });
  expect(existsSync(file)).toBe(false);
  expect(existsSync(join(dir, "nested"))).toBe(false);
});

test("never-throw：写盘失败不杀调用，降级标志置位可查（D3）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-audit-degraded-"));
  const blocker = join(dir, "blocker"); // 用一个文件占住目录位置，mkdir 必败
  writeFileSync(blocker, "x", "utf8");
  const file = join(blocker, "sub/model-audit.jsonl");
  const sink = createJsonlAuditSink(file);
  const scripted = createScriptedTransport(["降级下照常出稿"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "audit-degraded", auditSink: sink });
  const out = await client.complete({ system: "s", user: "u" });
  expect(out.text).toBe("降级下照常出稿");
  expect(isAuditDegraded(file)).toBe(true);
});

test("轮转：注入小上限触发 rename 出 .1（DR 值 50MB 生产不变）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-audit-rot-"));
  const file = join(dir, "model-audit.jsonl");
  const sink = createJsonlAuditSink(file, { maxBytes: 600 });
  const scripted = createScriptedTransport(["轮转探测"]);
  const client = createPiClient([{ model: MODEL, transport: scripted.transport }], { cacheKey: "audit-rot", auditSink: sink });
  for (let i = 0; i < 6; i++) {
    await client.complete({ system: "s", user: `u${i}` });
  }
  expect(existsSync(`${file}.1`)).toBe(true);
  expect(existsSync(file)).toBe(true);
});

test("串行队列：并发 append 行序保持（sequence 单调可解析）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-audit-order-"));
  const file = join(dir, "model-audit.jsonl");
  const sink = createJsonlAuditSink(file);
  const lines = Array.from({ length: 30 }, (_, i) => JSON.stringify({ version: "1.0", sequence: i }));
  await Promise.all(lines.map((l) => sink.append({ ...(JSON.parse(l) as object), kind: "run.finished" } as never, undefined as never)));
  const written = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l).sequence);
  expect(written).toEqual(Array.from({ length: 30 }, (_, i) => i));
});

test("vitest 守卫（G3）：测试环境未注入 MF_DATA_DIR 缺省解析 throw；注入则放行", () => {
  expect(() => resolveDataDir({})).toThrow(/MF_DATA_DIR/);
  const dir = mkdtempSync(join(tmpdir(), "mf-datadir-"));
  expect(resolveDataDir({ MF_DATA_DIR: dir })).toBe(dir);
});

test("缓存键并入审计路径身份（D8/红队 KA3 附带一击）：同链同 key 异路径 → 异缓存实例", async () => {
  const dirA = mkdtempSync(join(tmpdir(), "mf-cache-a-"));
  const dirB = mkdtempSync(join(tmpdir(), "mf-cache-b-"));
  const { createLlmClientFromEnv } = await import("../../src/llm/index.js");
  const base = { MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-audit" };
  createLlmClientFromEnv({ ...base, MF_DATA_DIR: dirA });
  const sizeA = __testHooks.cacheSize();
  createLlmClientFromEnv({ ...base, MF_DATA_DIR: dirB });
  expect(__testHooks.cacheSize()).toBe(sizeA + 1);
});
