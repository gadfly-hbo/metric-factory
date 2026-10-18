import type { ModelConfig } from "pi-agent-runtime";
import type { LlmClient } from "./types.js";
import { createPiClient } from "./pi-client.js";
import { createScriptedTransport } from "./scripted-transport.js";

export interface FauxHandle {
  client: LlmClient;
  setResponses(texts: string[]): void;
  callCount(): number;
}

const FAUX_MODEL: ModelConfig = {
  provider: "mf-faux",
  id: "mf-faux-model",
  protocol: "openai-completions",
  endpoint: "http://127.0.0.1/faux",
  contextWindow: 128_000,
  maxOutputTokens: 8_192
};

let fauxSeq = 0;

// 测试支持：脚本化 transport 经真实 runtime 管线驱动 client（零网络、脚本化响应）。
// M1 起不再经 pi-ai compat registerFauxProvider（KA4：引擎更换后 compat faux 无等价物）。
export function createPiFauxClient(): FauxHandle {
  const scripted = createScriptedTransport(["（faux 未设置脚本）"]);
  const client = createPiClient([{ model: FAUX_MODEL, transport: scripted.transport }], {
    cacheKey: `faux-${++fauxSeq}`,
    caller: "faux"
  });
  return {
    client,
    setResponses: (texts) => scripted.setScript(texts),
    callCount: scripted.callCount
  };
}
