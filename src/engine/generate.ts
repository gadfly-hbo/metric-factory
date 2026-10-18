import { z } from "zod";
import { TypeParamsSchema, type Metric, type Template } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { Draft } from "../schema/draft.js";
import { BlueprintSchema } from "../schema/blueprint.js";
import { ScenarioSchema, type Scenario } from "../schema/scenario.js";
import { PROMPT_VERSION, BLUEPRINT_PROMPT_VERSION } from "../llm/prompt.js";
import type { LlmClient } from "../llm/types.js";

// LLM 输出的宽松载荷（provenance 由组装层强制注入，模型无权自报出处）
export const LlmMetricPayloadSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, "name 必须是小写 snake_case"),
  display_name: z.string().min(1),
  type: z.enum(["simple", "ratio", "derived", "cumulative"]),
  definition: z.string().min(1),
  dimensions: z.array(z.string().min(1)).default([]),
  time_grains: z.array(z.enum(["day", "week", "month", "quarter", "year"])).min(1),
  owner_role: z.string().min(1),
  type_params: TypeParamsSchema.optional()
});

export type LlmMetricPayload = z.infer<typeof LlmMetricPayloadSchema>;

export type GenerateResult =
  | { ok: true; draft: Draft }
  | { ok: false; stage: "call" | "parse" | "payload"; raw: string; issues?: string[] };

