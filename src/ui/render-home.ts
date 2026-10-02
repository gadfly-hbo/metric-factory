import { escapeHtml, chip } from "./render.js";
import type { LlmStatus } from "./render-settings.js";

export interface HomeInstanceInfo {
  path: string;
  base: string;
  metricCount: number;
  pendingCount: number;
  changes: number;
}

const FLOW: { no: string; title: string; desc: string; href: string }[] = [
  { no: "1", title: "创建实例", desc: "回答三个问题，匹配行业模板生成你的指标体系", href: "/init" },
  { no: "2", title: "微调口径", desc: "按企业实际改口径开关、增删改指标（全量校验后写回）", href: "/instance" },
  { no: "3", title: "AI 草案", desc: "描述业务，AI 出候选指标草案，你决定采纳与否（可选）", href: "/drafts" },
  { no: "4", title: "审核导出", desc: "批准 AI 指标后导出 MetricFlow / Excel / Mermaid", href: "/review" }
];

export function homePage(args: {
  templateCount: number;
  current: HomeInstanceInfo | null;
  discovered: { path: string; base: string }[];
  llm: LlmStatus;
  hasPendingDraft: boolean;
}): string {
  const flow = `<div class="flow-grid">${FLOW.map(
    (s) => `<div class="flow-step"><span class="step-no">${s.no}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.desc)}</p>
      <p style="margin-top:6px"><a href="${s.href}">前往 →</a></p></div>`
  ).join("")}</div>`;

  const currentCard = args.current
    ? `<div class="card">
      <div class="card-h">当前实例 ${args.current.pendingCount > 0 ? chip("warn", `待审核 ${args.current.pendingCount}`) : chip("ok", "无待审")}${args.hasPendingDraft ? chip("queue", "有待采纳草案") : ""}</div>
      <p><span class="mono">${escapeHtml(args.current.path)}</span> · 基模板 <span class="mono">${escapeHtml(args.current.base)}</span></p>
      <p style="margin-top:4px">有效指标 <span class="num">${args.current.metricCount}</span> 个 · 相对模板变更 <span class="num">${args.current.changes}</span> 处</p>
      <p style="margin-top:8px" class="btn-row"><a class="btn" href="/instance">进入实例</a><a class="btn" href="/review">审核中心</a></p>
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
              <span class="mono" style="font-size:12px">${escapeHtml(d.path)}</span>
              <span style="color:var(--text-3);font-size:11.5px">基模板 ${escapeHtml(d.base)}</span></label>`
            )
            .join("")}
          </div><p style="margin-top:8px"><button class="btn" type="submit">打开该实例</button></p></form>`
    }
  </div>`;

  const llmLine =
    args.llm.mode === "configured"
      ? `<span>${chip("ok", "AI 模型已连接")} <span class="mono">${escapeHtml(args.llm.model ?? "")}</span></span>`
      : args.llm.mode === "faux"
        ? `${chip("accent", "AI 演示模式")} <a href="/settings">设置</a>`
        : `${chip("warn", "AI 未配置")} <a href="/settings">去设置模型</a>（不配置也可用模板微调全流程）`;

  return `${flow}
  ${currentCard}
  ${openCard}
  <div class="card"><div class="card-h">AI 模型</div><p>${llmLine}</p></div>`;
}
