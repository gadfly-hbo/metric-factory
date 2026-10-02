import { AnswersSchema } from "../schema/answers.js";
import type { Template } from "../schema/template.js";
import type { MatchOutcome } from "../engine/match.js";
import { escapeHtml, chip } from "./render.js";

// 问卷向导：选项直接取自 AnswersSchema 枚举（与校验层同源，不会漂移），
// 每个选项附一句业务人员友好的说明。
const OPTION_HINT: Record<string, string> = {
  交易抽佣: "平台撮合交易，按成交额抽成",
  订阅: "客户按周期付费解锁服务",
  广告: "靠流量卖广告位变现",
  服务费: "按交付的服务项目收费",
  混合: "多种收入模式并存",
  "2C": "服务个人消费者",
  "2B": "服务企业客户",
  双边市场: "同时服务供需双方",
  交易: "买家与卖家成交",
  内容消费: "用户浏览、观看、消费内容",
  创作消费: "用户既生产内容也消费内容",
  协作: "多人协同完成工作"
};

export interface WizardAnswers {
  revenue_model: string;
  user_structure: string;
  core_loop: string;
}

const QUESTIONS: { key: keyof WizardAnswers; options: readonly string[]; label: string; hint: string }[] = [
  { key: "revenue_model", options: AnswersSchema.shape.revenue_model.options, label: "收入模式", hint: "企业主要靠什么赚钱" },
  { key: "user_structure", options: AnswersSchema.shape.user_structure.options, label: "用户结构", hint: "服务的对象是谁" },
  { key: "core_loop", options: AnswersSchema.shape.core_loop.options, label: "核心循环", hint: "业务运转的核心动作" }
];

function questionBlock(key: string, label: string, hint: string, options: readonly string[], selected?: string): string {
  const radios = options
    .map(
      (o) => `<label class="radio-line" style="margin:0">
        <input type="radio" name="${key}" value="${escapeHtml(o)}" ${o === selected ? "checked" : ""}>
        <span><strong style="font-weight:500">${escapeHtml(o)}</strong><span style="color:var(--text-3)"> · ${OPTION_HINT[o] ?? ""}</span></span>
      </label>`
    )
    .join("");
  return `<div class="fld"><label>${escapeHtml(label)} <span style="color:var(--text-3);font-weight:400">— ${escapeHtml(hint)}</span></label>
    <div style="display:flex;flex-direction:column;gap:6px">${radios}</div></div>`;
}

export function wizardStep1Page(opts: { errors?: string[]; values?: Partial<WizardAnswers> } = {}): string {
  const errorsHtml = opts.errors?.length
    ? `<ul class="error-list">${opts.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : "";
  const questions = QUESTIONS.map((q) => questionBlock(q.key, q.label, q.hint, q.options, opts.values?.[q.key])).join("");
  return `<form action="/init/match" method="post">
    <div class="card">
      <div class="card-h">第 1 步 / 共 2 步 · 回答三个问题</div>
      ${errorsHtml}
      ${questions}
      <button class="btn btn-primary" type="submit">下一步 · 匹配行业模板</button>
    </div>
  </form>
  <p class="composer-note">答案仅用于匹配行业模板，之后可随时微调口径与指标。</p>`;
}

export function wizardStep2Page(
  match: MatchOutcome,
  templates: Template[],
  answers: WizardAnswers,
  opts: { errors?: string[]; name?: string; templateId?: string } = {}
): string {
  const errorsHtml = opts.errors?.length
    ? `<ul class="error-list">${opts.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : "";
  const tplById = new Map(templates.map((t) => [t.template.id, t]));
  const best = tplById.get(match.best.templateId);
  const ranked = [...match.all].sort((a, b) => b.score - a.score);
  const hidden = `<input type="hidden" name="revenue_model" value="${escapeHtml(answers.revenue_model)}">
    <input type="hidden" name="user_structure" value="${escapeHtml(answers.user_structure)}">
    <input type="hidden" name="core_loop" value="${escapeHtml(answers.core_loop)}">`;

  const bestCard = best
    ? `<div class="card" style="border-color:var(--accent-line);background:var(--accent-soft)">
      <div class="card-h">推荐模板 ${chip("accent", `匹配 ${match.best.score}/3`)}</div>
      <p><strong>${escapeHtml(best.template.industry)}</strong> · <span class="mono">${escapeHtml(best.template.id)}</span> · 指标 ${best.metrics.length} 个 · 适用于 ${escapeHtml(best.template.business_models.join(" / "))}</p>
      <ul style="margin:8px 0 0 16px;color:var(--text-2)">${match.best.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </div>`
    : "";

  const choices = ranked
    .map((m) => {
      const t = tplById.get(m.templateId)!;
      const checked = (opts.templateId ?? match.best.templateId) === m.templateId;
      return `<label style="display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid var(--border);border-radius:var(--rounded-sm);${checked ? "background:var(--accent-soft);border-color:var(--accent-line)" : ""}">
        <input type="radio" name="template_id" value="${escapeHtml(m.templateId)}" ${checked ? "checked" : ""} style="margin-top:3px">
        <span><strong style="font-weight:500">${escapeHtml(t.template.industry)} · ${escapeHtml(m.templateId)}</strong>
        <span style="color:var(--text-3)"> · 指标 ${t.metrics.length} 个</span>
        ${m.score > 0 ? `<span class="chip chip-accent" style="margin-left:6px">${m.score}/3</span>` : ""}
        ${m.reasons.length ? `<br><span style="font-size:11.5px;color:var(--text-2)">${escapeHtml(m.reasons.join("；"))}</span>` : ""}</span>
      </label>`;
    })
    .join("");

  return `<form action="/init/create" method="post">${hidden}
    ${bestCard}
    <div class="card">
      <div class="card-h">第 2 步 / 共 2 步 · 确认模板并命名实例</div>
      ${errorsHtml}
      <div class="fld"><label>选择行业模板（默认推荐项，可改选）</label>
        <div style="display:flex;flex-direction:column;gap:6px">${choices}</div></div>
      <div class="fld"><label>实例目录名（小写字母、数字、中划线；实例将保存在工作区下的该目录）</label>
        <input type="text" name="name" value="${escapeHtml(opts.name ?? "my-instance")}" required></div>
      <button class="btn btn-primary" type="submit">生成实例 · 进入工作台</button>
    </div>
  </form>
  <p class="composer-note">生成后：口径微调、AI 草案、审核与导出全部在浏览器完成。</p>`;
}
