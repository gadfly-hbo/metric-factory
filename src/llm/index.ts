import { createHash } from "node:crypto";
import { createPiTransport, type ModelConfig } from "pi-agent-runtime";
import { getBuiltinModels, type BuiltinProvider } from "@earendil-works/pi-ai/providers/all";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { LlmClient } from "./types.js";
import { createFakeClient } from "./fake-client.js";
import { createPiClient, type PiCandidate } from "./pi-client.js";

export type { LlmClient, LlmRequest } from "./types.js";
export { createFakeClient } from "./fake-client.js";
export { estimateTokens } from "./tokens.js";

// 工厂：按环境变量组装 client（pi 依赖收敛于 src/llm 模块，业务代码零 pi import——guard 测试锁定）。
// 环境变量面（M1 不变式：现行配置全部照常可用）：
// - MF_LLM_BACKEND=faux + MF_FAUX_RESPONSE：确定性脚本（测试/演示）
// - MF_LLM_MODEL=<provider>/<model-id>：主模型（四分映射 D4 解析）
// - MF_LLM_FALLBACK_MODELS：逗号分隔备模型（同四分映射；笔误急切抛错点名、缺 key 跳过、保序）
// - MF_LLM_BASE_URL：OpenAI 兼容网关覆盖；MF_LLM_API=openai-completions|anthropic-messages 覆盖网关协议
// - MF_LLM_TIMEOUT_MS：单次模型超时（正整数毫秒，缺省 300000）
// 密钥只从注入 env 实参读（G3，无 process.env 桥）；配置错误一律急切响亮失败（GRILL 主线）。

/** D4(a) 真值表：已验证模型（照 DR piRuntime 真值表逐字段拷贝）。 */
const TRUTH_TABLE: Record<string, ModelConfig> = {
  "minimax-cn/MiniMax-M3": {
    provider: "minimax-cn",
    id: "MiniMax-M3",
    protocol: "anthropic-messages",
    endpoint: "https://api.minimaxi.com/anthropic",
    contextWindow: 1_048_576,
    maxOutputTokens: 32_768,
    reasoning: true,
    input: ["text"]
  },
  "xiaomi-token-plan-cn/mimo-v2.6-flash": {
    provider: "xiaomi-token-plan-cn",
    id: "mimo-v2.6-flash",
    protocol: "openai-completions",
    endpoint: "https://token-plan-cn.xiaomimimo.com/v1",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    input: ["text"]
  }
};

/** G1：pi-ai 目录 api 值 → runtime 两协议映射表；未知值显式拒绝。 */
const PROTOCOL_MAP: Record<string, ModelConfig["protocol"]> = {
  "openai-completions": "openai-completions",
  "openai-responses": "openai-completions",
  "anthropic-messages": "anthropic-messages"
};

const RUNTIME_PROTOCOLS = ["openai-completions", "anthropic-messages"] as const;

export interface ResolvedCandidate {
  model: ModelConfig;
  /** null = 缺 key（运行时条件，工厂跳过）；非 null 即可构造 transport。 */
  apiKey: string | null;
}

/** D4 四分映射 + D5 主备链解析（纯函数，配置缝；一切配置笔误在此急切抛出）。 */
export function resolveModelChain(env: NodeJS.ProcessEnv): ResolvedCandidate[] {
  const spec = env.MF_LLM_MODEL;
  if (!spec) {
    throw new Error(
      "未配置模型：请设置 MF_LLM_MODEL=<provider>/<model-id>（或 MF_LLM_BACKEND=faux 用于测试），详见 README provider 配置表"
    );
  }
  if (env.MF_LLM_API !== undefined && !RUNTIME_PROTOCOLS.includes(env.MF_LLM_API as (typeof RUNTIME_PROTOCOLS)[number])) {
    throw new Error(`MF_LLM_API 必须是 ${RUNTIME_PROTOCOLS.join(" | ")} 之一（收到 "${env.MF_LLM_API}"）`);
  }
  const specs = [spec, ...parseFallbackSpecs(env.MF_LLM_FALLBACK_MODELS)];
  return specs.map((entry, i) => resolveOne(entry, env, i > 0));
}

