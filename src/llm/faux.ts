import { registerFauxProvider, fauxAssistantMessage } from "@earendil-works/pi-ai/compat";
import type { Model } from "@earendil-works/pi-ai";
import type { LlmClient } from "./types.js";
import { createPiClient } from "./pi-client.js";

export interface FauxHandle {
  client: LlmClient;
  setResponses(texts: string[]): void;
  callCount(): number;
}

// 测试支持：注册 pi-ai faux provider 并返回走真实 pi 管线的 client（零网络、脚本化响应）
export function createPiFauxClient(modelId = "mf-faux-model"): FauxHandle {
  const reg = registerFauxProvider({ models: [{ id: modelId }] });
  return {
    client: createPiClient(reg.getModel()),
    setResponses(texts) {
      reg.setResponses(texts.map((t) => fauxAssistantMessage(t)));
    },
    callCount() {
      return reg.state.callCount;
    }
  };
}
