import type { Template } from "../schema/template.js";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Xanthil 暖灰青工作台 token（~/.zcode/design/DESIGN.md，alpha 版直取）
const CSS = `
:root {
  --bg: #f7f6f3; --surface: #ffffff; --surface-2: #f0efec;
  --border: #e2e0db; --border-strong: #cfcdc6;
  --text: #1f1e1b; --text-2: #5b5952; --text-3: #8a877e;
  --accent: #0f766e; --accent-strong: #0b5c55; --accent-soft: #e6f4f2; --accent-line: #bfe3de;
  --ok: #166534; --ok-soft: #e7f4ea; --ok-line: #cbe6d2;
  --warn: #92400e; --warn-soft: #fdf1e2; --warn-line: #f0dfc2;
  --fail: #b91c1c; --fail-soft: #fbeaea; --fail-line: #f3caca;
  --queue: #6d5bd0; --queue-ink: #5b48c0; --queue-soft: #efecfb; --queue-line: #d9d2f5;
  --rounded-base: 10px; --rounded-sm: 6px;
  --font: -apple-system, "SF Pro Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --mono: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font: 400 13px/1.55 var(--font); }
.app { display: flex; min-height: 100vh; }
.sidebar { width: 248px; background: var(--surface-2); border-right: 1px solid var(--border); padding: 14px; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 0; height: 100vh; }
.brand { font-weight: 700; font-size: 14px; color: var(--accent-strong); padding: 6px 4px; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav a { display: block; padding: 7px 10px; border-radius: var(--rounded-sm); color: var(--text-2); text-decoration: none; font-size: 13px; }
.nav a:hover { background: var(--surface); }
.nav a.active { background: var(--accent-soft); color: var(--accent-strong); font-weight: 500; }
.boundary { margin-top: auto; padding: 10px; border: 1px dashed var(--border-strong); border-radius: var(--rounded-sm); color: var(--text-3); font-size: 11.5px; line-height: 1.6; }
.main { flex: 1; padding: 22px; max-width: 860px; margin: 0 auto; }
.statusbar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); padding: 6px 14px; font-size: 10.5px; color: var(--text-3); display: flex; gap: 14px; z-index: 10; }
.page-title { font-size: 22px; font-weight: 600; line-height: 1.3; margin-bottom: 6px; }
.view-title { font-size: 17px; font-weight: 600; line-height: 1.4; margin: 18px 0 10px; }
.page-desc { color: var(--text-2); font-size: 13px; margin-bottom: 16px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--rounded-base); padding: 14px 16px; margin-bottom: 14px; }
.card-h { font-size: 13.5px; font-weight: 600; margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th { text-align: left; background: var(--surface-2); padding: 7px 10px; font-weight: 500; white-space: nowrap; border-bottom: 1px solid var(--border); }
.tbl td { padding: 7px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
.tbl td.mono, .mono { font-family: var(--mono); font-size: 12px; }
.chip { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 1px 9px; font-size: 11px; border: 1px solid; white-space: nowrap; }
.chip-ok { background: var(--ok-soft); color: var(--ok); border-color: var(--ok-line); }
.chip-warn { background: var(--warn-soft); color: var(--warn); border-color: var(--warn-line); }
.chip-queue { background: var(--queue-soft); color: var(--queue-ink); border-color: var(--queue-line); }
.chip-accent { background: var(--accent-soft); color: var(--accent-strong); border-color: var(--accent-line); }
.btn { display: inline-block; border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: var(--rounded-sm); padding: 5px 12px; font-size: 13px; cursor: pointer; text-decoration: none; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn:hover { border-color: var(--border-strong); }
.btn-primary:hover { background: var(--accent-strong); }
.fld { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.fld label { font-size: 12px; color: var(--text-2); font-weight: 500; }
.fld input[type=text], .fld select, .fld textarea { background: var(--surface); border: 1px solid var(--border); border-radius: var(--rounded-sm); padding: 6px 8px; font: 400 13px var(--font); width: 100%; }
.fld textarea { font-family: var(--mono); font-size: 12px; min-height: 72px; }
.empty { border: 1px dashed var(--border-strong); border-radius: var(--rounded-base); padding: 22px; text-align: center; color: var(--text-2); background: var(--surface); }
.empty .btn { margin-top: 10px; }
.error-list { list-style: none; }
.error-list li { background: var(--fail-soft); border: 1px solid var(--fail-line); color: var(--fail); border-radius: var(--rounded-sm); padding: 6px 10px; margin-bottom: 6px; font-size: 12.5px; }
.tree-children { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tree-child { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--rounded-sm); padding: 3px 8px; font-size: 12px; }
a { color: var(--accent-strong); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.num { font-variant-numeric: tabular-nums; }

/* 杜邦式指标树（分模块 + 公式勾稽） */
.module { margin-bottom: 14px; }
.module > summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--rounded-sm); font-weight: 600; font-size: 13.5px; }
.module > summary::-webkit-details-marker { display: none; }
.module > summary .cat-dot { width: 8px; height: 8px; border-radius: 999px; }
.module > summary .tree-count { color: var(--text-3); font-weight: 400; font-size: 11.5px; }
.cat-scale .cat-dot { background: var(--accent); }
.cat-quality .cat-dot { background: var(--ok); }
.cat-structure .cat-dot { background: var(--warn); }
.cat-efficiency .cat-dot { background: var(--queue); }
.cat-journey .cat-dot { background: var(--text-3); }
.tree { padding: 14px 6px 4px; overflow-x: auto; }
.tree ul { display: flex; justify-content: center; padding-top: 18px; position: relative; list-style: none; }
.tree li { display: flex; flex-direction: column; align-items: center; padding: 18px 6px 0; position: relative; }
.tree li::before, .tree li::after { content: ""; position: absolute; top: 0; width: 50%; height: 18px; border-top: 1px solid var(--border-strong); }
.tree li::before { left: 0; border-right: 1px solid var(--border-strong); border-radius: 0 6px 0 0; }
.tree li::after { right: 0; }
.tree li:only-child::before, .tree li:only-child::after { display: none; }
.tree li:only-child { padding-top: 14px; }
.tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
.tree li:last-child::before { border-right: 0 none; border-radius: 0; }
.tree ul ul::before { content: ""; position: absolute; top: 0; left: 50%; width: 1px; height: 18px; background: var(--border-strong); }
.tnode { background: var(--surface); border: 1px solid var(--border); border-left-width: 3px; border-radius: var(--rounded-sm); padding: 6px 10px; min-width: 96px; max-width: 190px; text-align: center; position: relative; }
.tnode .t-name { font-size: 12.5px; font-weight: 500; }
.tnode .t-id { font-family: var(--mono); font-size: 10.5px; color: var(--text-3); }
.tnode .t-expr { font-family: var(--mono); font-size: 10px; color: var(--accent-strong); background: var(--accent-soft); border-radius: 4px; padding: 0 4px; margin-top: 3px; display: inline-block; }
.tnode-root { border-left-color: var(--accent); background: var(--accent-soft); }
.tnode-llm { border-color: var(--warn-line); background: var(--warn-soft); }
.tnode-modified { border-color: var(--accent-line); }
.op { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--border-strong); border-radius: 999px; font-size: 11px; color: var(--text-2); padding: 0 6px; z-index: 1; }
.ns-head { display: flex; gap: 10px; align-items: flex-start; }
.ns-badge { background: var(--accent-soft); color: var(--accent-strong); border: 1px solid var(--accent-line); border-radius: var(--rounded-sm); padding: 6px 10px; font-size: 12px; }
.loose-nodes { display: flex; flex-wrap: wrap; gap: 6px; }
`;

