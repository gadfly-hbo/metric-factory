import type { Instance } from "../schema/instance.js";
import type { Draft } from "../schema/draft.js";
import type { Template } from "../schema/template.js";

export interface ApplyError {
  rule: string;
  message: string;
}

export type ApplyResult =
  | { ok: true; instance: Instance }
  | { ok: false; errors: ApplyError[] };

// 草案合入：同名冲突 / 悬空目标在合入层即拒绝（fail-closed，零写盘由调用方保证）
export function applyDraft(instance: Instance, draft: Draft, template: Template): ApplyResult {
  const errors: ApplyError[] = [];
  const templateNames = new Set(template.metrics.map((m) => m.name));
  const addedNames = new Set(instance.added.map((m) => m.name));
  const addressable = new Set([...templateNames, ...addedNames]);

  for (const m of draft.added) {
    if (templateNames.has(m.name) || addedNames.has(m.name)) {
      errors.push({
        rule: "added-conflict",
        message: `草案新增指标 ${m.name} 与现有指标同名（模板或实例中已存在）`
      });
    }
  }
  for (const mod of draft.modified) {
    if (!addressable.has(mod.name)) {
      errors.push({
        rule: "modified-target",
        message: `草案修改目标不存在：${mod.name}（不在基模板或实例新增列表中）`
      });
    }
  }
  for (const name of draft.removed) {
    if (!addressable.has(name)) {
      errors.push({
        rule: "removed-target",
        message: `草案删除目标不存在：${name}`
      });
    }
  }
  for (const metricName of Object.keys(draft.caliber)) {
    if (!addressable.has(metricName)) {
      errors.push({
        rule: "caliber-target",
        message: `草案口径开关目标不存在：${metricName}`
      });
    }
  }
  // A1 D9：场景段合并——同 id 冲突即拒绝（含与模板种子同 id：覆盖种子请走实例编辑器，不走草案）
  const existingScenarioIds = new Set([
    ...template.scenarios.map((s) => s.id),
    ...instance.added_scenarios.map((s) => s.id)
  ]);
  for (const s of draft.added_scenarios) {
    if (existingScenarioIds.has(s.id)) {
      errors.push({
        rule: "scenario-conflict",
        message: `草案新增场景 ${s.id} 与现有场景同 id（模板种子或实例中已存在）`
      });
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const merged: Instance = {
    ...instance,
    added: [...instance.added, ...draft.added],
    modified: [...instance.modified, ...draft.modified],
    removed: [
      ...instance.removed,
      ...draft.removed.filter((n) => templateNames.has(n))
    ],
    caliber_switches: mergeCaliber(instance.caliber_switches, draft.caliber),
    added_scenarios: [...instance.added_scenarios, ...draft.added_scenarios]
  };
  // 删除目标若是实例自增指标：直接从 added 移除
  const removeSet = new Set(draft.removed);
  merged.added = merged.added.filter((m) => !removeSet.has(m.name));

  // A1 D9：blueprint 全量替换语义——采纳即更新同一工作稿；旧复核随新内容自然失效（指纹失配）
  if (draft.blueprint) {
    merged.blueprint = draft.blueprint;
  }

  return { ok: true, instance: merged };
}

function mergeCaliber(
  base: Record<string, Record<string, boolean>>,
  patch: Record<string, Record<string, boolean>>
): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = { ...base };
  for (const [metric, switches] of Object.entries(patch)) {
    out[metric] = { ...(out[metric] ?? {}), ...switches };
  }
  return out;
}
