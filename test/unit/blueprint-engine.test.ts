import { test, expect } from "vitest";
import { TemplateSchema, type Template } from "../../src/schema/template.js";
import { InstanceSchema, type Instance } from "../../src/schema/instance.js";
import { BlueprintSchema, type Blueprint } from "../../src/schema/blueprint.js";
import { MethodTemplateSchema, type MethodTemplate } from "../../src/schema/method.js";
import { materialize } from "../../src/engine/materialize.js";
import {
  findMetricReferences,
  designFingerprint,
  blueprintReviewStatus,
  validateBlueprint,
  validateMethodBindings,
  validateDesign,
  designReview
} from "../../src/engine/blueprint.js";
import { applyDraft } from "../../src/engine/apply.js";
import type { Draft } from "../../src/schema/draft.js";

// ===== 夹具 =====

function makeTemplate(): Template {
  return TemplateSchema.parse({
    template: { id: "demo-bp", industry: "零售", business_models: ["品牌 DTC"], version: "0.1.0", references: [] },
    matching: { revenue_models: ["交易抽佣"], user_structure: ["2C"], core_loops: ["交易"] },
    north_star: { candidates: [{ metric: "revenue", rationale: "规模" }], decision_guide: "先看规模" },
    trees: [{ id: "profit", formula: "profit = revenue - cost", children: ["profit", "revenue", "cost"] }],
    dimensions: ["channel"],
    metrics: [
      {
        name: "revenue", display_name: "收入", type: "simple", definition: "已确认收入合计",
        dimensions: ["channel"], time_grains: ["week"], owner_role: "经营负责人",
        caliber_switches: {}, provenance: { origin: "template", template_ref: "demo-bp@0.1.0" }, review: { required: false }
      },
      {
        name: "cost", display_name: "营业成本", type: "simple", definition: "匹配收入的成本合计",
        dimensions: ["channel"], time_grains: ["week"], owner_role: "经营负责人",
        caliber_switches: {}, provenance: { origin: "template", template_ref: "demo-bp@0.1.0" }, review: { required: false }
      },
      {
        name: "profit", display_name: "利润", type: "derived", definition: "收入减成本",
        dimensions: ["channel"], time_grains: ["week"], owner_role: "经营负责人",
        caliber_switches: {}, type_params: { expr: "revenue - cost" },
        provenance: { origin: "template", template_ref: "demo-bp@0.1.0" }, review: { required: false }
      }
    ],
    scenarios: []
  });
}

function makeBlueprint(overrides: Record<string, unknown> = {}): Blueprint {
  return BlueprintSchema.parse({
    title: "销售增长与利润改善分析体系",
    intent: "设计具体分析方案",
    purpose: "把销售增长、毛利变化和费用放回经营目标与约束中比较改善方案。",
    decision: "当前经营周期应调整什么，收益、代价与风险是什么？",
    boundary: "在既定业务方向下设计诊断与调整；资源批准由获授权负责人承担。",
    deliverable: "差距诊断、候选方案、试点及复盘安排。",
    contexts: ["经营改善"],
    organizations: ["假设先行"],
    questions: [
      { id: "q1", title: "利润差距由哪些部分组成？", detail: "按毛利与费用分解。", metric_refs: ["profit", "revenue"] }
    ],
    hypotheses: [
      {
        id: "h1", statement: "费用增加可能使收入增长未转化为利润改善。",
        support: "组成项与业务过程证据。", counter: "一次性投入或季节性可解释。",
        change_condition: "核验不支持时保留其他解释。"
      }
    ],
    evidence_plan: [
      {
        id: "e1", name: "收入成本费用明细", kind: "内部数据",
        source: "同范围同期间记录", check: "复核范围与计算关系", insufficiency: "缺失时不输出仿成功结论"
      }
    ],
    options: [],
    provenance: { origin: "manual" },
    ...overrides
  });
}

function makeInstance(blueprint?: Blueprint, addedScenarios: unknown[] = []): Instance {
  return InstanceSchema.parse({
    instance: { created_at: "2026-10-18T00:00:00.000Z" },
    base: "demo-bp@0.1.0",
    answers: { revenue_model: "交易抽佣", user_structure: "2C", core_loop: "交易" },
    added_scenarios: addedScenarios,
    ...(blueprint ? { blueprint } : {})
  });
}

