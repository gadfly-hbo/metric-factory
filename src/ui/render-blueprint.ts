import { escapeHtml, chip } from "./render.js";
import type { Blueprint, EvidenceStatus, JudgmentKind } from "../schema/blueprint.js";
import type { MethodTemplate } from "../schema/method.js";
import type { MaterializedInstance } from "../engine/materialize.js";
import type { Instance } from "../schema/instance.js";
import type { Template } from "../schema/template.js";
import type { Scenario } from "../schema/scenario.js";
import type { DesignReview, MetricReference, BlueprintReviewState } from "../engine/blueprint.js";
import type { ValidateIssue } from "../engine/validate.js";
import type { Draft } from "../schema/draft.js";
import {
  questionsToDsl, hypothesesToDsl, evidenceToDsl, optionsToDsl
} from "./dsl.js";

// A1 批次：分析体系四视图与蓝图页面的渲染（纯服务端、零客户端脚本）。
// 中文业务语言优先；机器 id 放辅助小字。

const CONTEXTS = ["经营改善", "战略选择", "独立数据专题"] as const;
const ORGANIZATIONS = ["假设先行", "深度研究", "自主探索"] as const;
const JUDGMENTS: JudgmentKind[] = ["待验证假设", "事实", "解释", "建议"];

function evidenceStatusChip(status: EvidenceStatus): string {
  switch (status) {
    case "已核验": return chip("ok", "已核验");
    case "取得待核": return chip("queue", "取得待核");
    case "支持不足": return chip("warn", "支持不足");
    case "存在冲突": return chip("fail", "存在冲突");
    default: return chip("warn", "待获取");
  }
}

function reviewStateChip(state: BlueprintReviewState): string {
  switch (state) {
    case "valid": return chip("ok", "已复核 · 有效");
    case "stale": return chip("warn", "复核已失效 · 需重新确认");
    case "unreviewed": return chip("warn", "未复核");
    default: return chip("queue", "仅指标体系");
  }
}

function judgmentChip(h: Blueprint["hypotheses"][number]): string {
  const base = h.verified ? chip("ok", `${h.judgment} · 已核验`) : chip("warn", `${h.judgment} · 未核验`);
  return base;
}

// ===== 01 体系总览 =====

export interface OverviewArgs {
  materialized: MaterializedInstance;
  instance: Instance;
  base: Template;
  review: ReturnType<typeof import("../engine/blueprint.js").blueprintReviewStatus>;
  designIssueCount: number;
  assistantNote?: string;
}

