import { test, expect } from "vitest";
import { parseDbtArtifacts } from "../../src/warehouse/parse.js";
import { recommendMappings } from "../../src/warehouse/recommend.js";
import { loadTemplate } from "../../src/engine/loader.js";

async function fixtureWarehouse() {
  return parseDbtArtifacts("test/fixtures/dbt-manifest.json", "test/fixtures/dbt-catalog.json");
}

test("精确命中：gmv/order_count/uv/aov 推荐到正确模型列，信号可解释", async () => {
  const wh = await fixtureWarehouse();
  const tpl = (await loadTemplate("templates/ecommerce-marketplace.yaml")) as { ok: true; template: Parameters<typeof recommendMappings>[0]["0"] extends never ? never : import("../../src/schema/template.js").Template };
  const metrics = tpl.template.metrics;
  const { recommended, needsManual } = recommendMappings(metrics, wh);

  const expected: Record<string, { model: string; column: string }> = {
    gmv: { model: "fct_orders", column: "gmv" },
    order_count: { model: "fct_orders", column: "order_count" },
    uv: { model: "fct_traffic", column: "uv" },
    aov: { model: "fct_orders", column: "aov" }
  };
  for (const [metric, target] of Object.entries(expected)) {
    const rec = recommended.find((r) => r.metric === metric);
    expect(rec, `${metric} 应被推荐`).toBeTruthy();
    expect(rec!.model).toBe(target.model);
    expect(rec!.column).toBe(target.column);
    expect(rec!.score).toBeGreaterThanOrEqual(0.6);
    expect(rec!.signals.length).toBeGreaterThan(0);
  }
  // 可映射指标命中率 100%（4/4）
  expect(recommended.filter((r) => Object.keys(expected).includes(r.metric)).length).toBe(4);
});

test("干扰项不产生假阳性：nps/retention_30d 无 ≥0.6 推荐", async () => {
  const wh = await fixtureWarehouse();
  const tpl = (await loadTemplate("templates/ecommerce-marketplace.yaml")) as { ok: true; template: import("../../src/schema/template.js").Template };
  const { recommended, needsManual } = recommendMappings(tpl.template.metrics, wh);
  expect(recommended.find((r) => r.metric === "nps")).toBeUndefined();
  expect(recommended.find((r) => r.metric === "retention_30d")).toBeUndefined();
  expect(needsManual).toContain("nps");
  expect(needsManual).toContain("retention_30d");
});

test("同义词信号：成交额经同义词命中 pay_amount（0.7），精确命中更高者胜出", async () => {
  const wh = await fixtureWarehouse();
  const { recommended } = recommendMappings(
    [{ name: "total_amount", display_name: "成交额", definition: "交易相关的规模描述" } as never],
    wh
  );
  const rec = recommended.find((r) => r.metric === "total_amount")!;
  // 无精确/包含命中：唯一 ≥0.6 的信号是同义词（成交额→gmv/amount，双 0.7 并列取迭代序先者）
  expect(rec.score).toBe(0.7);
  expect(["fct_orders.gmv", "fct_payments.pay_amount"]).toContain(`${rec.model}.${rec.column}`);
  expect(rec.signals.some((sig) => sig.includes("同义词"))).toBe(true);
  expect(rec.signals.some((sig) => sig.includes("精确"))).toBe(false);
});

test("S5：比率/占比类指标的包含命中降档（*_share 不再高置信映射到绝对值列）", async () => {
  const wh = await fixtureWarehouse();
  const tpl = (await loadTemplate("templates/ecommerce-marketplace.yaml")) as { ok: true; template: import("../../src/schema/template.js").Template };
  const { recommended } = recommendMappings(tpl.template.metrics, wh);
  // new_user_gmv_share 对 fct_orders.gmv 的包含命中因 _share 后缀降为 0.5 → 不应出现 ≥0.6 推荐
  const share = recommended.find((r) => r.metric === "new_user_gmv_share");
  expect(share).toBeUndefined();
});
