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

  // 场景规则（模板镜像）：schema 挡正规路径，此处兜底 YAML 直读 + 模板指标语境
  const scenarios = t.scenarios ?? [];
  const seenScenarioIds = new Set<string>();
  for (const [i, s] of scenarios.entries()) {
    if (!s.decision_purpose?.trim()) {
      issues.push({
        rule: "scenario-purpose",
        path: `scenarios.${i}.decision_purpose`,
        message: `场景 ${s.id} 缺少决策用途（decision_purpose 为空）`
      });
    }
    if (seenScenarioIds.has(s.id)) {
      issues.push({
        rule: "scenario-id",
        path: `scenarios.${i}.id`,
        message: `场景 id "${s.id}" 在模板内重复`
      });
    } else {
      seenScenarioIds.add(s.id);
    }

    const nodes = s.question_tree ?? [];
    const nodeIds = new Set(nodes.map((n) => n.id));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const seenNodeIds = new Set<string>();
    for (const [j, n] of nodes.entries()) {
      if (seenNodeIds.has(n.id)) {
        issues.push({
          rule: "scenario-tree-ref",
          path: `scenarios.${i}.question_tree.${j}.id`,
          message: `场景 ${s.id} 的 question_tree 节点 id "${n.id}" 重复`
        });
      } else {
        seenNodeIds.add(n.id);
      }
      if (n.metric && !metricNames.has(n.metric)) {
        issues.push({
          rule: "scenario-metric-ref",
          path: `scenarios.${i}.question_tree.${j}.metric`,
          message: `场景 ${s.id} 节点 ${n.id} 引用了模板不存在的指标 "${n.metric}"`
        });
      }
      if (!n.parent) continue;
      if (n.parent === n.id) {
        issues.push({
          rule: "scenario-tree-ref",
          path: `scenarios.${i}.question_tree.${j}.parent`,
          message: `场景 ${s.id} 节点 ${n.id} 的 parent 指向自身`
        });
        continue;
      }
      if (!nodeIds.has(n.parent)) {
        issues.push({
          rule: "scenario-tree-ref",
          path: `scenarios.${i}.question_tree.${j}.parent`,
          message: `场景 ${s.id} 节点 ${n.id} 的 parent "${n.parent}" 不在该场景 question_tree 中`
        });
        continue;
      }
      // 沿 parent 上溯步数超过节点总数仍未终止即成环
      let cur: string | undefined = n.parent;
      let steps = 0;
      while (cur !== undefined && nodeById.has(cur)) {
        steps += 1;
        if (steps > nodes.length) {
          issues.push({
            rule: "scenario-tree-ref",
            path: `scenarios.${i}.question_tree.${j}.parent`,
            message: `场景 ${s.id} 节点 ${n.id} 的 parent 链成环`
          });
          break;
        }
        cur = nodeById.get(cur)!.parent;
      }
    }
    for (const [j, u] of (s.metric_usages ?? []).entries()) {
      if (!metricNames.has(u.metric)) {
        issues.push({
          rule: "scenario-metric-ref",
          path: `scenarios.${i}.metric_usages.${j}.metric`,
          message: `场景 ${s.id} 的 metric_usages 引用了模板不存在的指标 "${u.metric}"`
        });
      }
    }
  }

  return issues;
}