export function overviewPage(a: OverviewArgs): string {
  const bp = a.materialized.blueprint;
  const metricNames = new Set(a.materialized.metrics.map((m) => m.name));

  const assistant = `<aside class="assistant" aria-label="AI 助手">
    <div class="card-h">一起完善 <span class="mono" style="font-weight:400;color:var(--text-3);font-size:10px">AI 助手</span></div>
    <p style="color:var(--text-2);font-size:12.5px;margin-bottom:10px">围绕同一设计提出修改建议与影响；采纳才进入工作稿，放弃不改内容。</p>
    ${bp ? `<form action="/instance/blueprint/refine" method="post">
      <div class="fld"><label for="refine-instruction">用自然语言说说你想怎么改</label>
        <textarea id="refine-instruction" name="instruction" required placeholder="例如：这还涉及增长方向，帮我补上需要验证的假设。"></textarea></div>
      <button class="btn btn-primary" type="submit">先看建议</button>
      ${a.assistantNote ? `<p style="color:var(--text-3);font-size:11px;margin-top:6px">${escapeHtml(a.assistantNote)}</p>` : ""}
    </form>` : `<p style="color:var(--text-2);font-size:12.5px">建立分析体系草稿后，可在此用自然语言继续修正。</p>`}
  </aside>`;

  if (!bp) {
    return `<div class="overview-grid"><div>
      <div class="empty">
        <p style="font-size:15px;font-weight:600;margin-bottom:6px">当前工作区还没有分析体系</p>
        <p style="margin-bottom:4px">这是一份仅指标体系工作稿（${a.materialized.metrics.length} 个指标）。可以为它补充业务目的、问题结构、假设与证据计划，也可以保持仅指标交付。</p>
      </div>
      <div class="bp-section">
        <h3>用一句话开始（AI 起草）</h3>
        <form action="/instance/blueprint/generate" method="post">
          <div class="fld"><label for="bp-describe">你想弄清什么，或做出什么选择？</label>
            <textarea id="bp-describe" name="describe" required placeholder="例如：销售在增长，利润却下降。帮我设计一套分析方案，比较促销、商品结构与费用调整。"></textarea></div>
          <button class="btn btn-primary" type="submit">生成分析设计草稿</button>
          <p style="color:var(--text-3);font-size:11px;margin-top:6px">草稿带未决项，需你修正与复核；不编造业务事实。</p>
        </form>
      </div>
      <div class="bp-section">
        <h3>或手工建立</h3>
        <p style="color:var(--text-2);font-size:13px;margin-bottom:8px">直接填写目的、问题、假设与证据计划。</p>
        <a class="btn" href="/instance/blueprint/edit">手工建立分析体系</a>
      </div>
    </div>${assistant}</div>`;
  }

  const questions = bp.questions.map((q, i) => {
    const refs = q.metric_refs.map((r) =>
      metricNames.has(r)
        ? `<a class="metric-ref" href="/instance" title="查看指标定义">${escapeHtml(r)} ↗</a>`
        : `<span class="metric-ref" style="border-color:var(--fail-line);color:var(--fail)">${escapeHtml(r)}（缺失）</span>`
    ).join("");
    return `<div class="bp-item">
      <h4>${String(i + 1).padStart(2, "0")}　${escapeHtml(q.title)}</h4>
      ${q.detail ? `<p class="bp-detail">${escapeHtml(q.detail)}</p>` : ""}
      ${refs ? `<div style="margin-top:4px">${refs}</div>` : ""}
    </div>`;
  }).join("");

  const hypotheses = bp.hypotheses.map((h) => `<div class="bp-item">
    <h4>${escapeHtml(h.statement)} ${judgmentChip(h)}</h4>
    <dl class="kv2">
      <dt>支持证据</dt><dd>${escapeHtml(h.support) || '<span class="import-gap">待补充</span>'}</dd>
      <dt>反对证据</dt><dd>${escapeHtml(h.counter) || '<span class="import-gap">待补充</span>'}</dd>
      <dt>改变条件</dt><dd>${escapeHtml(h.change_condition) || '<span class="import-gap">待补充</span>'}</dd>
    </dl>
    <form action="/instance/blueprint/hypotheses/${escapeHtml(h.id)}/state" method="post" class="bp-meta" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px">
      <span class="mono">${escapeHtml(h.id)}</span>
      <label>判断性质 <select name="judgment" style="font:inherit">${JUDGMENTS.map((j) => `<option${h.judgment === j ? " selected" : ""}>${j}</option>`).join("")}</select></label>
      <label><input type="checkbox" name="verified" value="true"${h.verified ? " checked" : ""}> 证据已核验</label>
      <button class="btn" type="submit" style="font-size:11px;padding:2px 8px">更新判断状态</button>
    </form>
  </div>`).join("");

  const evidence = bp.evidence_plan.map((e) => `<div class="bp-item">
    <h4>${escapeHtml(e.name)} ${evidenceStatusChip(e.status)}</h4>
    <dl class="kv2">
      <dt>类型</dt><dd>${escapeHtml(e.kind)}</dd>
      <dt>来源</dt><dd>${escapeHtml(e.source) || '<span class="import-gap">待补充</span>'}</dd>
      <dt>核验办法</dt><dd>${escapeHtml(e.check) || '<span class="import-gap">待补充</span>'}</dd>
      <dt>不足处置</dt><dd>${escapeHtml(e.insufficiency) || '<span class="import-gap">待补充</span>'}</dd>
    </dl>
  </div>`).join("");

  const options = bp.options.map((o) => `<div class="bp-item">
    <h4>${escapeHtml(o.name)}</h4>
    <p class="bp-detail">${escapeHtml(o.tradeoff) || '<span class="import-gap">取舍待补充</span>'}</p>
  </div>`).join("");

  const pendingText = [
    bp.evidence_plan.filter((e) => e.status === "待获取" || e.status === "取得待核").length
  ][0];

  return `<div class="overview-grid"><div>
    <div class="bp-section">
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
        ${chip("accent", bp.intent)}
        ${bp.contexts.map((c) => chip("queue", c)).join("")}
        ${bp.organizations.map((o) => chip("queue", o)).join("")}
        ${reviewStateChip(a.review.state)}
        ${a.designIssueCount > 0 ? `<a class="chip chip-warn" href="/instance/delivery">${a.designIssueCount} 项设计缺口</a>` : chip("ok", "设计检查通过")}
      </div>
      <h3 style="font-size:17px;margin-bottom:6px">${escapeHtml(bp.title)}</h3>
      <p style="color:var(--text-2);margin-bottom:4px">${escapeHtml(bp.purpose)}</p>
      <p style="margin-bottom:10px;font-size:13px"><strong>研究问题或选择：</strong>${escapeHtml(bp.decision)}</p>
      <div class="bp-boundary"><strong>这份设计的边界</strong><br>${escapeHtml(bp.boundary)}</div>
      <p class="bp-meta">交付要求：${escapeHtml(bp.deliverable)}　·　出处 ${escapeHtml(bp.provenance.origin)}${bp.provenance.model ? ` · ${escapeHtml(bp.provenance.model)}` : ""}${bp.provenance.prompt_version ? ` · ${escapeHtml(bp.provenance.prompt_version)}` : ""}</p>
      <p class="btn-row" style="margin-top:10px"><a class="btn" href="/instance/blueprint/edit">修正我的理解</a></p>
    </div>

    <div class="bp-section"><h3>把问题拆成可以研究的部分 <span style="color:var(--text-3);font-weight:400;font-size:11px">${bp.questions.length} 个问题</span></h3>
      ${questions || '<p class="bp-detail">暂无问题结构。</p>'}
    </div>

    <div class="bp-section"><h3>关键假设 <span style="color:var(--text-3);font-weight:400;font-size:11px">${bp.hypotheses.length} 条 · 事实、解释、假设分别表达</span></h3>
      ${hypotheses || '<p class="bp-detail">暂无假设。</p>'}
    </div>

    <div class="bp-section"><h3>证据计划 <span style="color:var(--text-3);font-weight:400;font-size:11px">${bp.evidence_plan.length} 项 · ${pendingText} 项待获取</span></h3>
      ${evidence || '<p class="bp-detail">暂无证据计划。</p>'}
      <p class="bp-meta">证据计划完整不等于证据已取得；业务复核通过不等于结论成立。</p>
    </div>

    ${bp.options.length > 0 ? `<div class="bp-section"><h3>候选道路与取舍 <span style="color:var(--text-3);font-weight:400;font-size:11px">${bp.options.length} 条</span></h3>${options}</div>` : ""}
  </div>${assistant}</div>`;
}

