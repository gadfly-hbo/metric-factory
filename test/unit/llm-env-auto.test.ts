import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, test } from "vitest";
import { readAuthJsonKeys } from "../../src/llm/key-discovery.js";
import { resolveLlmEnvAuto } from "../../src/llm/env-auto.js";
import { providerEnvKey } from "../../src/llm/provider-keys.js";
import { __testHooks } from "../../src/llm/pi-client.js";

// 配置缝（D1/D2/D3/D4/D6/G1/G2）：发现容错、三层合成优先级、映射合一、注入缝
beforeEach(() => {
  __testHooks.clearCache();
});

function tmpAuthJson(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mf-auth-"));
  const p = join(dir, "auth.json");
  writeFileSync(p, content, "utf8");
  return p;
}

test("发现容错（D2）：文件不存在 / JSON 坏 / OAuth 条目 / 非 object 条目 / 空串 key 一律静默", async () => {
  expect(await readAuthJsonKeys(join(tmpdir(), "mf-no-such-auth.json"))).toEqual({});
  expect(await readAuthJsonKeys(tmpAuthJson('{"minimax-cn": {"key": "sk-1"'))).toEqual({});
  const mixed = tmpAuthJson(
    JSON.stringify({
      "minimax-cn": { key: "sk-good" },
      "openai-codex": { access: "a", refresh: "r", expires: 1 },
      "kimi-coding": "not-an-object",
      deepseek: { key: "   " },
      moonshot: { key: "sk-moon" }
    })
  );
  expect(await readAuthJsonKeys(mixed)).toEqual({ "minimax-cn": "sk-good", moonshot: "sk-moon" });
});

