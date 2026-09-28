import { z } from "zod";
import { TypeParamsSchema, type Metric, type Template } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { Draft } from "../schema/draft.js";
import { PROMPT_VERSION } from "../llm/prompt.js";
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
  try {
    raw = await client.complete(prompt);
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
    provenance: { origin: "llm", model: modelLabel, prompt_version: PROMPT_VERSION },
    review: { required: true }
  }));

  return {
    ok: true,
    draft: {
      generator: { model: modelLabel, prompt_version: PROMPT_VERSION, describe, created_at: now },
      added: metrics,
      modified: [],
      removed: [],
      caliber: {}
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
  try {
    raw = await client.complete(prompt);
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
    provenance: { origin: "llm", model: modelLabel, prompt_version: PROMPT_VERSION },
    review: { required: true }
  }));

  return {
    ok: true,
    draft: {
      generator: { model: modelLabel, prompt_version: PROMPT_VERSION, describe: instruction, created_at: now },
      added,
      modified: payload.data.modified,
      removed: payload.data.removed,
      caliber: payload.data.caliber
    }
  };
}

export { PROMPT_VERSION };
