import {
  createRuntime,
  type AuditSink,
  type ModelConfig,
  type ModelTransport,
  type Runtime,
  type UncappedLimits
} from "pi-agent-runtime";
import type { DescribableBudgetStore } from "./budget-store.js";
import type { LlmClient } from "./types.js";

// pi 依赖收敛于 src/llm 模块（guard 测试锁定）；业务代码零 pi import。
// 本文件是 runtime 通道：createRuntime().runText 承载 LlmClient.complete()——接口不变，业务零改动（M1 D2）。

export interface PiCandidate {
  model: ModelConfig;
  transport: ModelTransport;
}

export interface PiClientOptions {
  /** 单例缓存键（D3/G3：工厂按 候选链+key 指纹 计算；同键复用 runtime，异键新实例）。 */
  cacheKey: string;
  /** taskId 前缀（G4：mf:<kind>-<seq>；缺省 complete，调用点零改动）。 */
  caller?: string;
  /** 单次模型超时（D6；缺省 300s，工厂经 MF_LLM_TIMEOUT_MS 校验后传入）。 */
  timeoutMs?: number;
  /** 审计 sink（D2→M3 D3：JSONL 落盘实现，never-throw）。 */
  auditSink?: AuditSink;
  /** 预算账本（M3 D4：原生 budgets 缩；claimUncapped 聚合超限 → blocked BUDGET_EXHAUSTED → 四要素文案）。 */
  budgets?: DescribableBudgetStore;
}

const NOOP_AUDIT: AuditSink = { append: async () => {} };

/** D6：恰好五键（照 DR buildLimits 逐值；runtime 按 Math.min(limits, modelCap) 钳制候选上限）。 */
const buildLimits = (timeoutMs: number): UncappedLimits => ({
  cumulative: "unlimited",
  maxOutputTokens: 32_768,
  modelTimeoutMs: timeoutMs,
  toolTimeoutMs: 30_000,
  controlTimeoutMs: 30_000
});

interface CacheEntry {
  runtime: Runtime | null;
  candidates: PiCandidate[];
  auditSink?: AuditSink;
  budgets?: DescribableBudgetStore;
  /** G5：per-taskId 出稿真值捕获表（onEvent 同步写，complete() 后取删——按关联键归因，并发零串线）。 */
  truth: Map<string, { provider: string; model: string }>;
}

const cache = new Map<string, CacheEntry>();

/** G7 四要素预算文案：预算字样 / 已用 X 上限 Y（千分位，契约 SE-C）/ 账本路径 / 两条出路。
 *  两条出路按超限维度择一 env 名（B4'：tokens 超限指 CALLS 会误导解除操作；双维同超才并列）。 */
function budgetExhaustedMessage(store?: DescribableBudgetStore): string {
  const fmtInt = (n: number): string => n.toLocaleString("en-US");
  const head = "预算已耗尽：本次模型调用被预算上限阻断。";
  const waysBoth = "两条出路：1) 调高或取消上限（环境变量 MF_LLM_BUDGET_TOKENS / MF_LLM_BUDGET_CALLS）；2) 删除账本文件重新计数。";
  if (!store) return `${head}账本文件：未知（未注入预算账本）。${waysBoth}`;
  const d = store.describeBudget();
  const parts: string[] = [];
  const tokensHit = d.caps.maxTokens !== undefined && d.usedTokens >= d.caps.maxTokens;
  const callsHit = d.caps.maxCalls !== undefined && d.usedCalls >= d.caps.maxCalls;
  if (tokensHit) {
    parts.push(`tokens（input+output 合计）已用 ${fmtInt(d.usedTokens)} / 上限 ${fmtInt(d.caps.maxTokens!)}。`);
  }
  if (callsHit) {
    parts.push(`调用次数 已用 ${fmtInt(d.usedCalls)} / 上限 ${fmtInt(d.caps.maxCalls!)}。`);
  }
  if (parts.length === 0) parts.push("用量已达上限（维度详见账本文件）。");
  const envName =
    tokensHit && callsHit ? "MF_LLM_BUDGET_TOKENS / MF_LLM_BUDGET_CALLS" : tokensHit ? "MF_LLM_BUDGET_TOKENS" : callsHit ? "MF_LLM_BUDGET_CALLS" : "MF_LLM_BUDGET_TOKENS / MF_LLM_BUDGET_CALLS";
  const ways = `两条出路：1) 调高或取消上限（环境变量 ${envName}）；2) 删除账本文件重新计数。`;
  return `${head}${parts.join("")}账本文件：${d.budgetFile}。${ways}`;
}
/** G4：taskId 进程内自增；M3 修正——预算账本以 taskId 为键跨进程持久，纯 <seq> 会在新进程
 * 覆写前进程同名账目（CLI 一次性进程恒从 1 起）→ 少计。加每进程随机后缀保跨进程唯一，
 * 前缀仍为 mf:<kind>-<seq>（审计可读性与 kind 归因不变）。 */
