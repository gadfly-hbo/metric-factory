import type { Template, Metric } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { MappingEntry } from "../schema/mapping.js";
import type { Scenario } from "../schema/scenario.js";
import type { Blueprint } from "../schema/blueprint.js";

export interface CaliberChange {
  metric: string;
  key: string;
  from: boolean;
  to: boolean;
}

export interface InstanceDiff {
  added: Metric[];
  removed: string[];
  modified: { name: string; fields: string[] }[];
  caliber: CaliberChange[];
  scenarios: { added: number };
}

export interface MaterializedInstance {
  /** 基模板引用（template_id@version）；A1 D13：空白起点实例为 undefined */
  base: string | undefined;
  industry: string;
  templateId: string;
  metrics: Metric[];
  trees: Template["trees"];
  north_star: Template["north_star"];
  dimensions: string[];
  scenarios: Scenario[];
  /** A1 批次 D1：分析体系（可选段透传；模板不携带 blueprint，无合并语义） */
  blueprint?: Blueprint;
  diff: InstanceDiff;
  /** 已确认的数仓映射（CLI export 装配；导出器用真实模型/列名替换占位） */
  mapping?: MappingEntry[];
}

// A1 D13：空白基座——自然语言起点的无模板工作区使用的引擎空基座常量。
// 它是「空对象模式」而非内容模板：刻意不满足 TemplateSchema 的内容门槛（metrics≥1 是对行业内容模板的要求）。
// 空白基座无 dimensions：新增指标的 dimensions 须为空数组（validate 的 dangling-dimension 规则照常执法）。
export const EMPTY_TEMPLATE: Template = {
  template: { id: "blank", industry: "（空白起点）", business_models: [], version: "0.1.0", references: [] },
  matching: { revenue_models: [], user_structure: [], core_loops: [] },
  north_star: { candidates: [], decision_guide: "" },
  trees: [],
  dimensions: [],
  metrics: [],
  scenarios: []
};

// 基座解析：实例无 base → 空白基座；有 base → 按 id 找模板（找不到返回 undefined，由调用方决定报错）
export function resolveBaseTemplate(instance: Instance, templates: Template[]): Template | undefined {
  if (!instance.base) return EMPTY_TEMPLATE;
  const baseId = instance.base.split("@")[0]!;
  return templates.find((t) => t.template.id === baseId);
}

// fork + diff patch 的物化：模板指标 → 应用删除/修改/口径覆盖 → 追加新增
export function materialize(template: Template, instance: Instance): MaterializedInstance {
  const removed = new Set(instance.removed);
  const modifiedByName = new Map(instance.modified.map((m) => [m.name, m]));
  const caliberByName = instance.caliber_switches;

  const metrics: Metric[] = [];
  for (const m of template.metrics) {
    if (removed.has(m.name)) continue;

    const patch = modifiedByName.get(m.name);
    const overrides = caliberByName[m.name];

    metrics.push({
      ...m,
      ...(patch ? { display_name: patch.display_name ?? m.display_name } : {}),
      ...(patch?.definition ? { definition: patch.definition } : {}),
      ...(patch?.owner_role ? { owner_role: patch.owner_role } : {}),
      ...(patch?.dimensions ? { dimensions: patch.dimensions } : {}),
      caliber_switches: patch?.caliber_switches
        ? { ...m.caliber_switches, ...patch.caliber_switches }
        : { ...m.caliber_switches, ...overrides }
    });
  }

  for (const added of instance.added) {
    metrics.push(added);
  }

  const known = new Set(metrics.map((m) => m.name));
  const trees = template.trees
    .map((t) => ({ ...t, children: t.children.filter((c) => known.has(c)) }))
    .filter((t) => t.children.length > 0 || t.formula);
  const north_star = {
    candidates: template.north_star.candidates.filter((c) => known.has(c.metric)),
    decision_guide: template.north_star.decision_guide
  };

  // 场景收集（GRILL Q3）：模板种子 ∪ added_scenarios，同 id 实例覆盖模板（fork 语义）
  const scenarios = new Map<string, Scenario>();
  for (const s of template.scenarios) scenarios.set(s.id, s);
  for (const s of instance.added_scenarios) scenarios.set(s.id, s);

  // diff：口径变更带模板默认值（from）与实例覆盖值（to）；仅保留真实变化，无变化的覆盖不算 diff
  const caliber: CaliberChange[] = [];
  for (const [metricName, switches] of Object.entries(instance.caliber_switches)) {
    const templateMetric = template.metrics.find((m) => m.name === metricName);
    for (const [key, to] of Object.entries(switches)) {
      const from = templateMetric?.caliber_switches[key] ?? false;
      if (from !== to) caliber.push({ metric: metricName, key, from, to });
    }
  }
  const diff: InstanceDiff = {
    added: instance.added,
    removed: instance.removed,
    modified: instance.modified.map((m) => ({
      name: m.name,
      fields: ["display_name", "definition", "owner_role", "dimensions"].filter(
        (f) => (m as Record<string, unknown>)[f] !== undefined
      )
    })),
    caliber,
    scenarios: { added: instance.added_scenarios.length }
  };

  return {
    base: instance.base,
    industry: template.template.industry,
    templateId: template.template.id,
    metrics,
    trees,
    north_star,
    dimensions: template.dimensions,
    scenarios: [...scenarios.values()],
    ...(instance.blueprint ? { blueprint: instance.blueprint } : {}),
    diff
  };
}
