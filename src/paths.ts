import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 兼容三种布局：src 运行（src/cli|src/mcp → ../../templates）、
// dist 根 chunk（dist/cli.js、dist/server-*.js → ../templates）
export function defaultTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // dist 或 src
  const candidates = [
    resolve(here, "../templates"),
    resolve(here, "../../templates")
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0]!;
}
