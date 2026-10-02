import { escapeHtml, chip } from "./render.js";
import type { LlmStatus } from "./render-settings.js";
import type { Draft } from "../schema/draft.js";

// AI 草案工坊：模型状态 + 生成/微调两个表单 + 待采纳草案预览（UI-11 草案卡范式）
// 采纳/丢弃动作在 server 端走 applyDraft 引擎校验，失败零写盘。

export interface DraftLoad {
  ok: true;
  draft: Draft;
}

export interface DraftLoadError {
  ok: false;
  error: string;
}

function draftMetricCard(m: Draft["added"][number]): string {
  return `<article class="draft-card">
    <div class="draft-heading">
      <div>
        <p class="eyebrow">CANDIDATE METRIC DRAFT</p>
        <h3>${escapeHtml(m.display_name)} <span class="mono" style="font-size:11px;color:var(--text-2)">${escapeHtml(m.name)}</span></h3>
        <p class="draft-src">来源：${escapeHtml(m.provenance.origin)}（${escapeHtml(m.provenance.model ?? "")} · prompt ${escapeHtml(m.provenance.prompt_version ?? "")}）</p>
      </div>
      <span class="state-badge amber">待采纳 · 无业务写入</span>
    </div>
    <div class="draft-grid">
      <div class="draft-section">
        <h4>指标定义</h4>
        <dl class="kv">
          <div><dt>类型</dt><dd>${escapeHtml(m.type)}</dd></div>
          <div><dt>口径</dt><dd>${escapeHtml(m.definition)}</dd></div>
          <div><dt>维度</dt><dd>${m.dimensions.length ? escapeHtml(m.dimensions.join("、")) : "（未登记）"}</dd></div>
          <div><dt>归口角色</dt><dd>${escapeHtml(m.owner_role)}</dd></div>
        </dl>
      </div>
      <div class="draft-section">
        <h4>采纳后</h4>
        <dl class="kv">
          <div><dt>合入</dt><dd>实例 added 段（自动带待审标记）</dd></div>
          <div><dt>审核</dt><dd>审核中心批准后才可导出（fail-closed）</dd></div>
        </dl>
      </div>
    </div>
  </article>`;
}

