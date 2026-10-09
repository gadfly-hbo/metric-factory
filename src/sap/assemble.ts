// SAP 0.1 包装配器（契约 §3 全段；PRD「SAP 包装配」段 + GRILL Q1/Q2/Q3）
// 输入 = 物化实例 + 基模板 + 调用方参数；输出 = 契约形状包对象，声明指纹 = 重算指纹。
// 供应侧 fail-closed：物化指标重名 / 实例 concept_refs 自身重复键 → throw SapAssemblyError；
// 装配产物自身恒合法（concept_refs 并集按 (id,version,role) 去重，GRILL Q2）。
import { packageFingerprint } from "./canonical.js";
import type { MaterializedInstance } from "../engine/materialize.js";
import type { Template, Metric, ConceptRef } from "../schema/template.js";
import type { MappingEntry } from "../schema/mapping.js";
import type { Scenario } from "../schema/scenario.js";

export interface SapAssemblyOptions {
  /** kebab-case 包 ID（调用方传入；CLI 侧取实例文件名 slug） */
  packageId: string;
  /** semver，缺省 "0.1.0" */
  version?: string;
  /** 调用方传入，如 metric-factory@0.1.0+abc123（sha 构建期注入） */
  generator: string;
  /** ISO-8601；review.exported_at 与 package.created_at 同源，测试可冻结 */
  createdAt: string;
  /** 实例级 concept_refs（切片 3 由 CLI 传 instance.concept_refs；缺省 []） */
  instanceConceptRefs?: ConceptRef[];
  /** 绑定草案（切片 3 映射文件接入；v4 缺省 []） */
  bindings?: MappingEntry[];
}

export type SapPackageV01 = {
  sap: "0.1";
  package: {
    id: string;
    version: string;
    kind: "instance";
    created_at: string;
    generator: string;
    fingerprint: string;
    namespace: string;
  };
  scenarios: Scenario[];
  metrics: Metric[];
  dimensions: string[];
  concept_refs: ConceptRef[];
  bindings: MappingEntry[];
  review: { gate: string; exported_at: string; unreviewed: unknown[] };
  runtime_state: "design_only";
};

export class SapAssemblyError extends Error {
  readonly rule: string;
  constructor(rule: string, message: string) {
    super(message);
    this.name = "SapAssemblyError";
    this.rule = rule;
  }
}

// GRILL Q2 去重键：(id, version, role)，role 缺省按空串参与键（同概念异角色 = 两个独立引用）
export function conceptRefKey(ref: ConceptRef): string {
  return `${ref.id}@${ref.version}#${ref.role ?? ""}`;
}

export function assembleSap(
  materialized: MaterializedInstance,
  template: Template,
  opts: SapAssemblyOptions
): SapPackageV01 {
  // 供应侧查重 1：物化指标重名（GRILL Q3：同包重名即拒，既有 schema 未显式禁止，SAP 装配首次强制）
  const seenNames = new Set<string>();
  for (const m of materialized.metrics) {
    if (seenNames.has(m.name)) {
      throw new SapAssemblyError(
        "duplicate-identity",
        `物化指标存在重名 "${m.name}"（同包重名即拒，GRILL Q3）`
      );
    }
    seenNames.add(m.name);
  }

  // 供应侧查重 2：实例级 concept_refs 自身重复键——输入脏数据 fail-closed，不被并集逻辑静默吞并
  const instanceRefs = opts.instanceConceptRefs ?? [];
  const seenKeys = new Set<string>();
  for (const ref of instanceRefs) {
    const key = conceptRefKey(ref);
    if (seenKeys.has(key)) {
      throw new SapAssemblyError(
        "duplicate-identity",
        `实例 concept_refs 存在重复键 ${ref.id}@${ref.version} role="${ref.role ?? ""}"（输入数据 fail-closed）`
      );
    }
    seenKeys.add(key);
  }

  // 并集：实例级引用 ∪ 各指标 statistic_object，同键合并、先见顺序保留
  const conceptRefs: ConceptRef[] = [...instanceRefs];
  for (const m of materialized.metrics) {
    if (!m.statistic_object) continue;
    const key = conceptRefKey(m.statistic_object);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    conceptRefs.push(m.statistic_object);
  }

  const createdAt = opts.createdAt;
  const pkg: SapPackageV01 = {
    sap: "0.1",
    package: {
      id: opts.packageId,
      version: opts.version ?? "0.1.0",
      kind: "instance",
      created_at: createdAt,
      generator: opts.generator,
      fingerprint: "",
      namespace: `mf.${opts.packageId}`
    },
    // 物化场景直接透传（引用完整性由 validateInstance 保证；装配不做二次语义校验，结构由 SapPackageSchema 兜底）
    scenarios: [...materialized.scenarios],
    metrics: [...materialized.metrics],
    dimensions: [...template.dimensions],
    concept_refs: conceptRefs,
    bindings: opts.bindings ?? [],
    review: {
      gate: "metric-factory-export-gate",
      exported_at: createdAt,
      unreviewed: []
    },
    runtime_state: "design_only"
  };
  // 声明值 = 计算值；自引用置空规则由 canonical 模块实现
  pkg.package.fingerprint = packageFingerprint(pkg);
  return pkg;
}
