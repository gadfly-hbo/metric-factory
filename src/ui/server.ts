import { createServer, type Server } from "node:http";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTemplate } from "../engine/loader.js";
import { layout, templatesPage, templateDetailPage, instancePage, reviewPage, formErrorPage, escapeHtml, emptyScenarioFormValues, scenarioFormPage, scenarioFormValues, scenariosBlock, viewNav, releaseBlock, receiptsBlock, chip, type ScenarioFormValues, type ReleaseUiState, type ReceiptsUiState } from "./render.js";
import {
  overviewPage, blueprintEditPage, blueprintFormValues, deliveryPage, metricDeleteImpactPage,
  blueprintDraftPreviewPage, methodsLibrarySection, methodDetailPage, exportBlock,
  saveAsMethodPage, saveAsMethodValues, importFormPage, importPreviewPage,
  type BlueprintFormValues, type SaveAsMethodValues, type ImportKind
} from "./render-blueprint.js";
import {
  parseQuestionTreeDsl, parseMetricUsagesDsl, parseMethodBindingsDsl,
  parseQuestionsDsl, parseHypothesesDsl, parseEvidenceDsl, parseOptionsDsl
} from "./dsl.js";
import { loadInstance } from "../engine/loader.js";
import { materialize, resolveBaseTemplate, EMPTY_TEMPLATE, type MaterializedInstance } from "../engine/materialize.js";
import { findPendingReview, applyApproval, applyRejection } from "../engine/review.js";
import { writeInstanceFile } from "../engine/io.js";
import { InstanceSchema } from "../schema/instance.js";
import type { Instance } from "../schema/instance.js";
import type { Template } from "../schema/template.js";
import { TemplateSchema } from "../schema/template.js";
import { BlueprintSchema, type JudgmentKind, type EvidenceStatus } from "../schema/blueprint.js";
import { MethodTemplateSchema } from "../schema/method.js";
import { createLlmClientFromEnv } from "../llm/index.js";
import { readEnvFile, writeManagedEnv, apiKeyEnvName, maskKey } from "./env-file.js";
import { resolveLlmEnvAuto, DEFAULT_CHAIN } from "../llm/env-auto.js";
import { aggregateCallStats } from "../llm/call-stats.js";
import { isAuditDegraded, resolveDataDir } from "../llm/audit-sink.js";
import { tryParseBudgetCaps } from "../llm/index.js";
import { createFileBudgetStore } from "../llm/budget-store.js";
import type { StatsView } from "./render-settings.js";
import { settingsPage, type ChainEntry, type LlmStatus } from "./render-settings.js";
import {
  writeWithGate, patchBlueprintFields, patchHypothesis, patchEvidence, patchMetric, deleteMetric, patchScene, patchSceneBindings, resolveCalibers, methodYamlFromScene, methodIdFromSceneId, methodRoleId,
  type WriteCtx
} from "./api-write.js";
import { wizardStep1Page, wizardStep2Page } from "./render-wizard.js";
import { homePage } from "./render-home.js";
import { AnswersSchema, type Answers } from "../schema/answers.js";
import { matchTemplates } from "../engine/match.js";
import { buildInstance } from "../engine/instantiate.js";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, access, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { generateDraft, generateRefineDraft, generateBlueprintDraft } from "../engine/generate.js";
import { buildGeneratePrompt, buildRefinePrompt, buildBlueprintGeneratePrompt, buildBlueprintRefinePrompt } from "../llm/prompt.js";
import { applyDraft } from "../engine/apply.js";
import { DraftSchema } from "../schema/draft.js";
import { draftsPage, jobRunningPage, jobErrorPage, type DraftLoad } from "./render-drafts.js";
import { metricflowExporter } from "../export/metricflow.js";
import { excelExporter } from "../export/excel.js";
import { mermaidExporter } from "../export/mermaid.js";
import { createSapExporter, packageIdFromInstancePath, SapExportValidationError } from "../export/sap.js";
import { SapAssemblyError } from "../sap/assemble.js";
import { releaseInstance, ReleaseError } from "../sap/release.js";
import { registerReceipt, listReceipts, ReceiptError } from "../sap/receipt.js";
import { ExportBlockedError } from "../export/gate.js";
import type { Exporter } from "../export/types.js";
import { MappingSchema } from "../schema/mapping.js";
import type { Scenario } from "../schema/scenario.js";
import type { MethodTemplate } from "../schema/method.js";
import { loadMethodsFromDir, defaultMethodsDir, lintMethodTemplate } from "../engine/methods.js";
import {
  validateDesign, designReview, blueprintReviewStatus, designFingerprint, findMetricReferences
} from "../engine/blueprint.js";
export interface UiOptions {
  instancePath?: string;
  templatesDir: string;
  /** LLM 配置文件（.env.local）；默认 <cwd>/.env.local，测试可注入临时路径 */
  envFilePath?: string;
  /** 密钥自动发现源（pi CLI auth.json）；默认 ~/.pi/agent/auth.json，测试注入临时 fixture 密闭（D3/G1） */
  authJsonPath?: string;
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

// A1 D3：方法模板库（<templatesDir>/methods；目录不存在 = 空库合法；装载失败 fail-closed 抛错）
async function discoverMethods(dir: string): Promise<MethodTemplate[]> {
  const result = await loadMethodsFromDir(defaultMethodsDir(dir));
  if (!result.ok) {
    const detail =
      result.kind === "read"
        ? result.message
        : result.errors.map((e) => `${e.file} ${e.error.path}: ${e.error.message}`).join("；");
    throw new Error(`方法模板库不可用：${detail}`);
  }
  return result.methods;
}

interface InstanceContext {
  instance: Instance;
  base: Template;
  instancePath: string;
}

// A2 LA1：实例 → 评审原型 system 形状 DTO（G1/G2/G3 映射；T4 扩全量派生面）
const JUDGMENT_RULE = "事实、解释、假设和建议分别表达；证据不足时保留未完成判断。";
const ROLE_LABELS: Record<string, string> = { outcome: "结果指标", driver: "驱动指标", guardrail: "护栏指标" };

// A2 T4：delivered 派生（G3）——releases/index.yaml 按包取最新版本；比较用快照对读在 T6 交付流接
function latestRelease(workspaceDir: string, packageId: string): { version: string; created_at: string } | null {
  try {
    const doc = parseYaml(readFileSync(join(workspaceDir, "releases", "index.yaml"), "utf8")) as
      { releases?: Array<{ package: string; version: string; created_at: string }> } | null;
    const entries = (doc?.releases ?? []).filter(r => r.package === packageId);
    if (entries.length === 0) return null;
    return entries[entries.length - 1] ?? null; // 登记序即时间序（追加式）
  } catch { return null; }
}

function buildSystemDto(ctx: InstanceContext, templates: Template[], workspaceDir: string, methods: MethodTemplate[] = []): Record<string, unknown> {
  const mat = materialize(ctx.base, ctx.instance);
  const bp = ctx.instance.blueprint;
  const id = relative(workspaceDir, ctx.instancePath) || basename(ctx.instancePath);
  const groupByMetric = new Map<string, string>();
  for (const tree of ctx.base.trees) for (const child of tree.children) groupByMetric.set(child, tree.category ?? tree.id);
  const methodById = new Map(methods.map((m) => [m.method.id, m]));
  return {
    id,
    title: bp?.title ?? basename(dirname(ctx.instancePath)),
    goal: bp?.purpose ?? "",
    source: ctx.instance.base ? `模板基座 · ${ctx.base.template.industry}` : "AI 草稿",
    hasBlueprint: Boolean(bp),
    blueprint: bp
      ? {
          title: bp.title,
          preset: bp.contexts.includes("战略选择") ? "strategy" : bp.contexts.includes("独立数据专题") ? "data" : "operating",
          intent: bp.intent, contexts: bp.contexts, organizations: bp.organizations,
          purpose: bp.purpose, decision: bp.decision, boundary: bp.boundary, deliverable: bp.deliverable,
          questions: bp.questions.map((q) => ({ title: q.title, detail: q.detail ?? "", metricRefs: q.metric_refs })),
          hypotheses: bp.hypotheses.map((h) => ({
            id: h.id, text: h.statement, support: h.support, counter: h.counter,
            change: h.change_condition, kind: h.judgment, verified: h.verified
          })),
          evidence: bp.evidence_plan.map((e) => ({
            id: e.id, name: e.name, kind: e.kind, source: e.source, check: e.check,
            failure: e.insufficiency, status: e.status
          })),
          options: bp.options.map((o) => ({ name: o.name, tradeoff: o.tradeoff })),
          judgmentRule: JUDGMENT_RULE, methodId: null
        }
      : {
          title: basename(dirname(ctx.instancePath)), preset: "metrics", intent: "建设可复用体系",
          contexts: ["经营改善"], organizations: ["假设先行"], purpose: "", decision: "", boundary: "", deliverable: "",
          questions: [], hypotheses: [], evidence: [], options: [], judgmentRule: JUDGMENT_RULE, methodId: null
        },
    metrics: mat.metrics.map((m) => ({
      id: m.name, name: m.display_name, group: groupByMetric.get(m.name) ?? "未分组",
      description: m.definition, formula: m.type_params?.expr ?? "计算关系见口径定义", unit: "—",
      dependencies: []
    })),
    scenes: mat.scenarios.map((s) => {
      const methodRef = s.method_bindings?.[0]?.method_ref ?? s.method_refs?.[0] ?? null;
      const method = methodRef ? methodById.get(methodRef.split("@")[0] ?? methodRef) : undefined;
      return {
        id: s.id, name: s.title ?? s.id, methodId: methodRef?.split("@")[0] ?? null,
        methodName: method?.method.name ?? methodRef ?? "未引用方法",
        purpose: s.decision_purpose,
        family: method?.family ?? "描述分解",
        contexts: method?.contexts ?? ["经营改善"],
        limit: method?.limits ?? "描述性拆解不自动提供因果解释；真实执行支持需另行核对。",
        evidence: method?.evidence ?? "同范围的原始记录、明确口径与独立核验条件。",
        steps: (method?.steps ?? []).map((st) => ({ title: st.title, detail: st.detail })),
        bindings: [
          ...s.metric_usages.map((u) => ({ role: ROLE_LABELS[u.role] ?? u.role, metric: u.metric, required: true })),
          ...(s.method_bindings ?? []).map((b) => {
            const role = method?.roles.find((r) => r.id === b.role);
            return { role: role?.name ?? b.role, metric: b.metric, required: role?.required ?? true };
          })
        ]
      };
    }),
    pending: derivePending(mat), // G2：约定键派生（退款归属/复购窗口；确认动作 T5 写 added 指标 caliber_switches）
    confirmed: blueprintReviewStatus(mat).state === "valid",
    reviewState: blueprintReviewStatus(mat).state,
    reviewPending: mat.metrics.filter(m => m.provenance.origin === "llm" && !m.provenance.reviewed_by).map(m => ({ name: m.name, display: m.display_name })),
    engineReady: designReview(mat, ctx.base, ctx.instance, []).ready, // T6 交付门真值基础（方法面由调用方按需重算覆盖）
    delivered: latestRelease(workspaceDir, packageIdFromInstancePath(ctx.instancePath)),
    revision: 1, // G3：丢弃自增号；「有新工作草稿」标签由 release 快照对读派生
    chat: [], proposal: null,
    metricOnly: mat.scenarios.length === 0 && !ctx.instance.blueprint
  };
}

// G2 判据实现：退款/复购类指标存在 → 口径问题面；已确认 = 物化 caliber_switches 带约定键
// 键名约定（U1-b/G2）：refund_to_payment_period: boolean；repeat_window_<30|90|180>d: true（选中的窗口）
const PENDING_RULES: Array<{ key: "refund" | "repeat"; caliberKeys: string[]; match: RegExp }> = [
  { key: "refund", caliberKeys: ["refund_to_payment_period"], match: /refund|退款/ },
  { key: "repeat", caliberKeys: ["repeat_window_30d", "repeat_window_90d", "repeat_window_180d"], match: /repeat|复购/ }
];
function derivePending(mat: MaterializedInstance): Record<string, boolean | string | null> {
  const pending: Record<string, boolean | string | null> = {};
  for (const rule of PENDING_RULES) {
    const related = mat.metrics.filter(m => rule.match.test(m.name) || rule.match.test(m.display_name));
    if (related.length === 0) continue;
    if (rule.key === "refund") {
      const hit = related.find(m => typeof m.caliber_switches.refund_to_payment_period === "boolean");
      pending.refund = hit ? (hit.caliber_switches.refund_to_payment_period as boolean) : null;
    } else {
      const confirmed = rule.caliberKeys.flatMap(k => related.filter(m => m.caliber_switches[k] === true).map(() => k.slice("repeat_window_".length, -1)))[0];
      pending.repeat = confirmed ?? null;
    }
  }
  return pending;
}


async function loadInstanceContext(instancePath: string | undefined, templates: Template[]): Promise<InstanceContext | null> {
  if (!instancePath) return null;
  const loaded = await loadInstance(instancePath);
  if (!loaded.ok) return null;
  // A1 D13：空白起点（无 base）→ 合成空基座
  const base = resolveBaseTemplate(loaded.instance, templates);
  if (!base) return null;
  return { instance: loaded.instance, base, instancePath };
}

// LLM 连接状态（试构造 client；key 只取打码形式）
// M2：env 经共享合成（process env > .env.local > 自动发现，②A），零配置默认链（G3）在此生效；
// shadowedKeys = .env.local 有值但被进程环境同名值覆盖的键（G5 遮蔽警告数据面）；
// chain/modelSource/otherProviders = D9/G9 读侧「查看」面数据（三 UI 面共用同一事实源）
async function llmStatus(envFilePath: string, authJsonPath?: string): Promise<LlmStatus> {
  const { env, sources, discoveredProviders } = await resolveLlmEnvAuto({
    processEnv: process.env,
    envFilePath,
    authJsonPath
  });
  if (env.MF_LLM_BACKEND === "faux") return { mode: "faux" };
  const spec = env.MF_LLM_MODEL;
  if (!spec) return { mode: "unconfigured" };

  // 链构成（与工厂同解析规则：主 + fallbacks 逗号分隔，trim 忽略空项保序）。
  // 契约 S2/G9a：默认链模式下「查看」面画完整默认链定义——缺 key 候选标「缺失（调用时自动跳过）」
  // （US3 语义：发现到几家启用几家，缺的被跳过但仍可见），注入的生效链是其子集。
  const modelSource0 = (sources["MF_LLM_MODEL"] as LlmStatus["modelSource"] | undefined) ?? "process";
  const specs =
    modelSource0 === "default-chain"
      ? [...DEFAULT_CHAIN]
      : [spec, ...(env.MF_LLM_FALLBACK_MODELS ?? "").split(",").map((s) => s.trim()).filter(Boolean)];
  const chain = specs.map((s, i) => {
    const slash = s.indexOf("/");
    const provider = slash > 0 ? s.slice(0, slash) : s;
    const varName = apiKeyEnvName(provider);
    const key = env[varName];
    const source: ChainEntry["source"] = key ? (sources[varName] as ChainEntry["source"] | undefined) ?? "process" : "missing";
    return {
      spec: s,
      role: i === 0 ? "主" : `备${i}`,
      source,
      keyMasked: key ? maskKey(key) : undefined
    };
  });
  const chainProviders = new Set(chain.map((c) => c.spec.slice(0, c.spec.indexOf("/"))));
  const otherProviders = discoveredProviders.filter((p) => !chainProviders.has(p));
  const modelSource = modelSource0;
  const gateway = env.MF_LLM_BASE_URL
    ? { url: env.MF_LLM_BASE_URL, source: (sources["MF_LLM_BASE_URL"] as "process" | "env-file" | undefined) ?? "process" }
    : undefined;
  const envFile = await readEnvFile(envFilePath);
  const shadowedKeys = Object.keys(envFile).filter(
    (k) => envFile[k] && envFile[k]!.trim() !== "" && nonEmptyEnv(process.env[k])
  );
  const shadow = shadowedKeys.length > 0 ? shadowedKeys : undefined;

  try {
    createLlmClientFromEnv(env);
    const fallbackCount = chain.length - 1;
    return {
      mode: "configured",
      model: fallbackCount > 0 ? `${spec} (+${fallbackCount} 备)` : spec,
      mainSpec: chain[0]?.spec,
      keyMasked: chain[0]?.keyMasked,
      baseUrl: env.MF_LLM_BASE_URL || undefined,
      shadowedKeys: shadow,
      modelSource,
      chain,
      gateway,
      otherProviders: otherProviders.length > 0 ? otherProviders : undefined
    };
  } catch (e) {
    return {
      mode: "error",
      model: spec,
      mainSpec: chain[0]?.spec,
      error: (e as Error).message,
      shadowedKeys: shadow,
      modelSource,
      chain,
      gateway,
      otherProviders: otherProviders.length > 0 ? otherProviders : undefined
    };
  }
}

function nonEmptyEnv(v: string | undefined): boolean {
  return v !== undefined && v.trim() !== "";
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

async function readFormBody(req: import("node:http").IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

// 实例发现：工作区根、一层子目录、examples 样例（供首页「打开已有实例」；只列可加载的）
async function discoverInstances(workspaceDir: string): Promise<{ path: string; base: string | undefined }[]> {
  const found = new Map<string, string | undefined>();
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
  /** A2：JSON API 轮询用（A1 表单流 id 在 map key，对象内可缺省） */
  id?: string;
  kind: "generate" | "refine";
  status: "running" | "done" | "error";
  error?: string;
  issues?: string[];
  /** A1：完成后去向——指标草案（drafts）/ 蓝图草案预览（blueprint）/ 首页创建流预览（blueprint-create） */
  returnTo?: "drafts" | "blueprint" | "blueprint-create";
  /** A2 T3（G1 自动落盘）：创建 job 完成后的实例相对路径 */
  instanceId?: string;
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
    method_bindings: get("method_bindings"),
    evidence_requirements: get("evidence_requirements").trim(),
    output_spec: get("output_spec").trim(),
    review_rules: get("review_rules").trim()
  };
}

function submitScenario(
  ctx: InstanceContext,
  methods: MethodTemplate[],
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
  const bindings = parseMethodBindingsDsl(values.method_bindings, knownMetrics);
  errors.push(...tree.errors, ...usages.errors, ...bindings.errors);
  if (errors.length > 0) return { ok: false, errors };

  const scenario: Scenario = {
    id: values.id,
    version: "0.1.0",
    title: values.title,
    decision_purpose: values.decision_purpose,
    question_tree: tree.nodes,
    metric_usages: usages.usages,
    method_refs: values.method_refs.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    ...(bindings.bindings.length > 0 ? { method_bindings: bindings.bindings } : {}),
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
  const issues = validateDesign(materialized, ctx.base, parsed.data, methods, { skipReviewGate: true, writeMode: true });
  if (issues.length > 0) {
    return { ok: false, errors: issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`) };
  }
  return { ok: true, instance: parsed.data };
}

// 场景合并集（模板种子 ∪ 实例 added，同 id 实例覆盖——与 materialize 同语义）
function mergedScenarios(ctx: InstanceContext): Map<string, Scenario> {
  return new Map([...ctx.base.scenarios, ...ctx.instance.added_scenarios].map((s) => [s.id, s] as const));
}

// A1 四视图共享：无实例空态（布局归属「我的体系」；指引回首页 NL 入口与向导）
function noInstanceView(statusInfo: string, title = "我的体系"): string {
  return layout("instance", title, "当前没有打开的实例。",
    `<div class="empty">还没有实例<br><span style="font-size:0.82rem">在首页用一句话生成分析设计草稿，或用问卷向导从模板创建</span><br><a class="btn btn-primary" href="/">返回首页开始</a>&nbsp;<a class="btn" href="/init">创建实例</a></div>`, statusInfo);
}


export function createUiServer(opts: UiOptions): Server {
  // 会话内可变状态（本机单用户）：当前实例路径（向导生成/打开实例时切换，重启回退 --instance）
  let currentInstancePath = opts.instancePath;
  const envFilePath = opts.envFilePath ?? join(process.cwd(), ".env.local");
  const authJsonPath = opts.authJsonPath; // 密闭缝（D3/G1）：测试注入 fixture，生产缺省真实发现
  const workspaceDir = resolve(opts.workspaceDir ?? process.cwd());
  const jobs = new Map<string, DraftJob>();

  // fire-and-forget：LLM 慢调用不占请求线程，进度由 /drafts/jobs/:id 轮询页呈现
  const runDraftJob = (job: DraftJob, base: Template, instance: Instance, instancePath: string, text: string): void => {
    void (async () => {
      try {
        const { env } = await resolveLlmEnvAuto({ processEnv: process.env, envFilePath, authJsonPath: opts.authJsonPath });
        const client = createLlmClientFromEnv(env, job.kind); // M3 D6：caller 标签（generate/refine）
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

  // A1：分析体系蓝图 job（D9 prompt v1.0.0 独立版本；caller 标签仍用 generate/refine 保 taskId 统计）。
  // 产物落盘：实例内生成/修正 → 实例旁 draft.pending.yaml（与指标草案同一单文件通道）；
  // 首页创建流（无实例）→ 工作区级 draft.pending.create.yaml，采纳时创建空白基座工作稿。
  const createDraftPath = join(workspaceDir, "draft.pending.create.yaml");
  const runBlueprintJob = (
    job: DraftJob,
    base: Template,
    instance: Instance | undefined,
    methods: MethodTemplate[],
    text: string,
    outFile: string
  ): void => {
    void (async () => {
      try {
        const { env } = await resolveLlmEnvAuto({ processEnv: process.env, envFilePath, authJsonPath: opts.authJsonPath });
        const client = createLlmClientFromEnv(env, job.kind);
        const modelLabel = env.MF_LLM_MODEL ?? (env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
        const now = new Date().toISOString();
        const prompt =
          job.kind === "generate"
            ? buildBlueprintGeneratePrompt(base, methods, text)
            : buildBlueprintRefinePrompt(base, instance!, methods, text);
        const result = await generateBlueprintDraft(client, prompt, text, modelLabel, now);
        if (!result.ok) {
          job.status = "error";
          job.error = `模型输出未通过校验（阶段 ${result.stage}）`;
          job.issues = result.issues ?? [result.stage === "call" ? result.raw : `原始返回前 300 字：${result.raw.slice(0, 300)}`];
          return;
        }
        await writeFile(
          outFile,
          `# Metric Factory 待采纳分析体系草案（AI 生成；采纳才写工作稿，未采纳不改内容）\n${stringifyYaml(result.draft)}`,
          "utf8"
        );
        job.status = "done";
      } catch (e) {
        job.status = "error";
        job.error = (e as Error).message;
      }
    })();
  };

