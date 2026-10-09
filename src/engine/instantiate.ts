import type { Template } from "../schema/template.js";
import type { Answers } from "../schema/answers.js";
import type { Instance } from "../schema/instance.js";

// init 产出：fork 基线 + 问卷答案 + 口径偏好；增删改 patch 初始为空，由企业后续微调填充
export function buildInstance(template: Template, answers: Answers, now: string): Instance {
  return {
    instance: { created_at: now },
    base: `${template.template.id}@${template.template.version}`,
    answers,
    caliber_switches: answers.caliber,
    added: [],
    removed: [],
    modified: [],
    concept_refs: [],
    added_scenarios: []
  };
}