// ===== 蓝图编辑（直接编辑；DSL 与场景表单同构）=====

export interface BlueprintFormValues {
  title: string;
  intent: string;
  purpose: string;
  decision: string;
  boundary: string;
  deliverable: string;
  contexts: string[];
  organizations: string[];
  questions: string;
  hypotheses: string;
  evidence_plan: string;
  options: string;
}

export function blueprintFormValues(bp: Blueprint | undefined): BlueprintFormValues {
  return {
    title: bp?.title ?? "",
    intent: bp?.intent ?? "设计具体分析方案",
    purpose: bp?.purpose ?? "",
    decision: bp?.decision ?? "",
    boundary: bp?.boundary ?? "",
    deliverable: bp?.deliverable ?? "",
    contexts: bp?.contexts ?? [],
    organizations: bp?.organizations ?? [],
    questions: questionsToDsl(bp?.questions ?? []),
    hypotheses: hypothesesToDsl(bp?.hypotheses ?? []),
    evidence_plan: evidenceToDsl(bp?.evidence_plan ?? []),
    options: optionsToDsl(bp?.options ?? [])
  };
}

function checkboxes(name: string, all: readonly string[], selected: string[]): string {
  return `<div class="radio-line">${all.map((c) =>
    `<label><input type="checkbox" name="${name}" value="${c}"${selected.includes(c) ? " checked" : ""}>${c}</label>`
  ).join("")}</div>`;
}

export function blueprintEditPage(values: BlueprintFormValues, hasBlueprint: boolean, errors?: string[]): string {
  const errorBlock = errors && errors.length > 0
    ? `<div class="card"><div class="card-h" style="color:var(--fail)">保存未通过（零写盘）</div>
       <ul class="error-list" role="alert">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></div>`
    : "";
  return `${errorBlock}
  <form action="/instance/blueprint" method="post">
    <div class="bp-section">
      <h3>业务需求理解</h3>
      <div class="fld"><label for="bp-title">体系名称（必填）</label>
        <input id="bp-title" name="title" type="text" required value="${escapeHtml(values.title)}"></div>
      <div class="fld"><label for="bp-intent">起点意图</label>
        <select id="bp-intent" name="intent">
          <option${values.intent === "设计具体分析方案" ? " selected" : ""}>设计具体分析方案</option>
          <option${values.intent === "建设可复用体系" ? " selected" : ""}>建设可复用体系</option>
        </select></div>
      <div class="fld"><label for="bp-purpose">业务目的（这份分析帮助做什么判断）</label>
        <textarea id="bp-purpose" name="purpose" style="font-family:var(--font);font-size:13px">${escapeHtml(values.purpose)}</textarea></div>
      <div class="fld"><label for="bp-decision">研究问题或选择（必填心智：要回答什么）</label>
        <textarea id="bp-decision" name="decision" style="font-family:var(--font);font-size:13px">${escapeHtml(values.decision)}</textarea></div>
      <div class="fld"><label for="bp-boundary">范围边界（不做什么；资源批准与行动执行归谁）</label>
        <textarea id="bp-boundary" name="boundary" style="font-family:var(--font);font-size:13px">${escapeHtml(values.boundary)}</textarea></div>
      <div class="fld"><label for="bp-deliverable">输出要求（交付什么）</label>
        <textarea id="bp-deliverable" name="deliverable" style="font-family:var(--font);font-size:13px">${escapeHtml(values.deliverable)}</textarea></div>
      <div class="fld"><label>适用语境（可组合，至少一项）</label>${checkboxes("contexts", CONTEXTS, values.contexts)}</div>
      <div class="fld"><label>调查组织方式（可组合，至少一项）</label>${checkboxes("organizations", ORGANIZATIONS, values.organizations)}</div>
    </div>

    <div class="bp-section">
      <h3>问题结构 <span style="color:var(--text-3);font-weight:400;font-size:11px">逐行 id|标题|说明|指标引用（逗号分隔）</span></h3>
      <div class="fld"><textarea name="questions" aria-label="问题结构" placeholder="q1|利润差距由哪些部分组成？|先复核口径，按毛利与费用分解。|profit,revenue">${escapeHtml(values.questions)}</textarea></div>
    </div>

    <div class="bp-section">
      <h3>关键假设 <span style="color:var(--text-3);font-weight:400;font-size:11px">逐行 id|假设陈述|支持证据|反对证据|改变判断的条件；判断性质与核验状态在总览视图维护</span></h3>
      <div class="fld"><textarea name="hypotheses" aria-label="关键假设" placeholder="h1|费用增加可能抵消了收入增长|费用明细证据|一次性投入可解释|核验不支持时保留其他解释">${escapeHtml(values.hypotheses)}</textarea></div>
    </div>

    <div class="bp-section">
      <h3>证据计划 <span style="color:var(--text-3);font-weight:400;font-size:11px">逐行 id|名称|类型|来源|核验办法|不足处置|状态（可省，默认 待获取）</span></h3>
      <div class="fld"><textarea name="evidence_plan" aria-label="证据计划" placeholder="e1|收入成本费用明细|内部数据|同范围同期间记录|复核范围与计算关系|缺失时不输出仿成功结论|待获取">${escapeHtml(values.evidence_plan)}</textarea></div>
    </div>

    <div class="bp-section">
      <h3>候选道路 <span style="color:var(--text-3);font-weight:400;font-size:11px">逐行 id|候选道路|取舍；战略选择类建议至少两条</span></h3>
      <div class="fld"><textarea name="options" aria-label="候选道路" placeholder="expand|选择性继续扩店|投入新店、占用资本；需证明店型价值可复制">${escapeHtml(values.options)}</textarea></div>
    </div>

    <div class="btn-row">
      <button class="btn btn-primary" type="submit">保存设计要素</button>
      <a class="btn" href="/instance/overview">取消</a>
    </div>
    <p style="color:var(--text-3);font-size:11px;margin-top:8px">保存即更新同一工作稿；${hasBlueprint ? "相关修改会使已完成的业务复核失效（需重新确认）；" : ""}保存前经全量校验，失败零写盘。</p>
  </form>`;
}

