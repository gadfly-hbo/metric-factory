import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { RuntimeFault, type BudgetLease, type BudgetStore, type Limits, type UncappedBudgetLease, type UncappedLimits } from "pi-agent-runtime";

// M3 预算账本（D4/G1/G2/G6）：
// - 原生 budgets 缝：uncapped 策略实现 claimUncapped；reserveModelUpTo 恒返回 maximum（runtime 契约）
// - 上限判定点 = claimUncapped 入口聚合：对文件内全部条目 Σ(tokens=in+out) / Σ(modelCalls=attempt)，
//   达到已配置上限即抛 BUDGET_EXHAUSTED（只阻断新调用发起——红线）
// - per-op 短临界区锁（G2，对 DR 进程持锁的唯一偏离）：每次变更 acquire(O_EXCL)→读→改→tmp+rename→release，
//   锁绝不横跨模型 HTTP 调用；文件为唯一权威（无内存缓存/路径单例），CLI/UI/MCP 任意并发正确互斥
// - 落盘形状照 DR：{version:1, tasks:{[taskId]:{configuration,limits,usage,owner?}}}；FIFO 剪老 10 万条
// - 惰性：构造零 I/O（mkdir/锁/读写全部在首次 complete() 的 op 内发生）

export interface BudgetCaps {
  maxTokens?: number;
  maxCalls?: number;
}

export interface BudgetDescription {
  usedTokens: number;
  usedCalls: number;
  caps: BudgetCaps;
  budgetFile: string;
}

const LOCK_STALE_MS = 30_000; // 死 owner 接管阈值（op 为毫秒级短临界区，30s 必死）
const MAX_TASKS = 100_000;

interface TaskOwner {
  runId: string;
  pid: number;
  bootId: number;
  acquiredAt: string;
}

interface TaskEntry {
  configuration: string;
  limits: Limits | UncappedLimits;
  usage: Record<string, number>;
  owner?: TaskOwner;
}

interface BudgetFile {
  version: 1;
  tasks: Record<string, TaskEntry>;
}

const isUncapped = (l: Limits | UncappedLimits): l is UncappedLimits =>
  (l as UncappedLimits).cumulative === "unlimited";

