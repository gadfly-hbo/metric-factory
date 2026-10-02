import type { LlmClient } from "./types.js";
import { createFakeClient } from "./fake-client.js";
import { createPiClient } from "./pi-client.js";
import { getBuiltinModels, type BuiltinProvider } from "@earendil-works/pi-ai/providers/all";
import type { Api, Model } from "@earendil-works/pi-ai";

export type { LlmClient, LlmRequest } from "./types.js";
export { createFakeClient } from "./fake-client.js";
export { estimateTokens } from "./tokens.js";

// 工厂：按环境变量组装 client（pi 依赖收敛于 src/llm 模块三文件，业务代码零 pi import）。
// - MF_LLM_BACKEND=faux + MF_FAUX_RESPONSE：确定性脚本（测试/演示）
// - MF_LLM_MODEL 形如 <provider>/<model-id>（如 openai/gpt-4o、anthropic/claude-sonnet-4）+ provider 各自 key（OPENAI_API_KEY 等）
// - MF_LLM_BASE_URL：OpenAI 兼容网关覆盖
export function createLlmClientFromEnv(env: NodeJS.ProcessEnv = process.env): LlmClient {
  if (env.MF_LLM_BACKEND === "faux") {
    return createFakeClient(env.MF_FAUX_RESPONSE ?? "");
  }
  const spec = env.MF_LLM_MODEL;
  if (!spec) {
    throw new Error(
      "未配置模型：请设置 MF_LLM_MODEL=<provider>/<model-id>（或 MF_LLM_BACKEND=faux 用于测试），详见 README provider 配置表"
    );
  }
  // pi-ai 目录从 process.env 读 provider key；注入 env（如 UI 的 .env.local 合成）带的 key
  // 需补进进程环境才可见——只在进程缺该键时补，不覆盖已有配置
  for (const [k, v] of Object.entries(env)) {
    if (k.endsWith("_API_KEY") && v && process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
  const model = resolveCatalogModel(spec);
  const effective: Model<Api> = env.MF_LLM_BASE_URL ? { ...model, baseUrl: env.MF_LLM_BASE_URL } : model;
  return createPiClient(effective);
}

function resolveCatalogModel(spec: string): Model<Api> {
  const slash = spec.indexOf("/");
  if (slash <= 0 || slash === spec.length - 1) {
    throw new Error(`MF_LLM_MODEL 需为 <provider>/<model-id> 形式（收到 "${spec}"），如 openai/gpt-4o`);
  }
  const provider = spec.slice(0, slash);
  const modelId = spec.slice(slash + 1);
  // 静态内置目录（providers/all）：createModels() 的动态目录需 provider 注册 + 网络 refresh，
  // 首次解析恒为空（2026-10-02 实测）；API key 由 compat 层调用时从 process.env 注入。
  // provider 为内置 id 字面量联合，用户输入串经 as 收敛（未知名列表为空走报错路径）
  const model = getBuiltinModels(provider as BuiltinProvider).find((m) => m.id === modelId);
  if (!model) {
    throw new Error(
      `目录中找不到模型 ${spec}：可检查拼写，或确认 provider key（如 OPENAI_API_KEY / ANTHROPIC_API_KEY）可用`
    );
  }
  return model;
}