const METHOD = MethodTemplateSchema.parse({
  method: { id: "profit-change-diagnosis", name: "利润变化与改善方案分析", version: "0.1.0", description: "分解与方案比较。", references: ["公开管理会计"] },
  contexts: ["经营改善"],
  family: "描述分解 · 方案比较",
  purpose: "利润变化归因与调整比较",
  roles: [
    { id: "profit_result", name: "利润结果", required: true },
    { id: "expense_constraint", name: "费用约束", required: true },
    { id: "optional_guard", name: "可选护栏", required: false }
  ],
  steps: [{ title: "核对口径" }],
  evidence: "明细数据。",
  limits: "分解不证明因果。",
  provenance: { origin: "template", template_ref: "profit-change-diagnosis@0.1.0" }
});

// ===== schema 层 =====

test("blueprint schema：合法样例通过；id 重复/语境重复被拒", () => {
  expect(makeBlueprint().title).toBe("销售增长与利润改善分析体系");
  expect(() => makeBlueprint({ contexts: ["经营改善", "经营改善"] })).toThrow();
  expect(() =>
    makeBlueprint({ hypotheses: [makeBlueprint().hypotheses[0], makeBlueprint().hypotheses[0]] })
  ).toThrow();
  // 默认值：judgment/status/verified
  const bp = makeBlueprint();
  expect(bp.hypotheses[0]!.judgment).toBe("待验证假设");
  expect(bp.hypotheses[0]!.verified).toBe(false);
  expect(bp.evidence_plan[0]!.status).toBe("待获取");
});

// ===== 蓝图规则 =====

test("blueprint-purpose：目的/决策/边界/交付缺失逐项报；问题结构为空报", () => {
  const bp = makeBlueprint({ purpose: "", decision: "", questions: [] });
  const issues = validateBlueprint(materialize(makeTemplate(), makeInstance(bp)));
  const paths = issues.filter((i) => i.rule === "blueprint-purpose").map((i) => i.path);
  expect(paths).toContain("blueprint.purpose");
  expect(paths).toContain("blueprint.decision");
  expect(paths).toContain("blueprint.questions");
});

test("blueprint-question-ref：问题引用不存在指标即报；存在则免报", () => {
  const bp = makeBlueprint();
  const okIssues = validateBlueprint(materialize(makeTemplate(), makeInstance(bp)));
  expect(okIssues.filter((i) => i.rule === "blueprint-question-ref")).toHaveLength(0);

  const bad = makeBlueprint({
    questions: [{ id: "q1", title: "坏引用", metric_refs: ["ghost_metric"] }]
  });
  const issues = validateBlueprint(materialize(makeTemplate(), makeInstance(bad)));
  expect(issues.some((i) => i.rule === "blueprint-question-ref" && i.message.includes("ghost_metric"))).toBe(true);
});

test("hypothesis-completeness：支持/反对/改变条件三要素缺一不可", () => {
  const bp = makeBlueprint({
    hypotheses: [{ id: "h1", statement: "缺反证。", support: "有支持。", counter: "", change_condition: "" }]
  });
  const issues = validateBlueprint(materialize(makeTemplate(), makeInstance(bp)));
  const paths = issues.filter((i) => i.rule === "hypothesis-completeness").map((i) => i.path);
  expect(paths).toEqual(["blueprint.hypotheses.h1.counter", "blueprint.hypotheses.h1.change_condition"]);
});

