import { z } from "zod";

export const AnswersSchema = z.object({
  revenue_model: z.enum(["交易抽佣", "订阅", "广告", "服务费", "混合"]),
  user_structure: z.enum(["2C", "2B", "双边市场"]),
  core_loop: z.enum(["交易", "内容消费", "创作消费", "协作"]),
  caliber: z.record(z.string(), z.record(z.string(), z.boolean())).default({})
});

export type Answers = z.infer<typeof AnswersSchema>;
