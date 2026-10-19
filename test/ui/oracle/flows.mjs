// A2 复刻 oracle 核心（capture.mjs CLI 与 vitest 进程内测试共用导入）。
// 产物（baseline/<view>.*）：.png 截图（人工复核，不做像素 diff——数据值不比对）、
// .skeleton.json DOM 骨架（结构/class/data-action/aria；data-id/data-index/文本 屏蔽）、
// .geo.json 几何锚（按锚点维度配置；内容高度锚只比宽度）。
// 行为断言（内联）：Esc 关弹层焦点回归 / 390px 无整页横溢 / dialog 原生语义 / skip-link。
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };
async function serve(root) {
  const srv = createServer(async (req, res) => {
    try {
      const rel = req.url.split("?")[0].replace(/^\/+/, "") || "index.html";
      const file = path.join(root, rel);
      const data = await readFile(file);
      res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
      res.end(data);
    } catch { res.writeHead(404); res.end("not found"); }
  });
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  return { srv, url: `http://127.0.0.1:${srv.address().port}` };
}

// ---- 7 视图流（与 screenshots-v0.2 对应；动作全部走 UI 点击，产品端同构复用）----
// direct：产品端（URL base + openInstance 参数）的等价直达流——hash 直开 work/<id>/<stage>；
// demo 端（目录 base）用 example 生成流。组件级折叠骨架下两者可比。
export const VIEWS = [
  { name: "v00-home", vw: 1440, vh: 900, flow: async (p) => { await p.locator("#main h1").waitFor(); } },
  { name: "v01-operating-overview", vw: 1440, vh: 900, direct: "overview", flow: async (p) => {
    await p.locator('[data-action="example"]').first().click();
    await p.locator('[data-action="generate"]').click();
    await p.locator('.work-tabs [data-stage="overview"]').waitFor({ timeout: 15000 });
  } },
  { name: "v02-strategy-review", vw: 1440, vh: 900, direct: "review", flow: async (p) => {
    await p.locator('[data-action="example"]').nth(1).click();
    await p.locator('[data-action="generate"]').click();
    await p.locator('.work-tabs [data-stage="overview"]').waitFor({ timeout: 15000 });
    await p.locator('.work-tabs [data-stage="review"]').click();
  } },
  { name: "v03-data-overview", vw: 1440, vh: 900, direct: "overview", flow: async (p) => {
    await p.locator('[data-action="example"]').nth(2).click();
    await p.locator('[data-action="generate"]').click();
    await p.locator('.work-tabs [data-stage="overview"]').waitFor({ timeout: 15000 });
  } },
  { name: "v04-library-methods", vw: 1440, vh: 900, flow: async (p) => {
    await p.locator('.nav-primary [data-action="library"]').click();
    await p.locator('[data-action="library-tab"][data-type="method"]').click();
  } },
  { name: "v05-strategy-overview-narrow", vw: 390, vh: 844, direct: "overview", flow: async (p) => {
    await p.locator('[data-action="example"]').nth(1).click();
    await p.locator('[data-action="generate"]').click();
    await p.locator('.work-tabs [data-stage="overview"]').waitFor({ timeout: 15000 });
  } },
  { name: "v06-review-narrow", vw: 390, vh: 844, direct: "review", flow: async (p) => {
    await p.locator('[data-action="example"]').nth(1).click();
    await p.locator('[data-action="generate"]').click();
    await p.locator('.work-tabs [data-stage="overview"]').waitFor({ timeout: 15000 });
    await p.locator('.work-tabs [data-stage="review"]').click();
  } },
];

