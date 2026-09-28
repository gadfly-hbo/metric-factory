import { complete, contentText } from "@earendil-works/pi-ai/compat";
import type { Api, Model } from "@earendil-works/pi-ai";
import type { LlmClient } from "./types.js";

// pi 依赖收敛于 src/llm 模块（本文件 + index.ts + faux.ts 三处 import）；业务代码零 pi import（guard 测试锁定）
export function createPiClient(model: Model<Api>): LlmClient {
  return {
    async complete(req) {
      const message = await complete(model, {
        systemPrompt: req.system,
        messages: [{ role: "user", content: req.user, timestamp: Date.now() }]
      });
      return contentText(message.content);
    }
  };
}