// ===== 03 场景与方法 =====

export function methodsLibrarySection(methods: MethodTemplate[]): string {
  if (methods.length === 0) {
    return `<div class="bp-section"><h3>分析方法库</h3><p class="bp-detail">方法模板目录为空（templates/methods/）。方法模板记录适用语境、输入角色、步骤、证据与限制。</p></div>`;
  }
  const cards = methods.map((m) => `<div class="method-card">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <div>
        <h4 style="font-size:14px">${escapeHtml(m.method.name)}</h4>
        <p class="bp-meta"><span class="mono">${escapeHtml(m.method.id)}@${escapeHtml(m.method.version)}</span> · ${escapeHtml(m.family)}</p>
      </div>
      <span>${m.contexts.map((c) => chip("queue", c)).join("")}</span>
    </div>
    <p class="bp-detail" style="margin-top:6px">${escapeHtml(m.method.description)}</p>
    <p style="margin-top:6px">${m.roles.length > 0
      ? m.roles.map((r) => `<span class="role-chip${r.required ? " required" : ""}">${escapeHtml(r.name)}${r.required ? " · 必需" : ""}</span>`).join("")
      : '<span class="bp-meta">定性方法 · 无必需量化角色</span>'}</p>
    <p class="btn-row" style="margin-top:8px"><a class="btn" href="/templates/methods/${escapeHtml(m.method.id)}">查看步骤、证据与限制</a></p>
  </div>`).join("");
  return `<div class="bp-section"><h3>分析方法库 <span style="color:var(--text-3);font-weight:400;font-size:11px">${methods.length} 个方法 · 引用不实现 · 语境不匹配会阻断交付</span></h3>${cards}</div>`;
}

export function methodDetailPage(m: MethodTemplate): string {
  return `<div class="method-card">
    <h4 style="font-size:16px">${escapeHtml(m.method.name)}</h4>
    <p class="bp-meta"><span class="mono">${escapeHtml(m.method.id)}@${escapeHtml(m.method.version)}</span> · ${escapeHtml(m.family)} · 适用：${m.contexts.join("、")}</p>
    <p class="bp-detail" style="margin-top:8px">${escapeHtml(m.method.description)}</p>
    <dl class="kv2" style="margin-top:10px">
      <dt>服务的判断</dt><dd>${escapeHtml(m.purpose)}</dd>
      <dt>输入角色</dt><dd>${m.roles.length > 0 ? m.roles.map((r) => `${escapeHtml(r.name)}（${r.id}${r.required ? "，必需" : "，可选"}）`).join("；") : "无量化角色（定性方法）"}</dd>
      <dt>证据要求</dt><dd>${escapeHtml(m.evidence)}</dd>
      <dt>限制</dt><dd>${escapeHtml(m.limits)}</dd>
      <dt>出处</dt><dd>${escapeHtml(m.method.references.join("；") || "（未标注）")}</dd>
    </dl>
    <div class="bp-section" style="margin-top:10px"><h3>步骤</h3>
      ${m.steps.map((s, i) => `<div class="bp-item"><h4>${i + 1}. ${escapeHtml(s.title)}</h4>${s.detail ? `<p class="bp-detail">${escapeHtml(s.detail)}</p>` : ""}</div>`).join("")}
    </div>
  </div>
  <p class="page-desc">在场景表单的方法绑定（method_bindings）中按 <span class="mono">方法id@版本|角色|指标</span> 绑定到当前体系指标；缺必需角色或语境不匹配将阻断设计交付。</p>`;
}