test("合成优先级（D4/②A）：process env > .env.local > 自动发现；sources 如实记录", async () => {
  const auth = tmpAuthJson(JSON.stringify({ "minimax-cn": { key: "sk-disc" } }));
  const envFileDir = mkdtempSync(join(tmpdir(), "mf-env-"));
  const envFile = join(envFileDir, ".env.local");
  writeFileSync(
    envFile,
    ["MINIMAX_CN_API_KEY=sk-file", "XIAOMI_TOKEN_PLAN_CN_API_KEY=sk-mimo-file", "MF_LLM_FALLBACK_MODELS=openai/gpt-4o"].join("\n"),
    "utf8"
  );
  const { env, sources, discoveredProviders } = await resolveLlmEnvAuto({
    processEnv: { MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-env" },
    envFilePath: envFile,
    authJsonPath: auth
  });
  expect(env.MINIMAX_CN_API_KEY).toBe("sk-env"); // process 赢
  expect(env.XIAOMI_TOKEN_PLAN_CN_API_KEY).toBe("sk-mimo-file"); // env-file 次之
  expect(env.MF_LLM_MODEL).toBe("minimax-cn/MiniMax-M3");
  expect(env.MF_LLM_FALLBACK_MODELS).toBe("openai/gpt-4o");
  expect(sources["MF_LLM_MODEL"]).toBe("process");
  expect(sources["MINIMAX_CN_API_KEY"]).toBe("process");
  expect(sources["XIAOMI_TOKEN_PLAN_CN_API_KEY"]).toBe("env-file");
  expect(sources["MF_LLM_FALLBACK_MODELS"]).toBe("env-file");
  expect(discoveredProviders).toContain("minimax-cn");
});

test("发现补齐（US6/D4）：未被显式设置的 key 由发现填充，source=discovery；显式值不被覆盖", async () => {
  const auth = tmpAuthJson(
    JSON.stringify({ "minimax-cn": { key: "sk-disc-mm" }, moonshot: { key: "sk-disc-ms" } })
  );
  const { env, sources, discoveredProviders } = await resolveLlmEnvAuto({
    processEnv: { MF_LLM_MODEL: "minimax-cn/MiniMax-M3" },
    authJsonPath: auth
  });
  expect(env.MINIMAX_CN_API_KEY).toBe("sk-disc-mm"); // 发现补齐
  expect(sources["MINIMAX_CN_API_KEY"]).toBe("discovery");
  expect(env.MOONSHOT_API_KEY).toBe("sk-disc-ms");
  expect(sources["MOONSHOT_API_KEY"]).toBe("discovery");
  expect(discoveredProviders.sort()).toEqual(["minimax-cn", "moonshot"]);
  // 显式值与发现不一致 → 显式赢
  const explicit = await resolveLlmEnvAuto({
    processEnv: { MF_LLM_MODEL: "minimax-cn/MiniMax-M3", MINIMAX_CN_API_KEY: "sk-explicit" },
    authJsonPath: auth
  });
  expect(explicit.env.MINIMAX_CN_API_KEY).toBe("sk-explicit");
  expect(explicit.sources["MINIMAX_CN_API_KEY"]).toBe("process");
});

test("空串语义（G2）：任何层的空串按未设置，低层值流入", async () => {
  const envFileDir = mkdtempSync(join(tmpdir(), "mf-env-"));
  const envFile = join(envFileDir, ".env.local");
  writeFileSync(envFile, "MF_LLM_MODEL=minimax-cn/MiniMax-M3\n", "utf8");
  const { env, sources } = await resolveLlmEnvAuto({
    processEnv: { MF_LLM_MODEL: "" },
    envFilePath: envFile,
    authJsonPath: join(envFileDir, "no-auth.json")
  });
  expect(env.MF_LLM_MODEL).toBe("minimax-cn/MiniMax-M3");
  expect(sources["MF_LLM_MODEL"]).toBe("env-file");
});

test("映射合一（D6）：已知表并集 + [^A-Z0-9]→_ 公式，含 . provider 产出合法变量名", () => {
  expect(providerEnvKey("minimax-cn")).toBe("MINIMAX_CN_API_KEY");
  expect(providerEnvKey("xiaomi-token-plan-cn")).toBe("XIAOMI_TOKEN_PLAN_CN_API_KEY");
  expect(providerEnvKey("openai")).toBe("OPENAI_API_KEY");
  expect(providerEnvKey("anthropic")).toBe("ANTHROPIC_API_KEY");
  expect(providerEnvKey("google")).toBe("GEMINI_API_KEY");
  expect(providerEnvKey("foo.bar")).toBe("FOO_BAR_API_KEY");
});

test("注入缝（G1）：authJsonPath 参数 > processEnv.MF_LLM_AUTH_JSON_PATH > 缺省；指向不存在文件=无发现", async () => {
  const authA = tmpAuthJson(JSON.stringify({ moonshot: { key: "sk-a" } }));
  const authB = tmpAuthJson(JSON.stringify({ deepseek: { key: "sk-b" } }));
  // 参数优先于环境变量
  const byParam = await resolveLlmEnvAuto({ processEnv: { MF_LLM_AUTH_JSON_PATH: authB }, authJsonPath: authA });
  expect(byParam.discoveredProviders).toEqual(["moonshot"]);
  // 环境变量次之
  const byEnv = await resolveLlmEnvAuto({ processEnv: { MF_LLM_AUTH_JSON_PATH: authB } });
  expect(byEnv.discoveredProviders).toEqual(["deepseek"]);
  // 指向不存在文件 → 无发现、不抛错
  const none = await resolveLlmEnvAuto({ processEnv: {}, authJsonPath: join(tmpdir(), "mf-absent.json") });
  expect(none.discoveredProviders).toEqual([]);
  expect(none.env.MOONSHOT_API_KEY).toBeUndefined();
});

test("env 超集（D4）：非 LLM 的 process 变量原样透传", async () => {
  const { env } = await resolveLlmEnvAuto({ processEnv: { PATH: "/usr/bin", MF_REVIEWER: "alice" }, authJsonPath: join(mkdtempSync(join(tmpdir(), "mf-env-no-auth-")), "auth.json") });
  expect(env.PATH).toBe("/usr/bin");
  expect(env.MF_REVIEWER).toBe("alice");
});

// ---- T2 · 默认链自动启用（G3/G4 裁决 B：MiniMax-M3 主 / mimo 备）----

const CHAIN_AUTH_BOTH = () => tmpAuthJson(JSON.stringify({ "minimax-cn": { key: "sk-mm" }, "xiaomi-token-plan-cn": { key: "sk-mimo" } }));
const CHAIN_AUTH_MAIN_ONLY = () => tmpAuthJson(JSON.stringify({ "minimax-cn": { key: "sk-mm" } }));
const CHAIN_AUTH_BACKUP_ONLY = () => tmpAuthJson(JSON.stringify({ "xiaomi-token-plan-cn": { key: "sk-mimo" } }));

test("默认链（G3/G4-B）：双 key → 注入主+备，sources=default-chain", async () => {
  const { env, sources } = await resolveLlmEnvAuto({ processEnv: {}, authJsonPath: CHAIN_AUTH_BOTH() });
  expect(env.MF_LLM_MODEL).toBe("minimax-cn/MiniMax-M3");
  expect(env.MF_LLM_FALLBACK_MODELS).toBe("xiaomi-token-plan-cn/mimo-v2.6-flash");
  expect(sources["MF_LLM_MODEL"]).toBe("default-chain");
  expect(sources["MF_LLM_FALLBACK_MODELS"]).toBe("default-chain");
});

test("默认链：发现到几家启用几家——仅主 key 只注入主；仅备 key 链首为备", async () => {
  const mainOnly = await resolveLlmEnvAuto({ processEnv: {}, authJsonPath: CHAIN_AUTH_MAIN_ONLY() });
  expect(mainOnly.env.MF_LLM_MODEL).toBe("minimax-cn/MiniMax-M3");
  expect(mainOnly.env.MF_LLM_FALLBACK_MODELS).toBeUndefined();
  const backOnly = await resolveLlmEnvAuto({ processEnv: {}, authJsonPath: CHAIN_AUTH_BACKUP_ONLY() });
  expect(backOnly.env.MF_LLM_MODEL).toBe("xiaomi-token-plan-cn/mimo-v2.6-flash");
  expect(backOnly.env.MF_LLM_FALLBACK_MODELS).toBeUndefined();
});

test("默认链不注入的边界：零 key / baseUrl 在场 / 只设 fallbacks / 显式模型 / faux 短路", async () => {
  const zero = await resolveLlmEnvAuto({ processEnv: {}, authJsonPath: join(tmpdir(), "mf-absent.json") });
  expect(zero.env.MF_LLM_MODEL).toBeUndefined();
  const withBase = await resolveLlmEnvAuto({ processEnv: { MF_LLM_BASE_URL: "https://gw/v1" }, authJsonPath: CHAIN_AUTH_BOTH() });
  expect(withBase.env.MF_LLM_MODEL).toBeUndefined();
  const envFileDir = mkdtempSync(join(tmpdir(), "mf-env-"));
  const envFile = join(envFileDir, ".env.local");
  writeFileSync(envFile, "MF_LLM_FALLBACK_MODELS=openai/gpt-4o\n", "utf8");
  const fbOnly = await resolveLlmEnvAuto({ processEnv: {}, envFilePath: envFile, authJsonPath: CHAIN_AUTH_BOTH() });
  expect(fbOnly.env.MF_LLM_MODEL).toBeUndefined();
  expect(fbOnly.env.MF_LLM_FALLBACK_MODELS).toBe("openai/gpt-4o"); // 不被默认链接管
  const explicit = await resolveLlmEnvAuto({ processEnv: { MF_LLM_MODEL: "openai/gpt-4o" }, authJsonPath: CHAIN_AUTH_BOTH() });
  expect(explicit.env.MF_LLM_MODEL).toBe("openai/gpt-4o");
  expect(explicit.env.MF_LLM_FALLBACK_MODELS).toBeUndefined();
  const faux = await resolveLlmEnvAuto({ processEnv: { MF_LLM_BACKEND: "faux" }, authJsonPath: CHAIN_AUTH_BOTH() });
  expect(faux.env.MF_LLM_MODEL).toBeUndefined(); // D10：faux 短路先于默认链
  expect(faux.discoveredProviders).toEqual([]); // 且不触发现层
});

// ---- REVIEW cycle 1 修复（F3：faux 短路用合成后终值）----

test("R3：显式非 faux BACKEND 覆盖 .env.local faux 时，发现与默认链照常（合成后语义）", async () => {
  const envFileDir = mkdtempSync(join(tmpdir(), "mf-env-"));
  const envFile = join(envFileDir, ".env.local");
  writeFileSync(envFile, "MF_LLM_BACKEND=faux\n", "utf8");
  const auth = tmpAuthJson(JSON.stringify({ "minimax-cn": { key: "sk-f3" } }));
  const { env, discoveredProviders } = await resolveLlmEnvAuto({
    processEnv: { MF_LLM_BACKEND: "pi" },
    envFilePath: envFile,
    authJsonPath: auth
  });
  expect(env.MF_LLM_BACKEND).toBe("pi"); // 显式赢（合成后终值）
  expect(discoveredProviders).toEqual(["minimax-cn"]); // 未被错误短路
  expect(env.MF_LLM_MODEL).toBe("minimax-cn/MiniMax-M3"); // 默认链照常注入
});
