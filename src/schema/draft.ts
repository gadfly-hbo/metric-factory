import { z } from "zod";
import { MetricSchema } from "./template.js";
import { ModifiedMetricSchema } from "./instance.js";

// LLM 草案 = generator 元信息 + 四段 patch；apply 校验后合入实例
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
  caliber: z.record(z.string(), z.record(z.string(), z.boolean())).default({})
});

export type Draft = z.infer<typeof DraftSchema>;
