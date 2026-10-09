import { test, expect } from "vitest";
import { matchTemplates } from "../../src/engine/match.js";
import type { Template } from "../../src/schema/template.js";
import { loadTemplate } from "../../src/engine/loader.js";

function saasMeta(): Template {
  return {
    template: { id: "saas-subscription", industry: "SaaS", business_models: ["订阅"], version: "0.1.0", references: [] },
    matching: { revenue_models: ["订阅"], user_structure: ["2B"], core_loops: ["协作"] },
    north_star: { candidates: [{ metric: "nrr", rationale: "测试" }], decision_guide: "测试" },
    trees: [{ id: "t", children: ["nrr"] }],
    dimensions: ["plan"],
    metrics: [
      {
        name: "nrr",
        display_name: "净收入留存",
        type: "ratio",
        definition: "测试",
        dimensions: ["plan"],
        time_grains: ["month"],
        owner_role: "测试",
        caliber_switches: {},
        provenance: { origin: "template", template_ref: "saas-subscription@0.1.0" },
        review: { required: false }
      }
    ],
    scenarios: []
  };
}

test("交易类答案确定性地选中电商模板并给出可解释理由", async () => {
  const ecommerce = (await loadTemplate("templates/ecommerce-marketplace.yaml")).ok
    ? ((await loadTemplate("templates/ecommerce-marketplace.yaml")) as { ok: true; template: Template }).template
    : null;
  expect(ecommerce).not.toBeNull();

  const result = matchTemplates(
    { revenue_model: "交易抽佣", user_structure: "双边市场", core_loop: "交易", caliber: {} },
    [saasMeta(), ecommerce!]
  );
  expect(result.best.templateId).toBe("ecommerce-marketplace");
  expect(result.best.score).toBe(3);
  expect(result.best.reasons.length).toBe(3);
  expect(result.best.reasons.join(" ")).toContain("交易抽佣");
});

test("跨模板：订阅类答案选中 SaaS 模板（切片 7 前置回归保护）", () => {
  const result = matchTemplates(
    { revenue_model: "订阅", user_structure: "2B", core_loop: "协作", caliber: {} },
    [saasMeta()]
  );
  expect(result.best.templateId).toBe("saas-subscription");
});

test("部分匹配时取高分者且并列时按输入顺序稳定取胜", () => {
  const result = matchTemplates(
    { revenue_model: "混合", user_structure: "2C", core_loop: "交易", caliber: {} },
    [saasMeta(), saasMeta()]
  );
  // saas 对混合/2C/协作均不匹配 → 0 分并列，取第一个
  expect(result.best.score).toBe(0);
  expect(result.best.templateId).toBe("saas-subscription");
});
