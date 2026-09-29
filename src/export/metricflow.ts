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
  agg: "sum" | "count_distinct" | "avg" | "min" | "max";
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

    // measure 注册表：有映射 → 真实模型/列名/agg；无映射 → 占位模型
    const mappingByMetric = new Map((input.mapping ?? []).map((e) => [e.metric, e]));
    interface RegistryEntry { model: string; expr: string; agg: MFMeasure["agg"] }
    const registry = new Map<string, RegistryEntry>();
    for (const m of input.metrics) {
      const entry = mappingByMetric.get(m.name);
      registry.set(m.name, entry
        ? { model: entry.model, expr: entry.column, agg: entry.agg ?? "sum" }
        : { model: "", expr: "placeholder", agg: "sum" });
    }
    // 显式 measure 覆盖引用（type_params.measure ≠ 指标名时也注册）
    for (const m of input.metrics) {
      const override = m.type_params?.measure;
      if (override && !registry.has(override)) {
        const own = mappingByMetric.get(m.name);
        registry.set(override, own
          ? { model: own.model, expr: own.column, agg: own.agg ?? "sum" }
          : { model: "", expr: "placeholder", agg: "sum" });
      }
    }

    const placeholderModelName = `mf_placeholder_${input.templateId.replace(/-/g, "_")}`;
    const byModel = new Map<string, string[]>(); // model -> measure names
    for (const [measureName, entry] of registry) {
      const model = entry.model || placeholderModelName;
      const list = byModel.get(model);
      if (list) list.push(measureName);
      else byModel.set(model, [measureName]);
    }

    const dimensions = [
      ...input.dimensions.map((name) => ({ name, type: "categorical" as const })),
      { name: "metric_date", type: "time" as const }
    ];

    const unmappedCount = input.metrics.filter((m) => !mappingByMetric.has(m.name)).length;
    const semantic_models = [...byModel.entries()].map(([model, measureNames]) => ({
      name: model,
      description:
        model === placeholderModelName
          ? `Metric Factory 占位语义模型（fork 自 ${input.base}，字段映射待 metric-factory map）`
          : `Metric Factory 映射语义模型（${model}；维度清单来自模板，请按真实模型核对）`,
      model: { ref: model },
      measures: measureNames.map((name) => {
        const entry = registry.get(name)!;
        return { name, agg: entry.agg, agg_time_dimension: "metric_date" as const, expr: entry.expr };
      }),
      dimensions
    }));

    const doc = { semantic_models, metrics };

    const lines = [`# Metric Factory 导出（dbt MetricFlow 格式）`, `# 基模板：${input.base}`];
    if (input.mapping && input.mapping.length > 0) {
      lines.push(`# 已映射指标 ${input.mapping.length} 个（真实模型引用）；未映射 ${unmappedCount} 个走占位模型，先跑 metric-factory map`);
    } else {
      lines.push(`# semantic_models 为占位模型，替换 ref 与 measure 映射后即可进 dbt Semantic Layer`);
    }
    return { filename: "metricflow.yaml", content: lines.join("\n") + "\n" + stringifyYaml(doc) };
  }
};