// ===== 04 检查与交付 =====

export interface DeliveryArgs {
  review: DesignReview;
  materialized: MaterializedInstance;
  instance: Instance;
  metricCount: number;
  extraSections: string;
}

function issueRows(issues: ValidateIssue[]): string {
  return issues.map((i) => `<div class="check-row"><span class="check-ico check-bad">✗</span><span><strong>[${escapeHtml(i.rule)}]</strong> ${escapeHtml(i.message)} <span class="mono" style="color:var(--text-3);font-size:11px">${escapeHtml(i.path)}</span></span></div>`).join("");
}

export function deliveryPage(a: DeliveryArgs): string {
  const r = a.review;
  const okRow = (text: string) => `<div class="check-row"><span class="check-ico check-ok">✓</span><span>${escapeHtml(text)}</span></div>`;

  const designBlock = r.hasBlueprint
    ? `<div class="bp-section"><h3>设计检查（蓝图）</h3>
        ${r.designIssues.length === 0 ? okRow("目的与问题、假设检验条件、证据来源／核验／不足处置、方法适用性与必需角色：均通过") : issueRows(r.designIssues)}
      </div>`
    : `<div class="bp-section"><h3>设计检查</h3>${okRow("仅指标体系模式：无分析体系蓝图；指标与场景规则照常检查")}</div>`;

  const metricBlock = `<div class="bp-section"><h3>指标与引用检查</h3>
    ${r.metricIssues.length === 0 ? okRow(`指标定义、依赖与引用完整（${a.metricCount} 个指标）`) : issueRows(r.metricIssues)}
  </div>`;

  const evidenceBlock = r.evidenceSummary
    ? `<div class="bp-section"><h3>证据状态（设计声明，非执行结果）</h3>
      <p style="font-size:13px">证据计划 ${r.evidenceSummary.total} 项：已核验 ${r.evidenceSummary.verified} · 待获取/待核 ${r.evidenceSummary.pending} · 其余 ${r.evidenceSummary.total - r.evidenceSummary.verified - r.evidenceSummary.pending}。</p>
      <p class="bp-meta">证据计划完整可以交付给后续分析，仍标明实际证据待获取；复核通过不代表结论成立、因果成立或经营效果得到验证。</p>
    </div>`
    : "";

  const reviewBlock = r.hasBlueprint
    ? `<div class="bp-section"><h3>业务复核</h3>
      <p style="margin-bottom:8px">${reviewStateChip(r.review.state)}${r.review.confirmed_by ? ` <span class="bp-meta">${escapeHtml(r.review.confirmed_by)} · ${escapeHtml(r.review.confirmed_at ?? "")}</span>` : ""}</p>
      ${r.review.state === "stale" ? '<p class="bp-detail" style="color:var(--warn)">设计在复核后被修改，确认已失效。请重新复核后再交付。</p>' : ""}
      ${r.designIssues.length === 0
        ? `<form action="/instance/review/confirm" method="post" class="btn-row">
            <input type="text" name="confirmed_by" required placeholder="复核人（如 业务负责人-王磊）" style="border:1px solid var(--border);border-radius:8px;padding:6px 8px;font:inherit;width:220px">
            <button class="btn btn-primary" type="submit">确认业务复核</button>
          </form>`
        : '<p class="bp-detail">请先处理上方设计缺口，再进行业务复核。</p>'}
      <p class="bp-meta" style="margin-top:8px">复核绑定当前完整设计快照（内容指纹）；任何相关修改都会使确认失效；查看和切换视图不改变确认。</p>
    </div>`
    : "";

  const deliveryHint = r.hasBlueprint
    ? r.ready
      ? '<p style="color:var(--ok);font-size:13px;margin-bottom:10px">设计就绪：缺口为零且业务复核有效，可以固定设计版本。</p>'
      : '<p style="color:var(--warn);font-size:13px;margin-bottom:10px">设计未就绪：处理阻断项并完成业务复核后才能固定设计版本。</p>'
    : '<p style="color:var(--text-2);font-size:13px;margin-bottom:10px">仅指标体系交付：审核与导出门照旧；不强制分析体系。</p>';

  return `${designBlock}${metricBlock}${evidenceBlock}${reviewBlock}
    <div class="bp-section"><h3>交付</h3>${deliveryHint}</div>${a.extraSections}`;
}

// ===== 指标删除影响页（D8）=====

