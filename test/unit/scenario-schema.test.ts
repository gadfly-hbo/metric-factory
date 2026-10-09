import { test, expect } from "vitest";
import { ScenarioSchema } from "../../src/schema/scenario.js";
import { TemplateSchema, type Template } from "../../src/schema/template.js";
import { InstanceSchema } from "../../src/schema/instance.js";
import { lintTemplate } from "../../src/engine/lint.js";
import { validateInstance } from "../../src/engine/validate.js";
import { materialize } from "../../src/engine/materialize.js";
import { loadTemplate } from "../../src/engine/loader.js";

// 独立构造的合法字面量（期望值来自 PRD 冻结结构，不重算实现）
function validScenario() {
  return {
    id: "monthly_review",
    version: "0.1.0",
    title: "月度经营复盘",
    decision_purpose: "每月复盘目标达成差距并决定下月资源倾斜方向",
    question_tree: [
      { id: "gap_root", label: "目标差距在哪", metric: "gmv" },
      { id: "traffic_gap", label: "流量缺口多大", parent: "gap_root", metric: "uv" },
      { id: "conv_gap", label: "转化率是否恶化", parent: "gap_root" }
    ],
    metric_usages: [
      { metric: "gmv", role: "outcome" },
      { metric: "uv", role: "driver", note: "拆解第一层" }
    ],
    method_refs: ["dame.m2.driver_decomposition@1.0.0"],
    evidence_requirements: "数据回溯 3 个完整月",
    output_spec: "一页复盘结论 + 行动清单",
    review_rules: "业务负责人确认口径"
  };
}

function validTemplate() {
  return {
    template: {
      id: "demo",
      industry: "电商",
      business_models: ["交易平台"],
      version: "0.1.0",
      references: []
    },
    matching: {
      revenue_models: ["交易抽佣"],
      user_structure: ["双边市场"],
      core_loops: ["交易"]
    },
    north_star: {
      candidates: [{ metric: "gmv", rationale: "交易规模" }],
      decision_guide: "交易平台优先 GMV"
    },
    trees: [{ id: "revenue", formula: "gmv = uv * cvr", children: ["gmv", "uv"] }],
    dimensions: ["channel", "region"],
    metrics: [
      {
        name: "gmv",
        display_name: "成交总额",
        type: "derived",
        definition: "支付成功订单的金额合计",
        dimensions: ["channel"],
        time_grains: ["day", "month"],
        owner_role: "电商业务负责人",
        caliber_switches: {},
        provenance: { origin: "template", template_ref: "demo@0.1.0" },
        review: { required: false }
      },
      {
        name: "uv",
        display_name: "访客数",
        type: "simple",
        definition: "去重访问用户数",
        dimensions: ["channel"],
        time_grains: ["day"],
        owner_role: "增长负责人",
        caliber_switches: {},
        provenance: { origin: "template", template_ref: "demo@0.1.0" },
        review: { required: false }
      }
    ]
  };
}

function validInstance() {
  return {
    instance: { created_at: "2026-10-09T00:00:00.000Z" },
    base: "demo@0.1.0",
    answers: { revenue_model: "交易抽佣", user_structure: "双边市场", core_loop: "交易" }
  };
}

// ---------- schema：正例 ----------

test("合法 ScenarioSpec 通过 schema，method_refs/文本字段缺省落位", () => {
  const full = ScenarioSchema.parse(validScenario());
  expect(full.method_refs).toEqual(["dame.m2.driver_decomposition@1.0.0"]);

  const minimal = validScenario() as Record<string, unknown>;
  delete minimal.method_refs;
  delete minimal.evidence_requirements;
  delete minimal.output_spec;
  delete minimal.review_rules;
  const parsed = ScenarioSchema.parse(minimal);
  expect(parsed.method_refs).toEqual([]);
  expect(parsed.evidence_requirements).toBe("");
  expect(parsed.output_spec).toBe("");
  expect(parsed.review_rules).toBe("");
});

test("Template.scenarios / Instance.added_scenarios 接入：缺省 []，合法场景通过", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  const inst = validInstance() as Record<string, unknown>;
  expect(TemplateSchema.parse(tpl).scenarios).toEqual([]);
  expect(InstanceSchema.parse(inst).added_scenarios).toEqual([]);

  tpl.scenarios = [validScenario()];
  inst.added_scenarios = [validScenario()];
  expect(TemplateSchema.safeParse(tpl).success).toBe(true);
  expect(InstanceSchema.safeParse(inst).success).toBe(true);
});

// ---------- schema：负例 ----------

test("无 decision_purpose（缺失或空串）被 schema 拒", () => {
  const missing = validScenario() as Record<string, unknown>;
  delete missing.decision_purpose;
  const r1 = ScenarioSchema.safeParse(missing);
  expect(r1.success).toBe(false);
  if (!r1.success) {
    expect(r1.error.issues.map((i) => i.path.join("."))).toContain("decision_purpose");
  }

  const empty = validScenario() as Record<string, unknown>;
  empty.decision_purpose = "";
  expect(ScenarioSchema.safeParse(empty).success).toBe(false);
});