test("hypothesis-verification（D6）：verified 需已核验证据且无冲突；事实/解释未核验即报", () => {
  // verified=true 但证据仍「待获取」→ 报
  const bp1 = makeBlueprint({
    hypotheses: [{ id: "h1", statement: "x", support: "s", counter: "c", change_condition: "ch", verified: true }]
  });
  const i1 = validateBlueprint(materialize(makeTemplate(), makeInstance(bp1)));
  expect(i1.some((i) => i.rule === "hypothesis-verification")).toBe(true);

  // verified=true + 证据已核验 → 免报
  const bp2 = makeBlueprint({
    hypotheses: [{ id: "h1", statement: "x", support: "s", counter: "c", change_condition: "ch", verified: true }],
    evidence_plan: [{ id: "e1", name: "n", kind: "内部数据", source: "s", check: "c", insufficiency: "i", status: "已核验" }]
  });
  const i2 = validateBlueprint(materialize(makeTemplate(), makeInstance(bp2)));
  expect(i2.filter((i) => i.rule === "hypothesis-verification")).toHaveLength(0);

  // verified=true + 已核验但同时有冲突证据 → 报
  const bp3 = makeBlueprint({
    hypotheses: [{ id: "h1", statement: "x", support: "s", counter: "c", change_condition: "ch", verified: true }],
    evidence_plan: [
      { id: "e1", name: "n", kind: "k", source: "s", check: "c", insufficiency: "i", status: "已核验" },
      { id: "e2", name: "n2", kind: "k", source: "s", check: "c", insufficiency: "i", status: "存在冲突" }
    ]
  });
  const i3 = validateBlueprint(materialize(makeTemplate(), makeInstance(bp3)));
  expect(i3.some((i) => i.rule === "hypothesis-verification" && i.message.includes("存在冲突"))).toBe(true);

  // judgment=事实 但未 verified → 报
  const bp4 = makeBlueprint({
    hypotheses: [{ id: "h1", statement: "x", judgment: "事实", support: "s", counter: "c", change_condition: "ch" }]
  });
  const i4 = validateBlueprint(materialize(makeTemplate(), makeInstance(bp4)));
  expect(i4.some((i) => i.rule === "hypothesis-verification" && i.path.endsWith(".judgment"))).toBe(true);
});

test("evidence-completeness：来源/核验/不足处置三要素缺一不可", () => {
  const bp = makeBlueprint({
    evidence_plan: [{ id: "e1", name: "缺来源", kind: "内部数据", source: "", check: "c", insufficiency: "" }]
  });
  const issues = validateBlueprint(materialize(makeTemplate(), makeInstance(bp)));
  const paths = issues.filter((i) => i.rule === "evidence-completeness").map((i) => i.path);
  expect(paths).toEqual(["blueprint.evidence_plan.e1.source", "blueprint.evidence_plan.e1.insufficiency"]);
});

// ===== 方法绑定规则 =====

function scenarioWithBindings(bindings: unknown[]): unknown {
  return {
    id: "profit_diag", version: "0.1.0", title: "利润诊断", decision_purpose: "定位利润变化来源",
    question_tree: [], metric_usages: [], method_refs: ["profit-change-diagnosis@0.1.0"],
    method_bindings: bindings, evidence_requirements: "", output_spec: "", review_rules: ""
  };
}

test("scenario-method-*：正例通过；未知方法/语境失配/缺必需角色/未知角色/悬空指标五类负例", () => {
  const t = makeTemplate();
  // 正例
  const ok = makeInstance(makeBlueprint(), [
    scenarioWithBindings([
      { method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "profit" },
      { method_ref: "profit-change-diagnosis@0.1.0", role: "expense_constraint", metric: "cost" }
    ])
  ]);
  expect(validateMethodBindings(materialize(t, ok), [METHOD])).toHaveLength(0);

  // 未知方法
  const bad1 = makeInstance(makeBlueprint(), [scenarioWithBindings([{ method_ref: "ghost@9.9.9", role: "profit_result", metric: "profit" }])]);
  expect(validateMethodBindings(materialize(t, bad1), [METHOD]).some((i) => i.rule === "scenario-method-ref")).toBe(true);

  // 缺必需角色（只绑了一个）
  const bad2 = makeInstance(makeBlueprint(), [
    scenarioWithBindings([{ method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "profit" }])
  ]);
  const i2 = validateMethodBindings(materialize(t, bad2), [METHOD]);
  expect(i2.some((i) => i.rule === "scenario-method-role" && i.message.includes("费用约束"))).toBe(true);

  // 未知角色
  const bad3 = makeInstance(makeBlueprint(), [
    scenarioWithBindings([
      { method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "profit" },
      { method_ref: "profit-change-diagnosis@0.1.0", role: "expense_constraint", metric: "cost" },
      { method_ref: "profit-change-diagnosis@0.1.0", role: "ghost_role", metric: "revenue" }
    ])
  ]);
  expect(validateMethodBindings(materialize(t, bad3), [METHOD]).some((i) => i.message.includes("ghost_role"))).toBe(true);

  // 悬空指标
  const bad4 = makeInstance(makeBlueprint(), [
    scenarioWithBindings([
      { method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "ghost_metric" },
      { method_ref: "profit-change-diagnosis@0.1.0", role: "expense_constraint", metric: "cost" }
    ])
  ]);
  expect(validateMethodBindings(materialize(t, bad4), [METHOD]).some((i) => i.message.includes("ghost_metric"))).toBe(true);
});

