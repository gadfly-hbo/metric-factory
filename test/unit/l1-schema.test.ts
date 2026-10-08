import { test, expect } from "vitest";
import { TemplateSchema, type Template } from "../../src/schema/template.js";
import { InstanceSchema } from "../../src/schema/instance.js";
import { lintTemplate } from "../../src/engine/lint.js";
import { materialize } from "../../src/engine/materialize.js";
import { loadTemplate } from "../../src/engine/loader.js";

// 独立构造的完整合法模板（期望值来自契约/PRD 字面量，不重算实现）
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
    trees: [{ id: "revenue", formula: "gmv = uv * cvr", children: ["gmv"] }],
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
      }
    ]
  };
}

function validInstance() {
  return {
    instance: { created_at: "2026-10-08T00:00:00.000Z" },
    base: "demo@0.1.0",
    answers: { revenue_model: "交易抽佣", user_structure: "双边市场", core_loop: "交易" }
  };
}

// ---------- schema：L1 三件套正例 ----------

test("L1 三件套合法字面量通过校验（aggregation / statistic_object / 多值 caliber_type）", () => {
  const tpl = validTemplate();
  const metric = tpl.metrics[0] as Record<string, unknown>;
  metric.aggregation = {
    allowed_dimensions: ["channel"],
    disallowed_dimensions: ["region"],
    ratio_policy: "recompute_from_parts"
  };
  metric.statistic_object = {
    id: "concept-order",
    version: "1.0.0",
    source: "protege:snapshot/order@1.0.0",
    role: "statistic_object"
  };
  metric.caliber_type = ["refund_adjustment", "fee_composition", "scope_inclusion"];
  expect(TemplateSchema.safeParse(tpl).success).toBe(true);
});

test("aggregation.ratio_policy 仅允许字面量 recompute_from_parts", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).aggregation = {
    allowed_dimensions: ["channel"],
    disallowed_dimensions: [],
    ratio_policy: "sum_then_divide"
  };
  expect(TemplateSchema.safeParse(tpl).success).toBe(false);
});

test("statistic_object 缺 source 或空 id/version 被拒（形状校验，不解析本体）", () => {
  const tplMissingSource = validTemplate();
  (tplMissingSource.metrics[0] as Record<string, unknown>).statistic_object = {
    id: "concept-order",
    version: "1.0.0"
  };
  const r1 = TemplateSchema.safeParse(tplMissingSource);
  expect(r1.success).toBe(false);

  const tplEmptyId = validTemplate();
  (tplEmptyId.metrics[0] as Record<string, unknown>).statistic_object = {
    id: "",
    version: "1.0.0",
    source: "protege:snapshot/order@1.0.0"
  };
  expect(TemplateSchema.safeParse(tplEmptyId).success).toBe(false);
});

test("caliber_type 拒绝 8 族之外的取值", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).caliber_type = ["refund_adjustment", "guess_family"];
  expect(TemplateSchema.safeParse(tpl).success).toBe(false);
});

test("caliber_type 重复值被 schema superRefine 拒绝", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).caliber_type = [
    "refund_adjustment",
    "fee_composition",
    "refund_adjustment"
  ];
  const result = TemplateSchema.safeParse(tpl);
  expect(result.success).toBe(false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("metrics.0.caliber_type");
  }
});

// ---------- schema：实例级 concept_refs ----------

test("Instance concept_refs 缺省解析为 []，合法条目通过", () => {
  const r1 = InstanceSchema.safeParse(validInstance());
  expect(r1.success).toBe(true);
  if (r1.success) expect(r1.data.concept_refs).toEqual([]);

  const withRefs = validInstance() as Record<string, unknown>;
  withRefs.concept_refs = [
    { id: "concept-order", version: "1.0.0", source: "protege:snapshot/order@1.0.0" },
    {
      id: "concept-member",
      version: "2.1.0",
      source: "protege:snapshot/member@2.1.0",
      role: "dimension_semantics"
    }
  ];
  expect(InstanceSchema.safeParse(withRefs).success).toBe(true);
});

test("Instance concept_refs 条目缺 source 被拒", () => {
  const bad = validInstance() as Record<string, unknown>;
  bad.concept_refs = [{ id: "concept-order", version: "1.0.0" }];
  const result = InstanceSchema.safeParse(bad);
  expect(result.success).toBe(false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths.some((p) => p.startsWith("concept_refs.0"))).toBe(true);
  }
});

// ---------- lint：aggregation-dimensions ----------

test("lint aggregation-dimensions：allowed 引用模板未声明维度报错", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).aggregation = {
    allowed_dimensions: ["channel", "unknown_dim"],
    disallowed_dimensions: []
  };
  const parsed = TemplateSchema.parse(tpl);
  const issues = lintTemplate(parsed);
  expect(issues).toEqual([
    {
      rule: "aggregation-dimensions",
      path: "metrics.0.aggregation.allowed_dimensions",
      message: expect.stringContaining("unknown_dim")
    }
  ]);
});

