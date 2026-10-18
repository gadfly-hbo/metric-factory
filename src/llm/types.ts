export interface LlmRequest {
  system: string;
  user: string;
}

/** G4：usage 收窄为 MF 实际消费的三字段（modelCalls/inputTokens?/outputTokens）——toolCalls 等恒 0 维度不暴露。 */
export interface LlmUsage {
  modelCalls: number;
  inputTokens?: number;
  outputTokens: number;
}

/** M3 真值管道（D1/D2）：complete() 边界交还 text + 实际出稿真值。
 *  - text：模型输出（INVALID_OUTPUT 截断时为 ""，真值照带——账本已记 tokens）
 *  - provider/model：实际出稿候选（onEvent 捕获，主备回退后为备候选）；faux 缺省
 *  - taskId：审计/账本关联键（mf:<kind>-<seq>） */
export interface LlmCompletion {
  text: string;
  usage?: LlmUsage;
  provider?: string;
  model?: string;
  taskId?: string;
}

// 业务代码唯一可见的模型访问边界；pi 依赖只在 pi-client.ts 出现（适配层纪律，guard 锁定）
export interface LlmClient {
  complete(req: LlmRequest): Promise<LlmCompletion>;
}