async function skeleton(page) {
  return page.evaluate(() => {
    const maskAttrs = ["data-id", "data-index", "data-file", "data-text", "for", "href", "id", "aria-labelledby", "aria-controls", "placeholder"];
    // 组件级折叠（契约「数据值不比对」）：重复列表容器只保留首子结构——数量敏感的重复体（指标组/问题/假设/证据/检查行/场景 pill 等）
    // 折叠后对照「组件形态」（首子的完整结构含 class/data-action/aria）而非数据条数。
    const collapseIfList = new Set(["question-outline", "hypothesis-list", "evidence-plan", "metric-groups", "metric-group", "binding-chips", "step-list", "scene-switch", "checks", "starter-list", "system-list", "template-grid", "suggestion-list", "option-list", "about-flow", "requirements", "item-list", "recent", "context-row"]);
    const collapseIfTag = new Set(["OL", "UL", "DL"]);
    const walk = (el) => {
      if (!(el instanceof Element)) return null;
      const node = { t: el.tagName.toLowerCase(), c: el.classList.value || undefined };
      for (const a of el.attributes) {
        if (maskAttrs.includes(a.name)) continue;
        if (a.name === "class" || a.name === "style") continue;
        if (["src", "data-action", "data-stage", "data-type", "data-view", "data-filter", "data-bind", "data-context", "data-organization", "data-missing-description", "data-binding-index"].includes(a.name)) node[a.name] = a.value;
        if (a.name.startsWith("aria-")) node[a.name] = a.value;
      }
      if (el.getAttribute("role")) node.role = el.getAttribute("role");
      const isList = collapseIfTag.has(el.tagName)
        || (el.classList.length > 0 && [...el.classList].some(c => collapseIfList.has(c)));
      const kids = [...el.childNodes].map(walk).filter(Boolean);
      if (kids.length) node.k = isList ? [kids[0]] : kids;
      return node;
    };
    return walk(document.querySelector(".app") ?? document.body);
  });
}

const GEO_ANCHORS = [
  ["sidebar", ".sidebar", "all"],
  ["topbar", ".topbar", "all"],
  ["main", "#main", ["w"]], // 内容高度随真实数据文本行数变化（契约：数据值不比对）
  ["workTabs", ".work-tabs", "all"],
  ["assistant", ".assistant", ["w"]],
  ["modal", "#modal", "all"],
  ["toast", "#toast", "all"],
];

async function behavior(page, full = true) {
  const out = {};
  // B1 Esc 关弹层焦点回归（about 弹层由顶栏按钮打开）
  const opener = page.locator('[data-action="about"]').first();
  await opener.click();
  const dlg = page.locator("#modal");
  out.dialogOpensNative = await dlg.evaluate(d => d.open && d.tagName === "DIALOG");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  out.escClosesDialog = await dlg.evaluate(d => !d.open);
  out.focusReturnsToOpener = await page.evaluate(() => document.activeElement?.dataset?.action === "about");
  // B2 390px 无整页横溢（仅全量模式——依赖生成流）；B3 skip-link 任意模式都查
  out.skipLinkPresent = await page.locator("a.skip").count() === 1;
  if (!full) { out.n390NoOverflowWork = "skipped"; return out; }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-action="example"]').nth(1).click();
  await page.locator('[data-action="generate"]').click();
  await page.locator('.work-tabs [data-stage="overview"]').waitFor({ timeout: 15000 });
  out.n390NoOverflowWork = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
  return out;
}

const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 骨架差异定位（调试与验收证据）：返回前 N 处差异路径
function skeletonDiffs(a, b, pathStr = "", out = [], depth = 0) {
  if (out.length >= 5 || depth > 40) return out;
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) {
    out.push(`${pathStr || "/"}：${Array.isArray(a) ? "[…]" : a?.t ?? JSON.stringify(a)} → ${Array.isArray(b) ? "[…]" : b?.t ?? JSON.stringify(b)}`);
    return out;
  }
  if (Array.isArray(a)) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n && out.length < 5; i++) skeletonDiffs(a[i], b[i], `${pathStr}[${i}]`, out, depth + 1);
    return out;
  }
  const keys = [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].filter(k => k !== "c" ? true : (a?.c ?? "") !== (b?.c ?? ""));
  for (const k of keys) {
    if (out.length >= 5) break;
    if (k === "c") { out.push(`${pathStr}.class：${a?.c} → ${b?.c}`); continue; }
    skeletonDiffs(a?.[k], b?.[k], `${pathStr}.${k}`, out, depth + 1);
  }
  return out;
}