test("lint aggregation-dimensions：disallowed 引用模板未声明维度报错", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).aggregation = {
    allowed_dimensions: [],
    disallowed_dimensions: ["ghost_dim"]
  };
  const issues = lintTemplate(TemplateSchema.parse(tpl));
  expect(issues).toEqual([
    {
      rule: "aggregation-dimensions",
      path: "metrics.0.aggregation.disallowed_dimensions",
      message: expect.stringContaining("ghost_dim")
    }
  ]);
});

test("lint aggregation-dimensions：allowed 与 disallowed 相交报错", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).aggregation = {
    allowed_dimensions: ["channel"],
    disallowed_dimensions: ["channel"]
  };
  const issues = lintTemplate(TemplateSchema.parse(tpl));
  expect(issues).toEqual([
    {
      rule: "aggregation-dimensions",
      path: "metrics.0.aggregation.allowed_dimensions",
      message: expect.stringContaining("channel")
    }
  ]);
});

test("lint aggregation-dimensions：指标 dimensions 为空数组时 aggregation 存在即报错", () => {
  const tpl = validTemplate();
  const metric = tpl.metrics[0] as Record<string, unknown>;
  metric.dimensions = [];
  metric.aggregation = { allowed_dimensions: [], disallowed_dimensions: [] };
  const issues = lintTemplate(TemplateSchema.parse(tpl));
  expect(issues).toEqual([
    {
      rule: "aggregation-dimensions",
      path: "metrics.0.aggregation",
      message: expect.stringContaining(tpl.metrics[0]!.name)
    }
  ]);
});

test("lint 合法 aggregation（两表 ⊆ dimensions 且不相交、指标有维度）零告警", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).aggregation = {
    allowed_dimensions: ["channel"],
    disallowed_dimensions: ["region"],
    ratio_policy: "recompute_from_parts"
  };
  expect(lintTemplate(TemplateSchema.parse(tpl))).toEqual([]);
});

// ---------- lint：caliber-dedup（兜底模板 YAML 直读路径） ----------

test("lint caliber-dedup：绕过 schema 的直读对象重复 caliber_type 报错", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as Record<string, unknown>).caliber_type = [
    "refund_adjustment",
    "fee_composition",
    "refund_adjustment"
  ];
  // as 强转模拟「YAML 直读未经 schema」路径（schema 层已挡正规路径）
  const issues = lintTemplate(tpl as unknown as Template);
  expect(issues).toEqual([
    {
      rule: "caliber-dedup",
      path: "metrics.0.caliber_type",
      message: expect.stringContaining("refund_adjustment")
    }
  ]);
});

// ---------- materialize 透传（spread 天然携带，零改动证明） ----------

test("materialize 透传 L1 字段：模板指标与 added 指标的新字段物化后仍在", () => {
  const tpl = validTemplate();
  const metric = tpl.metrics[0] as Record<string, unknown>;
  metric.aggregation = {
    allowed_dimensions: ["channel"],
    disallowed_dimensions: ["region"],
    ratio_policy: "recompute_from_parts"
  };
  metric.statistic_object = {
    id: "concept-order",
    version: "1.0.0",
    source: "protege:snapshot/order@1.0.0",
    role: "statistic_object"
  };
  metric.caliber_type = ["refund_adjustment", "fee_composition"];

  const instance = validInstance() as Record<string, unknown>;
  instance.added = [
    {
      name: "custom_metric",
      display_name: "自定义指标",
      type: "simple",
      definition: "手工新增的指标",
      dimensions: ["region"],
      time_grains: ["month"],
      owner_role: "数据团队",
      caliber_switches: {},
      provenance: { origin: "manual" },
      aggregation: { allowed_dimensions: ["region"], disallowed_dimensions: [] },
      caliber_type: ["measurement_anchor"]
    }
  ];

  const parsedTemplate = TemplateSchema.parse(tpl);
  const parsedInstance = InstanceSchema.parse(instance);
  const materialized = materialize(parsedTemplate, parsedInstance);

  expect(materialized.metrics).toHaveLength(2);
  expect(materialized.metrics[0]).toMatchObject({
    aggregation: {
      allowed_dimensions: ["channel"],
      disallowed_dimensions: ["region"],
      ratio_policy: "recompute_from_parts"
    },
    statistic_object: {
      id: "concept-order",
      version: "1.0.0",
      source: "protege:snapshot/order@1.0.0",
      role: "statistic_object"
    },
    caliber_type: ["refund_adjustment", "fee_composition"]
  });
  expect(materialized.metrics[1]).toMatchObject({
    name: "custom_metric",
    aggregation: { allowed_dimensions: ["region"], disallowed_dimensions: [] },
    caliber_type: ["measurement_anchor"]
  });
});

// ---------- 回归：7 个现有模板零告警 ----------

test("7 个现有模板 lint 零告警（新规则不触碰存量数据）", async () => {
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
