// SAP 0.1 消费侧校验器（契约 §6 validate_import 供应侧镜像；PRD「校验器双面共用」）
// 规则集：structure（zod 全段，含未知 sap 版本）/ runtime-state / fingerprint-mismatch /
// duplicate-identity（指标重名、concept_refs 重复键）；任一命中即 issues 非空，导出器据非空 throw。
import { z } from "zod";
import { packageFingerprint, type SapPackage } from "./canonical.js";
import { conceptRefKey } from "./assemble.js";
import { MetricSchema, ConceptRefSchema } from "../schema/template.js";
import type { ValidateIssue } from "../engine/validate.js";

// 契约 §3 全段：sap 字面 0.1、runtime_state 字面 design_only、必填段存在、
// 概念引用/指标条目形状（指标条目 = 现行 MetricSchema，契约 §3.2 L0「以现行 schema 为准」）
export const SapPackageSchema = z.object({
  sap: z.literal("0.1"),
  package: z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, "package.id 必须是 kebab-case"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "package.version 必须是 semver"),
    kind: z.literal("instance"),
    created_at: z.string().min(1),
    generator: z.string().min(1),
    fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/, "package.fingerprint 必须是 sha256:<hex64>"),
    namespace: z.string().min(1)
  }),
  scenarios: z.array(z.unknown()),
  metrics: z.array(MetricSchema),
  dimensions: z.array(z.string().min(1)),
  concept_refs: z.array(ConceptRefSchema),
  bindings: z.array(z.unknown()),
  review: z.object({
    gate: z.string().min(1),
    exported_at: z.string().min(1),
    unreviewed: z.array(z.unknown())
  }),
  runtime_state: z.literal("design_only")
});

export function validateSapPackage(pkg: unknown): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const parsed = SapPackageSchema.safeParse(pkg);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      issues.push({
        // runtime_state 字面拒绝给独立 rule 名（契约 §3.6 冻结规则），其余结构问题归 structure
        rule: path === "runtime_state" ? "runtime-state" : "structure",
        path,
        message: issue.message
      });
    }
    return issues;
  }

  // 指纹失配（契约 §4：fail-closed，包视为不可信并整批拒绝）
  const declared = parsed.data.package.fingerprint;
  const recomputed = packageFingerprint(pkg as SapPackage);
  if (recomputed !== declared) {
    issues.push({
      rule: "fingerprint-mismatch",
      path: "package.fingerprint",
      message: `指纹失配：声明值 ${declared}，重算值 ${recomputed}（fail-closed：包视为不可信并整批拒绝）`
    });
  }

  // 重复身份（契约 §4：重复 id@version 双向拒绝——指标按 name，概念引用按 (id,version,role) 键）
  const seenNames = new Set<string>();
  for (const m of parsed.data.metrics) {
    if (seenNames.has(m.name)) {
      issues.push({
        rule: "duplicate-identity",
        path: `metrics.${m.name}`,
        message: `指标 name 重复："${m.name}"（重复身份，拒绝）`
      });
    }
    seenNames.add(m.name);
  }
  const seenKeys = new Set<string>();
  for (const [i, ref] of parsed.data.concept_refs.entries()) {
    const key = conceptRefKey(ref);
    if (seenKeys.has(key)) {
      issues.push({
        rule: "duplicate-identity",
        path: `concept_refs.${i}`,
        message: `concept_refs 重复键 ${ref.id}@${ref.version} role="${ref.role ?? ""}"（重复身份，拒绝）`
      });
    }
    seenKeys.add(key);
  }

  return issues;
}
