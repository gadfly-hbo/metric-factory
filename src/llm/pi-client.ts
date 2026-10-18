import {
  createRuntime,
  type AuditSink,
  type ModelConfig,
  type ModelTransport,
  type Runtime,
  type UncappedLimits
} from "pi-agent-runtime";
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
  /** 审计 sink（D2：缺省 no-op 永不抛错——sink 抛错会以 AUDIT_FAILED 杀调用；M3 替换为 JSONL 落盘实现）。 */
  auditSink?: AuditSink;
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
}

const cache = new Map<string, CacheEntry>();
/** G4：taskId 全局自增——跨 cacheKey 也唯一（runtime 以 taskId 键控 idle/budget）。 */
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
    cache.set(opts.cacheKey, { runtime: null, candidates, auditSink: opts.auditSink });
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
        audit: entry.auditSink ?? NOOP_AUDIT
      });
    }
    return entry.runtime;
  };
  return {
    async complete(req) {
      taskSeq += 1;
      const result = await getRuntime().runText({
        taskId: `mf:${kind}-${taskSeq}`,
        prompt: req.user,
        system: req.system,
        limits: buildLimits(opts.timeoutMs ?? 300_000),
        modelRecovery: { extraAttempts: 1 }
      });
      // D7/G8 三分映射：succeeded→文本；INVALID_OUTPUT（含截断）→空串落解析失败桶；其余全部 status→抛错
      if (result.status === "succeeded") return result.value;
      if (result.status === "failed" && result.reason === "INVALID_OUTPUT") return "";
      // 非 succeeded 各变体均带 reason（waiting/suspended/failed/cancelled/blocked）——响亮失败
      throw new Error(`模型调用失败（${result.reason}）：taskId mf:${kind}-${taskSeq}`);
    }
  };
}