export type NavKey = "home" | "templates" | "instance" | "review";

const NAV: [NavKey, string, string][] = [
  ["home", "/", "工作台"],
  ["templates", "/templates", "模板库"],
  ["instance", "/instance", "我的实例"],
  ["review", "/review", "审核中心"]
];

export function layout(active: NavKey, title: string, desc: string, content: string, statusInfo: string): string {
  const nav = NAV.map(
    ([key, href, label]) => `<a href="${href}" class="${key === active ? "active" : ""}">${label}</a>`
  ).join("");
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} · Metric Factory</title><style>${CSS}</style></head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand">Metric Factory</div>
    <nav class="nav">${nav}</nav>
    <div class="boundary">本机运行 · 不联网 · 不处理凭据<br>写操作仅限本地实例与映射文件</div>
  </aside>
  <main class="main">
    <h1 class="page-title">${escapeHtml(title)}</h1>
    <p class="page-desc">${desc}</p>
    ${content}
  </main>
</div>
<div class="statusbar"><span>Metric Factory 工作台</span><span>${statusInfo}</span><span>本机 127.0.0.1</span></div>
</body></html>`;
}

export function chip(kind: "ok" | "warn" | "queue" | "accent", text: string): string {
  return `<span class="chip chip-${kind}">${escapeHtml(text)}</span>`;
}

export function templatesPage(templates: Template[]): string {
  const cards = templates
    .map(
      (t) => `<div class="card">
      <div class="card-h">${escapeHtml(t.template.industry)} · ${escapeHtml(t.template.business_models.join(" / "))}</div>
      <p style="color:var(--text-2);margin-bottom:8px"><span class="mono">${escapeHtml(t.template.id)}@${escapeHtml(t.template.version)}</span></p>
      <p>指标 <span class="num">${t.metrics.length}</span> 个 · 维度 ${t.dimensions.length} 个 · 北极星候选 ${t.north_star.candidates.length} 个</p>
      <p style="margin-top:8px"><a class="btn" href="/templates/${escapeHtml(t.template.id)}">浏览指标字典</a></p>
    </div>`
    )
    .join("");
  return `<div class="grid">${cards}</div>`;
}

export function templateDetailPage(t: Template): string {
  const treeViz = dupontTree(t.trees, t.metrics, { northStar: t.north_star });
  const rows = t.metrics
    .map(
      (m) => `<tr>
      <td class="mono">${escapeHtml(m.name)}</td>
      <td>${escapeHtml(m.display_name)}</td>
      <td>${chip("accent", m.type)}</td>
      <td>${escapeHtml(m.definition)}</td>
      <td>${escapeHtml(m.dimensions.join("、"))}</td>
      <td>${escapeHtml(m.owner_role)}</td>
      <td>${chip("ok", "模板出处")}</td>
    </tr>`
    )
    .join("");
  return `
  <div class="view-title">指标树 · 杜邦式分解（${t.trees.length} 棵，按模块分组）</div>
  ${treeViz}
  <div class="view-title">指标字典（${t.metrics.length}）</div>
  <div class="card" style="padding:0;overflow-x:auto"><table class="tbl">
    <thead><tr><th>指标名</th><th>展示名</th><th>类型</th><th>口径</th><th>维度</th><th>归口</th><th>出处</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