const counted = (n: number): number => {
  if (!Number.isSafeInteger(n) || n < 0) throw new RuntimeFault("STATE_FAILED");
  return n;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type DescribableBudgetStore = BudgetStore & { describeBudget(): BudgetDescription };

export function createFileBudgetStore(dataDir: string, caps: BudgetCaps = {}): DescribableBudgetStore {
  const file = join(dataDir, "model-budget.json");
  const tmp = `${file}.tmp`;
  const lockPath = join(dataDir, ".model-budget-lock");

  async function withLock<T>(fn: () => Promise<T>): Promise<T> {
    await mkdir(dataDir, { recursive: true });
    for (let attempt = 0; ; attempt++) {
      try {
        await writeFile(lockPath, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), { flag: "wx" });
        break;
      } catch {
        try {
          const st = await stat(lockPath);
          if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
            await rm(lockPath, { force: true }); // 死 owner 接管（op 毫秒级，超阈值必为残留）
            continue;
          }
        } catch {
          continue; // 锁刚被释放，重试
        }
        if (attempt > 400) throw new Error(`预算账本锁竞争超时（${lockPath}）`);
        await sleep(25);
      }
    }
    try {
      return await fn();
    } finally {
      await rm(lockPath, { force: true });
    }
  }

  async function load(): Promise<BudgetFile> {
    if (!existsSync(file)) return { version: 1, tasks: {} };
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as BudgetFile;
      return { version: 1, tasks: parsed.tasks ?? {} };
    } catch (error) {
      throw new Error(`预算账本不可读（${file}）：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function persist(data: BudgetFile): void {
    // 10 万 FIFO：剪最老已释放条目（owner 在役不剪）——「累计」只数留存条目（GRILL 披露口径）
    const ids = Object.keys(data.tasks);
    if (ids.length > MAX_TASKS) {
      let overflow = ids.length - MAX_TASKS;
      for (const id of ids) {
        if (overflow <= 0) break;
        if (!data.tasks[id]?.owner) {
          delete data.tasks[id];
          overflow -= 1;
        }
      }
    }
    // 同步写 + 原子改名（锁内毫秒级临界区；rename 原子性由 POSIX 保证——绝无 fire-and-forget 竞态）
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, file);
  }

  function zeroUsage(uncapped: boolean): Record<string, number> {
    return {
      modelCalls: 0,
      toolCalls: 0,
      outputTokens: 0,
      resourceUnits: 0,
      activeMs: 0,
      ...(uncapped ? { inputTokens: 0, reservedOutputTokens: 0 } : {})
    };
  }

  function aggregate(data: BudgetFile): { tokens: number; calls: number } {
    let tokens = 0;
    let calls = 0;
    for (const t of Object.values(data.tasks)) {
      calls += t.usage.modelCalls ?? 0;
      tokens += (t.usage.inputTokens ?? 0) + (t.usage.outputTokens ?? 0);
    }
    return { tokens, calls };
  }

  function assertCapOrThrow(data: BudgetFile): void {
    const { tokens, calls } = aggregate(data);
    if (caps.maxTokens !== undefined && tokens >= caps.maxTokens) {
      throw Object.assign(new RuntimeFault("BUDGET_EXHAUSTED"), {
        detail: `tokens（input+output 合计） 已用 ${tokens} / 上限 ${caps.maxTokens}`
      });
    }
    if (caps.maxCalls !== undefined && calls >= caps.maxCalls) {
      throw Object.assign(new RuntimeFault("BUDGET_EXHAUSTED"), {
        detail: `调用次数 已用 ${calls} / 上限 ${caps.maxCalls}`
      });
    }
  }

  function makeLease(taskId: string, runId: string, uncapped: boolean): BudgetLease {
    const mutate = <T>(fn: (entry: TaskEntry) => T): Promise<T> =>
      withLock(async () => {
        const data = await load();
        const entry = data.tasks[taskId];
        if (!entry) throw new RuntimeFault("STATE_FAILED");
        if (entry.owner?.runId !== runId) throw new RuntimeFault("TASK_BUSY");
        const result = fn(entry);
        persist(data);
        return result;
      });
    const readOwn = (): TaskEntry => {
      // 同步快照：文件为唯一权威，rename 原子性保证读到完整 JSON（锁外只读安全）
      if (!existsSync(file)) throw new RuntimeFault("STATE_FAILED");
      const parsed = JSON.parse(readFileSync(file, "utf8")) as BudgetFile;
      const entry = parsed.tasks[taskId];
      if (!entry) throw new RuntimeFault("STATE_FAILED");
      return entry;
    };
    const lease: UncappedBudgetLease = {
      snapshot: () => ({ ...readOwn().usage }) as never,
      reserveModel: async () => {
        throw new RuntimeFault("INVALID_REQUEST");
      },
      reserveModelUpTo: async (maximum: number) => {
        // runtime 契约（红队核查点 a）：uncapped 下必须恰好返回 maximum，不得在预留环节缩量
        return mutate((entry) => {
          const tokens = counted(maximum);
          entry.usage.modelCalls = counted((entry.usage.modelCalls ?? 0) + 1); // calls 按 attempt 计（G6）
          entry.usage.resourceUnits = counted((entry.usage.resourceUnits ?? 0) + 1);
          entry.usage.outputTokens = counted((entry.usage.outputTokens ?? 0) + tokens);
          entry.usage.reservedOutputTokens = counted((entry.usage.reservedOutputTokens ?? 0) + tokens);
          return tokens;
        });
      },
      settleModel: async (reserved: number, actual: number) => {
        return mutate((entry) => {
          entry.usage.outputTokens = counted((entry.usage.outputTokens ?? 0) - reserved + actual);
        });
      },
      settleModelUsage: async (reserved: number, usage: { inputTokens: number; outputTokens: number }) => {
        return mutate((entry) => {
          entry.usage.outputTokens = counted((entry.usage.outputTokens ?? 0) - counted(reserved) + counted(usage.outputTokens));
          entry.usage.inputTokens = counted((entry.usage.inputTokens ?? 0) + counted(usage.inputTokens));
          entry.usage.reservedOutputTokens = counted((entry.usage.reservedOutputTokens ?? 0) - counted(reserved));
        });
      },
      reserveTool: async (units: number) => {
        return mutate((entry) => {
          entry.usage.toolCalls = counted((entry.usage.toolCalls ?? 0) + 1);
          entry.usage.resourceUnits = counted((entry.usage.resourceUnits ?? 0) + units);
        });
      },
      release: async (activeMs: number) => {
        return mutate((entry) => {
          entry.usage.activeMs = counted((entry.usage.activeMs ?? 0) + counted(activeMs));
          delete entry.owner; // release 删 owner（DR 语义：FIFO 可剪、TASK_BUSY 解除）
        });
      }
    };
    return lease;
  }

  return {
    claim: async (taskId, runId, configuration, limits) => {
      // MF 恒走 uncapped（buildLimits 固定 unlimited）；capped 分支仅为接口完备
      return withLock(async () => {
        const data = await load();
        data.tasks[taskId] = {
          configuration,
          limits,
          usage: zeroUsage(isUncapped(limits)),
          owner: { runId, pid: process.pid, bootId: 0, acquiredAt: new Date().toISOString() }
        };
        persist(data);
        return makeLease(taskId, runId, false);
      });
    },
    claimUncapped: async (taskId, runId, configuration, limits) => {
      return withLock(async () => {
        const data = await load();
        const existing = data.tasks[taskId];
        if (existing?.owner && existing.owner.runId !== runId) throw new RuntimeFault("TASK_BUSY");
        assertCapOrThrow(data); // G1：上限判定点——聚合全部条目，超限拒绝新调用
        data.tasks[taskId] = {
          configuration,
          limits,
          usage: zeroUsage(true),
          owner: { runId, pid: process.pid, bootId: 0, acquiredAt: new Date().toISOString() }
        };
        persist(data);
        return makeLease(taskId, runId, true) as UncappedBudgetLease;
      });
    },
    describeBudget: (): BudgetDescription => {
      if (!existsSync(file)) return { usedTokens: 0, usedCalls: 0, caps, budgetFile: file };
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8")) as BudgetFile;
        const { tokens, calls } = aggregate(parsed);
        return { usedTokens: tokens, usedCalls: calls, caps, budgetFile: file };
      } catch {
        return { usedTokens: 0, usedCalls: 0, caps, budgetFile: file };
      }
    }
  };
}
