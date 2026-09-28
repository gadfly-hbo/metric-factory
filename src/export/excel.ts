import ExcelJS from "exceljs";
import type { Exporter, ExportResult } from "./types.js";
import { assertExportable } from "./gate.js";
import type { MaterializedInstance } from "../engine/materialize.js";
import type { Metric } from "../schema/template.js";

function provenanceSummary(m: Metric): string {
  const p = m.provenance;
  if (p.origin === "template") return `模板 ${p.template_ref}`;
  if (p.origin === "llm") return `LLM 生成（${p.model}，prompt ${p.prompt_version}${p.reviewed_by ? `，审核人 ${p.reviewed_by}` : ""}）`;
  return `人工定义${p.note ? `（${p.note}）` : ""}`;
}

export const excelExporter: Exporter = {
  format: "excel",
  async export(input: MaterializedInstance): Promise<ExportResult> {
    assertExportable(input.metrics);

    const wb = new ExcelJS.Workbook();

    // Sheet 1 · 指标字典（含出处列）
    const dict = wb.addWorksheet("指标字典");
    dict.columns = [
      { header: "指标名（机器契约）", key: "name", width: 32 },
      { header: "展示名", key: "display_name", width: 20 },
      { header: "类型", key: "type", width: 12 },
      { header: "口径定义", key: "definition", width: 60 },
      { header: "维度", key: "dimensions", width: 32 },
      { header: "时间粒度", key: "time_grains", width: 20 },
      { header: "归口角色", key: "owner_role", width: 18 },
      { header: "口径开关", key: "caliber", width: 36 },
      { header: "出处", key: "provenance", width: 44 }
    ];
    for (const m of input.metrics) {
      dict.addRow({
        name: m.name,
        display_name: m.display_name,
        type: m.type,
        definition: m.definition,
        dimensions: m.dimensions.join(" / "),
        time_grains: m.time_grains.join(" / "),
        owner_role: m.owner_role,
        caliber: Object.entries(m.caliber_switches)
          .map(([k, v]) => `${k}=${v}`)
          .join("，"),
        provenance: provenanceSummary(m)
      });
    }
    dict.getRow(1).font = { bold: true };

    // Sheet 2 · 口径开关（有效取值，实例覆盖标记）
    const caliberSheet = wb.addWorksheet("口径开关");
    caliberSheet.columns = [
      { header: "指标", key: "metric", width: 32 },
      { header: "开关", key: "key", width: 28 },
      { header: "取值", key: "value", width: 10 },
      { header: "来源", key: "source", width: 14 }
    ];
    const changedCaliber = new Set(input.diff.caliber.map((c) => `${c.metric}.${c.key}`));
    for (const m of input.metrics) {
      for (const [key, value] of Object.entries(m.caliber_switches)) {
        caliberSheet.addRow({
          metric: m.name,
          key,
          value: String(value),
          source: changedCaliber.has(`${m.name}.${key}`) ? "实例覆盖" : "模板默认"
        });
      }
    }
    caliberSheet.getRow(1).font = { bold: true };

    // Sheet 3 · 北极星候选与决策指引
    const ns = wb.addWorksheet("北极星");
    ns.columns = [
      { header: "候选指标", key: "metric", width: 32 },
      { header: "选择理由", key: "rationale", width: 60 }
    ];
    const metricByName = new Map(input.metrics.map((m) => [m.name, m]));
    for (const c of input.north_star.candidates) {
      ns.addRow({
        metric: `${metricByName.get(c.metric)?.display_name ?? c.metric}（${c.metric}）`,
        rationale: c.rationale
      });
    }
    ns.addRow({});
    const guide = ns.addRow({ rationale: `决策指引：${input.north_star.decision_guide}` });
    guide.getCell(2).font = { bold: true };
    ns.getRow(1).font = { bold: true };

    // Sheet 4 · 实例 vs 模板变更清单
    const changes = wb.addWorksheet("变更清单");
    changes.columns = [
      { header: "变更类型", key: "kind", width: 14 },
      { header: "对象", key: "target", width: 32 },
      { header: "明细", key: "detail", width: 72 }
    ];
    for (const c of input.diff.caliber) {
      changes.addRow({ kind: "口径调整", target: `${c.metric}.${c.key}`, detail: `${c.from} → ${c.to}` });
    }
    for (const m of input.diff.modified) {
      changes.addRow({ kind: "字段修改", target: m.name, detail: `修改字段：${m.fields.join("、")}` });
    }
    for (const name of input.diff.removed) {
      changes.addRow({ kind: "删除指标", target: name, detail: "实例中移除（不导出）" });
    }
    for (const m of input.diff.added) {
      changes.addRow({ kind: "新增指标", target: m.name, detail: `出处：${provenanceSummary(m)}` });
    }
    changes.getRow(1).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return { filename: "metric-dictionary.xlsx", content: new Uint8Array(buffer) };
  }
};