export function metricDeleteImpactPage(name: string, refs: MetricReference[]): string {
  const refList = refs.map((r) => `<div class="check-row"><span class="check-ico check-bad">●</span><span><strong>${escapeHtml(r.kind)}</strong>　${escapeHtml(r.where)}</span></div>`).join("");
  return `<div class="bp-section">
    <h3>删除指标「${escapeHtml(name)}」前的影响确认</h3>
    ${refs.length > 0
      ? `<p class="bp-detail" style="color:var(--fail);margin-bottom:8px">该指标仍被 ${refs.length} 处引用，不能删除（禁止悬空引用后假通过）。请先在以下位置解除引用：</p>${refList}
         <p class="btn-row" style="margin-top:10px"><a class="btn" href="/instance">返回指标体系</a></p>`
      : `<p class="bp-detail" style="margin-bottom:8px">未发现任何计算、树、问题、场景或方法绑定引用该指标，可以安全删除。</p>
         <form action="/instance/metrics/${escapeHtml(name)}/delete" method="post" class="btn-row">
           <button class="btn btn-danger" type="submit">确认删除 ${escapeHtml(name)}</button>
           <a class="btn" href="/instance">取消</a>
         </form>`}
  </div>`;
}

// ===== 导出区块（自实例页迁入「04 检查与交付」；与 CLI export 同语义）=====

export function exportBlock(): string {
  return `<div class="bp-section"><h3>导出与下载</h3>
    <p class="bp-detail" style="margin-bottom:8px">四格式与 CLI export 同语义：数仓映射自动发现 + 全量校验 + LLM 未审核硬阻断（fail-closed）。</p>
    <p class="btn-row">
      <a class="btn btn-primary" href="/instance/export/metricflow">导出 MetricFlow YAML</a>
      <a class="btn" href="/instance/export/excel">导出 Excel 字典</a>
      <a class="btn" href="/instance/export/mermaid">导出 Mermaid 指标树</a>
      <a class="btn" href="/instance/export/sap" aria-describedby="sap-export-note">导出 SAP 语义包</a>
    </p>
    <p id="sap-export-note" class="bp-meta">SAP 语义包：JuanerAI 语义资产包（YAML，含指纹与出处）</p>
  </div>`;
}

// ===== 蓝图草案预览（建议与影响；采纳才进工作稿）=====

export function blueprintDraftPreviewPage(draft: Draft, opts: { create: boolean }): string {
  const bp = draft.blueprint;
  if (!bp) return `<div class="card"><p>该草案不含分析体系内容。</p></div>`;
  const sec = (label: string, body: string) => `<div class="bp-section"><h3>${label}</h3>${body}</div>`;
  return `
  <div class="card" style="border-color:var(--accent-line);background:var(--accent-soft)">
    <div class="card-h">AI 建议 · 先看影响再决定</div>
    <p style="font-size:13px">出处 ${escapeHtml(draft.generator.model)} · ${escapeHtml(draft.generator.prompt_version)} · ${escapeHtml(draft.generator.created_at)}。采纳才更新同一工作稿；放弃不改任何内容。LLM 内容未经复核不可交付。</p>
  </div>
  ${sec("理解", `<h4 style="font-size:16px;margin-bottom:6px">${escapeHtml(bp.title)}</h4>
    <p style="margin-bottom:6px">${chip("accent", bp.intent)} ${bp.contexts.map((c) => chip("queue", c)).join("")} ${bp.organizations.map((o) => chip("queue", o)).join("")}</p>
    <dl class="kv2">
      <dt>业务目的</dt><dd>${escapeHtml(bp.purpose)}</dd>
      <dt>研究问题</dt><dd>${escapeHtml(bp.decision)}</dd>
      <dt>范围边界</dt><dd>${escapeHtml(bp.boundary)}</dd>
      <dt>输出要求</dt><dd>${escapeHtml(bp.deliverable)}</dd>
    </dl>`)}
  ${sec(`问题结构（${bp.questions.length}）`, bp.questions.map((q) =>
    `<div class="bp-item"><h4>${escapeHtml(q.title)}</h4><p class="bp-detail">${escapeHtml(q.detail)}</p>${q.metric_refs.length ? `<p class="bp-meta">引用指标：${q.metric_refs.map(escapeHtml).join("、")}</p>` : ""}</div>`).join("") || "<p class='bp-detail'>无</p>")}
  ${sec(`关键假设（${bp.hypotheses.length}）`, bp.hypotheses.map((h) =>
    `<div class="bp-item"><h4>${escapeHtml(h.statement)}</h4><dl class="kv2"><dt>支持</dt><dd>${escapeHtml(h.support)}</dd><dt>反对</dt><dd>${escapeHtml(h.counter)}</dd><dt>改变条件</dt><dd>${escapeHtml(h.change_condition)}</dd></dl></div>`).join("") || "<p class='bp-detail'>无</p>")}
  ${sec(`证据计划（${bp.evidence_plan.length}）`, bp.evidence_plan.map((e) =>
    `<div class="bp-item"><h4>${escapeHtml(e.name)} ${chip("queue", e.kind)}</h4><dl class="kv2"><dt>来源</dt><dd>${escapeHtml(e.source)}</dd><dt>核验</dt><dd>${escapeHtml(e.check)}</dd><dt>不足处置</dt><dd>${escapeHtml(e.insufficiency)}</dd></dl></div>`).join("") || "<p class='bp-detail'>无</p>")}
  ${bp.options.length > 0 ? sec(`候选道路（${bp.options.length}）`, bp.options.map((o) =>
    `<div class="bp-item"><h4>${escapeHtml(o.name)}</h4><p class="bp-detail">${escapeHtml(o.tradeoff)}</p></div>`).join("")) : ""}
  ${sec(`建议指标（${draft.added.length}）`, draft.added.length === 0
    ? '<p class="bp-detail">零指标定性设计——不为填满指标表编造量化定义；需要量化时可在当前体系补充。</p>'
    : `<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><thead><tr><th>指标名</th><th>展示名</th><th>类型</th><th>口径</th><th>归口</th></tr></thead><tbody>${draft.added.map((m) => `<tr><td class="mono">${escapeHtml(m.name)}</td><td>${escapeHtml(m.display_name)}</td><td>${chip("accent", m.type)}</td><td>${escapeHtml(m.definition)}</td><td>${escapeHtml(m.owner_role)}</td></tr>`).join("")}</tbody></table></div>`)}
  ${sec(`建议场景（${draft.added_scenarios.length}）`, draft.added_scenarios.map((s) =>
    `<div class="bp-item"><h4>${escapeHtml(s.title)}</h4><p class="bp-detail">${escapeHtml(s.decision_purpose)}</p><p class="bp-meta">方法引用：${s.method_refs.join("、") || "无"}</p></div>`).join("") || "<p class='bp-detail'>无</p>")}
  <div class="btn-row">
    <form action="${opts.create ? "/blueprint/apply-create" : "/instance/blueprint/apply"}" method="post">
      ${opts.create ? '<div class="fld"><label for="ws-name">工作区目录名（小写字母/数字/连字符）</label><input id="ws-name" name="name" type="text" required pattern="[a-z0-9-]+" placeholder="my-analysis"></div>' : ""}
      <button class="btn btn-primary" type="submit">采纳并${opts.create ? "创建工作稿" : "更新工作稿"}</button>
    </form>
    <form action="${opts.create ? "/blueprint/discard-create" : "/instance/blueprint/discard"}" method="post">
      <button class="btn" type="submit">放弃（不改工作稿）</button>
    </form>
  </div>`;
}

