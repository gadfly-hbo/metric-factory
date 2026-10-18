import { z } from "zod";

// ScenarioSpec v0.1（PRD 冻结结构）：决策场景 = 用途 + 问题树 + 指标角色登记 + 方法/证据/评审要求
// 树 metric 与 usages.metric 的存在性校验需要模板/物化上下文，留给 lint/validate，不在 schema 层做
export const ScenarioSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/, "场景 id 必须是小写 snake_case（机器契约）"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "场景 version 必须是 semver"),
    title: z.string().min(1, "场景标题（title）必填"),
    decision_purpose: z.string().min(1, "场景必须声明决策用途（decision_purpose，ABS AT02 门）"),
    question_tree: z.array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9_]*$/, "问题树节点 id 必须是小写 snake_case"),
        label: z.string().min(1, "问题树节点 label 必填"),
        parent: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
        metric: z.string().min(1).optional()
      })
    ),
    metric_usages: z.array(
      z.object({
        metric: z.string().min(1),
        role: z.enum(["outcome", "driver", "guardrail"]),
        note: z.string().optional()
      })
    ),
    method_refs: z.array(z.string().min(1)).default([]),
    // ScenarioSpec v0.2（A1 批次 D4，可选扩展，向后兼容 v0.1 包）：
    // 方法角色绑定 = 方法模板角色 → 本体系指标；method_ref 形如 <method-id>@<semver>。
    // 刻意不带 default：空绑定时键缺席，v0.1 内容的规范化字节与指纹不变（已发布快照身份不受影响）。
    method_bindings: z
      .array(
        z.object({
          method_ref: z.string().min(1),
          role: z.string().regex(/^[a-z][a-z0-9_]*$/, "绑定角色 id 必须是小写 snake_case"),
          metric: z.string().min(1)
        })
      )
      .optional(),
    evidence_requirements: z.string().default(""),
    output_spec: z.string().default(""),
    review_rules: z.string().default("")
  })
  .superRefine((s, ctx) => {
    const nodes = s.question_tree;
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const seen = new Set<string>();
    for (const [i, n] of nodes.entries()) {
      if (seen.has(n.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["question_tree", i, "id"],
          message: `question_tree 节点 id "${n.id}" 在场景内重复`
        });
        continue;
      }
      seen.add(n.id);
    }

    for (const [i, n] of nodes.entries()) {
      if (!n.parent) continue;
      if (n.parent === n.id) {
        ctx.addIssue({
          code: "custom",
          path: ["question_tree", i, "parent"],
          message: `节点 ${n.id} 的 parent 指向自身`
        });
        continue;
      }
      if (!byId.has(n.parent)) {
        ctx.addIssue({
          code: "custom",
          path: ["question_tree", i, "parent"],
          message: `节点 ${n.id} 的 parent "${n.parent}" 不在 question_tree 节点表中`
        });
        continue;
      }
      // 沿 parent 上溯步数超过节点总数仍未终止即成环
      let cur: string | undefined = n.parent;
      let steps = 0;
      while (cur !== undefined && byId.has(cur)) {
        steps += 1;
        if (steps > nodes.length) {
          ctx.addIssue({
            code: "custom",
            path: ["question_tree", i, "parent"],
            message: `节点 ${n.id} 的 parent 链成环`
          });
          break;
        }
        cur = byId.get(cur)!.parent;
      }
    }
  });

export type Scenario = z.infer<typeof ScenarioSchema>;
