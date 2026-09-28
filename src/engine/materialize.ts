import type { Template, Metric } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";

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
}

export interface MaterializedInstance {
  base: string;
  industry: string;
  templateId: string;
  metrics: Metric[];
  trees: Template["trees"];
  north_star: Template["north_star"];
  dimensions: string[];
  diff: InstanceDiff;
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
      caliber_switches: { ...m.caliber_switches, ...overrides }
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
    caliber
  };

  return {
    base: instance.base,
    industry: template.template.industry,
    templateId: template.template.id,
    metrics,
    trees,
    north_star,
    dimensions: template.dimensions,
    diff
  };
}
