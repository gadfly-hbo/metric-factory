import type { LlmClient } from "./types.js";

// 确定性脚本化 client：引擎级测试与本地演示注入用（零网络）。
// M3（D2/G4）：返回对象形状与真实 client 一致——faux 只带 text（无真值、不记账，D9）。
export function createFakeClient(response: string): LlmClient {
  return {
    async complete() {
      return { text: response };
    }
  };
}
