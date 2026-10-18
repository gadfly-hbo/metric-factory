import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { aggregateCallStats } from "../../src/llm/call-stats.js";

// M3 G8/D1：双源聚合——审计（taskId→provider/model/at）⋈ 账本（taskId→usage tokens）
function todayIso(): string {
  return new Date().toISOString();
}
function yesterdayIso(): string {
  return new Date(Date.now() - 24 * 3600 * 1000).toISOString();
}

function auditLine(taskId: string, provider: string, model: string, at: string, kind = "model.finished", reason?: string): string {
  return JSON.stringify({ version: "1.0", taskId, runId: `${taskId}-r`, sequence: 1, kind, at, provider, model, contextVersions: {}, ...(reason ? { reason } : {}) });
}

test("双源聚合：按模型行（次数/tokens/generate-refine 拆分）+ 今日/累计 + 勾稽", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-stats-"));
  const audit = [
    auditLine("mf:generate-1", "minimax-cn", "MiniMax-M3", todayIso()),
    auditLine("mf:refine-2", "minimax-cn", "MiniMax-M3", yesterdayIso()),
    auditLine("mf:generate-3", "xiaomi-token-plan-cn", "mimo-v2.6-flash", todayIso()),
    auditLine("mf:generate-9", "minimax-cn", "MiniMax-M3", todayIso(), "model.admitted"), // 失败尝试：admitted 归因其候选（finished 带 reason 不覆盖）
    "{broken-json" // 半行跳过
  ].join("\n");
  writeFileSync(join(dir, "model-audit.jsonl"), `${audit}\n`, "utf8");
  const budget = {
    version: 1,
    tasks: {
      "mf:generate-1": { configuration: "c", limits: { cumulative: "unlimited" }, usage: { modelCalls: 1, inputTokens: 1000, outputTokens: 500, reservedOutputTokens: 0 } },
      "mf:refine-2": { configuration: "c", limits: { cumulative: "unlimited" }, usage: { modelCalls: 2, inputTokens: 800, outputTokens: 200, reservedOutputTokens: 0 } },
      "mf:generate-3": { configuration: "c", limits: { cumulative: "unlimited" }, usage: { modelCalls: 1, inputTokens: 300, outputTokens: 700, reservedOutputTokens: 0 } },
      "mf:generate-9": { configuration: "c", limits: { cumulative: "unlimited" }, usage: { modelCalls: 1, inputTokens: 10, outputTokens: 10, reservedOutputTokens: 0 } }
    }
  };
  writeFileSync(join(dir, "model-budget.json"), JSON.stringify(budget), "utf8");

  const stats = aggregateCallStats(dir);
  expect(stats.total).toEqual({ calls: 5, tokens: 3520 }); // 账本权威：Σcalls=5、Σtokens=3520（含失败尝试 20——账本口径如实）
  expect(stats.today).toEqual({ calls: 3, tokens: 2520 }); // generate-1(1500)+generate-3(1000)+失败尝试(20)
  const mm = stats.byModel.find((r) => r.model === "MiniMax-M3")!;
  expect(mm.provider).toBe("minimax-cn");
  expect(mm.calls).toBe(4); // generate-1 + refine-2(2 attempts) + 失败尝试(1)——均归因主模型
  expect(mm.tokens).toBe(2520); // generate-1(1500) + refine-2(1000，累计口径含昨日) + 失败尝试(20)
  expect(mm.generateCalls).toBe(2);
  expect(mm.refineCalls).toBe(2);
  const mimo = stats.byModel.find((r) => r.model === "mimo-v2.6-flash")!;
  expect(mimo.calls).toBe(1);
  expect(mimo.tokens).toBe(1000);
  expect(mimo.generateCalls).toBe(1);
  expect(mimo.refineCalls).toBe(0);
  expect(stats.modelAttributionAvailable).toBe(true);
});

test("空态（两文件皆无）：零数字 + 暂无记录语义", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-stats-empty-"));
  const stats = aggregateCallStats(dir);
  expect(stats.total).toEqual({ calls: 0, tokens: 0 });
  expect(stats.today).toEqual({ calls: 0, tokens: 0 });
  expect(stats.byModel).toEqual([]);
  expect(stats.modelAttributionAvailable).toBe(false);
});

test("审计缺失账本在（降级形态）：总量照显（账本源）、模型归因不可用", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-stats-deg-"));
  const budget = {
    version: 1,
    tasks: {
      "mf:generate-1": { configuration: "c", limits: { cumulative: "unlimited" }, usage: { modelCalls: 2, inputTokens: 50, outputTokens: 50, reservedOutputTokens: 0 } }
    }
  };
  writeFileSync(join(dir, "model-budget.json"), JSON.stringify(budget), "utf8");
  const stats = aggregateCallStats(dir);
  expect(stats.total).toEqual({ calls: 2, tokens: 100 });
  expect(stats.modelAttributionAvailable).toBe(false);
  expect(stats.byModel).toEqual([]); // 不给假模型列（契约负例 3）
  expect(stats.todayAvailable).toBe(false);
});

test("轮转代（.1）也计入累计", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-stats-rot-"));
  writeFileSync(join(dir, "model-audit.jsonl.1"), `${auditLine("mf:generate-1", "minimax-cn", "MiniMax-M3", yesterdayIso())}\n`, "utf8");
  writeFileSync(
    join(dir, "model-budget.json"),
    JSON.stringify({ version: 1, tasks: { "mf:generate-1": { configuration: "c", limits: {}, usage: { modelCalls: 1, inputTokens: 10, outputTokens: 5, reservedOutputTokens: 0 } } } }),
    "utf8"
  );
  const stats = aggregateCallStats(dir);
  expect(stats.total).toEqual({ calls: 1, tokens: 15 });
  expect(stats.byModel[0]!.model).toBe("MiniMax-M3");
});
