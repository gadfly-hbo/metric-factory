import type { Metric } from "../schema/template.js";

// fail-closed 审核门：LLM 生成且未经人工审核（无 reviewed_by）的指标禁止导出
export class ExportBlockedError extends Error {
  constructor(public readonly blockedMetrics: string[]) {
    super(
      `导出被阻断（fail-closed）：以下指标为 LLM 生成且未经人工审核，完成审核（provenance.reviewed_by）后才能导出：\n` +
        blockedMetrics.map((n) => `  - ${n}`).join("\n")
    );
    this.name = "ExportBlockedError";
  }
}

export function assertExportable(metrics: Metric[]): void {
  const blocked = metrics
    .filter((m) => m.provenance.origin === "llm" && !m.provenance.reviewed_by)
    .map((m) => m.name);
  if (blocked.length > 0) {
    throw new ExportBlockedError(blocked);
  }
}
