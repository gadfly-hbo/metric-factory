import type { Template, Metric } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { MaterializedInstance } from "./materialize.js";

export interface ValidateIssue {
  rule: string;
  path: string;
  message: string;
}

// 实例校验：rebase 基模板后的全量规则（含 patch 目标存在性、fail-closed 镜像、出处一致性）
export function validateInstance(
  materialized: MaterializedInstance,
  template: Template,
  instance: Instance
): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const knownDims = new Set(template.dimensions);
  const templateMetricNames = new Set(template.metrics.map((m) => m.name));
  const addedNames = new Set(instance.added.map((m) => m.name));

  for (const m of materialized.metrics) {
    for (const dim of m.dimensions) {
      if (!knownDims.has(dim)) {
        issues.push({
          rule: "dangling-dimension",
          path: `metrics.${m.name}.dimensions`,
          message: `指标 ${m.name} 引用了未声明的 dimension "${dim}"（不在基模板 dimensions 清单中）`
        });
      }
    }
    if (m.provenance.origin === "template" && m.provenance.template_ref !== instance.base) {
      issues.push({
        rule: "provenance-ref",
        path: `metrics.${m.name}.provenance.template_ref`,
        message: `指标 ${m.name} 声称模板出处 ${m.provenance.template_ref}，与实例基模板 ${instance.base} 不一致`
      });
    }
    if (m.provenance.origin === "llm" && !m.provenance.reviewed_by) {
      issues.push({
        rule: "llm-unreviewed",
        path: `metrics.${m.name}.provenance.reviewed_by`,
        message: `指标 ${m.name} 为 LLM 生成且未经人工审核（fail-closed：无法导出，请补 provenance.reviewed_by）`
      });
    }
  }

  // patch 目标存在性：修改/删除/口径开关必须命中模板或新增指标
  const addressable = new Set([...templateMetricNames, ...addedNames]);
  for (const mod of instance.modified) {
    if (!addressable.has(mod.name)) {
      issues.push({
        rule: "modified-target",
        path: `modified.${mod.name}`,
        message: `修改目标不存在：指标 ${mod.name} 不在基模板或新增列表中`
      });
    }
  }
  for (const name of instance.removed) {
    if (!templateMetricNames.has(name)) {
      issues.push({
        rule: "removed-target",
        path: `removed.${name}`,
        message: `删除目标不存在：指标 ${name} 不在基模板中`
      });
    }
  }
  for (const metricName of Object.keys(instance.caliber_switches)) {
    if (!addressable.has(metricName)) {
      issues.push({
        rule: "caliber-target",
        path: `caliber_switches.${metricName}`,
        message: `口径开关目标不存在：指标 ${metricName} 不在基模板或新增列表中`
      });
    }
  }

  // 物化后 type_params 引用一致性（lint 规则的实例镜像）：删除派生输入指标后不留悬空引用
  const materializedNames = new Set(materialized.metrics.map((m) => m.name));
  for (const m of materialized.metrics) {
    const tp = m.type_params;
    if (!tp) continue;
    for (const ref of [tp.measure, tp.numerator, tp.denominator]) {
      if (ref && !materializedNames.has(ref)) {
        issues.push({
          rule: "type-params-ref",
          path: `metrics.${m.name}.type_params`,
          message: `指标 ${m.name} 的 type_params 引用了不存在（或已被删除）的指标 "${ref}"`
        });
      }
    }
    if (tp.expr) {
      const tokens = tp.expr.match(/[a-z_][a-z0-9_]*/g) ?? [];
      for (const token of tokens) {
        if (!materializedNames.has(token)) {
          issues.push({
            rule: "type-params-ref",
            path: `metrics.${m.name}.type_params.expr`,
            message: `指标 ${m.name} 的公式 "${tp.expr}" 引用了不存在（或已被删除）的指标 "${token}"`
          });
        }
      }
    }
  }

  return issues;
}