import type { MaterializedInstance } from "../engine/materialize.js";
import type { Instance } from "../schema/instance.js";
import { findPendingReview } from "../engine/review.js";

export function instancePage(materialized: MaterializedInstance, instance: Instance, instancePath: string): string {
  const pending = findPendingReview(instance.added);
  const d = materialized.diff;

  const summary = `<div class="card">
    <div class="card-h">实例概览 · <span class="mono">${escapeHtml(instancePath)}</span></div>
    <p>基模板 <span class="mono">${escapeHtml(instance.base)}</span> · 有效指标 <span class="num">${materialized.metrics.length}</span> 个
    · 口径调整 ${d.caliber.length} · 字段修改 ${d.modified.length} · 删除 ${d.removed.length} · 新增 ${d.added.length}
    · ${pending.length > 0 ? chip("warn", `待审核 ${pending.length}`) : chip("ok", "无待审核")}</p>
    <p style="margin-top:8px"><a class="btn" href="/review">前往审核中心</a></p>
  </div>`;

  const pendingNames = new Set(findPendingReview(instance.added).map((m) => m.name));
  const modifiedNames = new Set(instance.modified.map((m) => m.name));
  const trees = dupontTree(materialized.trees, materialized.metrics, {
    northStar: materialized.north_star,
    pendingNames,
    modifiedNames,
    looseMetrics: instance.added
  });

  // 口径开关三态（不变/开/关），只列模板声明了开关的指标
  const switchRows: string[] = [];
  for (const m of materialized.metrics) {
    for (const [key, def] of Object.entries(m.caliber_switches)) {
      const current = instance.caliber_switches[m.name]?.[key];
      const fieldName = `caliber__${m.name}__${key}`;
      const radio = (val: string, label: string, checked: boolean) =>
        `<label style="margin-right:10px;font-weight:400"><input type="radio" name="${fieldName}" value="${val}" ${checked ? "checked" : ""}> ${label}</label>`;
      switchRows.push(
        `<tr><td class="mono">${escapeHtml(m.name)}</td><td class="mono">${escapeHtml(key)}</td><td>${def ? "开" : "关"}</td><td>${
          radio("skip", "不变", current === undefined)
        }${radio("on", "覆盖为开", current === true)}${radio("off", "覆盖为关", current === false)}</td></tr>`
      );
    }
  }

  const form = `<form action="/instance/patch" method="post">
    <div class="view-title">微调实例（写回前经全量校验，失败零写盘）</div>
    ${switchRows.length > 0 ? `<div class="card" style="padding:0;overflow-x:auto"><table class="tbl">
      <thead><tr><th>指标</th><th>口径开关</th><th>模板默认</th><th>取值</th></tr></thead>
      <tbody>${switchRows.join("")}</tbody></table></div>` : ""}
    <div class="card">
      <div class="fld"><label>删除指标（每行一个指标名，对应 removed 段）</label><textarea name="removed" placeholder="">${escapeHtml(instance.removed.join("\n"))}</textarea></div>
      <div class="fld"><label>新增指标（JSON 数组，必须含 provenance；与已有新增按名合并——移除已合入指标请用审核中心拒绝或直接编辑 YAML）</label><textarea name="added" placeholder="[]">${escapeHtml(d.added.length ? JSON.stringify(d.added, null, 2) : "[]")}</textarea></div>
      <div class="fld"><label>修改指标（JSON 数组：name + 可选 display_name/definition/owner_role，替换 modified 段）</label><textarea name="modified" placeholder="[]">${escapeHtml(JSON.stringify(instance.modified, null, 2))}</textarea></div>
      <button class="btn btn-primary" type="submit">校验并写回实例</button>
    </div>
  </form>`;

  return `${summary}<div class="view-title">指标树 · 杜邦式分解（按模块分组，× ÷ 为公式算符）</div>${trees}${form}`;
}

