import { test, expect } from "vitest";
import { TemplateSchema, type Template } from "../../src/schema/template.js";
import { InstanceSchema, type Instance } from "../../src/schema/instance.js";
import { materialize, type MaterializedInstance } from "../../src/engine/materialize.js";
import { assembleSap, SapAssemblyError } from "../../src/sap/assemble.js";

// 期望值按契约 §3 / §3.5 / §3.6 与 PRD「SAP 包装配」段字面推导，不来自实现输出

const CREATED_AT = "2026-10-08T00:00:00.000Z";
const OPTS = { packageId: "acme-shop", generator: "metric-factory@0.0.0-test", createdAt: CREATED_AT };

function makeTemplate(): Template {
  return TemplateSchema.parse({
    template: {
      id: "demo-sap",
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
        type: "simple",
        definition: "支付成功订单的金额合计",
        dimensions: ["channel"],
        time_grains: ["day", "month"],
        owner_role: "电商业务负责人",
        caliber_switches: {},
        aggregation: { allowed_dimensions: ["channel"], disallowed_dimensions: ["region"] },
        statistic_object: {
          id: "concept-order",
          version: "1.0.0",
          source: "protege:snapshot/order@1.0.0",
          role: "statistic_object"
        },
        caliber_type: ["refund_adjustment", "fee_composition"],
        provenance: { origin: "template", template_ref: "demo-sap@0.1.0" },
        review: { required: false }
      },
      {
        name: "uv",
        display_name: "独立访客数",
        type: "simple",
        definition: "统计周期内去重访客数",
        dimensions: ["channel"],
        time_grains: ["day", "month"],
        owner_role: "电商业务负责人",
        caliber_switches: {},
        statistic_object: {
          id: "concept-order",
          version: "1.0.0",
          source: "protege:snapshot/order@1.0.0",
          role: "dimension_semantics"
        },
        provenance: { origin: "template", template_ref: "demo-sap@0.1.0" },
        review: { required: false }
      }
    ]
  });
}

function makeInstance(): Instance {
  return InstanceSchema.parse({
    instance: { created_at: CREATED_AT },
    base: "demo-sap@0.1.0",
    answers: { revenue_model: "交易抽佣", user_structure: "双边市场", core_loop: "交易" },
    concept_refs: [
      { id: "concept-order", version: "1.0.0", source: "protege:snapshot/order@1.0.0" },
      {
        id: "concept-order",
        version: "1.0.0",
        source: "protege:snapshot/order@1.0.0",
        role: "statistic_object"
      },
      {
        id: "concept-member",
        version: "2.1.0",
        source: "protege:snapshot/member@2.1.0",
        role: "dimension_semantics"
      }
    ]
  });
}

function assembled(
  instance: Instance = makeInstance(),
  opts: Omit<Parameters<typeof assembleSap>[2], "instanceConceptRefs"> = OPTS
): ReturnType<typeof assembleSap> {
  const template = makeTemplate();
  return assembleSap(materialize(template, instance), template, {
    ...opts,
    instanceConceptRefs: instance.concept_refs
  });
}

function catchAssemblyError(fn: () => unknown): SapAssemblyError {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(SapAssemblyError);
    return e as SapAssemblyError;
  }
  throw new Error("期望抛 SapAssemblyError，但未抛出");
}