test("parent 悬空被 superRefine 拒（path 指向具体节点）", () => {
  const s = validScenario() as Record<string, unknown>;
  (s.question_tree as Record<string, unknown>[])[2]!.parent = "ghost_node";
  const r = ScenarioSchema.safeParse(s);
  expect(r.success).toBe(false);
  if (!r.success) {
    expect(r.error.issues.map((i) => i.path.join("."))).toEqual(["question_tree.2.parent"]);
  }
});

test("parent 自指被 superRefine 拒", () => {
  const s = validScenario() as Record<string, unknown>;
  // 单节点隔离自指规则（若根自指，下游节点会另触发成环 issue）
  s.question_tree = [{ id: "self_node", label: "自指节点", parent: "self_node" }];
  const r = ScenarioSchema.safeParse(s);
  expect(r.success).toBe(false);
  if (!r.success) {
    expect(r.error.issues.map((i) => i.path.join("."))).toEqual(["question_tree.0.parent"]);
  }
});

test("parent 链成环被 superRefine 拒（环上每个节点各一条）", () => {
  const s = validScenario() as Record<string, unknown>;
  s.question_tree = [
    { id: "node_a", label: "A", parent: "node_b" },
    { id: "node_b", label: "B", parent: "node_a" }
  ];
  const r = ScenarioSchema.safeParse(s);
  expect(r.success).toBe(false);
  if (!r.success) {
    expect(r.error.issues.map((i) => i.path.join("."))).toEqual([
      "question_tree.0.parent",
      "question_tree.1.parent"
    ]);
  }
});

test("question_tree 节点 id 场景内重复被 superRefine 拒", () => {
  const s = validScenario() as Record<string, unknown>;
  s.question_tree = [
    { id: "dup_node", label: "一" },
    { id: "dup_node", label: "二" }
  ];
  const r = ScenarioSchema.safeParse(s);
  expect(r.success).toBe(false);
  if (!r.success) {
    expect(r.error.issues.map((i) => i.path.join("."))).toEqual(["question_tree.1.id"]);
  }
});

test("metric_usages.role 只允许 outcome/driver/guardrail", () => {
  const s = validScenario() as Record<string, unknown>;
  s.metric_usages = [{ metric: "gmv", role: "north_star" }];
  const r = ScenarioSchema.safeParse(s);
  expect(r.success).toBe(false);
  if (!r.success) {
    expect(r.error.issues.map((i) => i.path.join("."))).toContain("metric_usages.0.role");
  }
});

// ---------- lint：模板镜像 ----------

test("lint scenario-metric-ref：树 metric 与 usages.metric 引用模板外指标报错", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [
    {
      ...validScenario(),
      question_tree: [
        { id: "gap_root", label: "目标差距在哪", metric: "ghost_metric" },
        { id: "traffic_gap", label: "流量缺口", parent: "gap_root" }
      ],
      metric_usages: [{ metric: "ghost_usage", role: "driver" }]
    }
  ];
  const issues = lintTemplate(TemplateSchema.parse(tpl));
  expect(issues).toEqual([
    {
      rule: "scenario-metric-ref",
      path: "scenarios.0.question_tree.0.metric",
      message: expect.stringContaining("ghost_metric")
    },
    {
      rule: "scenario-metric-ref",
      path: "scenarios.0.metric_usages.0.metric",
      message: expect.stringContaining("ghost_usage")
    }
  ]);
});

test("lint scenario-purpose：YAML 直读绕过 schema 的空 decision_purpose 兜底报错", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [{ ...validScenario(), decision_purpose: "" }];
  // as 强转模拟「YAML 直读未经 schema」路径（schema 层已挡正规路径）
  const issues = lintTemplate(tpl as unknown as Template);
  expect(issues).toEqual([
    {
      rule: "scenario-purpose",
      path: "scenarios.0.decision_purpose",
      message: expect.stringContaining("monthly_review")
    }
  ]);
});

test("lint scenario-tree-ref：YAML 直读的悬空 parent 兜底报错", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [
    {
      ...validScenario(),
      question_tree: [{ id: "solo_node", label: "孤立节点", parent: "ghost_parent" }]
    }
  ];
  const issues = lintTemplate(tpl as unknown as Template);
  expect(issues).toEqual([
    {
      rule: "scenario-tree-ref",
      path: "scenarios.0.question_tree.0.parent",
      message: expect.stringContaining("ghost_parent")
    }
  ]);
});

test("lint scenario-id：模板内场景 id 重复报错", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [validScenario(), { ...validScenario(), title: "同名场景" }];
  const issues = lintTemplate(TemplateSchema.parse(tpl));
  expect(issues).toEqual([
    {
      rule: "scenario-id",
      path: "scenarios.1.id",
      message: expect.stringContaining("monthly_review")
    }
  ]);
});

test("lint 合法种子场景（metric ⊆ 模板指标、树完整）零告警", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [validScenario()];
  expect(lintTemplate(TemplateSchema.parse(tpl))).toEqual([]);
});