// ===== 场景另存为方法模板（T10：场景 → 方法库的沉淀通道；写 templates/methods/<id>.yaml）=====

const ROLE_NAMES: Record<string, string> = { outcome: "结果指标", driver: "驱动指标", guardrail: "护栏指标" };

export interface SaveAsMethodValues {
  id: string;
  name: string;
  family: string;
  purpose: string;
  description: string;
  contexts: string[];
  steps: string; // 逐行 标题|说明
  evidence: string;
  limits: string;
  references: string; // 逐行一条出处
}

export function saveAsMethodValues(s: Scenario, defaultContexts: readonly string[]): SaveAsMethodValues {
  return {
    id: "",
    name: s.title,
    family: "",
    purpose: s.decision_purpose,
    description: s.decision_purpose,
    contexts: [...defaultContexts],
    steps: s.question_tree.map((n) => `${n.label}|${n.metric ? `指标 ${n.metric}` : ""}`).join("\n"),
    evidence: s.evidence_requirements,
    limits: s.review_rules,
    references: ""
  };
}

export function saveAsMethodPage(s: Scenario, values: SaveAsMethodValues, errors?: string[]): string {
  const roles = [...new Set(s.metric_usages.map((u) => u.role))];
  const errorBlock = errors && errors.length > 0
    ? `<div class="card"><div class="card-h" style="color:var(--fail)">保存未通过（零写盘）</div>
       <ul class="error-list" role="alert">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></div>`
    : "";
  return `${errorBlock}
  <form action="/instance/scenarios/${escapeHtml(s.id)}/save-as-method" method="post">
    <div class="bp-section">
      <h3>把场景「${escapeHtml(s.title)}」沉淀为方法模板</h3>
      <p class="bp-detail" style="margin-bottom:10px">方法模板记录可复用的分析套路：适用语境、输入角色、步骤、证据要求与限制。保存后写入 <span class="mono">templates/methods/&lt;id&gt;.yaml</span>，供任意体系经方法绑定引用（引用不实现）。</p>
      <div class="fld"><label for="sm-id">方法 id（小写 kebab-case，保存后不可修改）</label>
        <input id="sm-id" name="id" type="text" required pattern="[a-z0-9-]+" value="${escapeHtml(values.id)}" placeholder="profit-change-diagnosis"></div>
      <div class="fld"><label for="sm-name">方法名称（必填）</label>
        <input id="sm-name" name="name" type="text" required value="${escapeHtml(values.name)}"></div>
      <div class="fld"><label for="sm-family">专业方法族（必填，如 描述分解 · 方案比较）</label>
        <input id="sm-family" name="family" type="text" required value="${escapeHtml(values.family)}" placeholder="描述分解 · 方案比较"></div>
      <div class="fld"><label for="sm-purpose">服务的判断（purpose，必填）</label>
        <textarea id="sm-purpose" name="purpose" required>${escapeHtml(values.purpose)}</textarea></div>
      <div class="fld"><label for="sm-description">方法描述（description，必填）</label>
        <textarea id="sm-description" name="description" required>${escapeHtml(values.description)}</textarea></div>
      <div class="fld"><label>适用语境（至少一项）</label>${checkboxes("contexts", CONTEXTS, values.contexts)}</div>
    </div>
    <div class="bp-section">
      <h3>角色与步骤</h3>
      <p class="bp-detail">输入角色从场景指标角色派生（固定映射：${roles.length > 0 ? roles.map((r) => `${escapeHtml(r)} → ${ROLE_NAMES[r] ?? r}`).join("，") : "场景无指标角色 → 定性方法，无角色"}）；outcome 与 driver 为必需角色，guardrail 可选。</p>
      <div class="fld"><label for="sm-steps">步骤（逐行 标题|说明，至少一行）</label>
        <textarea id="sm-steps" name="steps" required placeholder="核对口径|确认同范围同期间">${escapeHtml(values.steps)}</textarea></div>
      <div class="fld"><label for="sm-evidence">证据要求（evidence，必填）</label>
        <textarea id="sm-evidence" name="evidence" required>${escapeHtml(values.evidence)}</textarea></div>
      <div class="fld"><label for="sm-limits">限制（limits，必填——方法不能证明什么）</label>
        <textarea id="sm-limits" name="limits" required>${escapeHtml(values.limits)}</textarea></div>
      <div class="fld"><label for="sm-references">方法论出处（逐行一条，至少一条；不得搬运付费内容）</label>
        <textarea id="sm-references" name="references" required placeholder="公开管理会计实务">${escapeHtml(values.references)}</textarea></div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" type="submit">保存为方法模板</button>
      <a class="btn" href="/instance/scenarios">取消</a>
    </div>
    <p style="color:var(--text-3);font-size:11px;margin-top:8px">版本固定 0.1.0；id 与既有方法重复即拒绝（零写盘）。</p>
  </form>`;
}