test("装配正例：契约 §3 全段形状（package 七字段 + 全部顶段 + review 冻结形状）", () => {
  const pkg = assembled();
  expect(pkg).toMatchObject({
    sap: "0.1",
    package: {
      id: "acme-shop",
      version: "0.1.0",
      kind: "instance",
      created_at: CREATED_AT,
      generator: "metric-factory@0.0.0-test",
      namespace: "mf.acme-shop"
    },
    scenarios: [],
    dimensions: ["channel", "region"],
    bindings: [],
    review: {
      gate: "metric-factory-export-gate",
      exported_at: CREATED_AT,
      unreviewed: []
    },
    runtime_state: "design_only"
  });
  expect(pkg.package.fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
});

test("装配正例：物化指标全字段透传（含 L1 三件套）", () => {
  const pkg = assembled();
  expect(pkg.metrics.map((m) => m.name)).toEqual(["gmv", "uv"]);
  expect(pkg.metrics[0]).toMatchObject({
    name: "gmv",
    display_name: "成交总额",
    definition: "支付成功订单的金额合计",
    aggregation: { allowed_dimensions: ["channel"], disallowed_dimensions: ["region"] },
    statistic_object: {
      id: "concept-order",
      version: "1.0.0",
      source: "protege:snapshot/order@1.0.0",
      role: "statistic_object"
    },
    caliber_type: ["refund_adjustment", "fee_composition"]
  });
});

test("concept_refs 并集去重：同 id 异 role 并存，同键合并（GRILL Q2 键=id,version,role）", () => {
  const pkg = assembled();
  // gmv.statistic_object 与实例第 2 条同键（statistic_object）→ 合并；
  // concept-order 以三种 role（缺省/statistic_object/dimension_semantics）并存
  expect(pkg.concept_refs).toEqual([
    { id: "concept-order", version: "1.0.0", source: "protege:snapshot/order@1.0.0" },
    {
      id: "concept-order",
      version: "1.0.0",
      source: "protege:snapshot/order@1.0.0",
      role: "statistic_object"
    },
    {
      id: "concept-member",
      version: "2.1.0",
      source: "protege:snapshot/member@2.1.0",
      role: "dimension_semantics"
    },
    {
      id: "concept-order",
      version: "1.0.0",
      source: "protege:snapshot/order@1.0.0",
      role: "dimension_semantics"
    }
  ]);
});

test("bindings 由调用方传入并透传（默认 []）", () => {
  const bindings = [
    { metric: "gmv", model: "fct_orders", column: "amount", confidence: 0.9, signals: ["name-match"] }
  ];
  const pkg = assembled(makeInstance(), { ...OPTS, bindings });
  expect(pkg.bindings).toEqual(bindings);
  expect(assembled().bindings).toEqual([]);
});

test("供应侧负例：物化指标重名抛 SapAssemblyError（rule=duplicate-identity，GRILL Q3）", () => {
  const template = makeTemplate();
  const instance = InstanceSchema.parse({
    ...makeInstance(),
    added: [
      {
        name: "gmv",
        display_name: "重复成交总额",
        type: "simple",
        definition: "与模板指标重名的手工新增",
        dimensions: ["channel"],
        time_grains: ["day"],
        owner_role: "数据团队",
        caliber_switches: {},
        provenance: { origin: "manual" },
        review: { required: false }
      }
    ]
  });
  const materialized: MaterializedInstance = materialize(template, instance);
  expect(materialized.metrics.map((m) => m.name)).toEqual(["gmv", "uv", "gmv"]);
  const err = catchAssemblyError(() => assembleSap(materialized, template, OPTS));
  expect(err.rule).toBe("duplicate-identity");
  expect(err.message).toContain("gmv");
});

test("供应侧负例：实例 concept_refs 自身重复键即抛（输入脏数据 fail-closed，不被并集静默吞并）", () => {
  const base = makeInstance();
  const instance = InstanceSchema.parse({
    ...base,
    concept_refs: [...base.concept_refs, base.concept_refs[2]]
  });
  const err = catchAssemblyError(() => assembled(instance));
  expect(err.rule).toBe("duplicate-identity");
  expect(err.message).toContain("concept-member");
});

test("created_at 注入：同输入同时间戳两次装配，包深等且指纹恒等（GRILL Q1 冻结时钟）", () => {
  const a = assembled();
  const b = assembled();
  expect(a).toEqual(b);
  expect(a.package.fingerprint).toBe(b.package.fingerprint);
});