export function reviewPage(instance: Instance, instancePath: string): string {
  const pending = findPendingReview(instance.added);
  if (pending.length === 0) {
    return `<div class="empty">无待审核指标（全部已审核或无 LLM 生成指标）<br><a class="btn" href="/instance">返回实例编辑</a><br><span style="font-size:11.5px;color:var(--text-3)">生成新草案：CLI generate → apply 后回到此页</span></div>`;
  }
  const cards = pending
    .map(
      (m) => `<div class="card">
      <div class="card-h">${escapeHtml(m.display_name)} <span class="mono">${escapeHtml(m.name)}</span> ${chip("warn", "待审核")}</div>
      <p>${escapeHtml(m.definition)}</p>
      <p style="margin-top:6px;color:var(--text-2);font-size:12px">出处：LLM 生成（${escapeHtml(m.provenance.model ?? "")}，prompt ${escapeHtml(m.provenance.prompt_version ?? "")}）</p>
      <form action="/review/${escapeHtml(m.name)}" method="post" style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="text" name="reviewer" placeholder="审核人（默认 MF_REVIEWER）" style="border:1px solid var(--border);border-radius:6px;padding:5px 8px;font:inherit;width:200px">
        <button class="btn btn-primary" name="action" value="approve" type="submit">批准</button>
        <button class="btn" name="action" value="reject" type="submit">拒绝（移除）</button>
      </form>
    </div>`
    )
    .join("");
  void instancePath;
  return `<p style="color:var(--text-2);margin-bottom:12px">以下 ${pending.length} 个指标为 LLM 生成且未经人工审核——批准后才可导出（fail-closed）。</p>${cards}`;
}

export function formErrorPage(title: string, errors: string[]): string {
  return `<div class="card"><div class="card-h" style="color:var(--fail)">${escapeHtml(title)}</div>
  <ul class="error-list">${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
  <a class="btn" href="javascript:history.back()">返回修改</a></div>`;
}

// ===== 杜邦式指标树（分模块 + 公式勾稽）=====

const CATEGORY_CLASS: Record<string, string> = {
  规模: "cat-scale",
  质量: "cat-quality",
  结构: "cat-structure",
  效率: "cat-efficiency",
  旅程: "cat-journey"
};

