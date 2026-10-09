import { z } from "zod";
import { MetricSchema, ConceptRefSchema } from "./template.js";
import { ScenarioSchema } from "./scenario.js";
import { AnswersSchema } from "./answers.js";

// 企业实例 = 模板 fork + diff patch（GRILL 决议 #2：自定义结构化格式，人可读）
export const ModifiedMetricSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().min(1).optional(),
  definition: z.string().min(1).optional(),
  owner_role: z.string().min(1).optional(),
  dimensions: z.array(z.string().min(1)).optional()
});

export const InstanceSchema = z.object({
  instance: z.object({
    created_at: z.string().min(1),
    company: z.string().min(1).optional()
  }),
  base: z.string().regex(/^[a-z0-9-]+@\d+\.\d+\.\d+$/, "base 必须是 template_id@version 形式"),
  answers: AnswersSchema,
  caliber_switches: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  added: z.array(MetricSchema).default([]),
  removed: z.array(z.string().min(1)).default([]),
  modified: z.array(ModifiedMetricSchema).default([]),
  concept_refs: z.array(ConceptRefSchema).default([]),
  added_scenarios: z.array(ScenarioSchema).default([])
});

export type Instance = z.infer<typeof InstanceSchema>;
export type ModifiedMetric = z.infer<typeof ModifiedMetricSchema>;
