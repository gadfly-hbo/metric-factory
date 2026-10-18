import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

// 密钥自动发现（D1/D2）：读 pi CLI 凭据文件 ~/.pi/agent/auth.json（扁平 {provider:{key?}}）。
// 该文件是 pi CLI 的私有实现细节、无稳定性承诺——一切异常（文件不存在/JSON 坏/条目非 object/
// 缺 key 字段的 OAuth 形态/空串 key）一律静默跳过，整体降级为「未发现」，永不抛错。
// 发现到的 key 仅内存使用，永不写盘、永不进日志/导出物（红线）。

export function defaultAuthJsonPath(): string {
  return join(homedir(), ".pi", "agent", "auth.json");
}

export async function readAuthJsonKeys(authJsonPath: string): Promise<Record<string, string>> {
  let raw: string;
  try {
    raw = await readFile(authJsonPath, "utf8");
  } catch {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const keys: Record<string, string> = {};
  for (const [provider, entry] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const key = (entry as Record<string, unknown>).key;
    if (typeof key !== "string" || key.trim() === "") continue;
    keys[provider] = key;
  }
  return keys;
}
