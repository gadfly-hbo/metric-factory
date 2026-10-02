import { readFile, writeFile } from "node:fs/promises";

// .env.local 增量管理：UI 设置页写入 LLM 配置（MF_LLM_MODEL / provider key / MF_LLM_BASE_URL），
// 只改本模块管理的键，保留文件内其他行；key 明文只存在于本机文件，永不回显到页面。
// 格式：KEY=VALUE 逐行，# 开头为注释，不支持行内注释与引号（配置值均不含空格）。

export interface LlmSettings {
  model: string;
  apiKeyEnv: string; // provider 对应的环境变量名（如 OPENAI_API_KEY）
  baseUrl?: string;
}

// provider 前缀 → API key 环境变量名；未知 provider 按大写化约定推导
export function apiKeyEnvName(provider: string): string {
  const known: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GEMINI_API_KEY",
    gemini: "GEMINI_API_KEY"
  };
  return known[provider] ?? `${provider.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;
}

export function maskKey(key: string): string {
  return key.length > 4 ? `****${key.slice(-4)}` : "****";
}

export async function readEnvFile(path: string): Promise<Record<string, string>> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

// updates：值为 null 表示删除该键；文件内未涉及的行原样保留
export async function writeManagedEnv(
  path: string,
  updates: Record<string, string | null>
): Promise<void> {
  let lines: string[] = [];
  try {
    lines = (await readFile(path, "utf8")).split("\n");
  } catch {
    lines = ["# Metric Factory 工作台管理（本机配置，已在 .gitignore）"];
  }
  const pending = new Map(Object.entries(updates));
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      result.push(line);
      continue;
    }
    const eq = trimmed.indexOf("=");
    const key = eq > 0 ? trimmed.slice(0, eq).trim() : null;
    if (key && pending.has(key)) {
      const value = pending.get(key)!;
      pending.delete(key);
      if (value !== null) result.push(`${key}=${value}`);
      continue;
    }
    result.push(line);
  }
  for (const [key, value] of pending) {
    if (value !== null) result.push(`${key}=${value}`);
  }
  // 去掉尾部多余空行后统一一个换行
  while (result.length > 0 && result[result.length - 1]!.trim() === "") result.pop();
  await writeFile(path, `${result.join("\n")}\n`, "utf8");
}

// 合成 LLM 调用环境：.env.local 覆盖进程环境（设置页保存后无需重启即生效）
export async function resolveLlmEnv(path: string): Promise<NodeJS.ProcessEnv> {
  return { ...process.env, ...(await readEnvFile(path)) };
}
