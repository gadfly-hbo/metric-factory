import type { LlmClient } from "./types.js";
import { createFakeClient } from "./fake-client.js";
import { createPiClient } from "./pi-client.js";
import { createModels } from "@earendil-works/pi-ai";
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
  const model = createModels().getModel(provider, modelId);
  if (!model) {
    throw new Error(
      `目录中找不到模型 ${spec}：可检查拼写，或确认 provider key（如 OPENAI_API_KEY / ANTHROPIC_API_KEY）可用`
    );
  }
  return model;
}
