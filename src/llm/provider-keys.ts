// provider 前缀 → API key 环境变量名（D6 映射合一）：已知表取 env-file 与 llm 两边并集，
// 公式化回退取 [^A-Z0-9]→_（旧 envKeyFor 的 `-`→`_` 对含 `.` provider 会产出非法变量名）。
// 本模块是无依赖叶子：env-auto / index / env-file 三方共用，单一名义源（防 F3 类漂移）。
const KNOWN: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GEMINI_API_KEY",
  gemini: "GEMINI_API_KEY",
  "minimax-cn": "MINIMAX_CN_API_KEY",
  minimax: "MINIMAX_API_KEY",
  "xiaomi-token-plan-cn": "XIAOMI_TOKEN_PLAN_CN_API_KEY"
};

export function providerEnvKey(provider: string): string {
  return KNOWN[provider] ?? `${provider.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;
}