export async function runOracle({ base, mode = "compare", viewFilter = "all", baselineDir = null, launchOptions = {}, openInstance = null }) {
  const IS_URL = String(base).startsWith("http://") || String(base).startsWith("https://");
  if (!IS_URL && !existsSync(String(base))) throw new Error(`base 目录不存在：${base}`);
  const BASELINE_DIR = path.resolve(baselineDir ?? "test/ui/baseline");
  const activeViews = viewFilter === "all" ? VIEWS : VIEWS.filter(v => String(viewFilter).split(",").includes(v.name));
  if (activeViews.length === 0) throw new Error(`view 无匹配：${viewFilter}`);
  let srv = null, url;
  if (IS_URL) { url = String(base).replace(/\/$/, ""); }
  else { const s = await serve(path.resolve(String(base))); srv = s.srv; url = s.url; }
  const browser = await chromium.launch(launchOptions);
  const results = { mode, base: String(base), views: {}, behavior: null, ok: true };
  try {
    for (const v of activeViews) {
      const ctx = await browser.newContext({ viewport: { width: v.vw, height: v.vh } });
      const page = await ctx.newPage();
      try {
        if (IS_URL && v.direct && openInstance) {
          await page.goto(`${url}/#work/${encodeURIComponent(openInstance)}/${v.direct}`);
          await page.locator(".work-tabs").waitFor({ timeout: 20000 });
        } else {
          await page.goto(url + "/");
          await v.flow(page);
        }
        await page.waitForTimeout(120);
        const shot = await page.screenshot();
        const skel = await skeleton(page);
        const geo = {};
        for (const [k, sel, dims] of GEO_ANCHORS) {
          const loc = page.locator(sel).first();
          if (await loc.count()) { const bb = await loc.boundingBox(); if (bb) geo[k] = { x: +bb.x.toFixed(1), y: +bb.y.toFixed(1), w: +bb.width.toFixed(1), h: +bb.height.toFixed(1), dims }; }
        }
        geo._docScrollW = await page.evaluate(() => document.documentElement.scrollWidth);
        const file = path.join(BASELINE_DIR, v.name);
        if (mode === "update") {
          await mkdir(BASELINE_DIR, { recursive: true });
          await writeFile(file + ".png", shot);
          await writeFile(file + ".skeleton.json", JSON.stringify(skel, null, 1));
          await writeFile(file + ".geo.json", JSON.stringify(geo, null, 1));
          results.views[v.name] = "captured";
        } else {
          const problems = [];
          if (!existsSync(file + ".skeleton.json")) problems.push("baseline 缺失");
          else {
            const baseSkel = JSON.parse(await readFile(file + ".skeleton.json", "utf8"));
            if (!deepEq(baseSkel, skel)) problems.push("skeleton 漂移: " + skeletonDiffs(baseSkel, skel).join(" | "));
            const baseGeo = JSON.parse(await readFile(file + ".geo.json", "utf8"));
            for (const [k, val] of Object.entries(baseGeo)) {
              // _docScrollW 标量特判：非锚点 dict——基线或实测任一超视口宽且数值变化即报（宽视口新增横溢可被抓）
              const cur = k === "_docScrollW" ? geo._docScrollW : geo[k];
              if (!cur) { problems.push(`geo.${k} 缺失`); continue; }
              const dims = Array.isArray(val.dims) ? val.dims : ["x", "y", "w", "h"];
              for (const dim of k === "_docScrollW" ? [] : dims) {
                if (typeof val[dim] === "number" && Math.abs(val[dim] - cur[dim]) > 1.5) problems.push(`geo.${k}.${dim}: 基线${val[dim]} 实测${cur[dim]}`);
              }
              if (k === "_docScrollW" && (val > (v.vw ?? 1440) || cur > (v.vw ?? 1440)) && cur !== val) problems.push(`_docScrollW 溢出变化: ${val}→${cur}`);
            }
          }
          results.views[v.name] = problems.length ? "FAIL: " + problems.join("; ") : "pass";
          if (problems.length) results.ok = false;
        }
      } catch (e) {
        results.views[v.name] = "ERROR: " + String(e).split("\n")[0];
        results.ok = false;
      } finally {
        await ctx.close().catch(() => {});
      }
    }
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const bpage = await ctx.newPage();
    await bpage.goto(url + "/");
    results.behavior = await behavior(bpage, viewFilter === "all");
    for (const v of Object.values(results.behavior)) if (!v && v !== "skipped") results.ok = false;
    await ctx.close();
  } finally {
    await browser.close(); srv?.close();
  }
  return results;
}
