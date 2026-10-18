import { createHash } from "node:crypto";
import { join } from "node:path";
import { createPiTransport, type ModelConfig } from "pi-agent-runtime";
import { getBuiltinModels, type BuiltinProvider } from "@earendil-works/pi-ai/providers/all";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { LlmClient } from "./types.js";
import { createFakeClient } from "./fake-client.js";
import { createPiClient, type PiCandidate } from "./pi-client.js";
import { createJsonlAuditSink, resolveDataDir } from "./audit-sink.js";
import { createFileBudgetStore, type BudgetCaps } from "./budget-store.js";
import { providerEnvKey } from "./provider-keys.js";

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
      "未配置模型：自动发现未找到可用候选凭据（~/.pi/agent/auth.json 不存在或无真值表候选 key）。" +
        "手配路径：1) 工作台设置页保存（写 .env.local，CLI/MCP 同读）；" +
        "2) export MF_LLM_MODEL=<provider>/<model-id> 加对应 *_API_KEY；3) MF_LLM_BACKEND=faux（测试/演示）。" +
        "详见 README provider 配置表"
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

/** provider → 环境变量名（密钥只从注入 env 读，不经 process.env 桥——G3；D6 合一后委托 provider-keys）。 */
function envKeyFor(provider: string): string {
  return providerEnvKey(provider);
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
  // M3（D3/D12）：审计 JSONL 落盘——数据目录经注入 env（MF_DATA_DIR，测试密闭缝），sink 惰性
  const dataDir = resolveDataDir(env);
  const auditSink = createJsonlAuditSink(join(dataDir, "model-audit.jsonl"));
  const caps = parseBudgetCaps(env);
  const budgets = createFileBudgetStore(dataDir, caps);
  return createPiClient(candidates, {
    cacheKey: chainCacheKey(candidates, keys, dataDir, caps),
    caller,
    timeoutMs,
    auditSink,
    budgets
  });
}

/** D3/G3/D8 缓存键：候选链 + key 指纹 + 审计数据目录身份（I/O-free 字符串；同链同 key 异目录须异实例，防测试注入被缓存吞）。 */
function chainCacheKey(candidates: PiCandidate[], keys: string[], dataDir: string, caps: BudgetCaps): string {
  const chain = candidates.map((c) => `${c.model.provider}/${c.model.id}@${c.model.endpoint}`);
  const fingerprints = keys.map((k) => createHash("sha256").update(k).digest("hex").slice(0, 12));
  return JSON.stringify({ chain, fingerprints, auditDir: dataDir, caps });
}

/** G7：预算用量警告行（≥80% 固定阈，每已达标维度一条；未配置上限返回 undefined）。只读账本，不做预检。 */
export function budgetUsageWarning(env: NodeJS.ProcessEnv): string | undefined {
  const caps = parseBudgetCaps(env);
  if (caps.maxTokens === undefined && caps.maxCalls === undefined) return undefined;
  const d = createFileBudgetStore(resolveDataDir(env), caps).describeBudget();
  const lines: string[] = [];
  if (caps.maxTokens !== undefined && d.usedTokens >= caps.maxTokens * 0.8) {
    const pct = Math.min(100, Math.floor((d.usedTokens / caps.maxTokens) * 100));
    lines.push(`WARNING 预算已用 ${pct}%（tokens 已用 ${d.usedTokens} / 上限 ${caps.maxTokens}）`);
  }
  if (caps.maxCalls !== undefined && d.usedCalls >= caps.maxCalls * 0.8) {
    const pct = Math.min(100, Math.floor((d.usedCalls / caps.maxCalls) * 100));
    lines.push(`WARNING 预算已用 ${pct}%（调用次数 已用 ${d.usedCalls} / 上限 ${caps.maxCalls}）`);
  }
  return lines.length > 0 ? lines.join("\n") : undefined;
}

/** 读路径宽松版（统计卡警告 chips 用）：非法值静默视为未配置（急错校验在工厂构造时已做）。 */
export function tryParseBudgetCaps(env: NodeJS.ProcessEnv): BudgetCaps {
  try {
    return parseBudgetCaps(env);
  } catch {
    return {};
  }
}

/** G6：预算双维度可选上限（缺省不限——保 M2 零配置语义）；校验照 parseTimeoutMs 急错先例。 */
function parseBudgetCaps(env: NodeJS.ProcessEnv): BudgetCaps {
  const parse = (name: "MF_LLM_BUDGET_TOKENS" | "MF_LLM_BUDGET_CALLS"): number | undefined => {
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") return undefined;
    if (!/^\d+$/.test(raw.trim()) || Number(raw) <= 0) {
      throw new Error(`${name} 必须是正整数（收到 "${raw}"）`);
    }
    return Number(raw);
  };
  return { maxTokens: parse("MF_LLM_BUDGET_TOKENS"), maxCalls: parse("MF_LLM_BUDGET_CALLS") };
}
