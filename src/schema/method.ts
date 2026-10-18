import { z } from "zod";
import { ProvenanceSchema } from "./template.js";
import { AnalysisContextSchema } from "./blueprint.js";

// MethodTemplate v0.1（A1 批次，方案 §6 第二类模板）：分析方法模板 =
// 适用语境 + 输入角色 + 步骤 + 证据要求 + 限制。引用不实现：场景经 method_bindings 绑定角色，
// 适用性与必需角色检查需要体系上下文，留给 engine 规则，不在 schema 层做。

export const MethodRoleSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/, "方法角色 id 必须是小写 snake_case（机器契约）"),
  name: z.string().min(1, "角色中文名（name）必填"),
  required: z.boolean().default(true)
});

export const MethodStepSchema = z.object({
  title: z.string().min(1, "步骤标题（title）必填"),
  detail: z.string().default("")
});

export const MethodTemplateSchema = z
  .object({
    method: z.object({
      id: z.string().regex(/^[a-z0-9-]+$/, "方法 id 必须是小写 kebab-case（机器契约）"),
      name: z.string().min(1, "方法名称（name）必填"),
      version: z.string().regex(/^\d+\.\d+\.\d+$/, "方法 version 必须是 semver"),
      description: z.string().min(1, "方法描述（description）必填"),
      references: z.array(z.string().min(1)).default([])
    }),
    contexts: z.array(AnalysisContextSchema).min(1, "方法至少声明一个适用语境（contexts）"),
    family: z.string().min(1, "方法必须声明专业方法族（family，如 描述分解 · 方案比较）"),
    purpose: z.string().min(1, "方法必须声明服务的判断（purpose）"),
    roles: z.array(MethodRoleSchema).default([]),
    steps: z.array(MethodStepSchema).min(1, "方法至少包含一个步骤（steps）"),
    evidence: z.string().min(1, "方法必须声明证据要求（evidence）"),
    limits: z.string().min(1, "方法必须声明限制（limits）"),
    provenance: ProvenanceSchema
  })
  .superRefine((m, ctx) => {
    const seen = new Set<string>();
    for (const [i, r] of m.roles.entries()) {
      if (seen.has(r.id)) {
        ctx.addIssue({ code: "custom", path: ["roles", i, "id"], message: `方法角色 id "${r.id}" 重复` });
      }
      seen.add(r.id);
    }
    if (new Set(m.contexts).size !== m.contexts.length) {
      ctx.addIssue({ code: "custom", path: ["contexts"], message: "适用语境（contexts）不允许重复" });
    }
  });

export type MethodRole = z.infer<typeof MethodRoleSchema>;
export type MethodStep = z.infer<typeof MethodStepSchema>;
export type MethodTemplate = z.infer<typeof MethodTemplateSchema>;