// ===== 粘贴导入（次要起点：外部 YAML 粘贴 → 解析预览 → 存为模板）=====

export type ImportKind = "method" | "metric";

export function importFormPage(values?: { kind?: ImportKind; source?: string }, errors?: string[]): string {
  const kind = values?.kind ?? "method";
  const errorBlock = errors && errors.length > 0
    ? `<div class="card"><div class="card-h" style="color:var(--fail)">解析未通过（零写盘）</div>
       <ul class="error-list" role="alert">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></div>`
    : "";
  return `${errorBlock}
  <form action="/import/preview" method="post">
    <div class="bp-section">
      <h3>粘贴外部模板 YAML</h3>
      <p class="bp-detail" style="margin-bottom:10px">把别处整理的分析方法或指标体系模板粘贴到这里：先解析预览（缺口如实标注），确认后才落盘为模板文件。不猜不补：缺必需字段即拒绝。</p>
      <div class="fld"><label>模板类型</label>
        <div class="radio-line">
          <label><input type="radio" name="kind" value="method"${kind === "method" ? " checked" : ""}>分析方法模板（存 templates/methods/）</label>
          <label><input type="radio" name="kind" value="metric"${kind === "metric" ? " checked" : ""}>指标体系模板（存 templates/）</label>
        </div></div>
      <div class="fld"><label for="imp-source">模板 YAML（必填）</label>
        <textarea id="imp-source" name="source" required rows="16" style="font-family:var(--mono);font-size:12px" placeholder="method:\n  id: ...">${escapeHtml(values?.source ?? "")}</textarea></div>
      <button class="btn btn-primary" type="submit">解析并预览</button>
    </div>
  </form>`;
}

export interface ImportPreviewArgs {
  kind: ImportKind;
  source: string;
  title: string; // 模板名（方法 name 或行业）
  targetFile: string; // 相对路径 templates/methods/<id>.yaml
  summary: [string, string][]; // 预览键值对
  gaps: string[]; // 缺口提示（如实标注，不代填）
}

export function importPreviewPage(a: ImportPreviewArgs): string {
  const rows = a.summary.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("");
  return `<div class="bp-section">
    <h3>导入预览 · ${escapeHtml(a.title)}</h3>
    <dl class="kv2">${rows}<dt>落盘位置</dt><dd class="mono">${escapeHtml(a.targetFile)}</dd></dl>
    ${a.gaps.length > 0
      ? `<p class="bp-detail" style="margin-top:8px">缺口（保存后可再补，不代为编造）：</p>
         <ul class="error-list" style="margin-top:4px">${a.gaps.map((g) => `<li><span class="import-gap">${escapeHtml(g)}</span></li>`).join("")}</ul>`
      : '<p class="bp-detail" style="margin-top:8px">未发现缺口。</p>'}
  </div>
  <div class="btn-row">
    <form action="/import/save" method="post">
      <input type="hidden" name="kind" value="${a.kind}">
      <input type="hidden" name="source" value="${escapeHtml(a.source)}">
      <button class="btn btn-primary" type="submit">确认保存为模板</button>
    </form>
    <form action="/import" method="post">
      <input type="hidden" name="kind" value="${a.kind}">
      <input type="hidden" name="source" value="${escapeHtml(a.source)}">
      <button class="btn" type="submit">返回修改</button>
    </form>
  </div>`;
}
