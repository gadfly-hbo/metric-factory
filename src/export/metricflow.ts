import { stringify as stringifyYaml } from "yaml";
import type { Exporter, ExportResult } from "./types.js";
import { assertExportable } from "./gate.js";
import type { MaterializedInstance } from "../engine/materialize.js";
import type { Metric } from "../schema/template.js";

interface MFMetric {
  name: string;
  description: string;
  label: string;
  type: "simple" | "ratio" | "derived" | "cumulative";
  type_params: Record<string, unknown>;
}

interface MFMeasure {
  name: string;
  agg: "sum";
  agg_time_dimension: "metric_date";
  expr: string;
}

function provenanceSummary(m: Metric): string {
  const p = m.provenance;
  if (p.origin === "template") return `模板 ${p.template_ref}`;
  if (p.origin === "llm") return `LLM 生成（${p.model}，prompt ${p.prompt_version}${p.reviewed_by ? `，审核人 ${p.reviewed_by}` : ""}）`;
  return `人工定义${p.note ? `（${p.note}）` : ""}`;
}

function toMetricFlowMetric(m: Metric): MFMetric {
  const description = `${m.definition}（出处：${provenanceSummary(m)}）`;
  const base = { name: m.name, description, label: m.display_name };

  if (m.type === "ratio" && m.type_params?.numerator && m.type_params?.denominator) {
    return {
      ...base,
      type: "ratio",
      type_params: {
        numerator: { name: m.type_params.numerator },
        denominator: { name: m.type_params.denominator }
      }
    };
  }
  if (m.type === "derived" && m.type_params?.expr) {
    return { ...base, type: "derived", type_params: { expr: m.type_params.expr } };
  }
  if (m.type === "cumulative") {
    const params: Record<string, unknown> = { measure: { name: m.type_params?.measure ?? m.name } };
    if (m.type_params?.window) params.window = m.type_params.window;
    if (m.type_params?.grain_to_date) params.grain_to_date = m.type_params.grain_to_date;
    return { ...base, type: "cumulative", type_params: params };
  }
  // simple，或缺少 type_params 的 ratio/derived：占位为 simple，类型保留在 description 由导出方补充
  const note = m.type !== "simple" ? `；原类型 ${m.type}，待补 type_params 后按真实类型导出` : "";
  return {
    name: m.name,
    description: `${m.definition}${note}（出处：${provenanceSummary(m)}）`,
    label: m.display_name,
    type: "simple",
    type_params: { measure: { name: m.type_params?.measure ?? m.name } }
  };
}

export const metricflowExporter: Exporter = {
  format: "metricflow",
  async export(input: MaterializedInstance): Promise<ExportResult> {
    assertExportable(input.metrics);

    const knownMetricNames = new Set(input.metrics.map((m) => m.name));
    const metrics = input.metrics.map(toMetricFlowMetric);

    // derived 公式引用的指标清单（dbt MetricFlow 需要 metrics 输入列表）
    for (let i = 0; i < input.metrics.length; i++) {
      const m = input.metrics[i]!;
      const expr = m.type_params?.expr;
      if (m.type === "derived" && expr) {
        const refs = [...new Set((expr.match(/[a-z_][a-z0-9_]*/g) ?? []).filter((t) => knownMetricNames.has(t)))];
        (metrics[i]!.type_params as Record<string, unknown>).metrics = refs.map((name) => ({ name }));
      }
    }

    // 占位 measures：所有被引用的 measure 名（指标自身名 + ratio 分子分母名）
    const measureNames = new Set<string>();
    for (const m of input.metrics) {
      measureNames.add(m.type_params?.measure ?? m.name);
      if (m.type_params?.numerator) measureNames.add(m.type_params.numerator);
      if (m.type_params?.denominator) measureNames.add(m.type_params.denominator);
    }
    const measures: MFMeasure[] = [...measureNames].map((name) => ({
      name,
      agg: "sum",
      agg_time_dimension: "metric_date",
      expr: "placeholder"
    }));

    const dimensions = [
      ...input.dimensions.map((name) => ({ name, type: "categorical" as const })),
      { name: "metric_date", type: "time" as const }
    ];

    const semanticModelId = input.templateId.replace(/-/g, "_");
    const doc = {
      semantic_models: [
        {
          name: `mf_placeholder_${semanticModelId}`,
          description: `Metric Factory 占位语义模型（fork 自 ${input.base}，字段映射待 P3 数仓反推）`,
          model: { ref: `mf_placeholder_${semanticModelId}` },
          measures,
          dimensions
        }
      ],
      metrics
    };

    const header = `# Metric Factory 导出（dbt MetricFlow 格式）\n# 基模板：${input.base}；semantic_models 为占位模型，替换 ref 与 measure 映射后即可进 dbt Semantic Layer\n`;
    return { filename: "metricflow.yaml", content: header + stringifyYaml(doc) };
  }
};
