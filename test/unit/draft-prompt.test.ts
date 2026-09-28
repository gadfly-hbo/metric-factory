import { test, expect } from "vitest";
import { DraftSchema } from "../../src/schema/draft.js";
import { buildGeneratePrompt, PROMPT_VERSION } from "../../src/llm/prompt.js";
import { loadTemplate, loadInstance } from "../../src/engine/loader.js";

function validDraft() {
  return {
    generator: { model: "fake", prompt_version: "v2.0.0", describe: "跨境电商", created_at: "2026-09-29T00:00:00Z" },
    added: [
      {
        name: "custom_seckill_gmv",
        display_name: "秒杀 GMV",
        type: "simple",
        definition: "秒杀活动订单的成交金额",
        dimensions: ["channel"],
        time_grains: ["day"],
        owner_role: "电商业务负责人",
        caliber_switches: {},
        provenance: { origin: "llm", model: "fake", prompt_version: "v2.0.0" },
        review: { required: true }
      }
    ],
    modified: [],
    removed: [],
    caliber: {}
  };
}

test("合法草案通过 DraftSchema；缺 generator / added 缺 provenance 被拒", () => {
  expect(DraftSchema.safeParse(validDraft()).success).toBe(true);

  const noGen = validDraft() as Record<string, unknown>;
  delete noGen.generator;
  expect(DraftSchema.safeParse(noGen).success).toBe(false);

  const noProv = validDraft();
  delete (noProv.added[0] as Record<string, unknown>).provenance;
  expect(DraftSchema.safeParse(noProv).success).toBe(false);
});

test("generate prompt 注入基模板指标投影、业务描述、输出契约与版本号", async () => {
  const template = (await loadTemplate("templates/ecommerce-marketplace.yaml")) as { ok: true; template: Parameters<typeof buildGeneratePrompt>[0] };
  const instance = (await loadInstance("test/fixtures/instance-ecommerce.yaml")) as { ok: true; instance: Parameters<typeof buildGeneratePrompt>[1] };

  const prompt = buildGeneratePrompt(template.template, instance.instance, "我们是跨境电商平台，主打低价秒杀");

  expect(prompt.system).toContain("指标");
  expect(prompt.system).toContain("JSON");
  expect(prompt.system).toContain(PROMPT_VERSION);

  // 基模板指标投影注入（含口径与维度），原始文件头不注入
  expect(prompt.user).toContain("name: gmv");
  expect(prompt.user).toContain("display_name: 成交总额");
  expect(prompt.user).toContain("支付成功订单的金额合计");
  expect(prompt.user).toContain("user_tier");
  expect(prompt.user).not.toContain("行业指标模板");
  // 实例已审核 added 段注入
  expect(prompt.user).toContain("custom_gmv_excluding_gift");
  // 业务描述与维度清单
  expect(prompt.user).toContain("跨境电商平台，主打低价秒杀");
  expect(prompt.user).toContain("channel");
});