function prettyFormula(f: string): string {
  return f.replace(/\*/g, "×").replace(/\//g, "÷");
}

// 公式 "gmv = uv * cvr * aov" → 子节点顺序对应的算符（["×","×"]），子节点数不匹配时返回 null
function formulaOps(formula: string | undefined, children: string[]): string[] | null {
  if (!formula) return null;
  const eq = formula.split("=");
  if (eq.length !== 2) return null;
  const tokens = eq[1]!.match(/[A-Za-z_][A-Za-z0-9_]*|[+\-*/×÷]/g) ?? [];
  const ids = tokens.filter((t) => /^[A-Za-z_]/.test(t));
  const ops = tokens.filter((t) => /^[+\-*/×÷]$/.test(t)).map((o) => prettyFormula(o));
  if (ids.length === children.length && children.every((c, i) => ids[i] === c)) {
    return ops;
  }
  return null;
}

interface TreeNodeBadges {
  llmPending?: boolean;
  modified?: boolean;
}

function tNode(metric: { name: string; display_name: string; type_params?: { expr?: string } } | undefined, rawName: string, badges: TreeNodeBadges = {}, isRoot = false): string {
  const cls = ["tnode", isRoot ? "tnode-root" : "", badges.llmPending ? "tnode-llm" : "", badges.modified ? "tnode-modified" : ""].filter(Boolean).join(" ");
  const expr = metric?.type_params?.expr;
  return `<div class="${cls}">
    <div class="t-name">${escapeHtml(metric?.display_name ?? rawName)}</div>
    <div class="t-id">${escapeHtml(rawName)}</div>
    ${expr ? `<span class="t-expr" title="指标级公式">${escapeHtml(prettyFormula(expr))}</span>` : ""}
    ${badges.llmPending ? `<span class="chip chip-warn">待审核</span>` : ""}
    ${badges.modified ? `<span class="chip chip-accent">已修改</span>` : ""}
  </div>`;
}

function treeList(
  tree: { id: string; category?: string; formula?: string; children: string[] },
  ctx: { metricByName: Map<string, { name: string; display_name: string; type_params?: { expr?: string } }>; pendingNames?: Set<string>; modifiedNames?: Set<string> }
): string {
  const rootBadges: TreeNodeBadges = {
    llmPending: ctx.pendingNames?.has(tree.id),
    modified: ctx.modifiedNames?.has(tree.id)
  };
  const isMetricRoot = ctx.metricByName.has(tree.id);
  const rootHtml = isMetricRoot
    ? tNode(ctx.metricByName.get(tree.id), tree.id, rootBadges, true)
    : `<div class="tnode tnode-root"><div class="t-name">${escapeHtml(tree.id)}</div>${tree.formula ? `<span class="t-expr">${escapeHtml(prettyFormula(tree.formula))}</span>` : ""}</div>`;

  if (tree.children.length === 0) return rootHtml;

  const ops = formulaOps(tree.formula, tree.children);
  const children = tree.children
    .map((c, i) => {
      const op = ops && i > 0 ? `<span class="op" data-op="${ops[i - 1]}">${ops[i - 1]}</span>` : "";
      const badges: TreeNodeBadges = {
        llmPending: ctx.pendingNames?.has(c),
        modified: ctx.modifiedNames?.has(c)
      };
      const child = ctx.metricByName.get(c);
      if (!child) return "";
      return `<li>${op}${tNode(child, c, badges)}${child ? "" : ""}</li>`;
    })
    .join("");
  return `${rootHtml}<ul>${children}</ul>`;
}

export function dupontTree(
  trees: { id: string; category?: string; formula?: string; children: string[] }[],
  metrics: { name: string; display_name: string; type_params?: { expr?: string } }[],
  opts: { northStar?: { candidates: { metric: string; rationale: string }[]; decision_guide: string }; pendingNames?: Set<string>; modifiedNames?: Set<string>; looseMetrics?: { name: string; display_name: string }[] } = {}
): string {
  const metricByName = new Map(metrics.map((m) => [m.name, m]));
  const ctx = { metricByName, pendingNames: opts.pendingNames, modifiedNames: opts.modifiedNames };

  const ns = opts.northStar
    ? `<div class="card"><div class="card-h">🎯 北极星候选</div>
      <div class="ns-head">${opts.northStar.candidates
        .map((c) => {
          const m = metricByName.get(c.metric);
          return `<div class="ns-badge">${escapeHtml(m?.display_name ?? c.metric)} <span class="mono">${escapeHtml(c.metric)}</span></div>`;
        })
        .join("")}</div>
      <p style="margin-top:8px;color:var(--text-2);font-size:12px">决策指引：${escapeHtml(opts.northStar.decision_guide)}</p></div>`
    : "";

  const byCategory = new Map<string, typeof trees>();
  for (const t of trees) {
    const cat = t.category ?? "结构";
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), t]);
  }
  const modules = [...byCategory.entries()]
    .map(([cat, group]) => {
      const treesHtml = group
        .map((t) => `<div class="tree"><ul><li>${treeList(t, ctx)}</li></ul></div>`)
        .join("");
      return `<details class="module ${CATEGORY_CLASS[cat] ?? ""}" open>
        <summary><span class="cat-dot"></span>${escapeHtml(cat)}<span class="tree-count">${group.length} 棵分解树</span></summary>
        ${treesHtml}
      </details>`;
    })
    .join("");

  const loose = opts.looseMetrics && opts.looseMetrics.length > 0
    ? `<details class="module" open><summary><span class="cat-dot" style="background:var(--warn)"></span>新增指标（未入树）<span class="tree-count">${opts.looseMetrics.length} 个待审/自增</span></summary>
      <div class="loose-nodes" style="padding:12px">${opts.looseMetrics.map((m) => tNode(m as never, m.name, { llmPending: opts.pendingNames?.has(m.name) })).join("")}</div></details>`
    : "";

  return `${ns}${modules}${loose}`;
}
