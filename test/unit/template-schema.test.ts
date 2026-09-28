import { test, expect } from "vitest";
import { TemplateSchema } from "../../src/schema/template.js";

// 独立构造的完整合法模板（期望值来自规格，不重算实现）
function validTemplate() {
  return {
    template: {
      id: "demo",
      industry: "电商",
      business_models: ["交易平台"],
      version: "0.1.0",
      references: ["OneData 指标建模方法"]
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
    trees: [
      { id: "revenue", formula: "gmv = uv * cvr * aov", children: ["uv", "cvr", "aov"] }
    ],
    dimensions: ["channel", "region"],
    metrics: [
      {
        name: "gmv",
        display_name: "成交总额",
        display_name_en: "Gross Merchandise Value",
        type: "derived",
        definition: "支付成功订单的金额合计",
        dimensions: ["channel"],
        time_grains: ["day", "month"],
        owner_role: "电商业务负责人",
        caliber_switches: { include_refund: false },
        provenance: { origin: "template", template_ref: "demo@0.1.0" },
        review: { required: false }
      }
    ]
  };
}

test("合法模板通过校验", () => {
  const result = TemplateSchema.safeParse(validTemplate());
  expect(result.success).toBe(true);
});

test("缺 definition 被拒且错误路径可定位", () => {
  const bad = validTemplate();
  (bad.metrics[0] as Record<string, unknown>).definition = "";
  const result = TemplateSchema.safeParse(bad);
  expect(result.success).toBe(false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("metrics.0.definition");
  }
});

test("provenance 缺失被拒", () => {
  const bad = validTemplate() as { metrics: Record<string, unknown>[] };
  delete bad.metrics[0]!.provenance;
  const result = TemplateSchema.safeParse(bad);
  expect(result.success).toBe(false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths.some((p) => p.startsWith("metrics.0.provenance"))).toBe(true);
  }
});

test("provenance.origin 枚举外的取值被拒", () => {
  const bad = validTemplate();
  const metric = bad.metrics[0]!;
  (metric.provenance as Record<string, unknown>).origin = "guess";
  const result = TemplateSchema.safeParse(bad);
  expect(result.success).toBe(false);
});

test("origin=llm 必须带模型与 prompt 版本且 review.required=true（fail-closed 前置）", () => {
  const bad = validTemplate() as unknown as {
    metrics: { provenance: Record<string, unknown>; review: { required: boolean } }[];
  };
  const metric = bad.metrics[0]!;
  metric.provenance = {
    origin: "llm",
    model: "demo-model",
    prompt_version: "p1"
  };
  metric.review = { required: false };
  const result = TemplateSchema.safeParse(bad);
  expect(result.success).toBe(false);

  metric.review = { required: true };
  const ok = TemplateSchema.safeParse(bad);
  expect(ok.success).toBe(true);
});

test("display_name_en 与 definition_en 为可选双语字段", () => {
  const tpl = validTemplate();
  delete (tpl.metrics[0] as Record<string, unknown>).display_name_en;
  expect(TemplateSchema.safeParse(tpl).success).toBe(true);
});

test("caliber_switches 接受自由布尔键", () => {
  const tpl = validTemplate();
  (tpl.metrics[0] as { caliber_switches: Record<string, boolean> }).caliber_switches = {
    include_shipping: true,
    count_gift_card: false
  };
  expect(TemplateSchema.safeParse(tpl).success).toBe(true);
});
