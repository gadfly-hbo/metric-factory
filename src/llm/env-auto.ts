import { readEnvFile } from "../ui/env-file.js";
import { defaultAuthJsonPath, readAuthJsonKeys } from "./key-discovery.js";
import { providerEnvKey } from "./provider-keys.js";

// 三层 env 合成（D4/G2/②A）：process env > .env.local > 自动发现——「显式永远赢」在
// CLI/MCP/UI 四入口统一。返回 {env, sources}：env 是合成后的完整环境（工厂唯一入参，
// createLlmClientFromEnv 保持 env-only 纯函数，D1）；sources 如实记录每个被触及键的来源
// （llmStatus/设置页/芯片三个 UI 面共用同一事实源，优先级逻辑单份化）。
// 空串一律按未设置（与工厂 if (!spec) 及 readEnvFile trim 语义一致）。
// 发现结果的读取不缓存（每次合成即重读；KB 级 JSON 成本可忽略，保存后自然生效）。

export type KeySource = "process" | "env-file" | "discovery" | "default-chain";

export interface LlmEnvAuto {
  env: NodeJS.ProcessEnv;
  sources: Record<string, KeySource>;
  /** 发现层读到的 provider 全集（G9b 链外凭据提示用；仅 provider 名，永不含 key）。 */
  discoveredProviders: string[];
}

export interface LlmEnvAutoOptions {
  processEnv: NodeJS.ProcessEnv;
  envFilePath?: string;
  authJsonPath?: string;
}

const SOURCE_KEYS = ["MF_LLM_MODEL", "MF_LLM_FALLBACK_MODELS", "MF_LLM_BASE_URL"] as const;

/** G4 裁决 B：零配置默认链（MiniMax-M3 主 / mimo-v2.6-flash 备）——发现到几家启用几家。 */
export const DEFAULT_CHAIN = ["minimax-cn/MiniMax-M3", "xiaomi-token-plan-cn/mimo-v2.6-flash"] as const;

export async function resolveLlmEnvAuto(opts: LlmEnvAutoOptions): Promise<LlmEnvAuto> {
  const envFile = opts.envFilePath ? await readEnvFile(opts.envFilePath) : {};
  // 层叠合并先行（低层先铺，高层后铺覆盖；空串层值不覆盖——按未设置处理）
  const env: NodeJS.ProcessEnv = { ...envFile };
  for (const [k, v] of Object.entries(opts.processEnv)) {
    if (nonEmpty(v)) env[k] = v;
  }
  // D10 faux 短路：以合成后终值判定（F3 修复）——显式非 faux BACKEND 覆盖 .env.local 的
  // faux 时，工厂不走 faux，发现层照常运行（「显式永远赢」对合成后 env 成立）
  const fauxBackend = env.MF_LLM_BACKEND === "faux";
  const discovered = fauxBackend
    ? {}
    : await readAuthJsonKeys(
        opts.authJsonPath ??
          nonEmpty(opts.processEnv.MF_LLM_AUTH_JSON_PATH) ??
          nonEmpty(envFile.MF_LLM_AUTH_JSON_PATH) ??
          defaultAuthJsonPath()
      );

  const sources: Record<string, KeySource> = {};
  for (const key of SOURCE_KEYS) {
    if (nonEmpty(opts.processEnv[key])) sources[key] = "process";
    else if (nonEmpty(envFile[key])) sources[key] = "env-file";
  }
  // 被触及的 *_API_KEY 同样追踪来源（G2：设置页链表格每候选来源标签的数据面）
  for (const key of Object.keys(opts.processEnv)) {
    if (key.endsWith("_API_KEY") && nonEmpty(opts.processEnv[key])) sources[key] = "process";
  }
  for (const key of Object.keys(envFile)) {
    if (key.endsWith("_API_KEY") && nonEmpty(envFile[key]) && sources[key] === undefined) {
      sources[key] = "env-file";
    }
  }
  // 发现只填充未被显式设置的 *_API_KEY（D4；显式赢）
  for (const [provider, key] of Object.entries(discovered)) {
    const envKey = providerEnvKey(provider);
    if (!nonEmpty(env[envKey])) {
      env[envKey] = key;
      sources[envKey] = "discovery";
    }
  }
  // 默认链自动启用（G3）：模型未设且网关未设且未设 fallbacks 且默认链至少一个候选 key 可解析时注入；
  // baseUrl 在场 → 不注入（网关路径需显式设模型，避开 G6 真值表冲突）；
  // 只设 fallbacks 不设主模型 → 不注入（残缺显式配置应响亮，维持 M1 急切抛错）
  if (
    !fauxBackend &&
    !nonEmpty(env.MF_LLM_MODEL) &&
    !nonEmpty(env.MF_LLM_BASE_URL) &&
    !nonEmpty(env.MF_LLM_FALLBACK_MODELS)
  ) {
    const enabled = DEFAULT_CHAIN.filter((spec) => {
      const provider = spec.slice(0, spec.indexOf("/"));
      return nonEmpty(env[providerEnvKey(provider)]) !== undefined;
    });
    if (enabled.length > 0) {
      env.MF_LLM_MODEL = enabled[0];
      sources["MF_LLM_MODEL"] = "default-chain";
      if (enabled.length > 1) {
        env.MF_LLM_FALLBACK_MODELS = enabled.slice(1).join(",");
        sources["MF_LLM_FALLBACK_MODELS"] = "default-chain";
      }
    }
  }
  return { env, sources, discoveredProviders: Object.keys(discovered) };
}

function nonEmpty(v: string | undefined): string | undefined {
  return v !== undefined && v.trim() !== "" ? v : undefined;
}
