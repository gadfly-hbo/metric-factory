import type { Template } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { MaterializedInstance } from "./materialize.js";

export interface AuditFinding {
  rule: string;
  severity: "ERROR" | "WARN";
  metric: string;
  message: string;
}

// 虚荣指标启发式黑名单（GRILL 决议 #7）：命中且无对照比率/公式引用 → WARN
const VANITY_KEYWORDS = [
  "点击量", "曝光量", "下载量", "注册量", "粉丝数", "访问量", "页面浏览量", "打开量", "转发量", "点赞数"
];

export function auditInstance(
  materialized: MaterializedInstance,
  template: Template,
  instance: Instance
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const addedNames = new Set(instance.added.map((m) => m.name));

  // 引用生态：type_params（measure/numerator/denominator/expr）+ 树 children + 树公式 token + 北极星候选
  const referenced = new Set<string>();
  for (const m of materialized.metrics) {
    const tp = m.type_params;
    if (!tp) continue;
    for (const ref of [tp.measure, tp.numerator, tp.denominator]) {
      if (ref) referenced.add(ref);
    }
    if (tp.expr) {
      for (const t of tp.expr.match(/[a-z_][a-z0-9_]*/g) ?? []) referenced.add(t);
    }
  }
  for (const tree of template.trees) {
    for (const c of tree.children) referenced.add(c);
    if (tree.formula) {
      for (const t of tree.formula.match(/[a-z_][a-z0-9_]*/g) ?? []) referenced.add(t);
    }
  }
  for (const c of template.north_star.candidates) referenced.add(c.metric);

  for (const m of materialized.metrics) {
    if (m.definition.length < 10) {
      findings.push({
        rule: "incomplete-caliber",
        severity: "ERROR",
        metric: m.name,
        message: `口径疑似不完整：「${m.definition}」定义过短（<10 字符），未写清分子/分母/周期/剔除规则`
      });
    }
    if (m.dimensions.length === 0) {
      findings.push({
        rule: "incomplete-caliber",
        severity: "ERROR",
        metric: m.name,
        message: "缺维度切分：dimensions 为空，指标无法下钻对比"
      });
    }
    if (!m.owner_role) {
      findings.push({
        rule: "no-owner",
        severity: "ERROR",
        metric: m.name,
        message: "无归口角色：指标无人负责"
      });
    }
    if (VANITY_KEYWORDS.some((k) => m.display_name.includes(k)) && !referenced.has(m.name)) {
      findings.push({
        rule: "vanity",
        severity: "WARN",
        metric: m.name,
        message: `虚荣指标风险：「${m.display_name}」为纯计数展示量，且无对照比率/公式引用；建议配套转化率或效率指标`
      });
    }
    if (!addedNames.has(m.name) && !referenced.has(m.name)) {
      findings.push({
        rule: "orphan",
        severity: "WARN",
        metric: m.name,
        message: "孤儿指标：不在任何指标树、非北极星候选、未被公式引用，汇报与治理容易遗漏"
      });
    }
  }
  return findings;
}
