import { createServer, type Server } from "node:http";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadTemplate } from "../engine/loader.js";
import { layout, templatesPage, templateDetailPage, instancePage, reviewPage, formErrorPage, escapeHtml } from "./render.js";
import { loadInstance } from "../engine/loader.js";
import { materialize } from "../engine/materialize.js";
import { validateInstance } from "../engine/validate.js";
import { findPendingReview, applyApproval, applyRejection } from "../engine/review.js";
import { writeInstanceFile } from "../engine/io.js";
import { InstanceSchema } from "../schema/instance.js";
import type { Instance } from "../schema/instance.js";
import type { Template } from "../schema/template.js";
export interface UiOptions {
  instancePath?: string;
  templatesDir: string;
}

async function discoverTemplates(dir: string): Promise<Template[]> {
  const entries = (await readdir(dir)).filter((n) => n.endsWith(".yaml")).sort();
  const templates: Template[] = [];
  for (const f of entries) {
    const loaded = await loadTemplate(join(dir, f));
    if (loaded.ok) templates.push(loaded.template);
  }
  return templates;
}


interface InstanceContext {
  instance: Instance;
  base: Template;
  instancePath: string;
}

async function loadInstanceContext(opts: UiOptions, templates: Template[]): Promise<InstanceContext | null> {
  if (!opts.instancePath) return null;
  const loaded = await loadInstance(opts.instancePath);
  if (!loaded.ok) return null;
  const baseId = loaded.instance.base.split("@")[0]!;
  const base = templates.find((t) => t.template.id === baseId);
  if (!base) return null;
  return { instance: loaded.instance, base, instancePath: opts.instancePath };
}

async function readFormBody(req: import("node:http").IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}


