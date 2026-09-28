import type { Exporter, ExportResult } from "./types.js";
import { assertExportable } from "./gate.js";
import type { MaterializedInstance } from "../engine/materialize.js";

const CATEGORY_STYLES: Record<string, string> = {
  规模: "fill:#E8F1FA,stroke:#4A78C2",
  质量: "fill:#EAF6EC,stroke:#4C9A63",
  结构: "fill:#F6F0E7,stroke:#B08D4F",
  效率: "fill:#F5EDF6,stroke:#9A6DA8",
  旅程: "fill:#F0F4F8,stroke:#6B7F99"
};

function nodeId(name: string): string {
  return `m_${name}`;
}

function treeNodeId(treeId: string): string {
  return `t_${treeId.replace(/-/g, "_")}`;
}

export const mermaidExporter: Exporter = {
  format: "mermaid",
  async export(input: MaterializedInstance): Promise<ExportResult> {
    assertExportable(input.metrics);

    const metricByName = new Map(input.metrics.map((m) => [m.name, m]));

    const lines: string[] = [
      "flowchart TD",
      `  %% Metric Factory 指标树（fork 自 ${input.base}）`,
      `  %% 决策指引：${input.north_star.decision_guide}`
    ];

    // 北极星节点（候选并列展示）
    const nsLabel = input.north_star.candidates
      .map((c) => `${metricByName.get(c.metric)?.display_name ?? c.metric}（${c.metric}）`)
      .join(" / ");
    lines.push(`  NS["🎯 北极星（候选）：${nsLabel}"]`);

    // 按 category 聚合：同一分类只开一个 subgraph（GRILL 决议 #5）
    const byCategory = new Map<string, typeof input.trees>();
    for (const tree of input.trees) {
      const category = tree.category ?? "结构";
      const group = byCategory.get(category) ?? [];
      group.push(tree);
      byCategory.set(category, group);
    }
    for (const [category, trees] of byCategory) {
      lines.push(`  subgraph CAT_${category}["${category}"]`);
      for (const tree of trees) {
        const label = tree.formula ? `${tree.formula}` : `${tree.id}`;
        lines.push(`    ${treeNodeId(tree.id)}["${label}"]`);
        for (const child of tree.children) {
          const m = metricByName.get(child);
          const display = m ? `${m.display_name}（${child}）` : child;
          lines.push(`    ${nodeId(child)}["${display}"]`);
          lines.push(`    ${treeNodeId(tree.id)} --> ${nodeId(child)}`);
        }
        lines.push(`    NS --> ${treeNodeId(tree.id)}`);
      }
      lines.push("  end");
      lines.push(`  style CAT_${category} ${CATEGORY_STYLES[category] ?? "fill:#F2F2F2,stroke:#999999"}`);
    }

    return { filename: "metric-tree.mmd", content: lines.join("\n") + "\n" };
  }
};
