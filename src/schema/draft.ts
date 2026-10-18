import { z } from "zod";
import { MetricSchema } from "./template.js";
import { ModifiedMetricSchema } from "./instance.js";
import { BlueprintSchema } from "./blueprint.js";
import { ScenarioSchema } from "./scenario.js";

// LLM 草案 = generator 元信息 + patch 段；apply 校验后合入实例
// A1 批次 D9：新增可选 blueprint（全量替换语义）与 added_scenarios 段；既有四段指标 patch 不变
export const DraftSchema = z.object({
  generator: z.object({
    model: z.string().min(1),
    prompt_version: z.string().min(1),
    describe: z.string().min(1),
    created_at: z.string().min(1)
  }),
  added: z.array(MetricSchema),
  modified: z.array(ModifiedMetricSchema).default([]),
  removed: z.array(z.string().min(1)).default([]),
  caliber: z.record(z.string(), z.record(z.string(), z.boolean())).default({}),
  blueprint: BlueprintSchema.optional(),
  added_scenarios: z.array(ScenarioSchema).default([])
});

export type Draft = z.infer<typeof DraftSchema>;
