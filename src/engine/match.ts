import type { Template } from "../schema/template.js";
import type { Answers } from "../schema/answers.js";

export interface TemplateMatch {
  templateId: string;
  score: number;
  reasons: string[];
}

export interface MatchOutcome {
  best: TemplateMatch;
  all: TemplateMatch[];
}

// 问卷匹配内核：答案向量与模板 matching 元数据的确定性打分（并列取输入顺序第一）
export function matchTemplates(answers: Answers, templates: Template[]): MatchOutcome {
  const all: TemplateMatch[] = templates.map((t) => {
    const reasons: string[] = [];
    if (t.matching.revenue_models.includes(answers.revenue_model)) {
      reasons.push(`收入模式「${answers.revenue_model}」匹配`);
    }
    if (t.matching.user_structure.includes(answers.user_structure)) {
      reasons.push(`用户结构「${answers.user_structure}」匹配`);
    }
    if (t.matching.core_loops.includes(answers.core_loop)) {
      reasons.push(`核心循环「${answers.core_loop}」匹配`);
    }
    return { templateId: t.template.id, score: reasons.length, reasons };
  });

  let best = all[0]!;
  for (const m of all.slice(1)) {
    if (m.score > best.score) best = m;
  }
  return { best, all };
}
