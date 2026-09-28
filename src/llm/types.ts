export interface LlmRequest {
  system: string;
  user: string;
}

// 业务代码唯一可见的模型访问边界；pi-ai 只在 pi-client.ts 出现（参考方案 §5.1 适配层纪律）
export interface LlmClient {
  complete(req: LlmRequest): Promise<string>;
}