  // 「04 检查与交付」视图内容（release/receipts 表单状态可注入；与 GET/POST 重渲染共用同一组装）
  const deliveryContent = async (
    ctx: InstanceContext,
    release: ReleaseUiState = { kind: "form", values: { version: "", note: "" } },
    receiptsValues = { yaml: "" },
    receiptsPatch: Partial<ReceiptsUiState> = {}
  ): Promise<string> => {
    const materialized = materialize(ctx.base, ctx.instance);
    const methods = await discoverMethods(opts.templatesDir);
    const review = designReview(materialized, ctx.base, ctx.instance, methods);
    const extraSections =
      exportBlock() +
      releaseBlock(release) +
      receiptsBlock(buildReceiptsState(ctx.instancePath, receiptsValues, receiptsPatch));
    return deliveryPage({ review, materialized, instance: ctx.instance, metricCount: materialized.metrics.length, extraSections });
  };
  // 回执区块状态构建（批次 A+B 切片 5）：登记副本为事实源，列表零 index 运行时依赖（G2）
  const buildReceiptsState = (instancePath: string, values = { yaml: "" }, patch: Partial<ReceiptsUiState> = {}): ReceiptsUiState => {
    const releasesDir = join(workspaceDir, "releases");
    const packageId = packageIdFromInstancePath(instancePath);
    const list = listReceipts(releasesDir, packageId).map((r) => ({
      task_id: r.task_id,
      version: r.package.version,
      status: r.reconciliation.status,
      adopted: r.adopted_metrics.length,
      issues: r.issues_found.length,
      received_at: r.received_at
    }));
    return { list, showList: existsSync(releasesDir), packageId, values, ...patch };
  };

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    try {
      const templates = await discoverTemplates(opts.templatesDir);
      const statusInfo = `模板 ${templates.length} 个${currentInstancePath ? ` · 当前实例 ${currentInstancePath}` : ""}`;

      // ===== A2：SPA 静态资产 + JSON API（评审原型严格复刻；T2=读面，写路径切片接引擎）=====
      const sendJson = (code: number, obj: unknown) => {
        res.writeHead(code, { "content-type": "application/json; charset=utf-8" }).end(JSON.stringify(obj));
      };
      // 静态目录解析：src/ui/public（vitest/源码态）或 dist 根（tsup publicDir 拷贝产物）
      const moduleDir = dirname(fileURLToPath(import.meta.url));
      const publicDir = existsSync(join(moduleDir, "public", "index.html")) ? join(moduleDir, "public") : moduleDir;
      const servePublic = async (file: string, type: string): Promise<boolean> => {
        try {
          const data = await readFile(join(publicDir, file));
          res.writeHead(200, { "content-type": type, "cache-control": "no-cache" }).end(data);
          return true;
        } catch {
          return false;
        }
      };

      if (req.method === "GET" && path === "/") {
        if (await servePublic("index.html", "text/html; charset=utf-8")) return;
      }
      if (req.method === "GET" && (path === "/style.css" || path === "/app.js" || path === "/api.js")) {
        const type = path.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
        if (await servePublic(path.slice(1), type)) return;
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
        return;
      }
      if (req.method === "GET" && path === "/docs/guide") {
        try {
          // 仓内文档（src/ui 与 dist chunk 两处模块位置均回仓根；workspaceDir 指向别的目录时仍可读）
          const md = await readFile(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "工作台使用指南.md"), "utf8");
          res.writeHead(200, { "content-type": "text/plain; charset=utf-8" }).end(md);
        } catch {
          res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("指南未找到");
        }
        return;
      }
      if (req.method === "GET" && path === "/api/llm-status") {
        const status = await llmStatus(envFilePath, authJsonPath);
        sendJson(200, { mode: status.mode === "faux" ? "faux" : status.mode === "configured" ? "configured" : "none", raw: status.mode });
        return;
      }
      if (req.method === "GET" && path === "/api/workspace") {
        const systems = [];
        for (const found of await discoverInstances(workspaceDir)) {
          const ctx = await loadInstanceContext(found.path, templates);
          if (!ctx) continue;
          const mat = materialize(ctx.base, ctx.instance);
          const bp = ctx.instance.blueprint;
          const systemsDir = dirname(found.path);
          systems.push({
            id: relative(workspaceDir, found.path) || basename(found.path),
            title: bp?.title ?? basename(systemsDir),
            source: ctx.instance.base ? `模板基座 · ${ctx.base.template.industry}` : "AI 草稿",
            metricCount: mat.metrics.length,
            sceneCount: mat.scenarios.length,
            delivered: latestRelease(workspaceDir, packageIdFromInstancePath(found.path)), // G3：已交付版本标签派生
            hasBlueprint: Boolean(bp)
          });
        }
        sendJson(200, { systems });
        return;
      }
      if (req.method === "GET" && path === "/api/templates") {
        const methods = await discoverMethods(opts.templatesDir);
        // U1-a：templates/user/ 宽松装载（用户草稿模板，「我的模板」过滤源；不进 lint 门不进匹配池）
        const userTemplates: Array<Record<string, unknown>> = [];
        try {
          for (const f of (await readdir(join(opts.templatesDir, "user"))).filter(n => n.endsWith(".yaml"))) {
            try {
              const doc = parseYaml(await readFile(join(opts.templatesDir, "user", f), "utf8")) as {
                id: string; name: string; purpose?: string; incomplete?: boolean;
                metrics?: Array<{ name: string; description: string; group?: string }>;
              };
              userTemplates.push({
                id: doc.id, type: "metric", name: doc.name,
                description: doc.purpose || "从自己的指标资料导入或另存的草稿模板。",
                source: "我的模板", incomplete: Boolean(doc.incomplete),
                metricIds: (doc.metrics ?? []).map(m => m.name),
                customMetrics: (doc.metrics ?? []).map(m => ({ name: m.name }))
              });
            } catch { /* 单个用户模板损坏则跳过（宽松装载不阻断库） */ }
          }
        } catch { /* 无 templates/user/ 目录 = 空用户库 */ }
        // 评审原型卡片序（G6：oracle 04 结构对照）：三个内置方法在前，分析三方法随后
        const DEMO_METHOD_ORDER = ["net-change", "repeat-review", "weekly-review", "profit-change-diagnosis", "strategic-options-comparison", "association-vs-increment"];
        const orderedMethods = [
          ...DEMO_METHOD_ORDER.flatMap((id) => methods.filter((m) => m.method.id === id)),
          ...methods.filter((m) => !DEMO_METHOD_ORDER.includes(m.method.id))
        ];
        sendJson(200, {
          templates: [
            ...userTemplates,
            ...templates.map((t) => ({
              id: t.template.id, type: "metric" as const, name: t.template.industry,
              description: `${t.template.industry} · ${t.template.business_models.join("／")}`,
              source: "内置行业模板",
              metricIds: t.metrics.map((m) => m.name),
              customMetrics: t.metrics.map((m) => ({ name: m.display_name })),
              scenes: t.scenarios.map((s) => s.id)
            }))
          ],
          methodTemplates: orderedMethods.map((m) => ({
            id: m.method.id, type: "method" as const, name: m.method.name, description: m.method.description,
            source: "内置方法模板", contexts: m.contexts, family: m.family, roles: m.roles.map((r) => r.name),
            purpose: m.purpose, steps: m.steps, evidence: m.evidence, limit: m.limits
          }))
        });
        return;
      }
      const apiInstanceMatch = req.method === "GET" ? path.match(/^\/api\/instances\/([^/]+)$/) : null;
      if (apiInstanceMatch) {
        const id = decodeURIComponent(apiInstanceMatch[1] ?? "");
        const instancePath = resolve(workspaceDir, id);
        const ctx = await loadInstanceContext(instancePath, templates);
        if (!ctx) { sendJson(404, { error: `实例不可读：${id}` }); return; }
        const methods = await discoverMethods(opts.templatesDir);
        sendJson(200, buildSystemDto(ctx, templates, workspaceDir, methods));
        return;
      }
      // A2 T3（G1/G4）：NL 创建 job——生成完成即自动落盘 system-<时间戳>，前端轮询进 work
      if (req.method === "POST" && path === "/api/instances/create-job") {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as { need?: string };
        const need = String(body.need ?? "").trim();
        if (!need) { sendJson(422, { error: "先写一点业务需求，几个字也可以。" }); return; }
        const jobId = randomUUID();
        const job: DraftJob = { id: jobId, kind: "generate", status: "running", returnTo: "blueprint-create" };
        jobs.set(jobId, job);
        const methods = await discoverMethods(opts.templatesDir);
        void (async () => {
          try {
            const { env } = await resolveLlmEnvAuto({ processEnv: process.env, envFilePath, authJsonPath: opts.authJsonPath });
            const client = createLlmClientFromEnv(env, job.kind);
            const modelLabel = env.MF_LLM_MODEL ?? (env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
            const result = await generateBlueprintDraft(client, buildBlueprintGeneratePrompt(EMPTY_TEMPLATE, methods, need), need, modelLabel, new Date().toISOString());
            if (!result.ok) {
              job.status = "error";
              job.error = `模型输出未通过校验（阶段 ${result.stage}）`;
              job.issues = result.issues ?? [result.stage === "call" ? result.raw : `原始返回前 300 字：${result.raw.slice(0, 300)}`];
              return;
            }
            // G1：自动落盘（目录名系统生成；改名走 blueprint.title，不动目录）。同秒并发创建追加序号保证唯一。
            const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").replace(/(^\d{8})(\d{6})$/, "$1-$2");
            let dirName = `system-${ts}`;
            let outPath = join(workspaceDir, dirName, "instance.yaml");
            for (let suffix = 2; ; suffix++) {
              try { await access(outPath); dirName = `system-${ts}-${suffix}`; outPath = join(workspaceDir, dirName, "instance.yaml"); } catch { break; }
            }
            const instance = InstanceSchema.safeParse({
              instance: { created_at: new Date().toISOString() },
              added: result.draft.added,
              added_scenarios: result.draft.added_scenarios,
              blueprint: result.draft.blueprint
            });
            if (!instance.success) {
              job.status = "error";
              job.error = "生成内容未通过实例校验";
              job.issues = instance.error.issues.map((i) => `[instance] ${i.path.join(".")}: ${i.message}`);
              return;
            }
            const issues = validateDesign(materialize(EMPTY_TEMPLATE, instance.data), EMPTY_TEMPLATE, instance.data, methods, { skipReviewGate: true, writeMode: true });
            if (issues.length > 0) {
              job.status = "error";
              job.error = "生成内容未通过引擎写入门（零写盘）";
              job.issues = issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`);
              return;
            }
            await mkdir(dirname(outPath), { recursive: true });
            await writeInstanceFile(outPath, instance.data);
            job.status = "done";
            job.instanceId = relative(workspaceDir, outPath);
          } catch (e) {
            job.status = "error";
            job.error = (e as Error).message;
          }
        })();
        sendJson(202, { jobId: job.id });
        return;
      }
      const apiJobMatch = req.method === "GET" ? path.match(/^\/api\/jobs\/([a-f0-9-]+)$/) : null;
      if (apiJobMatch) {
        const job = jobs.get(apiJobMatch[1] ?? "");
        if (!job) { sendJson(404, { error: "任务不存在（服务可能已重启）" }); return; }
        sendJson(200, { status: job.status, error: job.error, issues: job.issues, instanceId: job.instanceId ?? null });
        return;
      }

      const readJsonBody = async (): Promise<Record<string, unknown>> => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, unknown>;
      };
      // ===== A2 T6：审核行（G7）/ 复核确认 / 交付（G3 自动版本）/ 导出直链 =====
      const t6Match = path.match(/^\/api\/instances\/([^/]+)\/(approve-metric|reject-metric|confirm-review|deliver|export)$/);
      if (t6Match && req.method !== "GET") {
        const id = decodeURIComponent(t6Match[1] ?? "");
        const ctx = await loadInstanceContext(resolve(workspaceDir, id), templates);
        if (!ctx) { sendJson(404, { error: `实例不可读：${id}` }); return; }
        const methods = await discoverMethods(opts.templatesDir);
        const action = t6Match[2]!;
        if (action === "approve-metric" || action === "reject-metric") {
          const body = await readJsonBody() as { name?: string; reviewer?: string };
          const name = String(body.name ?? "");
          const mat = materialize(ctx.base, ctx.instance);
          if (!mat.metrics.some(m => m.name === name)) { sendJson(404, { errors: [`指标 ${name} 不存在。`] }); return; }
          const next = action === "approve-metric"
            ? applyApproval(ctx.instance, name, String(body.reviewer ?? process.env.MF_REVIEWER ?? process.env.USER ?? "unknown"))
            : applyRejection(ctx.instance, name);
          const result = await writeWithGate(ctx, methods, () => ({ instance: next }));
          if (!result.ok) { sendJson(result.status, { errors: result.errors }); return; }
          const fresh = await loadInstanceContext(ctx.instancePath, templates);
          sendJson(200, buildSystemDto(fresh ?? ctx, templates, workspaceDir, methods));
          return;
        }
        if (action === "confirm-review") {
          const body = await readJsonBody() as { confirmed_by?: string };
          const confirmedBy = String(body.confirmed_by ?? process.env.MF_REVIEWER ?? process.env.USER ?? "").trim();
          const mat = materialize(ctx.base, ctx.instance);
          if (!ctx.instance.blueprint) { sendJson(422, { errors: ["当前实例无分析体系（仅指标体系模式无需业务复核）。"] }); return; }
          if (!confirmedBy) { sendJson(422, { errors: ["复核人不能为空（复核动作必须归属到具体责任人）。"] }); return; }
          const review = designReview(mat, ctx.base, ctx.instance, methods);
          if (review.designIssues.length > 0) { sendJson(422, { errors: [`存在 ${review.designIssues.length} 项设计缺口，处理完成后才能复核：`, ...review.designIssues.map(i => `[${i.rule}] ${i.path}: ${i.message}`)] }); return; }
          const confirmed: Instance = {
            ...ctx.instance,
            blueprint: {
              ...ctx.instance.blueprint,
              review: { confirmed_by: confirmedBy, confirmed_at: new Date().toISOString(), design_fingerprint: designFingerprint(mat) }
            }
          };
          const result = await writeWithGate(ctx, methods, () => ({ instance: confirmed }));
          if (!result.ok) { sendJson(result.status, { errors: result.errors }); return; }
          const fresh = await loadInstanceContext(ctx.instancePath, templates);
          sendJson(200, buildSystemDto(fresh ?? ctx, templates, workspaceDir, methods));
          return;
        }
        if (action === "deliver") {
          // G3：自动建议 next patch（无既有发布 → 1.0.0）；same-content 阻断由引擎透出
          const packageId = packageIdFromInstancePath(ctx.instancePath);
          const latest = latestRelease(workspaceDir, packageId);
          const [maj, min, pat] = (latest?.version ?? "1.0.0").split(".").map(Number) as [number, number, number];
          const nextVersion = latest ? `${maj}.${min}.${pat + 1}` : "1.0.0";
          try {
            const result = await releaseInstance({
              instancePath: ctx.instancePath,
              version: nextVersion,
              templatesDir: opts.templatesDir,
              releasesDir: join(workspaceDir, "releases"),
              releasedBy: process.env.MF_REVIEWER ?? process.env.USER ?? "unknown",
              note: "工作台交付（A2 SPA）",
              now: new Date().toISOString()
            });
            const fresh = await loadInstanceContext(ctx.instancePath, templates);
            const dto = buildSystemDto(fresh ?? ctx, templates, workspaceDir, methods);
            sendJson(201, { version: result.version, packageId: result.packageId, contentFingerprint: result.contentFingerprint, system: dto });
          } catch (e) {
            if (e instanceof ReleaseError) {
              sendJson(422, { errors: [e.rule === "same-content" ? "当前草稿与已交付版本相同，无需重复生成。" : `[${e.rule}] ${e.message}`] });
              return;
            }
            if (e instanceof ExportBlockedError) { sendJson(422, { errors: [`以下 LLM 生成指标未经人工审核：${e.blockedMetrics.join("、")}`] }); return; }
            throw e;
          }
          return;
        }
      }
      const t6ExportMatch = path.match(/^\/api\/instances\/([^/]+)\/export\/([a-z]+)$/);
      if (t6ExportMatch && (req.method === "GET" || req.method === "HEAD")) {
        const id = decodeURIComponent(t6ExportMatch[1] ?? "");
        const format = t6ExportMatch[2]!;
        const ctx = await loadInstanceContext(resolve(workspaceDir, id), templates);
        if (!ctx) { sendJson(404, { error: `实例不可读：${id}` }); return; }
        const exporters: Record<string, Exporter> = { metricflow: metricflowExporter, excel: excelExporter, mermaid: mermaidExporter };
        if (format !== "sap" && !exporters[format]) { sendJson(422, { errors: [`未知导出格式：${format}`] }); return; }
        const mat = materialize(ctx.base, ctx.instance);
        const methods = await discoverMethods(opts.templatesDir);
        // 与表单导出同一全量门（含 LLM 审核阻断与设计缺口；交付物语义一致）
        const issues = validateDesign(mat, ctx.base, ctx.instance, methods);
        if (issues.length > 0) { sendJson(422, { errors: issues.map(i => `[${i.rule}] ${i.path}: ${i.message}`) }); return; }
        try {
          const exporter: Exporter = format === "sap"
            ? createSapExporter({ template: ctx.base, packageId: packageIdFromInstancePath(ctx.instancePath), instanceConceptRefs: ctx.instance.concept_refs })
            : exporters[format]!;
          const result = await exporter.export(mat);
          const mime = format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : format === "metricflow" || format === "sap" ? "text/yaml; charset=utf-8" : "text/plain; charset=utf-8";
          res.writeHead(200, { "content-type": mime, "content-disposition": `attachment; filename="${result.filename}"` });
          res.end(result.content);
        } catch (e) {
          if (e instanceof ExportBlockedError) { sendJson(422, { errors: [`以下 LLM 生成指标未经人工审核：${e.blockedMetrics.join("、")}`] }); return; }
          if (e instanceof SapAssemblyError || e instanceof SapExportValidationError) {
            const errors = e instanceof SapAssemblyError
              ? [`[${e.rule}] ${e.message}`]
              : e.issues.map(i => `[${i.rule}] ${i.path}: ${i.message}`);
            sendJson(422, { errors });
            return;
          }
          throw e;
        }
        return;
      }

      // ===== A2 T7：助手 refine job（提案先看建议再采纳）/ 应用与放弃 / 用户模板（U1-a）/ 从模板创建 =====
      const refineMatch = path.match(/^\/api\/instances\/([^/]+)\/(refine-job|apply-refine|discard-refine)$/);
      const fromTemplateMatch = path === "/api/templates/use" ? ["", "", "from-template"] : null;
      if ((refineMatch || fromTemplateMatch) && req.method !== "GET") {
        const id = refineMatch ? decodeURIComponent(refineMatch[1] ?? "") : "";
        const action = (refineMatch ?? fromTemplateMatch)![2]!;
        if (action === "from-template") {
          const body = await readJsonBody() as { templateId?: string };
          const tpl = templates.find(t => t.template.id === body.templateId);
          if (!tpl) { sendJson(404, { errors: [`模板 ${body.templateId} 不存在。`] }); return; }
          const answers = {
            revenue_model: (tpl.matching.revenue_models[0] ?? "交易抽佣") as Answers["revenue_model"],
            user_structure: (tpl.matching.user_structure[0] ?? "2C") as Answers["user_structure"],
            core_loop: (tpl.matching.core_loops[0] ?? "交易") as Answers["core_loop"],
            caliber: {}
          };
          const instance = buildInstance(tpl, answers, new Date().toISOString());
          const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").replace(/(^\d{8})(\d{6})$/, "$1-$2");
          let dirName = `system-${ts}`;
          let outPath = join(workspaceDir, dirName, "instance.yaml");
          for (let suffix = 2; ; suffix++) {
            try { await access(outPath); dirName = `system-${ts}-${suffix}`; outPath = join(workspaceDir, dirName, "instance.yaml"); } catch { break; }
          }
          await mkdir(dirname(outPath), { recursive: true });
          await writeInstanceFile(outPath, instance);
          const ctx = await loadInstanceContext(outPath, templates);
          sendJson(201, { instanceId: relative(workspaceDir, outPath), system: ctx ? buildSystemDto(ctx, templates, workspaceDir, await discoverMethods(opts.templatesDir)) : null });
          return;
        }
        const ctx = await loadInstanceContext(resolve(workspaceDir, id), templates);
        if (!ctx) { sendJson(404, { error: `实例不可读：${id}` }); return; }
        const methods = await discoverMethods(opts.templatesDir);
        if (action === "refine-job") {
          const body = await readJsonBody() as { instruction?: string };
          const instruction = String(body.instruction ?? "").trim();
          if (!instruction) { sendJson(422, { errors: ["先说说希望怎样修改。"] }); return; }
          const jobId = randomUUID();
          const job: DraftJob = { id: jobId, kind: "refine", status: "running", returnTo: "blueprint" };
          jobs.set(jobId, job);
          const draftPath = join(dirname(ctx.instancePath), "draft.pending.yaml");
          runBlueprintJob(job, ctx.base, ctx.instance, methods, instruction, draftPath);
          // 提案摘要由 done 轮询端从草案 diff 提炼（G：先看建议再采纳）
          sendJson(202, { jobId, draftPath: relative(workspaceDir, draftPath) });
          return;
        }
        if (action === "apply-refine") {
          const pending = await loadPendingDraft(join(dirname(ctx.instancePath), "draft.pending.yaml"));
          if (!pending || !pending.ok || !pending.draft.blueprint) {
            sendJson(422, { errors: ["没有可采纳的建议（草案不存在或已被处理），请重新发起。"] });
            return;
          }
          const merged: Instance = {
            ...ctx.instance,
            blueprint: pending.draft.blueprint,
            added: pending.draft.added,
            added_scenarios: pending.draft.added_scenarios
          };
          const result = await writeWithGate(ctx, methods, () => ({ instance: merged }));
          if (!result.ok) { sendJson(result.status, { errors: result.errors }); return; }
          await rm(join(dirname(ctx.instancePath), "draft.pending.yaml"), { force: true });
          const fresh = await loadInstanceContext(ctx.instancePath, templates);
          sendJson(200, buildSystemDto(fresh ?? ctx, templates, workspaceDir, methods));
          return;
        }
        if (action === "discard-refine") {
          await rm(join(dirname(ctx.instancePath), "draft.pending.yaml"), { force: true });
          sendJson(200, { discarded: true });
          return;
        }
      }
      const refineProposalMatch = path.match(/^\/api\/instances\/([^/]+)\/refine-proposal$/);
      if (refineProposalMatch && req.method === "GET") {
        // 提案预览：读待采纳草案 → demo 提案卡形状（title/description/before/after/impact 概览）
        const id = decodeURIComponent(refineProposalMatch[1] ?? "");
        const ctx = await loadInstanceContext(resolve(workspaceDir, id), templates);
        if (!ctx) { sendJson(404, { error: `实例不可读：${id}` }); return; }
        const pending = await loadPendingDraft(join(dirname(ctx.instancePath), "draft.pending.yaml"));
        if (!pending || !pending.ok || !pending.draft.blueprint) { sendJson(404, { error: "没有待采纳的建议。" }); return; }
        const oldBp = ctx.instance.blueprint;
        const newBp = pending.draft.blueprint;
        const changed: string[] = [];
        if (oldBp?.purpose !== newBp.purpose) changed.push("业务目的");
        if (oldBp?.decision !== newBp.decision) changed.push("研究问题");
        if ((oldBp?.contexts ?? []).join() !== newBp.contexts.join()) changed.push(`语境（${newBp.contexts.join("、")}）`);
        if (oldBp?.questions.length !== newBp.questions.length) changed.push(`问题（${newBp.questions.length} 个）`);
        if (oldBp?.hypotheses.length !== newBp.hypotheses.length) changed.push(`假设（${newBp.hypotheses.length} 条）`);
        if (pending.draft.added.length > 0) changed.push(`新增指标 ${pending.draft.added.length} 个`);
        if (pending.draft.added_scenarios.length > 0) changed.push(`新增场景 ${pending.draft.added_scenarios.length} 个`);
        sendJson(200, {
          title: "AI 修改建议",
          description: newBp.purpose || "按你的指令更新分析设计。",
          before: oldBp ? `${oldBp.questions.length} 个问题 · ${oldBp.hypotheses.length} 条假设` : "（无蓝图）",
          after: changed.length ? changed.join("、") : "内容与当前草稿一致",
          impact: "采纳后写入同一工作稿；相关业务复核将失效（需重新确认）。放弃则零改动。",
          addedMetricNames: pending.draft.added.map(m => m.display_name)
        });
        return;
      }
      // ===== U1-a：用户指标模板（templates/user/ 宽松装载；不进 lint 门不进匹配池）=====
      const userDir = join(opts.templatesDir, "user");
      if (req.method === "POST" && path === "/api/templates/user") {
        const body = await readJsonBody() as { name?: string; rows?: Array<{ name?: string; description?: string; group?: string; formula?: string; unit?: string }>; purpose?: string };
        const name = String(body.name ?? "").trim();
        const rows = Array.isArray(body.rows) ? body.rows : [];
        if (!name) { sendJson(422, { errors: ["模板名称必填。"] }); return; }
        if (rows.length === 0 || rows.some(r => !String(r.name ?? "").trim())) { sendJson(422, { errors: ["至少一行指标且每行需有名称。"] }); return; }
        const id = `user-${Date.now().toString(36)}`;
        const incomplete = rows.some(r => !String(r.description ?? "").trim());
        const lines = [
          "# 用户指标模板（工作台导入/另存，A2 U1-a：宽松装载，不进 lint 门与匹配池）",
          `id: ${id}`,
          `name: ${JSON.stringify(name)}`,
          `purpose: ${JSON.stringify(String(body.purpose ?? ""))}`,
          `incomplete: ${incomplete}`,
          "metrics:",
          ...rows.map(r => `  - name: ${JSON.stringify(String(r.name ?? "").trim())}\n    description: ${JSON.stringify(String(r.description ?? "").trim())}\n    group: ${JSON.stringify(String(r.group ?? "导入指标").trim())}\n    formula: ${JSON.stringify(String(r.formula ?? "计算关系待检查").trim())}\n    unit: ${JSON.stringify(String(r.unit ?? "待确认").trim())}`)
        ];
        await mkdir(userDir, { recursive: true });
        await writeFile(join(userDir, `${id}.yaml`), lines.join("\n") + "\n", "utf8");
        sendJson(201, { id, name, incomplete });
        return;
      }
      const userTplMatch = path.match(/^\/api\/templates\/user\/preview$/);
      if (userTplMatch && req.method === "POST") {
        // SPA use-template 指标类（用户草稿模板）：创建 blank 基座 + added 指标（manual 来源）
        const body = await readJsonBody() as { id?: string };
        const file = join(userDir, `${body.id}.yaml`);
        if (!existsSync(file)) { sendJson(404, { errors: [`用户模板 ${body.id} 不存在。`] }); return; }
        const doc = parseYaml(await readFile(file, "utf8")) as { name?: string; metrics?: Array<{ name: string; description: string; group?: string; formula?: string }> };
        const methods = await discoverMethods(opts.templatesDir);
        const slug = (s: string, i: number) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `metric_${i + 1}`;
        const seen = new Set<string>();
        const added = (doc.metrics ?? []).map((m, i) => {
          let name = slug(m.name, i);
          while (seen.has(name)) name = `${name}_${i}`;
          seen.add(name);
          return {
            name, display_name: m.name, type: "simple" as const, definition: m.description || "（待补充统计说明）",
            dimensions: [], time_grains: ["month" as const], owner_role: "业务",
            caliber_switches: {}, provenance: { origin: "manual" as const }
          };
        });
        const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").replace(/(^\d{8})(\d{6})$/, "$1-$2");
        let dirName = `system-${ts}`;
        let outPath = join(workspaceDir, dirName, "instance.yaml");
        for (let suffix = 2; ; suffix++) {
          try { await access(outPath); dirName = `system-${ts}-${suffix}`; outPath = join(workspaceDir, dirName, "instance.yaml"); } catch { break; }
        }
        const instanceParsed = InstanceSchema.safeParse({ instance: { created_at: new Date().toISOString() }, added });
        if (!instanceParsed.success) { sendJson(422, { errors: instanceParsed.error.issues.map(i => `[instance] ${i.path.join(".")}: ${i.message}`) }); return; }
        // F5（评审）：与全部写路径一致——构造的 added 指标同样过引擎 writeMode 门（引用完整性 fail-closed）
        const gateIssues = validateDesign(materialize(EMPTY_TEMPLATE, instanceParsed.data), EMPTY_TEMPLATE, instanceParsed.data, methods, { skipReviewGate: true, writeMode: true });
        if (gateIssues.length > 0) { sendJson(422, { errors: gateIssues.map(i => `[${i.rule}] ${i.path}: ${i.message}`) }); return; }
        await mkdir(dirname(outPath), { recursive: true });
        await writeInstanceFile(outPath, instanceParsed.data);
        const ctx = await loadInstanceContext(outPath, templates);
        sendJson(201, { instanceId: relative(workspaceDir, outPath), system: ctx ? buildSystemDto(ctx, templates, workspaceDir, await discoverMethods(opts.templatesDir)) : null });
        return;
      }

      const loadCtxById = async (id: string): Promise<WriteCtx | null> => {
        const instancePath = resolve(workspaceDir, id);
        return await loadInstanceContext(instancePath, templates);
      };
      const dtoAfter = async (ctx: WriteCtx) => buildSystemDto(ctx, templates, workspaceDir, await discoverMethods(opts.templatesDir));

      const writeMatch = path.match(/^\/api\/instances\/([^/]+)(?:\/(blueprint|metrics|scenes|resolve)(.*))?$/);
      if (writeMatch && req.method !== "GET") {
        const id = decodeURIComponent(writeMatch[1] ?? "");
        const ctx = await loadCtxById(id);
        if (!ctx) { sendJson(404, { error: `实例不可读：${id}` }); return; }
        const methods = await discoverMethods(opts.templatesDir);
        const rest = writeMatch[3] ?? "";
        const gate = async (mutate: () => { instance: unknown } | { errors: string[] } | { blocked: true; references: string[] }) => {
          const next = mutate();
          if ("blocked" in next && next.blocked) { sendJson(409, next as { blocked: true; references: string[] }); return; }
          if ("errors" in next) { sendJson(422, { errors: next.errors }); return; }
          const result = await writeWithGate(ctx, methods, () => next as { instance: unknown });
          if (!result.ok) { sendJson(result.status, { errors: result.errors }); return; }
          const fresh = await loadInstanceContext(ctx.instancePath, templates);
          sendJson(200, await dtoAfter(fresh ?? ctx));
        };
        // PATCH /api/instances/:id/blueprint（基础字段合并）
        if (writeMatch[2] === "blueprint" && rest === "" && req.method === "PATCH") {
          const body = await readJsonBody();
          await gate(() => patchBlueprintFields(ctx, body));
          return;
        }
        // PATCH /api/instances/:id/blueprint/hypotheses/:hid（文本三要素 + 判断状态分轴）
        const hypMatch = rest.match(/^\/hypotheses\/([a-z][a-z0-9_]*)$/);
        if (writeMatch[2] === "blueprint" && hypMatch && req.method === "PATCH") {
          const body = await readJsonBody();
          await gate(() => patchHypothesis(ctx, hypMatch[1]!, body));
          return;
        }
        // PATCH /api/instances/:id/blueprint/evidence/:eid
        const evMatch = rest.match(/^\/evidence\/([a-z][a-z0-9_-]+)$/);
        if (writeMatch[2] === "blueprint" && evMatch && req.method === "PATCH") {
          const body = await readJsonBody();
          await gate(() => patchEvidence(ctx, evMatch[1]!, body));
          return;
        }
        // DELETE /api/instances/:id/metrics/:name（无 confirm=只查影响不执行；confirm=1 执行删除）
        const metricMatch = rest.match(/^\/([a-z][a-z0-9_]*)$/);
        if (writeMatch[2] === "metrics" && metricMatch && req.method === "DELETE") {
          const confirm = url.searchParams.get("confirm") === "1";
          const pre = deleteMetric(ctx, metricMatch[1]!, false);
          if ("blocked" in pre && pre.blocked) { sendJson(409, pre); return; }
          if (!confirm) { sendJson(200, { blocked: false }); return; } // 影响查询模式：无引用也不删（显式确认才动）
          await gate(() => deleteMetric(ctx, metricMatch[1]!, true) as { instance: unknown } | { errors: string[] });
          return;
        }
        // PATCH /api/instances/:id/metrics/:name（名称/统计说明）
        if (writeMatch[2] === "metrics" && metricMatch && req.method === "PATCH") {
          const body = await readJsonBody();
          await gate(() => patchMetric(ctx, metricMatch[1]!, body));
          return;
        }
        // PATCH /api/instances/:id/scenes/:sid（用途；步骤另存方法 G8 走 POST save-as-method）
        const sceneMatch = rest.match(/^\/([a-z][a-z0-9_]*)$/);
        if (writeMatch[2] === "scenes" && sceneMatch && req.method === "PATCH") {
          const body = await readJsonBody();
          await gate(() => patchScene(ctx, sceneMatch[1]!, body));
          return;
        }
        // POST /api/instances/:id/scenes（方法模板 → 新场景：T7 use-template method / generate-scene）
        if (writeMatch[2] === "scenes" && rest === "" && req.method === "POST") {
          const body = await readJsonBody() as { methodId?: string; purpose?: string };
          const methods = await discoverMethods(opts.templatesDir);
          const method = methods.find(m => m.method.id === body.methodId);
          if (!method) { sendJson(404, { errors: [`方法 ${body.methodId} 不存在。`] }); return; }
          const mat = materialize(ctx.base, ctx.instance);
          let sid = `${method.method.id.replace(/-/g, "_")}`;
          while (mat.scenarios.some(s => s.id === sid)) sid = `${sid}_2`;
          const known = new Set(mat.metrics.map(m => m.name));
          const scenario = {
            id: sid,
            version: "0.1.0",
            title: method.method.name,
            decision_purpose: String(body.purpose ?? method.purpose),
            question_tree: method.steps.map((st, i) => ({ id: `n${i + 1}`, label: st.title })),
            metric_usages: [],
            method_refs: [`${method.method.id}@${method.method.version}`],
            evidence_requirements: method.evidence,
            output_spec: "",
            review_rules: ""
          };
          await gate(() => ({ instance: { ...ctx.instance, added_scenarios: [...ctx.instance.added_scenarios, scenario] } }));
          return;
        }
        // PATCH /api/instances/:id/scenes/:sid/bindings（指标角色绑定 ↔ metric_usages）
        const bindingsMatch = rest.match(/^\/([a-z][a-z0-9_]*)\/bindings$/);
        if (writeMatch[2] === "scenes" && bindingsMatch && req.method === "PATCH") {
          const body = await readJsonBody() as { bindings?: Array<{ role?: string; metric?: string }> };
          if (!Array.isArray(body.bindings)) { sendJson(422, { errors: ["bindings 数组必填。"] }); return; }
          await gate(() => patchSceneBindings(ctx, bindingsMatch[1]!, body.bindings ?? []));
          return;
        }
        // POST /api/instances/:id/scenes/:sid/save-as-method（G8 另存新方法 → templates/methods/；场景指向新方法）
        // id 规则与 A1 一致：场景 id（snake_case 机器契约）；名称走 method.name（中文可）
        const saveMethodMatch = rest.match(/^\/([a-z][a-z0-9_]*)\/save-as-method$/);
        if (writeMatch[2] === "scenes" && saveMethodMatch && req.method === "POST") {
          const body = await readJsonBody() as { name?: string; purpose?: string; steps?: string[] };
          const mat = materialize(ctx.base, ctx.instance);
          const scene = mat.scenarios.find((x) => x.id === saveMethodMatch[1]);
          if (!scene) { sendJson(404, { errors: [`场景 ${saveMethodMatch[1]} 不存在。`] }); return; }
          const name = String(body.name ?? "").trim();
          if (!name) { sendJson(422, { errors: ["方法名称必填。"] }); return; }
          const id = methodIdFromSceneId(scene.id);
          const methodsDir = join(opts.templatesDir, "methods");
          const outFile = join(methodsDir, `${id}.yaml`);
          if (existsSync(outFile)) { sendJson(409, { errors: [`方法 ${id}@0.1.0 已存在（templates/methods/${id}.yaml）；不覆盖，请换名或直接编辑该方法。`] }); return; }
          // 角色/语境/家族从场景与方法库派生（A1 另存方法同构：outcome/driver 必需、guardrail 可选）
          const prevMethod = scene.method_bindings?.[0]?.method_ref ?? scene.method_refs?.[0];
          const prev = prevMethod ? methods.find((m) => m.method.id === prevMethod.split("@")[0]) : undefined;
          const usages = scene.metric_usages;
          const yaml = methodYamlFromScene({
            name,
            purpose: String(body.purpose ?? scene.decision_purpose),
            steps: (body.steps ?? prev?.steps.map((s) => s.title) ?? ["明确对象、范围和比较依据"]).map((title) => ({ title })),
            contexts: prev?.contexts ?? (ctx.instance.blueprint?.contexts.length ? ctx.instance.blueprint.contexts : ["经营改善"]),
            family: prev?.family ?? "描述分解",
            roles: usages.map((u, i) => ({
              id: methodRoleId(u.role, i),
              name: ({ outcome: "结果指标", driver: "驱动指标", guardrail: "护栏指标" })[u.role] ?? u.role,
              required: u.role !== "guardrail"
            }))
          }, id);
          await mkdir(methodsDir, { recursive: true });
          await writeFile(outFile, yaml, "utf8");
          // 场景指向新方法（G8：引用不复制；步骤改由新方法承载）——重载方法库后过门（新方法须可解析）
          const ref = `${id}@0.1.0`;
          const freshCtx = await loadInstanceContext(ctx.instancePath, templates);
          const gateResult = await writeWithGate(freshCtx ?? ctx, await discoverMethods(opts.templatesDir), (inst) => patchScene({ ...ctx, instance: inst }, scene.id, { method_refs: [ref] }));
          if (!gateResult.ok) {
            await rm(outFile, { force: true }); // 场景更新失败 → 回滚新方法文件（不留孤儿资产）
            sendJson(gateResult.status, { errors: gateResult.errors });
            return;
          }
          sendJson(201, { id, version: "0.1.0", ref });
          return;
        }
        // POST /api/instances/:id/resolve（口径确认 U1-b/G2）
        if (writeMatch[2] === "resolve" && rest === "" && req.method === "POST") {
          const body = await readJsonBody() as { refund?: boolean; repeat?: string; descriptions?: Record<string, string> };
          await gate(() => resolveCalibers(ctx, body));
          return;
        }
      }

      if (path === "/") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        const discovered = await discoverInstances(workspaceDir);
        const llm = await llmStatus(envFilePath, authJsonPath);
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

      // ===== A1 首页 NL 入口（默认起点）：一句话 → AI 起草分析体系 → 预览 → 采纳建空白基座工作稿 =====
      if (path === "/blueprint/generate" && req.method === "POST") {
        const form = await readFormBody(req);
        const text = form.get("describe")?.trim() ?? "";
        const llm = await llmStatus(envFilePath, authJsonPath);
        const fail = (errors: string[]) => {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "生成分析设计草稿", "提交未通过校验。", formErrorPage("无法生成", errors), statusInfo)
          );
        };
        if (llm.mode !== "configured" && llm.mode !== "faux") {
          fail(["AI 模型未配置或配置有误，请先到设置页完成配置", llm.error ?? ""].filter(Boolean));
          return;
        }
        if (!text) {
          fail(["需求描述不能为空——用一句话说说你想弄清什么或做出什么选择"]);
          return;
        }
        const id = randomUUID().slice(0, 8);
        const job: DraftJob = { kind: "generate", status: "running", returnTo: "blueprint-create" };
        jobs.set(id, job);
        // D13 空白基座：无基模板，建议指标 dimensions 须空（prompt 已钉死）；方法库照常注入供 method_refs 选择
        runBlueprintJob(job, EMPTY_TEMPLATE, undefined, await discoverMethods(opts.templatesDir), text, createDraftPath);
        res.writeHead(303, { location: `/drafts/jobs/${id}` }).end();
        return;
      }

      if (path === "/blueprint/preview") {
        const pending = await loadPendingDraft(createDraftPath);
        if (!pending || !pending.ok || !pending.draft.blueprint) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "分析体系草案", "没有可预览的草案。",
              formErrorPage("无草案", [pending && !pending.ok ? pending.error : "没有待采纳的分析体系草案，请先在首页用一句话生成"]), statusInfo)
          );
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("home", "分析体系草案 · 预览与影响", "AI 建议逐段呈现；采纳才创建工作稿，放弃不改任何内容。",
            blueprintDraftPreviewPage(pending.draft, { create: true }), statusInfo)
        );
        return;
      }

      if (path === "/blueprint/apply-create" && req.method === "POST") {
        const form = await readFormBody(req);
        const name = form.get("name")?.trim() ?? "";
        const pending = await loadPendingDraft(createDraftPath);
        if (!pending || !pending.ok || !pending.draft.blueprint) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "采纳草案", "没有可采纳的草案。", formErrorPage("无草案", [pending && !pending.ok ? pending.error : "草案不存在或已被处理，请重新生成"]), statusInfo)
          );
          return;
        }
        const draft = pending.draft;
        const rerender = (errors: string[]) => {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("home", "分析体系草案 · 预览与影响", "创建工作稿前校验未通过（零写盘）。",
              `${formErrorPage("无法创建", errors)}${blueprintDraftPreviewPage(draft, { create: true })}`, statusInfo)
          );
        };
        if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
          rerender([`工作区目录名需以小写字母或数字开头，仅含小写字母、数字、中划线、下划线（收到 "${name}"）`]);
          return;
        }
        const outPath = join(workspaceDir, name, "instance.yaml");
        try {
          await access(outPath);
          rerender([`目录 ${name}/ 下已存在 instance.yaml，为避免覆盖请换一个名字`]);
          return;
        } catch { /* 不存在，可创建 */ }
        // D13 空白起点工作稿：无 base；LLM 建议指标带待审标记（审核中心批准前导出被硬阻断）
        const instance = InstanceSchema.safeParse({
          instance: { created_at: new Date().toISOString() },
          added: draft.added,
          added_scenarios: draft.added_scenarios,
          blueprint: draft.blueprint
        });
        if (!instance.success) {
          rerender(instance.error.issues.map((i) => `[instance] ${i.path.join(".")}: ${i.message}`));
          return;
        }
        const issues = validateDesign(materialize(EMPTY_TEMPLATE, instance.data), EMPTY_TEMPLATE, instance.data, await discoverMethods(opts.templatesDir), { skipReviewGate: true, writeMode: true });
        if (issues.length > 0) {
          rerender(issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`));
          return;
        }
        await mkdir(dirname(outPath), { recursive: true });
        await writeInstanceFile(outPath, instance.data);
        await rm(createDraftPath, { force: true });
        currentInstancePath = outPath;
        res.writeHead(303, { location: "/instance/overview" }).end();
        return;
      }

      if (path === "/blueprint/discard-create" && req.method === "POST") {
        await rm(createDraftPath, { force: true });
        res.writeHead(303, { location: "/" }).end();
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

      // ===== 方法模板库（A1 第二类模板；须在 /templates/:id 之前注册——"methods" 会被模板 id 通配吞掉）=====
      if (path === "/templates/methods") {
        const methods = await discoverMethods(opts.templatesDir);
        const html = layout(
          "templates",
          "方法模板库",
          `共 ${methods.length} 个分析方法模板。方法记录适用语境、输入角色、步骤、证据与限制；场景经方法绑定引用（引用不实现），语境不匹配或缺必需角色将阻断交付。`,
          methodsLibrarySection(methods),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      const methodMatch = path.match(/^\/templates\/methods\/([a-z0-9-]+)$/);
      if (methodMatch) {
        const id = methodMatch[1]!;
        const methods = await discoverMethods(opts.templatesDir);
        const m = methods.find((x) => x.method.id === id);
        if (!m) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("templates", "未找到方法", `方法 ${escapeHtml(id)} 不存在。`, `<div class="empty">方法不存在<br><a class="btn" href="/templates/methods">返回方法库</a></div>`, statusInfo)
          );
          return;
        }
        const html = layout(
          "templates",
          `${m.method.name} · ${m.method.id}`,
          `${escapeHtml(m.family)} · 版本 ${escapeHtml(m.method.version)} · 适用：${m.contexts.join("、")}`,
          methodDetailPage(m),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      // ===== 粘贴导入（次要起点；解析预览 → 确认落盘，零猜补）=====
      if (path === "/import" && req.method === "GET") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("templates", "导入模板", "粘贴外部模板 YAML，解析预览后确认落盘。", importFormPage(), statusInfo)
        );
        return;
      }
      if (path === "/import" && req.method === "POST") {
        // 预览页「返回修改」回带原值
        const form = await readFormBody(req);
        const kind: ImportKind = form.get("kind") === "metric" ? "metric" : "method";
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("templates", "导入模板", "粘贴外部模板 YAML，解析预览后确认落盘。",
            importFormPage({ kind, source: form.get("source") ?? "" }), statusInfo)
        );
        return;
      }

      type ImportParseResult =
        | { kind: ImportKind; source: string; error: string[] }
        | { kind: ImportKind; source: string; method: MethodTemplate }
        | { kind: ImportKind; source: string; template: Template };

      const importParse = async (form: URLSearchParams): Promise<ImportParseResult> => {
        const kind: ImportKind = form.get("kind") === "metric" ? "metric" : "method";
        const source = form.get("source") ?? "";
        let doc: unknown;
        try {
          doc = parseYaml(source);
        } catch (e) {
          return { kind, source, error: [`YAML 解析失败：${(e as Error).message}`] as string[] };
        }
        if (kind === "method") {
          const parsed = MethodTemplateSchema.safeParse(doc);
          if (!parsed.success) {
            return { kind, source, error: parsed.error.issues.map((i) => `[method] ${i.path.join(".")}: ${i.message}`) };
          }
          const m = parsed.data;
          const lintIssues = lintMethodTemplate(m);
          if (lintIssues.length > 0) {
            return { kind, source, error: lintIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`) };
          }
          return { kind, source, method: m };
        }
        const parsed = TemplateSchema.safeParse(doc);
        if (!parsed.success) {
          return { kind, source, error: parsed.error.issues.map((i) => `[template] ${i.path.join(".")}: ${i.message}`) };
        }
        return { kind, source, template: parsed.data };
      };

      if (path === "/import/preview" && req.method === "POST") {
        const form = await readFormBody(req);
        const r = await importParse(form);
        if ("error" in r) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("templates", "导入模板", "解析未通过（零写盘）。", importFormPage({ kind: r.kind, source: r.source }, r.error), statusInfo)
          );
          return;
        }
        const preview =
          "method" in r
            ? {
                kind: r.kind, source: r.source, title: `${r.method.method.name}（${r.method.method.id}）`,
                targetFile: `templates/methods/${r.method.method.id}.yaml`,
                summary: [
                  ["方法族", r.method.family],
                  ["适用语境", r.method.contexts.join("、")],
                  ["输入角色", r.method.roles.length > 0 ? r.method.roles.map((x) => `${x.name}${x.required ? "（必需）" : ""}`).join("；") : "无（定性方法）"],
                  ["步骤数", String(r.method.steps.length)],
                  ["版本", r.method.method.version]
                ] as [string, string][],
                gaps: [
                  ...(r.method.method.references.length === 0 ? ["方法论出处（references）为空——lint 要求必填"] : []),
                  ...(r.method.roles.length === 0 ? ["无输入角色：将作为定性方法入库"] : [])
                ]
              }
            : {
                kind: r.kind, source: r.source, title: `${r.template.template.industry}（${r.template.template.id}）`,
                targetFile: `templates/${r.template.template.id}.yaml`,
                summary: [
                  ["业务模型", r.template.template.business_models.join("、")],
                  ["指标数", String(r.template.metrics.length)],
                  ["维度", r.template.dimensions.join("、") || "（无）"],
                  ["场景数", String(r.template.scenarios.length)],
                  ["版本", r.template.template.version]
                ] as [string, string][],
                gaps: [
                  ...(r.template.dimensions.length === 0 ? ["维度清单为空"] : []),
                  ...(r.template.scenarios.length === 0 ? ["无种子决策场景"] : [])
                ]
              };
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("templates", "导入模板 · 预览", "确认内容与落盘位置；缺口如实标注，不代为编造。", importPreviewPage(preview), statusInfo)
        );
        return;
      }

      if (path === "/import/save" && req.method === "POST") {
        const form = await readFormBody(req);
        const r = await importParse(form);
        if ("error" in r) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("templates", "导入模板", "解析未通过（零写盘）。", importFormPage({ kind: r.kind, source: r.source }, r.error), statusInfo)
          );
          return;
        }
        const isMethod = "method" in r;
        const id = isMethod ? r.method.method.id : r.template.template.id;
        const target = isMethod ? join(defaultMethodsDir(opts.templatesDir), `${id}.yaml`) : join(opts.templatesDir, `${id}.yaml`);
        try {
          await access(target);
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("templates", "导入模板", "目标已存在（零写盘）。",
              importFormPage({ kind: r.kind, source: r.source }, [`${isMethod ? "方法" : "模板"} id "${id}" 已存在（${target}），为避免覆盖请更换 id`]), statusInfo)
          );
          return;
        } catch { /* 不存在，可创建 */ }
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, `# Metric Factory ${isMethod ? "方法" : "行业"}模板（工作台导入）\n${stringifyYaml(isMethod ? r.method : r.template)}`, "utf8");
        res.writeHead(303, { location: isMethod ? `/templates/methods/${id}` : `/templates/${id}` }).end();
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

      // ===== 01 体系总览（A1 四视图之一；分析体系蓝图 + AI 助手栏）=====
      if (path === "/instance/overview") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(noInstanceView(statusInfo, "体系总览"));
          return;
        }
        const materialized = materialize(ctx.base, ctx.instance);
        const methods = await discoverMethods(opts.templatesDir);
        const review = designReview(materialized, ctx.base, ctx.instance, methods);
        const html = layout(
          "instance",
          "体系总览",
          `基模板 ${escapeHtml(ctx.instance.base ?? "（空白起点）")} · 分析体系的目的、问题结构、假设、证据计划与候选道路。`,
          viewNav("/instance/overview") +
            overviewPage({
              materialized,
              instance: ctx.instance,
              base: ctx.base,
              review: blueprintReviewStatus(materialized),
              designIssueCount: review.designIssues.length
            }),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      // ===== 02 指标体系（原实例视图：概览/变更/指标树/指标字典/微调表单）=====
      if (path === "/instance") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(noInstanceView(statusInfo, "指标体系"));
          return;
        }
        const materialized = materialize(ctx.base, ctx.instance);
        const html = layout("instance", "指标体系", `基模板 ${escapeHtml(ctx.instance.base ?? "（空白起点）")} · 指标定义的唯一权威来源；下方可微调（口径开关/增删改）并写回，写回前经全量校验。`,
          viewNav("/instance") + instancePage(materialized, ctx.instance, ctx.instancePath, ctx.base), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      // ===== 03 场景与方法（决策场景列表 + 方法模板库）=====
      if (path === "/instance/scenarios" && req.method === "GET") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(noInstanceView(statusInfo, "场景与方法"));
          return;
        }
        const materialized = materialize(ctx.base, ctx.instance);
        const methods = await discoverMethods(opts.templatesDir);
        const html = layout(
          "instance",
          "场景与方法",
          "决策场景回答「怎样分析这个问题」；方法模板记录可复用的分析套路，场景经方法绑定引用。",
          viewNav("/instance/scenarios") + scenariosBlock(materialized, ctx.instance, ctx.base) + methodsLibrarySection(methods),
          statusInfo
        );
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      // ===== 04 检查与交付（设计检查 + 业务复核 + 导出/发布/回执）=====
      if (path === "/instance/delivery") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(noInstanceView(statusInfo, "检查与交付"));
          return;
        }
        const html = layout(
          "instance",
          "检查与交付",
          "设计缺口、业务复核与导出发布在同一处收口；复核绑定完整设计快照，相关修改使确认失效。",
          viewNav("/instance/delivery") + (await deliveryContent(ctx)),
          statusInfo
        );
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
              `<div class="empty">场景不存在<br><span class="mono">${escapeHtml(id)}</span><br><a class="btn" href="/instance/scenarios">返回场景列表</a></div>`, statusInfo)
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
        const result = submitScenario(ctx, await discoverMethods(opts.templatesDir), values, "new");
        if (!result.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "决策场景 · 新建", "全量校验未通过（零写盘）——修正下列问题后重试。",
              scenarioFormPage({ mode: "new", values, errors: result.errors }), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, result.instance);
        res.writeHead(303, { location: "/instance/scenarios" }).end();
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
              `<div class="empty">场景不存在<br><span class="mono">${escapeHtml(id)}</span><br><a class="btn" href="/instance/scenarios">返回场景列表</a></div>`, statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const values = { ...readScenarioFormValues(form), id }; // id 以路径为准
        const result = submitScenario(ctx, await discoverMethods(opts.templatesDir), values, "edit");
        if (!result.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "决策场景 · 编辑", "全量校验未通过（零写盘）——修正下列问题后重试。",
              scenarioFormPage({ mode: "edit", values, errors: result.errors }), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, result.instance);
        res.writeHead(303, { location: "/instance/scenarios" }).end();
        return;
      }

      // ===== 场景另存为方法模板（A1 T10：写 templates/methods/<id>.yaml，id 冲突零写盘）=====
      const saveAsMethodMatch = path.match(/^\/instance\/scenarios\/([a-z][a-z0-9_]*)\/save-as-method$/);
      if (saveAsMethodMatch) {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const id = saveAsMethodMatch[1]!;
        const scn = mergedScenarios(ctx).get(id);
        if (!scn) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到场景", `场景 ${escapeHtml(id)} 不存在。`,
              `<div class="empty">场景不存在<br><span class="mono">${escapeHtml(id)}</span><br><a class="btn" href="/instance/scenarios">返回场景列表</a></div>`, statusInfo)
          );
          return;
        }
        const defaultContexts = ctx.instance.blueprint?.contexts ?? [];
        if (req.method === "GET") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "另存为方法模板", `把场景「${escapeHtml(scn.title)}」的分析套路沉淀为可复用方法模板。`,
              saveAsMethodPage(scn, saveAsMethodValues(scn, defaultContexts)), statusInfo)
          );
          return;
        }
        if (req.method === "POST") {
          const form = await readFormBody(req);
          const values: SaveAsMethodValues = {
            id: (form.get("id") ?? "").trim(),
            name: (form.get("name") ?? "").trim(),
            family: (form.get("family") ?? "").trim(),
            purpose: (form.get("purpose") ?? "").trim(),
            description: (form.get("description") ?? "").trim(),
            contexts: form.getAll("contexts"),
            steps: form.get("steps") ?? "",
            evidence: (form.get("evidence") ?? "").trim(),
            limits: (form.get("limits") ?? "").trim(),
            references: form.get("references") ?? ""
          };
          const rerender = (errors: string[]) => {
            res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
              layout("instance", "另存为方法模板", "校验未通过（零写盘）。", saveAsMethodPage(scn, values, errors), statusInfo)
            );
          };
          // 步骤 DSL：逐行 标题|说明（说明可省）
          const stepRows: { title: string; detail: string }[] = [];
          const stepErrors: string[] = [];
          for (const [i, raw] of values.steps.split(/\r?\n/).entries()) {
            if (raw.trim() === "") continue;
            const slots = raw.split("|").map((s) => s.trim());
            if (slots.length < 1 || slots.length > 2 || slots[0] === "") {
              stepErrors.push(`[method-steps] steps 第 ${i + 1} 行: 格式须为 标题|说明（说明可省）`);
              continue;
            }
            stepRows.push({ title: slots[0]!, detail: slots[1] ?? "" });
          }
          if (stepErrors.length > 0) {
            rerender(stepErrors);
            return;
          }
          // 角色从场景指标角色派生：outcome/driver 必需，guardrail 可选
          const ROLE_NAME: Record<string, string> = { outcome: "结果指标", driver: "驱动指标", guardrail: "护栏指标" };
          const roleIds = [...new Set(scn.metric_usages.map((u) => u.role))];
          const candidate = {
            method: {
              id: values.id,
              name: values.name,
              version: "0.1.0",
              description: values.description,
              references: values.references.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
            },
            contexts: values.contexts,
            family: values.family,
            purpose: values.purpose,
            roles: roleIds.map((r) => ({ id: r, name: ROLE_NAME[r] ?? r, required: r !== "guardrail" })),
            steps: stepRows,
            evidence: values.evidence,
            limits: values.limits,
            provenance: { origin: "manual" as const }
          };
          const parsed = MethodTemplateSchema.safeParse(candidate);
          if (!parsed.success) {
            rerender(parsed.error.issues.map((i) => `[method] ${i.path.join(".")}: ${i.message}`));
            return;
          }
          const lintIssues = lintMethodTemplate(parsed.data);
          if (lintIssues.length > 0) {
            rerender(lintIssues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`));
            return;
          }
          const target = join(defaultMethodsDir(opts.templatesDir), `${parsed.data.method.id}.yaml`);
          try {
            await access(target);
            rerender([`方法 id "${parsed.data.method.id}" 已存在（${target}），为避免覆盖请更换 id`]);
            return;
          } catch { /* 不存在，可创建 */ }
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, `# Metric Factory 方法模板（由场景 ${scn.id} 另存）\n${stringifyYaml(parsed.data)}`, "utf8");
          res.writeHead(303, { location: `/templates/methods/${parsed.data.method.id}` }).end();
          return;
        }
      }

      // ===== 分析体系蓝图（A1 T8/T9：编辑保存 / 假设判断状态 / AI 生成与修正 / 预览采纳 / 业务复核）=====
      if (path === "/instance/blueprint/edit") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const bp = ctx.instance.blueprint;
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("instance", bp ? "修正我的理解" : "手工建立分析体系",
            "直接编辑设计要素：业务目的、问题结构、假设三要素、证据计划与候选道路。草稿允许缺口；交付前必须补齐。",
            blueprintEditPage(blueprintFormValues(bp), Boolean(bp)), statusInfo)
        );
        return;
      }

      if (path === "/instance/blueprint" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("未指定实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const values: BlueprintFormValues = {
          title: (form.get("title") ?? "").trim(),
          intent: (form.get("intent") ?? "").trim(),
          purpose: (form.get("purpose") ?? "").trim(),
          decision: (form.get("decision") ?? "").trim(),
          boundary: (form.get("boundary") ?? "").trim(),
          deliverable: (form.get("deliverable") ?? "").trim(),
          contexts: form.getAll("contexts"),
          organizations: form.getAll("organizations"),
          questions: form.get("questions") ?? "",
          hypotheses: form.get("hypotheses") ?? "",
          evidence_plan: form.get("evidence_plan") ?? "",
          options: form.get("options") ?? ""
        };
        const knownMetrics = new Set(materialize(ctx.base, ctx.instance).metrics.map((m) => m.name));
        const q = parseQuestionsDsl(values.questions, knownMetrics);
        const h = parseHypothesesDsl(values.hypotheses);
        const e = parseEvidenceDsl(values.evidence_plan);
        const o = parseOptionsDsl(values.options);
        const dslErrors = [...q.errors, ...h.errors, ...e.errors, ...o.errors];
        const fail = (errors: string[]) => {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "修正我的理解", "保存未通过（零写盘）——修正下列问题后重试。",
              blueprintEditPage(values, Boolean(ctx.instance.blueprint), errors), statusInfo)
          );
        };
        if (dslErrors.length > 0) {
          fail(dslErrors);
          return;
        }
        // 判断性质/核验状态不在编辑表单内（总览视图逐条维护）：按 id 保留既有取值，新增假设取缺省
        const prev = ctx.instance.blueprint;
        const prevHyp = new Map((prev?.hypotheses ?? []).map((x) => [x.id, x]));
        const bpParsed = BlueprintSchema.safeParse({
          title: values.title,
          intent: values.intent,
          purpose: values.purpose,
          decision: values.decision,
          boundary: values.boundary,
          deliverable: values.deliverable,
          contexts: values.contexts,
          organizations: values.organizations,
          questions: q.rows,
          hypotheses: h.rows.map((r) => ({
            ...r,
            judgment: prevHyp.get(r.id)?.judgment ?? "待验证假设",
            verified: prevHyp.get(r.id)?.verified ?? false
          })),
          evidence_plan: e.rows,
          options: o.rows,
          provenance: prev?.provenance ?? { origin: "manual" },
          // review 原样保留：内容未变则复核仍有效（指纹不变）；内容变了自然失配失效（D5）
          ...(prev?.review ? { review: prev.review } : {})
        });
        if (!bpParsed.success) {
          fail(bpParsed.error.issues.map((i) => `[blueprint] ${i.path.join(".")}: ${i.message}`));
          return;
        }
        const merged: Instance = { ...ctx.instance, blueprint: bpParsed.data };
        const instParsed = InstanceSchema.safeParse(merged);
        if (!instParsed.success) {
          fail(instParsed.error.issues.map((i) => `[instance] ${i.path.join(".")}: ${i.message}`));
          return;
        }
        const issues = validateDesign(materialize(ctx.base, instParsed.data), ctx.base, instParsed.data, await discoverMethods(opts.templatesDir), { skipReviewGate: true, writeMode: true });
        if (issues.length > 0) {
          fail(issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`));
          return;
        }
        await writeInstanceFile(ctx.instancePath, instParsed.data);
        res.writeHead(303, { location: "/instance/overview" }).end();
        return;
      }

      const hypStateMatch = path.match(/^\/instance\/blueprint\/hypotheses\/([a-z][a-z0-9_]*)\/state$/);
      if (hypStateMatch && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx || !ctx.instance.blueprint) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无法更新", "实例或分析体系不存在。", formErrorPage("无法更新", ["metric-factory ui --instance <path>，且实例需已含分析体系"]), statusInfo)
          );
          return;
        }
        const hypId = hypStateMatch[1]!;
        const bp = ctx.instance.blueprint;
        if (!bp.hypotheses.some((x) => x.id === hypId)) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到假设", `假设 ${escapeHtml(hypId)} 不存在。`,
              `<div class="empty">假设不存在<br><span class="mono">${escapeHtml(hypId)}</span><br><a class="btn" href="/instance/overview">返回体系总览</a></div>`, statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const judgment = (form.get("judgment") ?? "待验证假设") as JudgmentKind;
        const verified = form.get("verified") === "true";
        const merged: Instance = {
          ...ctx.instance,
          blueprint: {
            ...bp,
            hypotheses: bp.hypotheses.map((x) => (x.id === hypId ? { ...x, judgment, verified } : x))
          }
        };
        const instParsed = InstanceSchema.safeParse(merged);
        if (!instParsed.success) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无法更新", "判断状态取值非法（零写盘）。",
              formErrorPage("schema 校验失败", instParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)), statusInfo)
          );
          return;
        }
        // 判断性质越过证据状态（事实/解释未核验、核验但无已核验证据）是交付缺口而非写入错误——允许保存，缺口在「检查与交付」呈现
        await writeInstanceFile(ctx.instancePath, instParsed.data);
        res.writeHead(303, { location: "/instance/overview" }).end();
        return;
      }

      if ((path === "/instance/blueprint/generate" || path === "/instance/blueprint/refine") && req.method === "POST") {
        const kind = path.endsWith("/generate") ? "generate" : "refine";
        const field = kind === "generate" ? "describe" : "instruction";
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "AI 分析设计", "未指定实例。", formErrorPage("无实例", ["AI 分析设计基于当前实例生成/修正，请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const text = form.get(field)?.trim() ?? "";
        const llm = await llmStatus(envFilePath, authJsonPath);
        if (llm.mode !== "configured" && llm.mode !== "faux") {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "AI 分析设计", "提交未通过校验。", formErrorPage("无法生成", ["AI 模型未配置或配置有误，请先到设置页完成配置", llm.error ?? ""].filter(Boolean)), statusInfo)
          );
          return;
        }
        if (!text) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "AI 分析设计", "提交未通过校验。", formErrorPage("无法生成", [kind === "generate" ? "需求描述不能为空" : "修正指令不能为空"]), statusInfo)
          );
          return;
        }
        const id = randomUUID().slice(0, 8);
        const job: DraftJob = { kind, status: "running", returnTo: "blueprint" };
        jobs.set(id, job);
        runBlueprintJob(job, ctx.base, ctx.instance, await discoverMethods(opts.templatesDir), text, draftPendingPath(ctx.instancePath));
        res.writeHead(303, { location: `/drafts/jobs/${id}` }).end();
        return;
      }

      if (path === "/instance/blueprint/preview") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const pending = await loadPendingDraft(draftPendingPath(ctx.instancePath));
        if (!pending) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "没有可预览的草案。", formErrorPage("无草案", ["没有待采纳的草案，请先在体系总览用自然语言生成或修正"]), statusInfo)
          );
          return;
        }
        if (!pending.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "草案文件损坏，无法预览。", formErrorPage("草案损坏", [pending.error]), statusInfo)
          );
          return;
        }
        if (!pending.draft.blueprint) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "该草案不含分析体系内容。",
              formErrorPage("非蓝图草案", ["当前待采纳草案是指标草案（无分析体系段），请到「AI 草案」页预览与采纳"]), statusInfo)
          );
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("instance", "分析体系草案 · 建议与影响", "AI 建议逐段呈现；采纳才更新同一工作稿，放弃不改任何内容。",
            blueprintDraftPreviewPage(pending.draft, { create: false }), statusInfo)
        );
        return;
      }

      if (path === "/instance/blueprint/apply" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const pending = await loadPendingDraft(draftPendingPath(ctx.instancePath));
        if (!pending) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "无待采纳草案。", formErrorPage("无草案", ["没有可采纳的草案，请先生成"]), statusInfo)
          );
          return;
        }
        if (!pending.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "草案文件损坏，无法采纳。", formErrorPage("草案损坏", [pending.error]), statusInfo)
          );
          return;
        }
        const applied = applyDraft(ctx.instance, pending.draft, ctx.base);
        if (!applied.ok) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "草案合入校验未通过（零写盘，草案已保留）。",
              formErrorPage("合入失败", applied.errors.map((e) => `[${e.rule}] ${e.message}`)), statusInfo)
          );
          return;
        }
        const materialized = materialize(ctx.base, applied.instance);
        const issues = validateDesign(materialized, ctx.base, applied.instance, await discoverMethods(opts.templatesDir), { skipReviewGate: true, writeMode: true });
        if (issues.length > 0) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "分析体系草案", "草案合入校验未通过（零写盘，草案已保留）。",
              formErrorPage("校验失败", issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, applied.instance);
        await rm(draftPendingPath(ctx.instancePath), { force: true });
        res.writeHead(303, { location: "/instance/overview" }).end();
        return;
      }

      if (path === "/instance/blueprint/discard" && req.method === "POST") {
        if (currentInstancePath) {
          await rm(draftPendingPath(currentInstancePath), { force: true });
        }
        res.writeHead(303, { location: "/instance/overview" }).end();
        return;
      }

      // ===== 业务复核确认（A1 D5：绑定完整设计快照指纹；相关修改使确认失效）=====
      if (path === "/instance/review/confirm" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "业务复核", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const confirmedBy = (form.get("confirmed_by") ?? "").trim();
        const materialized = materialize(ctx.base, ctx.instance);
        const methods = await discoverMethods(opts.templatesDir);
        const review = designReview(materialized, ctx.base, ctx.instance, methods);
        const failDelivery = async (msg: string, status = 422) => {
          res.writeHead(status, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "检查与交付", "业务复核未确认（零写盘）。",
              viewNav("/instance/delivery") +
              `<div class="card"><div class="card-h" style="color:var(--fail)">复核被拒绝</div><ul class="error-list" role="alert"><li>${escapeHtml(msg)}</li></ul></div>` +
              (await deliveryContent(ctx)),
              statusInfo)
          );
        };
        if (!ctx.instance.blueprint) {
          await failDelivery("当前实例无分析体系（仅指标体系模式无需业务复核）");
          return;
        }
        if (!confirmedBy) {
          await failDelivery("复核人不能为空（复核动作必须归属到具体责任人）");
          return;
        }
        // fail-closed：设计缺口未清零不可复核（与发布门同一 designReview 聚合，无第二套规则）
        if (review.designIssues.length > 0) {
          await failDelivery(`存在 ${review.designIssues.length} 项设计缺口，处理完成后才能复核`);
          return;
        }
        const confirmed: Instance = {
          ...ctx.instance,
          blueprint: {
            ...ctx.instance.blueprint,
            review: {
              confirmed_by: confirmedBy,
              confirmed_at: new Date().toISOString(),
              design_fingerprint: designFingerprint(materialized)
            }
          }
        };
        await writeInstanceFile(ctx.instancePath, confirmed);
        res.writeHead(303, { location: "/instance/delivery" }).end();
        return;
      }

      // ===== 指标删除（A1 D8：先展示影响；被引用即阻断，禁止悬空引用后假通过）=====
      const metricDeleteIntentMatch = path.match(/^\/instance\/metrics\/([a-z][a-z0-9_]*)\/delete-intent$/);
      if (metricDeleteIntentMatch && req.method === "GET") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "删除指标", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const name = metricDeleteIntentMatch[1]!;
        const materialized = materialize(ctx.base, ctx.instance);
        if (!materialized.metrics.some((m) => m.name === name)) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到指标", `指标 ${escapeHtml(name)} 不存在。`,
              `<div class="empty">指标不存在<br><span class="mono">${escapeHtml(name)}</span><br><a class="btn" href="/instance">返回指标体系</a></div>`, statusInfo)
          );
          return;
        }
        const refs = findMetricReferences(materialized).get(name) ?? [];
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(
          layout("instance", "删除指标 · 影响确认", `指标 ${escapeHtml(name)} 的引用位置全量列出。`,
            viewNav("/instance") + metricDeleteImpactPage(name, refs), statusInfo)
        );
        return;
      }

      const metricDeleteMatch = path.match(/^\/instance\/metrics\/([a-z][a-z0-9_]*)\/delete$/);
      if (metricDeleteMatch && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "删除指标", "未指定实例。", formErrorPage("无实例", ["请先创建或打开实例"]), statusInfo)
          );
          return;
        }
        const name = metricDeleteMatch[1]!;
        const materialized = materialize(ctx.base, ctx.instance);
        if (!materialized.metrics.some((m) => m.name === name)) {
          res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "未找到指标", `指标 ${escapeHtml(name)} 不存在。`,
              `<div class="empty">指标不存在<br><span class="mono">${escapeHtml(name)}</span><br><a class="btn" href="/instance">返回指标体系</a></div>`, statusInfo)
          );
          return;
        }
        // fail-closed：删除前复检六路引用（影响页之后再有点击间隔，状态可能已变）
        const refs = findMetricReferences(materialized).get(name) ?? [];
        if (refs.length > 0) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "删除指标 · 被引用阻断", `指标 ${escapeHtml(name)} 仍被 ${refs.length} 处引用，已拒绝删除（零写盘）。`,
              viewNav("/instance") + metricDeleteImpactPage(name, refs), statusInfo)
          );
          return;
        }
        const isAdded = ctx.instance.added.some((m) => m.name === name);
        const caliber = { ...ctx.instance.caliber_switches };
        delete caliber[name];
        const merged: Instance = {
          ...ctx.instance,
          caliber_switches: caliber,
          modified: ctx.instance.modified.filter((m) => m.name !== name),
          ...(isAdded
            ? { added: ctx.instance.added.filter((m) => m.name !== name) }
            : { removed: [...ctx.instance.removed, name] })
        };
        const instParsed = InstanceSchema.safeParse(merged);
        if (!instParsed.success) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "删除指标", "实例 schema 校验未通过（零写盘）。",
              formErrorPage("schema 校验失败", instParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)), statusInfo)
          );
          return;
        }
        const issues = validateDesign(materialize(ctx.base, instParsed.data), ctx.base, instParsed.data, await discoverMethods(opts.templatesDir), { skipReviewGate: true, writeMode: true });
        if (issues.length > 0) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "删除指标", "删除后全量校验未通过（零写盘）。",
              formErrorPage("校验失败", issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`)), statusInfo)
          );
          return;
        }
        await writeInstanceFile(ctx.instancePath, instParsed.data);
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
        const issues = validateDesign(materialized, ctx.base, ctx.instance, await discoverMethods(opts.templatesDir));
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

      // ===== 发布（批次 1 切片 3；ui-contract §0.1：成功 200 重渲染 / 失败 422 零写盘；与 CLI release 同一管线，零第二套规则）=====
      if (path === "/instance/release" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("无实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const version = (form.get("version") ?? "").trim();
        const note = form.get("note") ?? "";
        const values = { version, note };
        const rerender = async (release: ReleaseUiState, status: number) => {
          res.writeHead(status, { "content-type": "text/html; charset=utf-8" }).end(
            layout(
              "instance",
              "检查与交付",
              "设计缺口、业务复核与导出发布在同一处收口；复核绑定完整设计快照，相关修改使确认失效。",
              viewNav("/instance/delivery") + (await deliveryContent(ctx, release)),
              statusInfo
            )
          );
        };
        try {
          const result = await releaseInstance({
            instancePath: ctx.instancePath,
            version,
            templatesDir: opts.templatesDir,
            releasesDir: join(workspaceDir, "releases"),
            releasedBy: process.env.MF_REVIEWER ?? process.env.USER ?? "unknown",
            note,
            now: new Date().toISOString()
          });
          await rerender(
            {
              kind: "success",
              values: { version: "", note: "" },
              result: {
                packageId: result.packageId,
                version: result.version,
                contentFingerprint: result.contentFingerprint,
                packageFingerprint: result.packageFingerprint,
                indexEntryNumber: result.indexEntryNumber
              }
            },
            200
          );
        } catch (e) {
          if (e instanceof ReleaseError) {
            if (e.rule === "invalid-version") {
              await rerender(
                {
                  kind: "invalid",
                  values,
                  versionError: `版本号 "${version}" 不是合法 semver（须为三段数字 X.Y.Z，如 1.2.0），已拒绝发布（零写盘）`
                },
                422
              );
            } else if (e.rule === "duplicate-release") {
              await rerender(
                {
                  kind: "duplicate",
                  values,
                  versionError: `${e.info.packageId}@${e.info.publishedVersion} 已发布于 ${e.info.createdAt}，请升级版本号（已发布版本不可变）`
                },
                422
              );
            } else if (e.rule === "same-content") {
              await rerender(
                {
                  kind: "duplicate",
                  values,
                  versionError: `内容与 ${e.info.packageId}@${e.info.publishedVersion} 完全一致，未修改不重复发版；如需新版本请先修改设计内容`
                },
                422
              );
            } else if (e.rule === "index-corrupt") {
              await rerender(
                {
                  kind: "index-corrupt",
                  values,
                  issues: [
                    `releases/index.yaml 解析失败或形状非法（${e.info.detail ?? e.message}），已拒绝发布（fail-closed，零写盘）。请用 git 恢复该文件后重试；发布不会自动重建或覆盖它。`
                  ]
                },
                422
              );
            } else {
              await rerender({ kind: "validation-failed", values, issues: e.info.issues ?? [e.message] }, 422);
            }
            return;
          }
          if (e instanceof ExportBlockedError) {
            await rerender(
              {
                kind: "validation-failed",
                values,
                issues: [e.message]
              },
              422
            );
            return;
          }
          if (e instanceof SapAssemblyError) {
            await rerender({ kind: "validation-failed", values, issues: [`[${e.rule}] ${e.message}`] }, 422);
            return;
          }
          throw e;
        }
        return;
      }

      // ===== 采用回执登记（批次 A+B 切片 5；ui-contract §0.1：成功 200 重渲染 / 失败 422 零写盘；与 CLI receipt add 同一 registerReceipt）=====
      if (path === "/instance/receipts" && req.method === "POST") {
        const ctx = await loadInstanceContext(currentInstancePath, templates);
        if (!ctx) {
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("instance", "无实例", "未指定实例。", formErrorPage("无实例", ["metric-factory ui --instance <path>"]), statusInfo)
          );
          return;
        }
        const form = await readFormBody(req);
        const yamlText = form.get("receipt") ?? "";
        const values = { yaml: yamlText };
        const receiptRerender = async (patch: Partial<ReceiptsUiState>, status: number) => {
          res.writeHead(status, { "content-type": "text/html; charset=utf-8" }).end(
            layout(
              "instance",
              "检查与交付",
              "设计缺口、业务复核与导出发布在同一处收口；复核绑定完整设计快照，相关修改使确认失效。",
              viewNav("/instance/delivery") + (await deliveryContent(ctx, undefined, values, patch)),
              statusInfo
            )
          );
        };
        const receiptIssue13 = (detail: string) =>
          `releases/index.yaml 缺失或损坏（${detail}），无法对账，已拒绝登记（fail-closed，零写盘）。若从未发布过版本请先发布；若文件损坏请用 git 恢复后重试；登记不会自动重建或覆盖它。`;
        try {
          registerReceipt({ receiptText: yamlText, releasesDir: join(workspaceDir, "releases"), now: new Date().toISOString() });
          await receiptRerender({ values: { yaml: "" } }, 200);
        } catch (e) {
          if (e instanceof ReceiptError) {
            if (e.rule === "schema" && Array.isArray(e.info.issues)) {
              await receiptRerender(
                {
                  issuesTitle: "回执未通过校验（零写盘）",
                  issues: (e.info.issues as { path: string; message: string }[]).map((i) => `[receipt] ${i.path}: ${i.message}`)
                },
                422
              );
            } else if (e.rule === "duplicate") {
              await receiptRerender(
                {
                  yamlError: `task_id "${String(e.info.task_id)}" 已登记于 ${String(e.info.received_at || "未知时间")}，不可重复登记（append-only）；如为新任务请更换 task_id。`
                },
                422
              );
            } else if (e.rule === "index-missing") {
              await receiptRerender({ issuesTitle: "登记被拒绝 · releases/index.yaml 不可用", issues: [receiptIssue13("缺失，尚无任何发布版本")] }, 422);
            } else if (e.rule === "index-corrupt") {
              await receiptRerender({ issuesTitle: "登记被拒绝 · releases/index.yaml 不可用", issues: [receiptIssue13(String(e.info.detail ?? "解析失败"))] }, 422);
            } else {
              await receiptRerender({ issuesTitle: "登记失败", issues: [e.message] }, 422);
            }
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
        const issues = validateDesign(materialized, ctx.base, parsed.data, await discoverMethods(opts.templatesDir), { skipReviewGate: true, writeMode: true });
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
        const llm = await llmStatus(envFilePath, authJsonPath);
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
        const llm = await llmStatus(envFilePath, authJsonPath);
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
          // A1：按任务去向分流——指标草案回草案工坊；蓝图草案进预览页（建议与影响）；首页创建流进创建预览
          const target =
            job.returnTo === "blueprint" ? "/instance/blueprint/preview"
              : job.returnTo === "blueprint-create" ? "/blueprint/preview"
                : "/drafts";
          res.writeHead(303, { location: target }).end();
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
        const issues = validateDesign(materialized, ctx.base, applied.instance, await discoverMethods(opts.templatesDir), { skipReviewGate: true, writeMode: true });
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
        const status = await llmStatus(envFilePath, authJsonPath);
        const banner =
          url.searchParams.get("saved") === "1"
            ? "saved"
            : url.searchParams.get("cleared") === "1"
              ? "cleared"
              : undefined;
        // M3 统计卡（D7/G8）：faux 整卡替换；真实后端双源聚合 + 降级标志 + 预算警告 chips
        let statsView: StatsView | undefined;
        if (status.mode === "faux") {
          statsView = { mode: "faux" };
        } else {
          const { env } = await resolveLlmEnvAuto({ processEnv: process.env, envFilePath, authJsonPath });
          const dataDir = resolveDataDir(env);
          const caps = tryParseBudgetCaps(env);
          const d = createFileBudgetStore(dataDir, caps).describeBudget();
          const warns: { label: string; note: string }[] = [];
          if (caps.maxTokens !== undefined && d.usedTokens >= caps.maxTokens * 0.8) {
            const pct = Math.min(100, Math.floor((d.usedTokens / caps.maxTokens) * 100));
            warns.push({ label: `预算已用 ${pct}%`, note: `（tokens 上限 ${d.usedTokens >= caps.maxTokens ? fmtNum(caps.maxTokens) : fmtNum(caps.maxTokens)}）` });
          }
          if (caps.maxCalls !== undefined && d.usedCalls >= caps.maxCalls * 0.8) {
            const pct = Math.min(100, Math.floor((d.usedCalls / caps.maxCalls) * 100));
            warns.push({ label: `预算已用 ${pct}%`, note: `（调用上限 ${fmtNum(caps.maxCalls)} 次）` });
          }
          statsView = {
            mode: "real",
            stats: aggregateCallStats(dataDir),
            degraded: isAuditDegraded(join(dataDir, "model-audit.jsonl")),
            warns
          };
        }
        const html = layout("settings", "设置", "AI 模型连接与工作台信息。配置仅存本机 .env.local（git 已忽略），页面不回显密钥。",
          settingsPage(status, { banner, statsView }), statusInfo);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
        return;
      }

      if (path === "/settings/save" && req.method === "POST") {
        const form = await readFormBody(req);
        const model = form.get("model")?.trim() ?? "";
        const apiKey = form.get("api_key")?.trim() ?? "";
        const baseUrl = form.get("base_url")?.trim() ?? "";
        // G6：空模型保存 ≡ 清除覆盖、回退自动发现（忽略 api_key/base_url 输入，键集合同 /settings/clear）
        if (model === "") {
          const existing = await readEnvFile(envFilePath);
          const updates: Record<string, string | null> = { MF_LLM_MODEL: null, MF_LLM_BASE_URL: null };
          const prevSpec = existing.MF_LLM_MODEL;
          if (prevSpec) {
            const prevSlash = prevSpec.indexOf("/");
            if (prevSlash > 0) updates[apiKeyEnvName(prevSpec.slice(0, prevSlash))] = null;
          }
          await writeManagedEnv(envFilePath, updates);
          res.writeHead(303, { location: "/settings?cleared=1" }).end();
          return;
        }
        const slash = model.indexOf("/");
        if (slash <= 0 || slash === model.length - 1) {
          const status = await llmStatus(envFilePath, authJsonPath);
          res.writeHead(422, { "content-type": "text/html; charset=utf-8" }).end(
            layout("settings", "保存失败", "模型格式不正确。", settingsPage(status, {
              errors: [`模型需为 <provider>/<model-id> 形式（收到 "${model}"），如 openai/gpt-4o`]
              // G9c：表单 value 永不回填（含 422）——查看与覆盖物理分离，违例值只在错误信息引用内
            }), statusInfo)
          );
          return;
        }
        const provider = model.slice(0, slash);
        const updates: Record<string, string | null> = { MF_LLM_MODEL: model, MF_LLM_BASE_URL: baseUrl || null };
        if (apiKey) updates[apiKeyEnvName(provider)] = apiKey;
        await writeManagedEnv(envFilePath, updates);
        res.writeHead(303, { location: "/settings?saved=1" }).end();
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
        res.writeHead(303, { location: "/settings?cleared=1" }).end();
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