export function createUiServer(opts: UiOptions): Server {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    try {
      const templates = await discoverTemplates(opts.templatesDir);
      const statusInfo = `模板 ${templates.length} 个`;

      if (path === "/") {
        const home = layout(
          "home",
          "工作台",
          "指标体系设计态工作台：从行业模板到企业实例，到导出与数仓映射。下一步：浏览模板库或打开你的实例。",
          templatesPage(templates),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(home);
        return;
      }

      if (path === "/templates") {
        const html = layout(
          "templates",
          "模板库",
          `共 ${templates.length} 个行业模板（fork 即微调）。选择一个模板浏览完整指标字典与口径。`,
          templatesPage(templates),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      const tplMatch = path.match(/^\/templates\/([a-z0-9-]+)$/);
      if (tplMatch) {
        const id = tplMatch[1]!;
        const tpl = templates.find((t) => t.template.id === id);
        if (!tpl) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("templates", "未找到模板", `模板 ${escapeHtml(id)} 不存在。`, `<div class="empty">模板 ${escapeHtml(id)} 不存在<br><a class="btn" href="/templates">返回模板库</a></div>`, statusInfo)
          );
          return;
        }
        const html = layout(
          "templates",
          `${tpl.template.industry} · ${tpl.template.id}`,
          `${escapeHtml(tpl.template.business_models.join(" / "))} · 指标 ${tpl.metrics.length} 个 · 版本 ${escapeHtml(tpl.template.version)}`,
          templateDetailPage(tpl),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      // ===== 实例视图（切片 6）=====
      if (path === "/instance") {
        const ctx = await loadInstanceContext(opts, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "我的实例", "未指定实例或实例不可加载。用 metric-factory ui --instance <path> 指定，或先 CLI init 生成实例。",
              `<div class="empty">暂无实例<br><span style="font-size:12px">CLI：metric-factory init --answers examples/ecommerce-answers.yaml --out .</span><br><a class="btn" href="/templates">先逛模板库</a></div>`, statusInfo)
          );
          return;
        }
        const materialized = materialize(ctx.base, ctx.instance);
        const html = layout("instance", "我的实例", `基模板 ${escapeHtml(ctx.instance.base)} · 下方可微调（口径开关/增删改）并写回，写回前经全量校验。`,
          instancePage(materialized, ctx.instance, ctx.instancePath), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      if (path === "/instance/patch" && req.method === "POST") {
        const ctx = await loadInstanceContext(opts, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo));
          return;
        }
        const form = await readFormBody(req);

        // added/modified JSON 解析（错 JSON 即 422）
        let addedNew: unknown[] = [];
        let modifiedNew: unknown[] = [];
        try {
          const addedRaw = form.get("added") ?? "[]";
          addedNew = addedRaw.trim() ? JSON.parse(addedRaw) : [];
          const modRaw = form.get("modified") ?? "[]";
          modifiedNew = modRaw.trim() ? JSON.parse(modRaw) : [];
        } catch (e) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "写回失败", "JSON 输入不合法。", formErrorPage("JSON 解析失败", [(e as Error).message]), statusInfo)
          );
          return;
        }

        // 三态口径覆盖收集
        const caliber: Record<string, Record<string, boolean>> = {};
        for (const [field, value] of form.entries()) {
          if (!field.startsWith("caliber__")) continue;
          if (value === "skip") continue;
          const rest = field.slice("caliber__".length);
          const sep = rest.lastIndexOf("__");
          if (sep <= 0) continue;
          const metric = rest.slice(0, sep);
          const key = rest.slice(sep + 2);
          (caliber[metric] ??= {})[key] = value === "on";
        }

        const removed = (form.get("removed") ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

        const merged = {
          ...ctx.instance,
          caliber_switches: caliber,
          removed,
          modified: modifiedNew,
          added: [...ctx.instance.added]
        };
        // added 合并：表单 added 为「期望的全部新增」时以表单为准？——语义定为合并去重（表单数组替换同名字段）
        if (Array.isArray(addedNew)) {
          const byName = new Map(ctx.instance.added.map((m) => [m.name, m]));
          for (const a of addedNew as { name?: string }[]) {
            if (a?.name) byName.set(a.name, a as never);
          }
          merged.added = [...byName.values()];
        }

        const parsed = InstanceSchema.safeParse(merged);
        if (!parsed.success) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "写回失败", "实例 schema 校验未通过（零写盘）。", formErrorPage("schema 校验失败", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)), statusInfo)
          );
          return;
        }
        const materialized = materialize(ctx.base, parsed.data);
        const issues = validateInstance(materialized, ctx.base, parsed.data, { skipReviewGate: true });
        if (issues.length > 0) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "写回失败", "全量校验未通过（零写盘）。", formErrorPage("校验失败", issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, parsed.data);
        res.writeHead(303, { location: "/instance" }).end();
        return;
      }

      // ===== 审核中心（切片 7）=====
      if (path === "/review") {
        const ctx = await loadInstanceContext(opts, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
            layout("review", "审核中心", "未指定实例。", `<div class="empty">暂无实例<br><a class="btn" href="/">返回工作台</a></div>`, statusInfo)
          );
          return;
        }
        const html = layout("review", "审核中心", `LLM 生成指标的守门台（fail-closed：未审核不可导出）。`, reviewPage(ctx.instance, ctx.instancePath), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      const reviewMatch = path.match(/^\/review\/([a-z0-9_]+)$/);
      if (reviewMatch && req.method === "POST") {
        const ctx = await loadInstanceContext(opts, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(layout("review", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo));
          return;
        }
        const name = reviewMatch[1]!;
        const form = await readFormBody(req);
        const action = form.get("action");
        const pending = findPendingReview(ctx.instance.added);
        if (!pending.some((m) => m.name === name)) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("review", "操作失败", "该指标不在待审列表。", formErrorPage("非待审指标", [`${name} 不在待审列表（已审核过或不存在，拒绝改写审核记录）`]), statusInfo)
          );
          return;
        }
        const reviewer = form.get("reviewer")?.trim() || process.env.MF_REVIEWER || process.env.USER || "unknown";
        let updated: Instance;
        if (action === "approve") {
          updated = applyApproval(ctx.instance, name, reviewer);
        } else if (action === "reject") {
          updated = applyRejection(ctx.instance, name);
        } else {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("review", "操作失败", "未知操作。", formErrorPage("未知操作", [`action 必须是 approve 或 reject`]), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, updated);
        res.writeHead(303, { location: "/review" }).end();
        return;
      }

      res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
        layout("home", "未找到", `路径 ${path} 不存在。`, `<div class="empty">页面不存在<br><a class="btn" href="/">返回工作台</a></div>`, statusInfo)
      );
    } catch (e) {
      res.writeHead(500, { "content-type": "text/html; charset=utf-8" }).end(
        layout("home", "服务错误", "页面渲染失败。", `<div class="empty">${escapeHtml((e as Error).message)}</div>`, "error")
      );
    }
  });
}

export function listenUi(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const addr = server.address();
      resolve(typeof addr === "object" && addr ? addr.port : port);
    });
  });
}
