import { escapeHtml, chip } from "./render.js";
import type { LlmStatus } from "./render-settings.js";

export interface HomeInstanceInfo {
  path: string;
  base: string | undefined;
  metricCount: number;
  pendingCount: number;
  changes: number;
}

const FLOW: { no: string; title: string; desc: string; href: string }[] = [
  { no: "1", title: "模板向导", desc: "回答三个问题，匹配行业模板生成指标体系实例", href: "/init" },
  { no: "2", title: "模板库", desc: "浏览行业指标模板与分析方法模板，fork 即微调", href: "/templates" },
  { no: "3", title: "粘贴导入", desc: "把外部整理好的方法/指标模板 YAML 粘贴入库", href: "/import" },
  { no: "4", title: "AI 草案", desc: "基于已有实例做指标增补草案，你决定采纳与否", href: "/drafts" }
];

export function homePage(args: {
  templateCount: number;
  current: HomeInstanceInfo | null;
  discovered: { path: string; base: string | undefined }[];
  llm: LlmStatus;
  hasPendingDraft: boolean;
}): string {
  // A1 主入口：自然语言 → AI 起草分析体系（空白基座工作稿）；模板/导入为次要起点
  const nlCard = `<div class="card" style="border-color:var(--accent-line);background:var(--accent-soft)">
    <div class="card-h">用一句话开始 <span class="mono" style="font-weight:400;color:var(--text-3);font-size:10px">推荐起点 · AI 起草</span></div>
    <form action="/blueprint/generate" method="post">
      <div class="fld"><label for="nl-describe">你想弄清什么，或做出什么选择？</label>
        <textarea id="nl-describe" name="describe" required placeholder="例如：销售在增长，利润却下降。帮我设计一套分析方案，比较促销、商品结构与费用调整。"></textarea></div>
      <button class="btn btn-primary" type="submit">生成分析设计草稿</button>
      <p style="color:var(--text-2);font-size:12px;margin-top:6px">AI 起草分析体系：业务目的、问题结构、关键假设、证据计划、候选道路与建议指标。草稿带未决项，采纳前可放弃；不编造业务事实，结论需你复核。</p>
    </form>
  </div>`;

  const flow = `<p style="color:var(--text-3);font-size:12px;margin:14px 0 8px">或从模板与导入开始（次要起点）</p><div class="flow-grid">${FLOW.map(
    (s) => `<div class="flow-step"><span class="step-no">${s.no}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.desc)}</p>
      <p style="margin-top:6px"><a href="${s.href}">前往 →</a></p></div>`
  ).join("")}</div>`;

  const currentCard = args.current
    ? `<div class="card">
      <div class="card-h">当前实例 ${args.current.pendingCount > 0 ? chip("warn", `待审核 ${args.current.pendingCount}`) : chip("ok", "无待审")}${args.hasPendingDraft ? chip("queue", "有待采纳草案") : ""}</div>
      <p><span class="mono">${escapeHtml(args.current.path)}</span> · 基模板 <span class="mono">${escapeHtml(args.current.base ?? "（空白起点）")}</span></p>
      <p style="margin-top:4px">有效指标 <span class="num">${args.current.metricCount}</span> 个 · 相对模板变更 <span class="num">${args.current.changes}</span> 处</p>
      <p style="margin-top:8px" class="btn-row"><a class="btn" href="/instance/overview">进入体系总览</a><a class="btn" href="/review">审核中心</a></p>
    </div>`
    : `<div class="card">
      <div class="card-h">还没有实例</div>
      <p style="color:var(--text-2)">回答三个问题，一分钟生成你的第一份指标体系；或从下方打开已有实例。</p>
      <p style="margin-top:8px"><a class="btn btn-primary" href="/init">开始问卷向导</a> <a class="btn" href="/templates">先逛模板库（${args.templateCount} 个行业）</a></p>
    </div>`;

  const others = args.discovered.filter((d) => d.path !== args.current?.path);
  const openCard = `<div class="card">
    <div class="card-h">打开已有实例</div>
    ${
      others.length === 0
        ? `<p style="color:var(--text-3)">工作区暂未发现其他实例（扫描工作区一层目录与 examples）。</p>`
        : `<form action="/instance/open" method="post"><div style="display:flex;flex-direction:column;gap:6px">
          ${others
            .map(
              (d, i) => `<label style="display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid var(--border);border-radius:var(--rounded-sm)">
              <input type="radio" name="path" value="${escapeHtml(d.path)}" ${i === 0 ? "checked" : ""}>
              <span class="mono" style="font-size:0.82rem">${escapeHtml(d.path)}</span>
              <span style="color:var(--text-3);font-size:0.8rem">基模板 ${escapeHtml(d.base ?? "（空白起点）")}</span></label>`
            )
            .join("")}
          </div><p style="margin-top:8px"><button class="btn" type="submit">打开该实例</button></p></form>`
    }
  </div>`;

  // G7 四分支三态：就绪（绿，来源小字二值）/ 未配置（灰正常态+引导）/ 配置错误（红+摘要）/ 演示模式（accent）
  const mainModel = args.llm.mainSpec ?? args.llm.model ?? "";
  const llmLine =
    args.llm.mode === "configured"
      ? `<a href="/settings" class="chip chip-ok" title="去设置查看与覆盖">就绪 · ${escapeHtml(mainModel)}</a> <span style="color:var(--text-2);font-size:0.82rem">来源：${args.llm.modelSource === "default-chain" ? "自动发现" : "手动配置"}</span>`
      : args.llm.mode === "faux"
        ? `<a href="/settings" class="chip chip-accent" title="去设置配置真实模型">演示模式</a> <span style="color:var(--text-2);font-size:0.82rem">faux 确定性后端（零网络），供体验与测试；配置真实模型后自动切换 · <a href="/settings">去设置</a></span>`
        : args.llm.mode === "error"
          ? `<a href="/settings" class="chip chip-fail" title="去设置修正配置">配置错误</a> <span style="color:var(--text-2);font-size:0.82rem">${escapeHtml((args.llm.error ?? "").slice(0, 160))} · <a href="/settings">去设置</a></span>`
          : `<a href="/settings" class="chip chip-queue" title="去设置手动配置">未配置</a> <span style="color:var(--text-2);font-size:0.82rem">本机已有 pi CLI 凭据即可零配置直接使用；或去设置手动配置（不配置也可用模板微调全流程）</span>`;

  return `${nlCard}
  ${currentCard}
  ${flow}
  ${openCard}
  <div class="card"><div class="card-h">AI 模型</div><p>${llmLine}</p></div>`;
}
