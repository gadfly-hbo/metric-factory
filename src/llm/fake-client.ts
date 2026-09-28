import type { LlmClient } from "./types.js";

// 确定性脚本化 client：引擎级测试与本地演示注入用（零网络）
export function createFakeClient(response: string): LlmClient {
  return {
    async complete() {
      return response;
    }
  };
}
