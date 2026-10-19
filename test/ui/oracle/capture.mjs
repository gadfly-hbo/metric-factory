// A2 复刻 oracle 捕获器 CLI（核心逻辑在 flows.mjs；vitest 进程内测试共用同一实现）
// 用法：node test/ui/oracle/capture.mjs --base <目录|http://origin> [--mode update|compare] [--view all|v00-home,...]
// 环境变量 MF_BASELINE_DIR 可覆盖基线目录（diff 调试用）。
import { runOracle } from "./flows.mjs";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const BASE = flag("base", "");
const MODE = flag("mode", "compare");
const VIEW_FILTER = flag("view", "all");
if (!BASE) { console.error("需要 --base <目录或 http://origin>（demo 目录 / 静态根 / 运行中的服务）"); process.exit(2); }
try {
  const results = await runOracle({
    base: BASE, mode: MODE, viewFilter: VIEW_FILTER,
    ...(process.env.MF_BASELINE_DIR ? { baselineDir: process.env.MF_BASELINE_DIR } : {})
  });
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.ok ? 0 : 1);
} catch (e) {
  console.error(String(e));
  process.exit(2);
}
