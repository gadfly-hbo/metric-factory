import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// M3 调用统计读路径（D7/G8）：渲染时只读数据目录两文件（rename 原子、append 尾读安全，无需锁）。
// 双源连接（D1）：审计事件（taskId→provider/model/at，取无 reason 的 model.finished）⋈ 账本
// （taskId→usage tokens/calls）。口径：
// - 次数 = Σ usage.modelCalls（attempt 计，容灾重试如实计 2——G6）
// - tokens = Σ inputTokens + outputTokens（input+output 合计）
// - 今日 = 审计 at 落在本地时区自然日的条目；累计 = 两文件留存条目（轮转/FIFO 边界由脚注披露）
// - 失败尝试：账本照记 tokens（口径如实），归因到发稿候选；无 reason 的 model.finished 才是出稿归因源
// - 审计缺失（降级）：总量照显（账本源），模型/时间归因不可用——不给假数（契约负例 3）

export interface ModelRow {
  provider: string;
  model: string;
  calls: number;
  tokens: number;
  generateCalls: number;
  refineCalls: number;
}

export interface CallStats {
  today: { calls: number; tokens: number };
  total: { calls: number; tokens: number };
  byModel: ModelRow[];
  todayAvailable: boolean;
  modelAttributionAvailable: boolean;
}

interface AuditAttr {
  provider: string;
  model: string;
  at: string;
  kind: "generate" | "refine" | "other";
}

function readAudit(dataDir: string): Map<string, AuditAttr> {
  const attrs = new Map<string, AuditAttr>();
  for (const file of [join(dataDir, "model-audit.jsonl.1"), join(dataDir, "model-audit.jsonl")]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue; // append 尾读半行/损坏行跳过
      }
      // 归因源：model.admitted（失败尝试也归因到其候选）+ 无 reason 的 model.finished（出稿胜者 last-wins）
      const admitted = event.kind === "model.admitted";
      const finishedClean = event.kind === "model.finished" && event.reason === undefined;
      if (!admitted && !finishedClean) continue;
      const taskId = String(event.taskId ?? "");
      const provider = String(event.provider ?? "");
      const model = String(event.model ?? "");
      if (!taskId || !provider || !model) continue;
      const kind: AuditAttr["kind"] = taskId.startsWith("mf:generate-")
        ? "generate"
        : taskId.startsWith("mf:refine-")
          ? "refine"
          : "other";
      attrs.set(taskId, { provider, model, at: String(event.at ?? ""), kind }); // last-wins（回退后胜者覆盖）
    }
  }
  return attrs;
}

function isLocalToday(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  );
}

export function aggregateCallStats(dataDir: string): CallStats {
  const attrs = readAudit(dataDir);
  const auditPresent = attrs.size > 0 || existsSync(join(dataDir, "model-audit.jsonl"));
  const budgetFile = join(dataDir, "model-budget.json");

  let totalCalls = 0;
  let totalTokens = 0;
  let todayCalls = 0;
  let todayTokens = 0;
  const byModel = new Map<string, ModelRow>();

  if (existsSync(budgetFile)) {
    let tasks: Record<string, { usage?: Record<string, number> }>;
    try {
      tasks = (JSON.parse(readFileSync(budgetFile, "utf8")) as { tasks?: typeof tasks }).tasks ?? {};
    } catch {
      tasks = {};
    }
    for (const [taskId, entry] of Object.entries(tasks)) {
      const u = entry.usage ?? {};
      const calls = u.modelCalls ?? 0;
      const tokens = (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
      totalCalls += calls;
      totalTokens += tokens;
      const attr = attrs.get(taskId);
      if (attr) {
        if (isLocalToday(attr.at)) {
          todayCalls += calls;
          todayTokens += tokens;
        }
        const key = `${attr.provider}/${attr.model}`;
        const row = byModel.get(key) ?? { provider: attr.provider, model: attr.model, calls: 0, tokens: 0, generateCalls: 0, refineCalls: 0 };
        row.calls += calls;
        row.tokens += tokens;
        if (attr.kind === "generate") row.generateCalls += calls;
        if (attr.kind === "refine") row.refineCalls += calls;
        byModel.set(key, row);
      }
    }
  }

  return {
    today: { calls: todayCalls, tokens: todayTokens },
    total: { calls: totalCalls, tokens: totalTokens },
    byModel: [...byModel.values()].sort((a, b) => b.tokens - a.tokens),
    todayAvailable: auditPresent,
    modelAttributionAvailable: byModel.size > 0
  };
}