export function draftsPage(args: {
  hasInstance: boolean;
  llm: LlmStatus;
  pending: DraftLoad | DraftLoadError | null;
  errors?: string[];
  values?: { describe?: string; instruction?: string };
}): string {
  if (!args.hasInstance) {
    return `<div class="empty">AI 草案基于当前实例生成<br><span style="font-size:12px">先创建或打开一个实例，再回到这里</span><br><a class="btn" href="/init">创建实例</a>&nbsp;<a class="btn" href="/">打开已有实例</a></div>`;
  }

  const errorsHtml = args.errors?.length
    ? `<ul class="error-list">${args.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : "";

  const llmReady = args.llm.mode === "configured" || args.llm.mode === "faux";
  const llmCard = `<div class="card">
    <div class="card-h">AI 模型</div>
    ${
      llmReady
        ? `<p>${args.llm.mode === "faux" ? chip("accent", "演示模式（faux）") : chip("ok", `已连接 ${args.llm.model ?? ""}`)}</p>`
        : `<p>${chip("warn", "未配置")} AI 草案需要先配置模型。<a href="/settings">去设置</a>（不配置也可用模板微调与导出）</p>`
    }
  </div>`;

  const forms = llmReady
    ? `${errorsHtml}
    <form action="/drafts/generate" method="post">
      <div class="card">
        <div class="card-h">生成候选指标</div>
        <p style="color:var(--text-2);font-size:12px;margin-bottom:8px">描述你的业务特点，AI 基于当前实例与行业模板出候选指标草案（模板锚定，不会大而全）。</p>
        <div class="fld"><label>业务描述</label>
          <textarea name="describe" placeholder="例：我们是跨境电商，主打低价秒杀，用户价格敏感、决策快，退货率是核心风险…">${escapeHtml(args.values?.describe ?? "")}</textarea></div>
        <button class="btn btn-primary" type="submit">生成草案</button>
      </div>
    </form>
    <form action="/drafts/refine" method="post">
      <div class="card">
        <div class="card-h">自然语言微调</div>
        <p style="color:var(--text-2);font-size:12px;margin-bottom:8px">用一句话改现有实例：改口径、删指标、加口径开关，AI 出变更草案。</p>
        <div class="fld"><label>调整指令</label>
          <textarea name="instruction" placeholder="例：GMV 口径改为含退款；删掉 NPS；客单价默认剔除运费">${escapeHtml(args.values?.instruction ?? "")}</textarea></div>
        <button class="btn" type="submit">生成微调草案</button>
      </div>
    </form>
    <p class="composer-note">每次生成会替换当前待采纳草案；采纳前不写入实例。</p>`
    : "";

  let pendingHtml = "";
  if (args.pending?.ok) {
    const d = args.pending.draft;
    const cards = d.added.map(draftMetricCard).join("");
    const others = [
      d.modified.length
        ? `<div class="fld"><label>修改（${d.modified.length}）</label><ul style="margin-left:16px">${d.modified.map((m) => `<li><span class="mono">${escapeHtml(m.name)}</span>（${Object.keys(m).filter((k) => k !== "name").join("、") || "无字段变化"}）</li>`).join("")}</ul></div>`
        : "",
      d.removed.length
        ? `<div class="fld"><label>删除（${d.removed.length}）</label><p class="mono">${escapeHtml(d.removed.join("、"))}</p></div>`
        : "",
      Object.keys(d.caliber).length
        ? `<div class="fld"><label>口径开关（${Object.keys(d.caliber).length} 个指标）</label><p class="mono" style="font-size:11.5px">${escapeHtml(Object.entries(d.caliber).map(([m, ks]) => `${m}: ${Object.entries(ks).map(([k, v]) => `${k}=${v}`).join(", ")}`).join("；"))}</p></div>`
        : ""
    ].join("");
    pendingHtml = `<div class="view-title">待采纳草案（${d.generator.model} · ${escapeHtml(d.generator.describe.slice(0, 60))}${d.generator.describe.length > 60 ? "…" : ""}）</div>
      ${cards}
      ${others ? `<div class="card">${others}</div>` : ""}
      <div class="btn-row" style="margin-bottom:16px">
        <form action="/drafts/apply" method="post" style="margin:0"><button class="btn btn-primary" type="submit">采纳并合入实例（去审核）</button></form>
        <form action="/drafts/discard" method="post" style="margin:0"><button class="btn btn-danger" type="submit">丢弃草案</button></form>
      </div>`;
  } else if (args.pending && !args.pending.ok) {
    pendingHtml = `<div class="card"><div class="card-h" style="color:var(--fail)">待采纳草案文件损坏</div>
      <ul class="error-list"><li>${escapeHtml(args.pending.error)}</li></ul>
      <form action="/drafts/discard" method="post"><button class="btn btn-danger" type="submit">删除损坏的草案文件</button></form></div>`;
  }

  return `${llmCard}${forms}${pendingHtml}`;
}

export function jobRunningPage(kind: "generate" | "refine"): string {
  const label = kind === "generate" ? "生成候选指标" : "生成微调草案";
  return `<div class="card" style="text-align:center;padding:36px">
    <p><span class="pulse-dot"></span>AI 正在${escapeHtml(label)}…</p>
    <p style="color:var(--text-2);margin-top:8px">通常 10–60 秒；本页每 2 秒自动刷新，完成后自动跳转。</p>
    <p style="margin-top:14px"><a href="/drafts">返回草案工坊（不取消任务）</a></p>
  </div>`;
}

export function jobErrorPage(kind: "generate" | "refine", error: string, issues: string[] = []): string {
  return `<div class="card">
    <div class="card-h" style="color:var(--fail)">AI 草案生成失败</div>
    <ul class="error-list">${[`<li>${escapeHtml(error)}</li>`, ...issues.map((i) => `<li>${escapeHtml(i)}</li>`)].join("")}</ul>
    <p class="btn-row"><a class="btn" href="/drafts">返回重试</a> <a class="btn" href="/settings">检查模型设置</a></p>
  </div>`;
}