// ---------- validate：实例镜像（模板种子 ∪ added_scenarios 合并集） ----------

test("validate 同 id 实例覆盖模板种子合法，合并集零 issue（物化取实例版本）", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [validScenario()];
  const inst = validInstance() as Record<string, unknown>;
  inst.added_scenarios = [{ ...validScenario(), title: "月度经营复盘（本地修订）" }];

  const parsedTemplate = TemplateSchema.parse(tpl);
  const parsedInstance = InstanceSchema.parse(inst);
  const mat = materialize(parsedTemplate, parsedInstance);
  expect(mat.scenarios.map((s) => s.title)).toEqual(["月度经营复盘（本地修订）"]);
  expect(validateInstance(mat, parsedTemplate, parsedInstance)).toEqual([]);
});

test("validate scenario-id：added_scenarios 内部同 id 重复非法", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  const inst = validInstance() as Record<string, unknown>;
  inst.added_scenarios = [validScenario(), { ...validScenario(), title: "重复场景" }];

  const parsedTemplate = TemplateSchema.parse(tpl);
  const parsedInstance = InstanceSchema.parse(inst);
  const issues = validateInstance(
    materialize(parsedTemplate, parsedInstance),
    parsedTemplate,
    parsedInstance
  );
  expect(issues).toEqual([
    {
      rule: "scenario-id",
      path: "added_scenarios.1.id",
      message: expect.stringContaining("monthly_review")
    }
  ]);
});

test("validate scenario-metric-ref：removed 使模板种子场景引用物化外指标报错", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [validScenario()]; // 引用 gmv 与 uv
  const inst = validInstance() as Record<string, unknown>;
  inst.removed = ["uv"];

  const parsedTemplate = TemplateSchema.parse(tpl);
  const parsedInstance = InstanceSchema.parse(inst);
  const issues = validateInstance(
    materialize(parsedTemplate, parsedInstance),
    parsedTemplate,
    parsedInstance
  );
  expect(issues).toEqual([
    {
      rule: "scenario-metric-ref",
      path: "scenarios.monthly_review.question_tree.1.metric",
      message: expect.stringContaining("uv")
    },
    {
      rule: "scenario-metric-ref",
      path: "scenarios.monthly_review.metric_usages.1.metric",
      message: expect.stringContaining("uv")
    }
  ]);
});

// ---------- materialize：场景收集（模板种子 ∪ added_scenarios，同 id 实例覆盖） ----------

test("materialize 模板种子透传：实例无 added_scenarios 时原样透传，diff 计数为 0", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [validScenario()];
  const mat = materialize(TemplateSchema.parse(tpl), InstanceSchema.parse(validInstance()));

  expect(mat.scenarios.map((s) => s.id)).toEqual(["monthly_review"]);
  expect(mat.scenarios[0]!.title).toBe("月度经营复盘");
  expect(mat.diff.scenarios).toEqual({ added: 0 });
});

test("materialize 同 id 实例覆盖模板种子（保位），新 id 追加在后，added 计数取实例段", () => {
  const tpl = validTemplate() as Record<string, unknown>;
  tpl.scenarios = [validScenario()];
  const inst = validInstance() as Record<string, unknown>;
  inst.added_scenarios = [
    { ...validScenario(), title: "月度经营复盘（本地修订）" },
    {
      ...validScenario(),
      id: "promo_ab_test",
      title: "大促 AB 实验",
      question_tree: [{ id: "promo_root", label: "大促增量在哪", metric: "gmv" }],
      metric_usages: [{ metric: "gmv", role: "outcome" }]
    }
  ];
  const mat = materialize(TemplateSchema.parse(tpl), InstanceSchema.parse(inst));

  expect(mat.scenarios.map((s) => s.id)).toEqual(["monthly_review", "promo_ab_test"]);
  expect(mat.scenarios[0]!.title).toBe("月度经营复盘（本地修订）");
  expect(mat.diff.scenarios).toEqual({ added: 2 });
});

test("materialize 空场景：模板无种子且实例无 added 时 scenarios 为 []", () => {
  const mat = materialize(TemplateSchema.parse(validTemplate()), InstanceSchema.parse(validInstance()));

  expect(mat.scenarios).toEqual([]);
  expect(mat.diff.scenarios).toEqual({ added: 0 });
});

// ---------- 回归：7 个现有模板零告警（无种子场景默认空合法） ----------

test("7 个现有模板 lint 零告警保持（scenarios 缺省 []）", async () => {
  const files = [
    "templates/ecommerce-marketplace.yaml",
    "templates/saas-subscription.yaml",
    "templates/content-community.yaml",
    "templates/digital-marketing.yaml",
    "templates/supply-chain-logistics.yaml",
    "templates/cloud-cost.yaml",
    "templates/apparel-brand-retail.yaml"
  ];
  for (const f of files) {
    const loaded = await loadTemplate(f);
    expect(loaded.ok, f).toBe(true);
    if (loaded.ok) {
      expect(lintTemplate(loaded.template), f).toEqual([]);
    }
  }
});
