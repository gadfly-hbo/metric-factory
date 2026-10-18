import { beforeEach, expect, test } from "vitest";
import { createLlmClientFromEnv, resolveModelChain } from "../../src/llm/index.js";
import { __testHooks } from "../../src/llm/pi-client.js";

// 配置缝（D4/D5/G1/G5/G6）：四分映射 + 主备链 + 急切校验，全部经纯函数 resolver 与工厂观察
beforeEach(() => {
  __testHooks.clearCache();
});

const MINIMAX = { MINIMAX_CN_API_KEY: "sk-minimax-test" };
const MIMO = { XIAOMI_TOKEN_PLAN_CN_API_KEY: "sk-mimo-test" };

test("四分 (a)：真值表命中返回精确 ModelConfig（MiniMax-M3 逐字段）", () => {
  const chain = resolveModelChain({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", ...MINIMAX });
  expect(chain).toHaveLength(1);
  expect(chain[0]!.model).toEqual({
    provider: "minimax-cn",
    id: "MiniMax-M3",
    protocol: "anthropic-messages",
    endpoint: "https://api.minimaxi.com/anthropic",
    contextWindow: 1_048_576,
    maxOutputTokens: 32_768,
    reasoning: true,
    input: ["text"]
  });
  expect(chain[0]!.apiKey).toBe("sk-minimax-test");
});

test("四分 (a)+G6：真值表命中与 MF_LLM_BASE_URL 同设 → 急切抛错", () => {
  expect(() =>
    resolveModelChain({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MF_LLM_BASE_URL: "https://gw.example/v1", ...MINIMAX })
  ).toThrow(/MF_LLM_BASE_URL.*不生效/);
});

test("四分 (b)：未验证模型 + MF_LLM_BASE_URL → 默认 openai-completions 网关", () => {
  const chain = resolveModelChain({
    MF_LLM_MODEL: "internal/biz-model",
    MF_LLM_BASE_URL: "https://gw.example/v1",
    INTERNAL_API_KEY: "sk-gw"
  });
  expect(chain[0]!.model.protocol).toBe("openai-completions");
  expect(chain[0]!.model.endpoint).toBe("https://gw.example/v1");
});

test("四分 (b)+G6：MF_LLM_API 合法覆盖、非法值急切抛错", () => {
  const ok = resolveModelChain({
    MF_LLM_MODEL: "internal/biz-model",
    MF_LLM_BASE_URL: "https://gw.example/v1",
    MF_LLM_API: "anthropic-messages",
    INTERNAL_API_KEY: "sk-gw"
  });
  expect(ok[0]!.model.protocol).toBe("anthropic-messages");
  expect(() =>
    resolveModelChain({
      MF_LLM_MODEL: "internal/biz-model",
      MF_LLM_BASE_URL: "https://gw.example/v1",
      MF_LLM_API: "opeani",
      INTERNAL_API_KEY: "sk-gw"
    })
  ).toThrow(/MF_LLM_API/);
});

test("四分 (c)+G1：openai/gpt-4o 经映射表可用（openai-responses→openai-completions）", () => {
  const chain = resolveModelChain({ MF_LLM_MODEL: "openai/gpt-4o", OPENAI_API_KEY: "sk-openai" });
  expect(chain[0]!.model.protocol).toBe("openai-completions");
  expect(chain[0]!.model.endpoint).toBe("https://api.openai.com/v1");
});

test("四分 (c)+G1：google/gemini-2.5-pro 协议不可映射 → 拒绝且文案含网关迁移指引", () => {
  expect(() => resolveModelChain({ MF_LLM_MODEL: "google/gemini-2.5-pro", GEMINI_API_KEY: "sk-g" })).toThrow(
    /MF_LLM_BASE_URL.*网关|网关.*MF_LLM_BASE_URL/
  );
});

test("四分 (d)：乱配置显式拒绝，报错文案列出三条可用路径", () => {
  expect(() => resolveModelChain({ MF_LLM_MODEL: "foo/bar", FOO_API_KEY: "sk" })).toThrow(
    /真值表|已验证模型[\s\S]*MF_LLM_BASE_URL[\s\S]*目录|目录[\s\S]*MF_LLM_BASE_URL/
  );
});

test("spec 格式错误急切抛错（<provider>/<model-id> 形式）", () => {
  expect(() => resolveModelChain({ MF_LLM_MODEL: "nonsense" })).toThrow(/<provider>\/<model-id>/);
});

test("D5/G5：fallback 笔误条目急切抛错且点名；缺 key 条目跳过；保序", () => {
  expect(() =>
    resolveModelChain({
      MF_LLM_MODEL: "minimax-cn/MiniMax-M3",
      MF_LLM_FALLBACK_MODELS: "minimax-cn/MiniMax-M4",
      ...MINIMAX
    })
  ).toThrow(/MF_LLM_FALLBACK_MODELS[\s\S]*MiniMax-M4/);

  const chain = resolveModelChain({
    MF_LLM_MODEL: "minimax-cn/MiniMax-M3",
    MF_LLM_FALLBACK_MODELS: " , openai/gpt-4o ,xiaomi-token-plan-cn/mimo-v2.6-flash ,",
    ...MINIMAX,
    ...MIMO
    // openai 无 key → 该条 apiKey 为 null（跳过），顺序保持
  });
  expect(chain.map((c) => `${c.model.provider}/${c.model.id}`)).toEqual([
    "minimax-cn/MiniMax-M3",
    "openai/gpt-4o",
    "xiaomi-token-plan-cn/mimo-v2.6-flash"
  ]);
  expect(chain[1]!.apiKey).toBeNull();
  expect(chain[2]!.apiKey).toBe("sk-mimo-test");
});

test("D5：全部候选无 key 时工厂抛错并列出所需环境变量名", () => {
  expect(() => createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3" })).toThrow(/MINIMAX_CN_API_KEY/);
  expect(() =>
    createLlmClientFromEnv({
      MF_LLM_MODEL: "minimax-cn/MiniMax-M3",
      MF_LLM_FALLBACK_MODELS: "xiaomi-token-plan-cn/mimo-v2.6-flash"
    })
  ).toThrow(/MINIMAX_CN_API_KEY[\s\S]*XIAOMI_TOKEN_PLAN_CN_API_KEY/);
});

test("G6：MF_LLM_TIMEOUT_MS 非正整数急切抛错，合法值放行", () => {
  expect(() => createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MF_LLM_TIMEOUT_MS: "abc", ...MINIMAX })).toThrow(
    /MF_LLM_TIMEOUT_MS/
  );
  expect(() => createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MF_LLM_TIMEOUT_MS: "0", ...MINIMAX })).toThrow(
    /MF_LLM_TIMEOUT_MS/
  );
  expect(() =>
    createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MF_LLM_TIMEOUT_MS: "5000", ...MINIMAX })
  ).not.toThrow();
});

test("G3：密钥改后同进程生效（新 key → 新缓存实例），process.env 桥已删", () => {
  __testHooks.clearCache();
  createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-one" });
  const sizeAfterFirst = __testHooks.cacheSize();
  createLlmClientFromEnv({ MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-two" });
  expect(__testHooks.cacheSize()).toBe(sizeAfterFirst + 1);
});