test("scenario-method-context：方法语境与体系语境无交即报（用途不匹配说明原因）", () => {
  const strategyOnly = makeBlueprint({ contexts: ["战略选择"] });
  const inst = makeInstance(strategyOnly, [
    scenarioWithBindings([
      { method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "profit" },
      { method_ref: "profit-change-diagnosis@0.1.0", role: "expense_constraint", metric: "cost" }
    ])
  ]);
  const issues = validateMethodBindings(materialize(makeTemplate(), inst), [METHOD]);
  const hit = issues.find((i) => i.rule === "scenario-method-context");
  expect(hit?.message).toContain("经营改善");
  expect(hit?.message).toContain("战略选择");
});

// ===== 引用保护 =====

test("findMetricReferences：六路引用全收集（计算依赖/指标树/北极星/问题/场景/方法绑定）", () => {
  const inst = makeInstance(makeBlueprint(), [
    scenarioWithBindings([
      { method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "profit" },
      { method_ref: "profit-change-diagnosis@0.1.0", role: "expense_constraint", metric: "cost" }
    ])
  ]);
  const refs = findMetricReferences(materialize(makeTemplate(), inst));
  expect(refs.get("revenue")!.map((r) => r.kind)).toEqual(
    expect.arrayContaining(["计算依赖", "指标树", "北极星", "问题引用"])
  );
  expect(refs.get("profit")!.map((r) => r.kind)).toEqual(expect.arrayContaining(["问题引用", "方法绑定"]));
  expect(refs.get("cost")!.map((r) => r.kind)).toEqual(expect.arrayContaining(["计算依赖", "指标树", "方法绑定"]));
  expect(refs.has("ghost")).toBe(false);
});

// ===== 复核指纹与失效 =====

test("D5 复核指纹：未复核 → 确认有效 → 内容修改失效；指标审核动作不使设计复核失效", () => {
  const t = makeTemplate();
  const inst = makeInstance(makeBlueprint());
  const m1 = materialize(t, inst);
  expect(blueprintReviewStatus(m1).state).toBe("unreviewed");

  // 确认
  const fp = designFingerprint(m1);
  const confirmed = makeInstance(
    makeBlueprint({ review: { confirmed_by: "boss", confirmed_at: "2026-10-18T01:00:00Z", design_fingerprint: fp } })
  );
  const m2 = materialize(t, confirmed);
  expect(blueprintReviewStatus(m2).state).toBe("valid");
  expect(blueprintReviewStatus(m2).confirmed_by).toBe("boss");

  // 内容修改 → 失效
  const changed = makeInstance(
    makeBlueprint({
      decision: "改为另一个决策问题？",
      review: { confirmed_by: "boss", confirmed_at: "2026-10-18T01:00:00Z", design_fingerprint: fp }
    })
  );
  expect(blueprintReviewStatus(materialize(t, changed)).state).toBe("stale");

  // 仅指标 provenance.reviewed_by 变化（审核动作）→ 不失效
  const t2 = makeTemplate();
  const reviewed = t2.metrics.map((mm) =>
    mm.name === "revenue" ? { ...mm, provenance: { ...mm.provenance, reviewed_by: "reviewer" } } : mm
  );
  const tReviewed = { ...t2, metrics: reviewed };
  expect(blueprintReviewStatus(materialize(tReviewed, confirmed)).state).toBe("valid");

  // 无 blueprint → none
  expect(blueprintReviewStatus(materialize(makeTemplate(), makeInstance())).state).toBe("none");
});

// ===== 聚合与交付门 =====

test("designReview：草稿允许缺口；就绪需要 缺口零 ∧ 复核有效；证据汇总如实呈现", () => {
  const t = makeTemplate();
  const draft = makeInstance(makeBlueprint({ boundary: "", deliverable: "" }));
  const r1 = designReview(materialize(t, draft), t, draft, [METHOD]);
  expect(r1.ready).toBe(false);
  expect(r1.designIssues.length).toBeGreaterThan(0);
  expect(r1.evidenceSummary).toEqual({ total: 1, verified: 0, pending: 1 });

  const fp = designFingerprint(materialize(t, makeInstance(makeBlueprint())));
  const confirmed = makeInstance(
    makeBlueprint({ review: { confirmed_by: "boss", confirmed_at: "2026-10-18T01:00:00Z", design_fingerprint: fp } })
  );
  const r2 = designReview(materialize(t, confirmed), t, confirmed, [METHOD]);
  expect(r2.ready).toBe(true);
  expect(r2.review.state).toBe("valid");
});