// refine 输出契约：四段 patch（added 同样由组装层注入 provenance）
export const RefinePayloadSchema = z.object({
  caliber: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  modified: z
    .array(
      z.object({
        name: z.string().min(1),
        display_name: z.string().min(1).optional(),
        definition: z.string().min(1).optional(),
        owner_role: z.string().min(1).optional(),
        dimensions: z.array(z.string().min(1)).optional()
      })
    )
    .default([]),
  removed: z.array(z.string().min(1)).default([]),
  added: z.array(LlmMetricPayloadSchema).default([])
});

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const firstNewline = trimmed.indexOf("\n");
    const body = firstNewline === -1 ? "" : trimmed.slice(firstNewline + 1);
    return body.replace(/```\s*$/, "").trim();
  }
  return trimmed;
}

export async function generateDraft(
  client: LlmClient,
  prompt: { system: string; user: string },
  describe: string,
  modelLabel: string,
  now: string
): Promise<GenerateResult> {
  let raw: string;
  let truthModel: string | undefined;
  try {
    const completion = await client.complete(prompt);
    raw = completion.text;
    // M3 D5：provenance 真值——实际出稿 provider/model（主备回退后为备候选）；无真值（faux）回退 modelLabel
    truthModel = completion.provider !== undefined ? `${completion.provider}/${completion.model ?? ""}` : undefined;
  } catch (e) {
    return { ok: false, stage: "call", raw: (e as Error).message };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return { ok: false, stage: "parse", raw };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, stage: "parse", raw };
  }

  const payloads = z.array(LlmMetricPayloadSchema).safeParse(parsed);
  if (!payloads.success) {
    return {
      ok: false,
      stage: "payload",
      raw,
      issues: payloads.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    };
  }

  const metrics: Metric[] = payloads.data.map((p) => ({
    ...p,
    caliber_switches: {},
    provenance: { origin: "llm", model: truthModel ?? modelLabel, prompt_version: PROMPT_VERSION },
    review: { required: true }
  }));

  return {
    ok: true,
    draft: {
      generator: { model: truthModel ?? modelLabel, prompt_version: PROMPT_VERSION, describe, created_at: now },
      added: metrics,
      modified: [],
      removed: [],
      caliber: {},
      added_scenarios: []
    }
  };
}

export async function generateRefineDraft(
  client: LlmClient,
  prompt: { system: string; user: string },
  instruction: string,
  modelLabel: string,
  now: string
): Promise<GenerateResult> {
  let raw: string;
  let truthModel: string | undefined;
  try {
    const completion = await client.complete(prompt);
    raw = completion.text;
    // M3 D5：provenance 真值——实际出稿 provider/model（主备回退后为备候选）；无真值（faux）回退 modelLabel
    truthModel = completion.provider !== undefined ? `${completion.provider}/${completion.model ?? ""}` : undefined;
  } catch (e) {
    return { ok: false, stage: "call", raw: (e as Error).message };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return { ok: false, stage: "parse", raw };
  }

  const payload = RefinePayloadSchema.safeParse(parsed);
  if (!payload.success) {
    return {
      ok: false,
      stage: "payload",
      raw,
      issues: payload.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    };
  }

  const added: Metric[] = payload.data.added.map((p) => ({
    ...p,
    caliber_switches: {},
    provenance: { origin: "llm", model: truthModel ?? modelLabel, prompt_version: PROMPT_VERSION },
    review: { required: true }
  }));

  return {
    ok: true,
    draft: {
      generator: { model: truthModel ?? modelLabel, prompt_version: PROMPT_VERSION, describe: instruction, created_at: now },
      added,
      modified: payload.data.modified,
      removed: payload.data.removed,
      caliber: payload.data.caliber,
      added_scenarios: []
    }
  };
}

export { PROMPT_VERSION, BLUEPRINT_PROMPT_VERSION };

// ===== A1 批次 D9：分析体系（blueprint）草稿 =====

// LLM 输出的蓝图载荷：无 provenance（装配层强制注入，模型无权自报出处）
const LlmBlueprintPayloadSchema = z.object({
  title: z.string().min(1),
  intent: z.enum(["建设可复用体系", "设计具体分析方案"]),
  purpose: z.string().default(""),
  decision: z.string().default(""),
  boundary: z.string().default(""),
  deliverable: z.string().default(""),
  contexts: z.array(z.enum(["经营改善", "战略选择", "独立数据专题"])).min(1),
  organizations: z.array(z.enum(["假设先行", "深度研究", "自主探索"])).min(1),
  questions: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9_]*$/),
        title: z.string().min(1),
        detail: z.string().default(""),
        metric_refs: z.array(z.string().min(1)).default([])
      })
    )
    .default([]),
  hypotheses: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9_]*$/),
        statement: z.string().min(1),
        judgment: z.enum(["事实", "解释", "待验证假设", "建议"]).default("待验证假设"),
        support: z.string().default(""),
        counter: z.string().default(""),
        change_condition: z.string().default(""),
        verified: z.boolean().default(false)
      })
    )
    .default([]),
  evidence_plan: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9_]*$/),
        name: z.string().min(1),
        kind: z.string().min(1),
        source: z.string().default(""),
        check: z.string().default(""),
        insufficiency: z.string().default(""),
        status: z.enum(["待获取", "取得待核", "已核验", "支持不足", "存在冲突"]).default("待获取")
      })
    )
    .default([]),
  options: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9_]*$/),
        name: z.string().min(1),
        tradeoff: z.string().default("")
      })
    )
    .default([])
});

// LLM 输出的场景载荷：version 由服务端固定（与 UI 场景表单同规）
const LlmScenarioPayloadSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  title: z.string().min(1),
  decision_purpose: z.string().min(1),
  question_tree: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9_]*$/),
        label: z.string().min(1),
        parent: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
        metric: z.string().min(1).optional()
      })
    )
    .default([]),
  metric_usages: z
    .array(
      z.object({
        metric: z.string().min(1),
        role: z.enum(["outcome", "driver", "guardrail"]),
        note: z.string().optional()
      })
    )
    .default([]),
  method_refs: z.array(z.string().min(1)).default([]),
  method_bindings: z
    .array(
      z.object({
        method_ref: z.string().min(1),
        role: z.string().regex(/^[a-z][a-z0-9_]*$/),
        metric: z.string().min(1)
      })
    )
    .default([]),
  evidence_requirements: z.string().default(""),
  output_spec: z.string().default(""),
  review_rules: z.string().default("")
});

export const BlueprintDraftPayloadSchema = z.object({
  blueprint: LlmBlueprintPayloadSchema,
  added_metrics: z.array(LlmMetricPayloadSchema).default([]),
  added_scenarios: z.array(LlmScenarioPayloadSchema).default([])
});

// blueprint 生成与修正共用同一载荷契约（prompt 不同，装配相同；修正为全量替换语义）
export async function generateBlueprintDraft(
  client: LlmClient,
  prompt: { system: string; user: string },
  describe: string,
  modelLabel: string,
  now: string
): Promise<GenerateResult> {
  let raw: string;
  let truthModel: string | undefined;
  try {
    const completion = await client.complete(prompt);
    raw = completion.text;
    truthModel = completion.provider !== undefined ? `${completion.provider}/${completion.model ?? ""}` : undefined;
  } catch (e) {
    return { ok: false, stage: "call", raw: (e as Error).message };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return { ok: false, stage: "parse", raw };
  }

  const payload = BlueprintDraftPayloadSchema.safeParse(parsed);
  if (!payload.success) {
    return {
      ok: false,
      stage: "payload",
      raw,
      issues: payload.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    };
  }

  const model = truthModel ?? modelLabel;
  const issues: string[] = [];

  const blueprintParsed = BlueprintSchema.safeParse({
    ...payload.data.blueprint,
    provenance: { origin: "llm", model, prompt_version: BLUEPRINT_PROMPT_VERSION }
  });
  if (!blueprintParsed.success) {
    issues.push(...blueprintParsed.error.issues.map((i) => `blueprint.${i.path.join(".")}: ${i.message}`));
  }

  const scenarios: Scenario[] = [];
  for (const s of payload.data.added_scenarios) {
    const { method_bindings, ...rest } = s;
    const sp = ScenarioSchema.safeParse({
      ...rest,
      // 空绑定时键缺席（与 D4 约定一致：不污染规范化字节）
      ...(method_bindings.length > 0 ? { method_bindings } : {}),
      version: "0.1.0"
    });
    if (!sp.success) {
      issues.push(...sp.error.issues.map((i) => `added_scenarios.${s.id}.${i.path.join(".")}: ${i.message}`));
    } else {
      scenarios.push(sp.data);
    }
  }
  if (issues.length > 0 || !blueprintParsed.success) {
    return { ok: false, stage: "payload", raw, issues };
  }

  const added: Metric[] = payload.data.added_metrics.map((p) => ({
    ...p,
    caliber_switches: {},
    provenance: { origin: "llm", model, prompt_version: BLUEPRINT_PROMPT_VERSION },
    review: { required: true }
  }));

  return {
    ok: true,
    draft: {
      generator: { model, prompt_version: BLUEPRINT_PROMPT_VERSION, describe, created_at: now },
      added,
      modified: [],
      removed: [],
      caliber: {},
      blueprint: blueprintParsed.data,
      added_scenarios: scenarios
    }
  };
}
