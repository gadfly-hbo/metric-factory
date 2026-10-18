import { appendFile, mkdir, rename, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { AuditSink } from "pi-agent-runtime";

// M3 审计 JSONL sink（D3/G2/G3）：
// - never-throw：一切 I/O 异常吞掉（内部串行队列），一次性降级标志（per-path）供设置页呈现——
//   审计是事后记账，故障不得杀调用（runtime 会以 AUDIT_FAILED 终结 run，M1 实证）
// - 惰性：append 时才 mkdir——仅构造 client（设置页探针）不落任何文件
// - 轮转：写前 stat 超上限（缺省 50MB）→ rename 出 .1（保留 2 代；并发窗口丢 1-2 行，DR 先例披露）
// - 行序：promise 链串行化，保证 JSONL 事件顺序

const degradedPaths = new Set<string>();

/** 数据目录（G3）：MF_DATA_DIR 覆盖 > 缺省 ~/.metric-factory/（三入口 cwd 不齐，唯 home 成全一本账）。
 *  vitest 守卫：测试环境未注入时缺省解析直接 throw——home 泄漏对 git status 验收门不可见，须显式注入。 */
export function resolveDataDir(env: NodeJS.ProcessEnv): string {
  const v = env.MF_DATA_DIR?.trim();
  if (v) return v;
  if (process.env.VITEST) {
    throw new Error("测试环境必须显式注入 MF_DATA_DIR（防真实数据目录泄漏到 ~/.metric-factory；用临时目录）");
  }
  return join(homedir(), ".metric-factory");
}

/** 降级标志（一次性、进程内）：设置页统计卡 ST3 消费（跨进程降级不可见，单用户可接受，契约脚注披露）。 */
export function isAuditDegraded(filePath: string): boolean {
  return degradedPaths.has(filePath);
}

export function createJsonlAuditSink(filePath: string, opts: { maxBytes?: number } = {}): AuditSink {
  const maxBytes = opts.maxBytes ?? 50 * 1024 * 1024;
  let queue: Promise<void> = Promise.resolve();
  const enqueue = (job: () => Promise<void>): Promise<void> => {
    // 错误吞进 promise（never-throw），落盘本身被 await——runText 返回即已落盘（本机 append 毫秒级）
    const run = queue.then(job).catch(() => {
      degradedPaths.add(filePath);
    });
    queue = run;
    return run;
  };
  return {
    append(event) {
      return enqueue(async () => {
        await mkdir(dirname(filePath), { recursive: true });
        try {
          const st = await stat(filePath);
          if (st.size > maxBytes) await rename(filePath, `${filePath}.1`);
        } catch {
          // 文件不存在：首写，无需轮转
        }
        await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
      });
    }
  };
}