test("validateDesign 统一入口：指标悬空 + 蓝图问题 + 方法绑定一次收齐", () => {
  const t = makeTemplate();
  const bp = makeBlueprint({ purpose: "" });
  const inst = makeInstance(bp, [
    scenarioWithBindings([{ method_ref: "ghost@9.9.9", role: "profit_result", metric: "profit" }])
  ]);
  const issues = validateDesign(materialize(t, inst), t, inst, [METHOD]);
  const rules = new Set(issues.map((i) => i.rule));
  expect(rules.has("blueprint-purpose")).toBe(true);
  expect(rules.has("scenario-method-ref")).toBe(true);
});

test("validateDesign writeMode（方案 §7）：写时只执法引用完整性，设计缺口留给交付门", () => {
  const t = makeTemplate();
  // 设计缺口（purpose 空）+ 适用性缺口（缺必需角色），无悬空引用 → 写时放行
  const inst = makeInstance(makeBlueprint({ purpose: "" }), [
    scenarioWithBindings([{ method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "profit" }])
  ]);
  expect(validateDesign(materialize(t, inst), t, inst, [METHOD], { writeMode: true })).toHaveLength(0);
  const full = validateDesign(materialize(t, inst), t, inst, [METHOD]);
  expect(full.some((i) => i.rule === "blueprint-purpose")).toBe(true);
  expect(full.some((i) => i.rule === "scenario-method-role" && i.message.includes("必需角色"))).toBe(true);

  // 悬空引用即使 writeMode 也写时拒绝（D8：禁止悬空引用后假通过）
  const dangling = makeInstance(
    makeBlueprint({ questions: [{ id: "q1", title: "x", metric_refs: ["ghost_metric"] }] }),
    [scenarioWithBindings([{ method_ref: "ghost@9.9.9", role: "profit_result", metric: "profit" }])]
  );
  const w = validateDesign(materialize(t, dangling), t, dangling, [METHOD], { writeMode: true });
  expect(w.some((i) => i.rule === "blueprint-question-ref")).toBe(true);
  expect(w.some((i) => i.rule === "scenario-method-ref")).toBe(true);
  // 完整性缺口不在写时混入
  expect(w.some((i) => i.rule === "blueprint-purpose")).toBe(false);
});

// ===== 草案合入 =====

test("applyDraft：blueprint 全量替换（旧 review 丢弃）；场景同 id 冲突拒绝；仅指标草案不触碰 blueprint", () => {
  const t = makeTemplate();
  const inst = makeInstance(makeBlueprint());
  const replacement = makeBlueprint({ title: "修订后的体系" });
  const draft: Draft = {
    generator: { model: "test/model", prompt_version: "v1.0.0", describe: "d", created_at: "2026-10-18T00:00:00Z" },
    added: [], modified: [], removed: [], caliber: {},
    blueprint: replacement,
    added_scenarios: []
  };
  const applied = applyDraft(inst, draft, t);
  expect(applied.ok).toBe(true);
  if (applied.ok) {
    expect(applied.instance.blueprint!.title).toBe("修订后的体系");
    expect(applied.instance.blueprint!.review).toBeUndefined();
  }

  // 仅指标草案不动 blueprint
  const metricOnly: Draft = { ...draft, blueprint: undefined };
  const applied2 = applyDraft(inst, metricOnly, t);
  expect(applied2.ok && applied2.instance.blueprint!.title).toBe("销售增长与利润改善分析体系");

  // 场景同 id 冲突（与实例已有场景）→ 拒绝
  const withScene = makeInstance(makeBlueprint(), [
    {
      id: "s1", version: "0.1.0", title: "已有", decision_purpose: "x",
      question_tree: [], metric_usages: [], method_refs: [], evidence_requirements: "", output_spec: "", review_rules: ""
    }
  ]);
  const conflict2: Draft = {
    ...draft,
    blueprint: undefined,
    added_scenarios: [withScene.added_scenarios[0]!]
  };
  const r = applyDraft(withScene, conflict2, t);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.errors[0]!.rule).toBe("scenario-conflict");
});
