import { z } from "zod";
import { MetricSchema, ConceptRefSchema } from "./template.js";
import { ScenarioSchema } from "./scenario.js";
import { BlueprintSchema } from "./blueprint.js";
import { AnswersSchema } from "./answers.js";

// 企业实例 = 模板 fork + diff patch（GRILL 决议 #2：自定义结构化格式，人可读）
// A1 批次 D13：base/answers 可选化——自然语言起点的空白工作区（无基模板）合法存在；
// 向导/模板路径仍总是携带 base 与 answers。空白基座的物化语义见 materialize.ts EMPTY_TEMPLATE。
export const ModifiedMetricSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().min(1).optional(),
  definition: z.string().min(1).optional(),
  owner_role: z.string().min(1).optional(),
  dimensions: z.array(z.string().min(1)).optional(),
  // A2 U1-b（用户裁决）：口径确认写路径——对模板基座指标经 modified 段覆盖 caliber_switches 布尔键
  //（与实例级 caliber_switches 同语义：键级合并，加法式扩展，既有实例无此字段行为不变）
  caliber_switches: z.record(z.string(), z.boolean()).optional()
});

export const InstanceSchema = z.object({
  instance: z.object({
    created_at: z.string().min(1),
    company: z.string().min(1).optional()
  }),
  base: z.string().regex(/^[a-z0-9-]+@\d+\.\d+\.\d+$/, "base 必须是 template_id@version 形式").optional(),
  answers: AnswersSchema.optional(),
  caliber_switches: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  added: z.array(MetricSchema).default([]),
  removed: z.array(z.string().min(1)).default([]),
  modified: z.array(ModifiedMetricSchema).default([]),
  concept_refs: z.array(ConceptRefSchema).default([]),
  added_scenarios: z.array(ScenarioSchema).default([]),
  // A1 批次 D1：分析体系为可选段；缺省 = 仅指标体系模式（既有行为不变）
  blueprint: BlueprintSchema.optional()
});

export type Instance = z.infer<typeof InstanceSchema>;
export type ModifiedMetric = z.infer<typeof ModifiedMetricSchema>;
