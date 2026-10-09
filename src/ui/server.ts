import { createServer, type Server } from "node:http";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTemplate } from "../engine/loader.js";
import { layout, templatesPage, templateDetailPage, instancePage, reviewPage, formErrorPage, escapeHtml, emptyScenarioFormValues, scenarioFormPage, scenarioFormValues, type ScenarioFormValues } from "./render.js";
import { parseQuestionTreeDsl, parseMetricUsagesDsl } from "./dsl.js";
import { loadInstance } from "../engine/loader.js";
import { materialize } from "../engine/materialize.js";
import { validateInstance } from "../engine/validate.js";
import { findPendingReview, applyApproval, applyRejection } from "../engine/review.js";
import { writeInstanceFile } from "../engine/io.js";
import { InstanceSchema } from "../schema/instance.js";
import type { Instance } from "../schema/instance.js";
import type { Template } from "../schema/template.js";
import { createLlmClientFromEnv } from "../llm/index.js";
import { readEnvFile, writeManagedEnv, resolveLlmEnv, apiKeyEnvName, maskKey } from "./env-file.js";
import { settingsPage, type LlmStatus } from "./render-settings.js";
import { wizardStep1Page, wizardStep2Page } from "./render-wizard.js";
import { homePage } from "./render-home.js";
import { AnswersSchema, type Answers } from "../schema/answers.js";
import { matchTemplates } from "../engine/match.js";
import { buildInstance } from "../engine/instantiate.js";
import { mkdir, access, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { generateDraft, generateRefineDraft } from "../engine/generate.js";
import { buildGeneratePrompt, buildRefinePrompt } from "../llm/prompt.js";
import { applyDraft } from "../engine/apply.js";
import { DraftSchema } from "../schema/draft.js";
import { draftsPage, jobRunningPage, jobErrorPage, type DraftLoad } from "./render-drafts.js";
import { metricflowExporter } from "../export/metricflow.js";
import { excelExporter } from "../export/excel.js";
import { mermaidExporter } from "../export/mermaid.js";
import { createSapExporter, packageIdFromInstancePath, SapExportValidationError } from "../export/sap.js";
import { SapAssemblyError } from "../sap/assemble.js";
import { ExportBlockedError } from "../export/gate.js";
import type { Exporter } from "../export/types.js";
import { MappingSchema } from "../schema/mapping.js";
import type { Scenario } from "../schema/scenario.js";
export interface UiOptions {
  instancePath?: string;
  templatesDir: string;
  /** LLM 配置文件（.env.local）；默认 <cwd>/.env.local，测试可注入临时路径 */
  envFilePath?: string;
  /** 工作区目录：向导实例写盘与实例扫描的根；默认 cwd */
  workspaceDir?: string;
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

async function loadInstanceContext(instancePath: string | undefined, templates: Template[]): Promise<InstanceContext | null> {
  if (!instancePath) return null;
  const loaded = await loadInstance(instancePath);
  if (!loaded.ok) return null;
  const baseId = loaded.instance.base.split("@")[0]!;
  const base = templates.find((t) => t.template.id === baseId);
  if (!base) return null;
  return { instance: loaded.instance, base, instancePath };
}

// LLM 连接状态（试构造 client；key 只取打码形式）
async function llmStatus(envFilePath: string): Promise<LlmStatus> {
  const env = await resolveLlmEnv(envFilePath);
  if (env.MF_LLM_BACKEND === "faux") return { mode: "faux" };
  const spec = env.MF_LLM_MODEL;
  if (!spec) return { mode: "unconfigured" };
  try {
    createLlmClientFromEnv(env);
    const provider = spec.split("/")[0]!;
    const key = env[apiKeyEnvName(provider)];
    return {
      mode: "configured",
      model: spec,
      keyMasked: key ? maskKey(key) : undefined,
      baseUrl: env.MF_LLM_BASE_URL || undefined
    };
  } catch (e) {
    return { mode: "error", model: spec, error: (e as Error).message };
  }
}

async function readFormBody(req: import("node:http").IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

// 实例发现：工作区根、一层子目录、examples 样例（供首页「打开已有实例」；只列可加载的）
async function discoverInstances(workspaceDir: string): Promise<{ path: string; base: string }[]> {
  const found = new Map<string, string>();
  const tryAdd = async (p: string) => {
    const loaded = await loadInstance(p);
    if (loaded.ok) found.set(p, loaded.instance.base);
  };
  await tryAdd(join(workspaceDir, "instance.yaml"));
  try {
    for (const ent of await readdir(workspaceDir, { withFileTypes: true })) {
      if (ent.isDirectory() && !["node_modules", "dist", ".git"].includes(ent.name)) {
        await tryAdd(join(workspaceDir, ent.name, "instance.yaml"));
      }
    }
  } catch { /* 工作区不可读则跳过 */ }
  try {
    for (const f of (await readdir(join(workspaceDir, "examples"))).filter((n) => n.endsWith("instance.yaml"))) {
      await tryAdd(join(workspaceDir, "examples", f));
    }
  } catch { /* 无 examples 目录则跳过 */ }
  return [...found.entries()].map(([path, base]) => ({ path, base }));
}

function parseWizardAnswers(map: { get(k: string): string | null }): { ok: true; answers: Answers } | { ok: false; errors: string[] } {
  const raw = {
    revenue_model: map.get("revenue_model") ?? "",
    user_structure: map.get("user_structure") ?? "",
    core_loop: map.get("core_loop") ?? ""
  };
  const parsed = AnswersSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  return { ok: true, answers: parsed.data };
}

// ===== AI 草案 job（内存态；产物落盘 draft.pending.yaml，重启不丢）=====
interface DraftJob {
  kind: "generate" | "refine";
  status: "running" | "done" | "error";
  error?: string;
  issues?: string[];
}

function draftPendingPath(instancePath: string): string {
  return join(dirname(instancePath), "draft.pending.yaml");
}

async function loadPendingDraft(draftFile: string): Promise<DraftLoad | { ok: false; error: string } | null> {
  let text: string;
  try {
    text = await readFile(draftFile, "utf8");
  } catch {
    return null;
  }
  const parsed = DraftSchema.safeParse(parseYaml(text));
  if (!parsed.success) {
    return {
      ok: false,
      error: `draft.pending.yaml 结构不符：${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`
    };
  }
  return { ok: true, draft: parsed.data };
}


// ===== 决策场景提交管线（v5 切片 4；与 patch 表单同构：DSL 解析 → 合入 added_scenarios → schema → materialize → 引擎 validate 全过 → 写盘）=====
// 任一步失败零写盘；错误串按 ui-contract §4 逐字（E-01/E-02 与 DSL 行级 E-03…E-08 在此层产出，
// schema 层错误按既有 `path: message` 格式、引擎层按 `[rule] path: message` 格式透出）

function readScenarioFormValues(form: URLSearchParams): ScenarioFormValues {
  const get = (k: string) => form.get(k) ?? "";
  return {
    id: get("id").trim(),
    title: get("title").trim(),
    decision_purpose: get("decision_purpose").trim(),
    question_tree: get("question_tree"),
    metric_usages: get("metric_usages"),
    method_refs: get("method_refs"),
    evidence_requirements: get("evidence_requirements").trim(),
    output_spec: get("output_spec").trim(),
    review_rules: get("review_rules").trim()
  };
}

function submitScenario(
  ctx: InstanceContext,
  values: ScenarioFormValues,
  mode: "new" | "edit"
): { ok: true; instance: Instance } | { ok: false; errors: string[] } {
  // E-07 对照集 = 当前实例物化指标名（模板指标可能已被 removed）
  const knownMetrics = new Set(materialize(ctx.base, ctx.instance).metrics.map((m) => m.name));
  const errors: string[] = [];

  if (!values.decision_purpose) {
    errors.push(`[scenario-purpose] scenarios[${values.id}].decision_purpose: 决策用途不能为空（无决策用途不可保存）`);
  }
  if (mode === "new") {
    const existing = new Set([...ctx.base.scenarios.map((s) => s.id), ...ctx.instance.added_scenarios.map((s) => s.id)]);
    if (values.id && existing.has(values.id)) {
      errors.push(`[scenario-id] scenarios: 场景 id "${values.id}" 已存在（实例内唯一；编辑已有场景请从列表「编辑」进入）`);
    }
  }

  const tree = parseQuestionTreeDsl(values.question_tree, knownMetrics);
  const usages = parseMetricUsagesDsl(values.metric_usages, knownMetrics);
  errors.push(...tree.errors, ...usages.errors);
  if (errors.length > 0) return { ok: false, errors };

  const scenario: Scenario = {
    id: values.id,
    version: "0.1.0",
    title: values.title,
    decision_purpose: values.decision_purpose,
    question_tree: tree.nodes,
    metric_usages: usages.usages,
    method_refs: values.method_refs.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    evidence_requirements: values.evidence_requirements,
    output_spec: values.output_spec,
    review_rules: values.review_rules
  };
  // 新建追加；编辑按 id 替换；id 是模板种子 id 时无既有条目可替换 → 追加即实例覆盖（D2）
  const existingIdx = ctx.instance.added_scenarios.findIndex((s) => s.id === scenario.id);
  const added =
    mode === "new" || existingIdx < 0
      ? [...ctx.instance.added_scenarios, scenario]
      : ctx.instance.added_scenarios.map((s, i) => (i === existingIdx ? scenario : s));

  const merged: Instance = { ...ctx.instance, added_scenarios: added };
  const parsed = InstanceSchema.safeParse(merged);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const materialized = materialize(ctx.base, parsed.data);
  const issues = validateInstance(materialized, ctx.base, parsed.data, { skipReviewGate: true });
  if (issues.length > 0) {
    return { ok: false, errors: issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`) };
  }
  return { ok: true, instance: parsed.data };
}

// 场景合并集（模板种子 ∪ 实例 added，同 id 实例覆盖——与 materialize 同语义）
function mergedScenarios(ctx: InstanceContext): Map<string, Scenario> {
  return new Map([...ctx.base.scenarios, ...ctx.instance.added_scenarios].map((s) => [s.id, s] as const));
}


export function createUiServer(opts: UiOptions): Server {
  // 会话内可变状态（本机单用户）：当前实例路径（向导生成/打开实例时切换，重启回退 --instance）
  let currentInstancePath = opts.instancePath;
  const envFilePath = opts.envFilePath ?? join(process.cwd(), ".env.local");
  const workspaceDir = resolve(opts.workspaceDir ?? process.cwd());
  const jobs = new Map<string, DraftJob>();

  // fire-and-forget：LLM 慢调用不占请求线程，进度由 /drafts/jobs/:id 轮询页呈现
  const runDraftJob = (job: DraftJob, base: Template, instance: Instance, instancePath: string, text: string): void => {
    void (async () => {
      try {
        const env = await resolveLlmEnv(envFilePath);
        const client = createLlmClientFromEnv(env);
        const modelLabel = env.MF_LLM_MODEL ?? (env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
        const now = new Date().toISOString();
        const result =
          job.kind === "generate"
            ? await generateDraft(client, buildGeneratePrompt(base, instance, text), text, modelLabel, now)
            : await generateRefineDraft(client, buildRefinePrompt(base, instance, text), text, modelLabel, now);
        if (!result.ok) {
          job.status = "error";
          job.error = `模型输出未通过校验（阶段 ${result.stage}）`;
          job.issues = result.issues ?? [result.stage === "call" ? result.raw : `原始返回前 300 字：${result.raw.slice(0, 300)}`];
          return;
        }
        await writeFile(
          draftPendingPath(instancePath),
          `# Metric Factory 待采纳草案（AI 生成；采纳走工作台「AI 草案」页，未采纳不写实例）\n${stringifyYaml(result.draft)}`,
          "utf8"
        );
        job.status = "done";
      } catch (e) {
        job.status = "error";
        job.error = (e as Error).message;
      }
    })();
  };
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    try {
      const templates = await discoverTemplates(opts.templatesDir);
      const statusInfo = `模板 ${templates.length} 个${currentInstancePath ? ` · 当前实例 ${currentInstancePath}` : ""}`;

      if (path === "/") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        const discovered = await discoverInstances(workspaceDir);
        const llm = await llmStatus(envFilePath);
        let hasPendingDraft = false;
        if (currentInstancePath) {
          try {
            await access(join(dirname(currentInstancePath), "draft.pending.yaml"));
            hasPendingDraft = true;
          } catch { /* 无待采纳草案 */ }
        }
        const current = ctx
          ? (() => {
              const m = materialize(ctx.base, ctx.instance);
              return {
                path: ctx.instancePath,
                base: ctx.instance.base,
                metricCount: m.metrics.length,
                pendingCount: findPendingReview(ctx.instance.added).length,
                changes: m.diff.caliber.length + m.diff.modified.length + m.diff.removed.length + m.diff.added.length
              };
            })()
          : null;
        const home = layout(
          "home",
          "工作台",
          "指标体系设计态工作台：从行业模板到企业实例，到审核与导出——全程浏览器完成。",
          homePage({ templateCount: templates.length, current, discovered, llm, hasPendingDraft }),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(home);
        return;
      }

      // ===== 问卷向导（两步）=====
      if (path === "/init") {
        const html = layout("home", "创建实例", "回答三个问题，匹配行业模板，一分钟生成你的指标体系实例。",
          wizardStep1Page(), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      const matchQ = path === "/init/match" ? url.searchParams : null;
      if ((path === "/init/match" && req.method === "GET") || (path === "/init/match" && req.method === "POST")) {
        if (req.method === "POST") {
          const form = await readFormBody(req);
          const q = new URLSearchParams({
            revenue_model: form.get("revenue_model") ?? "",
            user_structure: form.get("user_structure") ?? "",
            core_loop: form.get("core_loop") ?? ""
          });
          res.writeHead(303, { location: `/init/match?${q.toString()}` }).end();
          return;
        }
        const parsed = parseWizardAnswers(matchQ!);
        if (!parsed.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "创建实例", "问卷答案不完整。", wizardStep1Page({ errors: parsed.errors, values: Object.fromEntries(matchQ!) }), statusInfo)
          );
          return;
        }
        const match = matchTemplates(parsed.answers, templates);
        const html = layout("home", "创建实例 · 匹配结果", "根据你的回答推荐行业模板；确认后生成实例。",
          wizardStep2Page(match, templates, parsed.answers), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      if (path === "/init/create" && req.method === "POST") {
        const form = await readFormBody(req);
        const parsed = parseWizardAnswers(form);
        if (!parsed.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "创建实例", "问卷答案不完整。", wizardStep1Page({ errors: parsed.errors }), statusInfo)
          );
          return;
        }
        const answers = parsed.answers;
        const templateId = form.get("template_id") ?? "";
        const chosen = templates.find((t) => t.template.id === templateId);
        const name = form.get("name")?.trim() ?? "";
        const rerender = (errors: string[]) => {
          const match = matchTemplates(answers, templates);
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "创建实例", "生成实例前校验未通过（零写盘）。", wizardStep2Page(match, templates, parsed.answers, { errors, name, templateId }), statusInfo)
          );
        };
        if (!chosen) {
          rerender([`所选模板 ${templateId || "（空）"} 不存在，请重新选择`]);
          return;
        }
        if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
          rerender([`实例目录名需以小写字母或数字开头，仅含小写字母、数字、中划线、下划线（收到 "${name}"）`]);
          return;
        }
        const outPath = join(workspaceDir, name, "instance.yaml");
        try {
          await access(outPath);
          rerender([`目录 ${name}/ 下已存在 instance.yaml，为避免覆盖请换一个名字`]);
          return;
        } catch { /* 不存在，可创建 */ }
        const instance = buildInstance(chosen, answers, new Date().toISOString());
        const validated = InstanceSchema.safeParse(instance);
        if (!validated.success) {
          rerender(validated.error.issues.map((i) => `[instance] ${i.path.join(".")}: ${i.message}`));
          return;
        }
        await mkdir(dirname(outPath), { recursive: true });
        await writeInstanceFile(outPath, validated.data);
        currentInstancePath = outPath;
        res.writeHead(303, { location: "/instance" }).end();
        return;
      }

      if (path === "/instance/open" && req.method === "POST") {
        const form = await readFormBody(req);
        const raw = form.get("path") ?? "";
        const target = resolve(raw);
        const discovered = await discoverInstances(workspaceDir);
        const allowed = new Set(
          [opts.instancePath, currentInstancePath, ...discovered.map((d) => d.path)].filter(Boolean).map((p) => resolve(p!))
        );
        if (!allowed.has(target)) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "打开失败", "该路径不在工作区实例白名单内。", formErrorPage("拒绝打开", [`${raw} 不在工作区扫描到的实例列表内（仅支持工作区一层目录与 examples 下的实例）`]), statusInfo)
          );
          return;
        }
        const loaded = await loadInstance(target);
        if (!loaded.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "打开失败", "实例文件无法解析。", formErrorPage("实例不可加载", loaded.errors.map((e) => `${e.path}: ${e.message}`)), statusInfo)
          );
          return;
        }
        currentInstancePath = target;
        res.writeHead(303, { location: "/instance" }).end();
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
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "我的实例", "当前没有打开的实例。",
              `<div class="empty">还没有实例<br><span style="font-size:12px">用问卷向导创建，或在首页打开已有实例</span><br><a class="btn btn-primary" href="/init">创建实例</a>&nbsp;<a class="btn" href="/">返回工作台</a></div>`, statusInfo)
          );
          return;
        }
        const materialized = materialize(ctx.base, ctx.instance);
        const html = layout("instance", "我的实例", `基模板 ${escapeHtml(ctx.instance.base)} · 下方可微调（口径开关/增删改）并写回，写回前经全量校验。`,
          instancePage(materialized, ctx.instance, ctx.instancePath, ctx.base), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      // ===== 决策场景（v5 切片 4；ui-contract §0.1 路由钉死：独立表单页 + 原生 form POST，零客户端脚本）=====
      if (path === "/instance/scenarios/new") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("instance", "决策场景 · 新建", "新建决策场景并写回实例（写回前经全量校验，失败零写盘）。",
            scenarioFormPage({ mode: "new", values: emptyScenarioFormValues() }), statusInfo)
        );
        return;
      }

      const scenarioEditMatch = path.match(/^\/instance\/scenarios\/([a-z][a-z0-9_]*)\/edit$/);
      if (scenarioEditMatch && req.method === "GET") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const id = scenarioEditMatch[1]!;
        const scn = mergedScenarios(ctx).get(id);
        if (!scn) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到场景", `场景 ${escapeHtml(id)} 不存在。`,
              `<div class="empty">场景不存在<br><span class="mono">${escapeHtml(id)}</span><br><a class="btn" href="/instance">返回实例</a></div>`, statusInfo)
          );
          return;
        }
        // fork 语义提示仅对未被实例覆盖的模板种子显示（T-04）
        const isUntouchedSeed = ctx.base.scenarios.some((s) => s.id === id) && !ctx.instance.added_scenarios.some((s) => s.id === id);
        const desc = `编辑决策场景（写回前经全量校验，失败零写盘）。${isUntouchedSeed ? "保存后此场景以实例版本生效（覆盖模板种子）。" : ""}`;
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("instance", "决策场景 · 编辑", desc, scenarioFormPage({ mode: "edit", values: scenarioFormValues(scn) }), statusInfo)
        );
        return;
      }

      if (path === "/instance/scenarios" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const values = readScenarioFormValues(form);
        const result = submitScenario(ctx, values, "new");
        if (!result.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "决策场景 · 新建", "全量校验未通过（零写盘）——修正下列问题后重试。",
              scenarioFormPage({ mode: "new", values, errors: result.errors }), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, result.instance);
        res.writeHead(303, { location: "/instance" }).end();
        return;
      }

      const scenarioPostMatch = path.match(/^\/instance\/scenarios\/([a-z][a-z0-9_]*)$/);
      if (scenarioPostMatch && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const id = scenarioPostMatch[1]!;
        if (!mergedScenarios(ctx).has(id)) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到场景", `场景 ${escapeHtml(id)} 不存在。`,
              `<div class="empty">场景不存在<br><span class="mono">${escapeHtml(id)}</span><br><a class="btn" href="/instance">返回实例</a></div>`, statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const values = { ...readScenarioFormValues(form), id }; // id 以路径为准
        const result = submitScenario(ctx, values, "edit");
        if (!result.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "决策场景 · 编辑", "全量校验未通过（零写盘）——修正下列问题后重试。",
              scenarioFormPage({ mode: "edit", values, errors: result.errors }), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, result.instance);
        res.writeHead(303, { location: "/instance" }).end();
        return;
      }

      // ===== 导出下载（四格式；与 CLI export 同语义：mapping 自动发现 + 全量校验 + fail-closed 门）=====
      // sap 不在静态表内：装配依赖当前实例（基模板 / 文件名 slug / concept_refs），ctx 加载后走 createSapExporter 工厂（与 CLI 同管线，无第二套规则）
      const exporters: Record<string, Exporter> = {
        metricflow: metricflowExporter,
        excel: excelExporter,
        mermaid: mermaidExporter
      };
      const exportMatch = path.match(/^\/instance\/export\/([a-z]+)$/);
      if (exportMatch && (req.method === "GET" || req.method === "HEAD")) {
        const format = exportMatch[1]!;
        if (format !== "sap" && !exporters[format]) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到格式", `不支持的导出格式 ${escapeHtml(format)}。`, `<div class="empty">可选：metricflow / excel / mermaid / sap<br><a class="btn" href="/instance">返回实例</a></div>`, statusInfo)
          );
          return;
        }
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const materialized = materialize(ctx.base, ctx.instance);
        // 数仓映射装配：与实例同目录自动发现，损坏静默视为无映射（不阻断既有导出）
        const mappingPath = ctx.instancePath.replace(/\.yaml$/, ".mapping.yaml");
        try {
          const mappingFile = MappingSchema.safeParse(parseYaml(await readFile(mappingPath, "utf8")));
          if (mappingFile.success && mappingFile.data.mappings.length > 0) {
            const names = new Set(materialized.metrics.map((m) => m.name));
            materialized.mapping = mappingFile.data.mappings.filter((m) => names.has(m.metric));
          }
        } catch { /* 无映射文件 */ }
        const issues = validateInstance(materialized, ctx.base, ctx.instance);
        if (issues.length > 0) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "导出前校验未通过", "实例存在未解决问题，修正后才能导出。", formErrorPage("校验失败", issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)), statusInfo)
          );
          return;
        }
        try {
          const exporter: Exporter =
            format === "sap"
              ? createSapExporter({
                  template: ctx.base,
                  packageId: packageIdFromInstancePath(ctx.instancePath),
                  instanceConceptRefs: ctx.instance.concept_refs
                })
              : exporters[format]!;
          const result = await exporter.export(materialized);
          const mime = format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : format === "metricflow" || format === "sap"
              ? "text/yaml; charset=utf-8"
              : "text/plain; charset=utf-8";
          res.writeHead(200, {
            "content-type": mime,
            "content-disposition": `attachment; filename="${result.filename}"`
          });
          res.end(result.content);
        } catch (e) {
          if (e instanceof ExportBlockedError) {
            res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
              layout("instance", "导出被阻断（fail-closed）", "以下 LLM 生成指标未经人工审核，完成审核后才能导出。",
                `<div class="card"><div class="card-h" style="color:var(--fail)">待审核指标</div>
                <ul class="error-list">${e.blockedMetrics.map((n) => `<li><span class="mono">${escapeHtml(n)}</span></li>`).join("")}</ul>
                <a class="btn btn-primary" href="/review">前往审核中心</a></div>`, statusInfo)
            );
            return;
          }
          // 供应侧查重拒绝 / SAP 包校验失败：与 CLI 同语义（exit 1 的 UI 等价物），422 带文字错误页而非兜底 500
          if (e instanceof SapAssemblyError) {
            res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
              layout("instance", "导出装配未通过", "SAP 语义包供应侧查重 fail-closed，修正实例后才能导出。",
                formErrorPage("装配被拒绝（fail-closed）", [`[${e.rule}] ${e.message}`]), statusInfo)
            );
            return;
          }
          if (e instanceof SapExportValidationError) {
            res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
              layout("instance", "导出校验未通过", "SAP 语义包校验 fail-closed，修正包内容后才能导出。",
                formErrorPage("校验失败", e.issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)), statusInfo)
            );
            return;
          }
          throw e;
        }
        return;
      }

      if (path === "/instance/patch" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
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
        const ctx = await loadInstanceContext(currentInstancePath, templates);
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
        const ctx = await loadInstanceContext(currentInstancePath, templates);
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

      // ===== AI 草案工坊 =====
      if (path === "/drafts") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        const llm = await llmStatus(envFilePath);
        const pending = ctx ? await loadPendingDraft(draftPendingPath(ctx.instancePath)) : null;
        const html = layout(
          "drafts",
          "AI 草案",
          "AI 出初稿、你当守门员：草案在采纳前不写入实例；采纳后进入审核中心，批准前导出被硬阻断。",
          draftsPage({ hasInstance: Boolean(ctx), llm, pending }),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      if ((path === "/drafts/generate" || path === "/drafts/refine") && req.method === "POST") {
        const kind = path === "/drafts/generate" ? "generate" : "refine";
        const field = kind === "generate" ? "describe" : "instruction";
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "未指定实例。", formErrorPage("无实例", ["AI 草案基于当前实例生成，请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const text = form.get(field)?.trim() ?? "";
        const llm = await llmStatus(envFilePath);
        const fail = async (errors: string[]) => {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "提交未通过校验。", draftsPage({ hasInstance: true, llm, pending: await loadPendingDraft(draftPendingPath(ctx.instancePath)), errors, values: { [field]: text } as { describe?: string; instruction?: string } }), statusInfo)
          );
        };
        if (llm.mode !== "configured" && llm.mode !== "faux") {
          fail(["AI 模型未配置或配置有误，请先到设置页完成配置", llm.error ?? ""].filter(Boolean));
          return;
        }
        if (!text) {
          fail([kind === "generate" ? "业务描述不能为空" : "调整指令不能为空"]);
          return;
        }
        const id = randomUUID().slice(0, 8);
        const job: DraftJob = { kind, status: "running" };
        jobs.set(id, job);
        runDraftJob(job, ctx.base, ctx.instance, ctx.instancePath, text);
        res.writeHead(303, { location: `/drafts/jobs/${id}` }).end();
        return;
      }

      const jobMatch = path.match(/^\/drafts\/jobs\/([a-f0-9]+)$/);
      if (jobMatch) {
        const job = jobs.get(jobMatch[1]!);
        if (!job) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "未找到任务", "该生成任务不存在（可能已重启服务）。", `<div class="empty">任务不存在<br><a class="btn" href="/drafts">返回草案工坊</a></div>`, statusInfo)
          );
          return;
        }
        if (job.status === "running") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案 · 生成中", "AI 正在生成草案，本页自动刷新。", jobRunningPage(job.kind), statusInfo,
              `<meta http-equiv="refresh" content="2">`)
          );
          return;
        }
        if (job.status === "done") {
          res.writeHead(303, { location: "/drafts" }).end();
          return;
        }
        res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
          layout("drafts", "AI 草案 · 生成失败", "模型调用或输出校验失败。", jobErrorPage(job.kind, job.error ?? "未知错误", job.issues), statusInfo)
        );
        return;
      }

      if (path === "/drafts/apply" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const pending = await loadPendingDraft(draftPendingPath(ctx.instancePath));
        if (!pending) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "无待采纳草案。", formErrorPage("无草案", ["没有可采纳的草案，请先生成"]), statusInfo)
          );
          return;
        }
        if (!pending.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "草案文件损坏，无法采纳。", formErrorPage("草案损坏", [pending.error]), statusInfo)
          );
          return;
        }
        const applied = applyDraft(ctx.instance, pending.draft, ctx.base);
        if (!applied.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "草案合入校验未通过（零写盘，草案已保留）。", formErrorPage("合入失败", applied.errors.map((e) => `[${e.rule}] ${e.message}`)), statusInfo)
          );
          return;
        }
        const materialized = materialize(ctx.base, applied.instance);
        const issues = validateInstance(materialized, ctx.base, applied.instance, { skipReviewGate: true });
        if (issues.length > 0) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("drafts", "AI 草案", "草案合入校验未通过（零写盘，草案已保留）。", formErrorPage("校验失败", issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, applied.instance);
        await rm(draftPendingPath(ctx.instancePath), { force: true });
        res.writeHead(303, { location: "/review" }).end();
        return;
      }

      if (path === "/drafts/discard" && req.method === "POST") {
        if (currentInstancePath) {
          await rm(draftPendingPath(currentInstancePath), { force: true });
        }
        res.writeHead(303, { location: "/drafts" }).end();
        return;
      }

      // ===== 设置（LLM 模型配置，存 .env.local）=====
      if (path === "/settings") {
        const status = await llmStatus(envFilePath);
        const html = layout("settings", "设置", "AI 模型连接与工作台信息。配置仅存本机 .env.local（git 已忽略），页面不回显密钥。",
          settingsPage(status), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      if (path === "/settings/save" && req.method === "POST") {
        const form = await readFormBody(req);
        const model = form.get("model")?.trim() ?? "";
        const apiKey = form.get("api_key")?.trim() ?? "";
        const baseUrl = form.get("base_url")?.trim() ?? "";
        const slash = model.indexOf("/");
        if (slash <= 0 || slash === model.length - 1) {
          const status = await llmStatus(envFilePath);
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("settings", "保存失败", "模型格式不正确。", settingsPage(status, {
              errors: [`模型需为 <provider>/<model-id> 形式（收到 "${model}"），如 openai/gpt-4o`],
              values: { model, baseUrl }
            }), statusInfo)
          );
          return;
        }
        const provider = model.slice(0, slash);
        const updates: Record<string, string | null> = { MF_LLM_MODEL: model, MF_LLM_BASE_URL: baseUrl || null };
        if (apiKey) updates[apiKeyEnvName(provider)] = apiKey;
        await writeManagedEnv(envFilePath, updates);
        res.writeHead(303, { location: "/settings" }).end();
        return;
      }

      if (path === "/settings/clear" && req.method === "POST") {
        const existing = await readEnvFile(envFilePath);
        const updates: Record<string, string | null> = { MF_LLM_MODEL: null, MF_LLM_BASE_URL: null };
        const spec = existing.MF_LLM_MODEL;
        if (spec) {
          const slash = spec.indexOf("/");
          if (slash > 0) updates[apiKeyEnvName(spec.slice(0, slash))] = null;
        }
        await writeManagedEnv(envFilePath, updates);
        res.writeHead(303, { location: "/settings" }).end();
        return;
      }

      // 品牌资产（JuanerAI logo，09-28 契约 UI-00；src 运行与 dist 打包两种布局兼容）
      if (path === "/assets/juanerai-logo-slogan.png") {
        const here = dirname(fileURLToPath(import.meta.url));
        for (const dir of [resolve(here, "../../assets"), resolve(here, "../assets")]) {
          try {
            const png = await readFile(join(dir, "juanerai-logo-slogan.png"));
            res.writeHead(200, { "content-type": "image/png", "cache-control": "public, max-age=86400" }).end(png);
            return;
          } catch { /* 尝试下一个候选目录 */ }
        }
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("logo asset missing");
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