const processTag = Math.random().toString(36).slice(2, 6);
let taskSeq = 0;

/** 测试缝：单例语义可观察、用例间隔离（仅限测试使用）。 */
export const __testHooks = {
  cacheSize: () => cache.size,
  clearCache: () => {
    cache.clear();
    taskSeq = 0;
  }
};

export function createPiClient(candidates: PiCandidate[], opts: PiClientOptions): LlmClient {
  if (candidates.length === 0) {
    throw new Error("缺少可用模型候选：全部候选均未通过密钥检查（transportFor 跳过）");
  }
  const kind = opts.caller ?? "complete";
  // 急切登记缓存条目（同键复用、异键新实例——G3 缓存键含 key 指纹，改 key 同进程生效）；
  // createRuntime 对象本身惰性物化（G2/D3）：装配无 I/O，错误面全在工厂解析阶段
  if (!cache.has(opts.cacheKey)) {
    cache.set(opts.cacheKey, { runtime: null, candidates, auditSink: opts.auditSink, budgets: opts.budgets, truth: new Map() });
  }
  const getRuntime = (): Runtime => {
    const entry = cache.get(opts.cacheKey)!;
    if (!entry.runtime) {
      const primary = entry.candidates[0]!;
      entry.runtime = createRuntime({
        model: primary.model,
        transport: primary.transport,
        fallbacks: entry.candidates.slice(1).map((c) => ({ model: c.model, transport: c.transport })),
        authorize: async () => true, // 决策 #7：单机语义无条件放行；结果仅进程内返回，无工具/外发
        audit: entry.auditSink ?? NOOP_AUDIT,
        budgets: entry.budgets,
        // G5：同步观察缝（错误被 runtime 吞掉、结构上不可能杀调用）——取无 reason 的
        // model.finished last-wins 即实际出稿候选（主候选失败发带 reason 事件后备候选接棒）
        onEvent: (event) => {
          if (event.kind === "model.finished" && !event.reason) {
            entry.truth.set(event.taskId, { provider: event.provider, model: event.model });
          }
        }
      });
    }
    return entry.runtime;
  };
  return {
    async complete(req) {
      taskSeq += 1;
      const taskId = `mf:${kind}-${taskSeq}-${processTag}`;
      const entry = cache.get(opts.cacheKey)!;
      const result = await getRuntime().runText({
        taskId,
        prompt: req.user,
        system: req.system,
        limits: buildLimits(opts.timeoutMs ?? 300_000),
        modelRecovery: { extraAttempts: 1 }
      });
      // G5：按本调用 taskId 取真值并删除（关联键归因，并发零串线）
      const truth = entry.truth.get(taskId);
      entry.truth.delete(taskId);
      const usage = result.usageKnown
        ? {
            modelCalls: result.usage.modelCalls,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens
          }
        : undefined;
      // D7/G8 三分映射：succeeded→文本；INVALID_OUTPUT（含截断）→空串落解析失败桶；其余全部 status→抛错
      // M3（D2/G4）：对象返回带真值——INVALID_OUTPUT 也照带（截断但出稿，账本已记 tokens）
      if (result.status === "succeeded") {
        return { text: result.value, usage, provider: truth?.provider, model: truth?.model, taskId };
      }
      if (result.status === "failed" && result.reason === "INVALID_OUTPUT") {
        return { text: "", usage, provider: truth?.provider, model: truth?.model, taskId };
      }
      // 非 succeeded 各变体均带 reason（waiting/suspended/failed/cancelled/blocked）——响亮失败
      if (result.reason === "BUDGET_EXHAUSTED") {
        throw new Error(budgetExhaustedMessage(entry.budgets)); // 契约 SE-C：模板止于「删除账本文件重新计数。」
      }
      throw new Error(`模型调用失败（${result.reason}）：taskId ${taskId}`);
    }
  };
}
