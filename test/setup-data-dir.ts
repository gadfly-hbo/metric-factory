import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// M3 密闭性（G3）：vitest 全局注入 MF_DATA_DIR——经 process env 合成的入口（UI/MCP/CLI e2e）
// 自动携带；字面量 env 的测试仍须显式写 MF_DATA_DIR（守卫会拦）。
process.env.MF_DATA_DIR = mkdtempSync(join(tmpdir(), "mf-vitest-data-"));