function parseFallbackSpecs(raw: string | undefined): string[] {
  if (!raw) return [];
  // G5：trim、忽略空项、保序不去重
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function resolveOne(spec: string, env: NodeJS.ProcessEnv, isFallback: boolean): ResolvedCandidate {
  const slash = spec.indexOf("/");
  if (slash <= 0 || slash === spec.length - 1) {
    throw new Error(
      `${isFallback ? `MF_LLM_FALLBACK_MODELS 条目 "${spec}"` : `MF_LLM_MODEL（收到 "${spec}"）`}需为 <provider>/<model-id> 形式，如 openai/gpt-4o`
    );
  }
  const model = resolveModelConfig(spec, env, isFallback);
  return { model, apiKey: env[envKeyFor(model.provider)] ?? null };
}

function resolveModelConfig(spec: string, env: NodeJS.ProcessEnv, isFallback: boolean): ModelConfig {
  const where = isFallback ? `MF_LLM_FALLBACK_MODELS 条目 "${spec}"` : `模型 ${spec}`;
  // (a) 真值表精确匹配；G6：与 baseUrl 同设是永久性配置矛盾，急切抛出
  const hit = TRUTH_TABLE[spec];
  if (hit) {
    if (env.MF_LLM_BASE_URL) {
      throw new Error(`${where} 命中内置已验证模型，MF_LLM_BASE_URL 对其不生效：请清除网关变量或改用其他模型`);
    }
    return hit;
  }
  const [provider, modelId] = [spec.slice(0, spec.indexOf("/")), spec.slice(spec.indexOf("/") + 1)];
  // (b) 自定义网关：protocol 缺省 openai-completions（MF_LLM_BASE_URL 既有语义），MF_LLM_API 覆盖
  if (env.MF_LLM_BASE_URL) {
    return {
      provider,
      id: modelId,
      protocol: (env.MF_LLM_API as ModelConfig["protocol"] | undefined) ?? "openai-completions",
      endpoint: env.MF_LLM_BASE_URL,
      contextWindow: 128_000,
      maxOutputTokens: 8_192
    };
  }
  // (c) pi-ai 内置静态目录回退（现行解析路径）；G1 协议映射表
  const catalog = getBuiltinModels(provider as BuiltinProvider).find((m) => m.id === modelId);
  if (catalog) {
    const protocol = PROTOCOL_MAP[catalog.api];
    if (!protocol) {
      throw new Error(
        `${where} 的协议 ${catalog.api} 暂不支持：请经 MF_LLM_BASE_URL 走 OpenAI 兼容网关接入（详见 README provider 配置表）`
      );
    }
    return toModelConfig(catalog);
  }
  // (d) 其余显式拒绝，文案列出三条可用路径
  throw new Error(
    `${where} 无法解析，可用路径有三：\n` +
      `  1) 内置已验证模型：${Object.keys(TRUTH_TABLE).join(" / ")}\n` +
      `  2) 自定义网关：设置 MF_LLM_BASE_URL（协议缺省 openai-completions，MF_LLM_API 可覆盖）\n` +
      `  3) pi-ai 内置目录模型：如 openai/gpt-4o、anthropic/claude-sonnet-4-5（检查 provider/model-id 拼写）`
  );
}

/** catalog 条目 → runtime ModelConfig（数据级字段拷贝 + G1 协议映射）。 */
function toModelConfig(catalog: Model<Api>): ModelConfig {
  return {
    provider: catalog.provider,
    id: catalog.id,
    protocol: PROTOCOL_MAP[catalog.api]!,
    endpoint: catalog.baseUrl,
    contextWindow: catalog.contextWindow ?? 128_000,
    maxOutputTokens: catalog.maxTokens ?? 8_192
  };
}

/** provider → 环境变量名（密钥只从注入 env 读，不经 process.env 桥——G3）。 */
function envKeyFor(provider: string): string {
  const known: Record<string, string> = {
    "minimax-cn": "MINIMAX_CN_API_KEY",
    minimax: "MINIMAX_API_KEY",
    "xiaomi-token-plan-cn": "XIAOMI_TOKEN_PLAN_CN_API_KEY",
    google: "GEMINI_API_KEY",
    gemini: "GEMINI_API_KEY"
  };
  return known[provider] ?? `${provider.replace(/-/g, "_").toUpperCase()}_API_KEY`;
}

/** G6：MF_LLM_TIMEOUT_MS 必须是正有限整数（防 NaN 静默即时超时）。 */
function parseTimeoutMs(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    throw new Error(`MF_LLM_TIMEOUT_MS 必须是正整数毫秒（收到 "${raw}"）`);
  }
  return Number(raw);
}

export function createLlmClientFromEnv(env: NodeJS.ProcessEnv = process.env, caller?: string): LlmClient {
  if (env.MF_LLM_BACKEND === "faux") {
    return createFakeClient(env.MF_FAUX_RESPONSE ?? "");
  }
  const timeoutMs = parseTimeoutMs(env.MF_LLM_TIMEOUT_MS);
  const chain = resolveModelChain(env);
  // D5：缺 key 候选跳过（运行时条件）；全部无 key 才抛错并列出所需环境变量名
  const candidates: PiCandidate[] = [];
  const missingEnvNames: string[] = [];
  for (const c of chain) {
    if (c.apiKey === null) {
      missingEnvNames.push(envKeyFor(c.model.provider));
      continue;
    }
    candidates.push({ model: c.model, transport: createPiTransport({ model: c.model, apiKey: c.apiKey }) });
  }
  if (candidates.length === 0) {
    throw new Error(`缺少模型密钥：请设置环境变量 ${missingEnvNames.join(" / ")}（候选链 ${chain.map((c) => `${c.model.provider}/${c.model.id}`).join(" → ")}）`);
  }
  const keys = chain.filter((c) => c.apiKey !== null).map((c) => c.apiKey!);
  return createPiClient(candidates, { cacheKey: chainCacheKey(candidates, keys), caller, timeoutMs });
}

/** D3/G3 缓存键：候选链 + key 指纹（sha256 截断，仅存内存、永不进日志）。 */
function chainCacheKey(candidates: PiCandidate[], keys: string[]): string {
  const chain = candidates.map((c) => `${c.model.provider}/${c.model.id}@${c.model.endpoint}`);
  const fingerprints = keys.map((k) => createHash("sha256").update(k).digest("hex").slice(0, 12));
  return JSON.stringify({ chain, fingerprints });
}
