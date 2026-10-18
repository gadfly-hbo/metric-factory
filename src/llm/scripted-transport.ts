import type { ModelReply, ModelTransport } from "pi-agent-runtime";

// 测试支持：脚本化 ModelTransport（系统边界 mock——模型 HTTP 调用是唯一外部依赖）。
// 脚本项三种形态：脚本文本（stop:complete）/ { stop:"length" }（触发 INVALID_OUTPUT 路径）/ { throw }（触发 MODEL_FAILED）。
// 脚本耗尽后循环末项（modelRecovery 重试与多调用场景）。

export type ScriptedReply = string | { stop: "length" } | { throw: Error };

export interface ScriptedTransportHandle {
  transport: ModelTransport;
  callCount(): number;
  /** 替换脚本并复位计数（faux 句柄 setResponses 用；transport 闭包实时读脚本）。 */
  setScript(next: ScriptedReply[]): void;
}

export function createScriptedTransport(initial: ScriptedReply[]): ScriptedTransportHandle {
  if (initial.length === 0) throw new Error("脚本至少一项");
  let script = initial;
  let calls = 0;
  const transport: ModelTransport = async () => {
    const item = script[Math.min(calls, script.length - 1)]!;
    calls += 1;
    if (typeof item === "object" && "throw" in item) throw item.throw;
    if (typeof item === "object" && "stop" in item) {
      return reply([], "length");
    }
    return reply([{ kind: "text", text: item as string }], "complete");
  };
  return {
    transport,
    callCount: () => calls,
    setScript(next) {
      if (next.length === 0) throw new Error("脚本至少一项");
      script = next;
      calls = 0;
    }
  };
}

function reply(content: ModelReply["content"], stop: ModelReply["stop"]): ModelReply {
  return { content, stop, usage: { inputTokens: 1, outputTokens: 1 } };
}
