import type { Template } from "../schema/template.js";

export interface LintIssue {
  rule: string;
  path: string;
  message: string;
}

export function lintTemplate(t: Template): LintIssue[] {
  const issues: LintIssue[] = [];
  const knownDims = new Set(t.dimensions);
  const metricNames = new Set(t.metrics.map((m) => m.name));

  for (const [i, m] of t.metrics.entries()) {
    for (const dim of m.dimensions) {
      if (!knownDims.has(dim)) {
        issues.push({
          rule: "dimension-ref",
          path: `metrics.${i}.dimensions`,
          message: `指标 ${m.name} 引用了未声明的 dimension "${dim}"（不在模板 dimensions 清单中）`
        });
      }
    }
    if (m.provenance.origin === "template") {
      const expected = `${t.template.id}@${t.template.version}`;
      if (m.provenance.template_ref !== expected) {
        issues.push({
          rule: "provenance-ref",
          path: `metrics.${i}.provenance.template_ref`,
          message: `指标 ${m.name} 的 provenance.template_ref "${m.provenance.template_ref}" 与模板标识 ${expected} 不一致`
        });
      }
    }

    const agg = m.aggregation;
    if (agg) {
      if (m.dimensions.length === 0) {
        issues.push({
          rule: "aggregation-dimensions",
          path: `metrics.${i}.aggregation`,
          message: `指标 ${m.name} 的 dimensions 为空数组，不允许声明 aggregation（防双源不一致）`
        });
      }
      for (const dim of agg.allowed_dimensions) {
        if (!knownDims.has(dim)) {
          issues.push({
            rule: "aggregation-dimensions",
            path: `metrics.${i}.aggregation.allowed_dimensions`,
            message: `指标 ${m.name} 的 aggregation.allowed_dimensions 包含模板未声明的 dimension "${dim}"`
          });
        }
      }
      for (const dim of agg.disallowed_dimensions) {
        if (!knownDims.has(dim)) {
          issues.push({
            rule: "aggregation-dimensions",
            path: `metrics.${i}.aggregation.disallowed_dimensions`,
            message: `指标 ${m.name} 的 aggregation.disallowed_dimensions 包含模板未声明的 dimension "${dim}"`
          });
        }
      }
      for (const dim of agg.allowed_dimensions) {
        if (agg.disallowed_dimensions.includes(dim)) {
          issues.push({
            rule: "aggregation-dimensions",
            path: `metrics.${i}.aggregation.allowed_dimensions`,
            message: `指标 ${m.name} 的 dimension "${dim}" 同时出现在 aggregation.allowed_dimensions 与 disallowed_dimensions`
          });
        }
      }
    }

    if (m.caliber_type) {
      const seen = new Set<string>();
      for (const family of m.caliber_type) {
        if (seen.has(family)) {
          issues.push({
            rule: "caliber-dedup",
            path: `metrics.${i}.caliber_type`,
            message: `指标 ${m.name} 的 caliber_type 存在重复口径族 "${family}"`
          });
          break;
        }
        seen.add(family);
      }
    }
  }

  for (const [i, tree] of t.trees.entries()) {
    for (const child of tree.children) {
      if (!metricNames.has(child)) {
        issues.push({
          rule: "tree-ref",
          path: `trees.${i}.children`,
          message: `指标树 ${tree.id} 引用了不存在的指标 "${child}"`
        });
      }
    }
  }

  // type_params 引用一致性：measure/numerator/denominator 必须命中已定义指标；expr 中的标识符同理
  for (const [i, m] of t.metrics.entries()) {
    const tp = m.type_params;
    if (!tp) continue;
    for (const ref of [tp.measure, tp.numerator, tp.denominator]) {
      if (ref && !metricNames.has(ref)) {
        issues.push({
          rule: "type-params-ref",
          path: `metrics.${i}.type_params`,
          message: `指标 ${m.name} 的 type_params 引用了不存在的指标 "${ref}"`
        });
      }
    }
    if (tp.expr) {
      const tokens = tp.expr.match(/[a-z_][a-z0-9_]*/g) ?? [];
      for (const token of tokens) {
        if (!metricNames.has(token)) {
          issues.push({
            rule: "type-params-ref",
            path: `metrics.${i}.type_params.expr`,
            message: `指标 ${m.name} 的公式 "${tp.expr}" 引用了不存在的指标 "${token}"`
          });
        }
      }
    }
  }

  for (const [i, c] of t.north_star.candidates.entries()) {
    if (!metricNames.has(c.metric)) {
      issues.push({
        rule: "north-star-ref",
        path: `north_star.candidates.${i}.metric`,
        message: `北极星候选引用了不存在的指标 "${c.metric}"`
      });
    }
  }

  return issues;
}
