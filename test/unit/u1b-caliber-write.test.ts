// A2 U1-b（用户裁决）：口径确认写路径——ModifiedMetricSchema.caliber_switches 加法式扩展
// 既有语义零变更：不带该字段的 modified 行为与从前逐字节一致；带字段时键级合并覆盖。
import { describe, it, expect } from "vitest";
import { materialize, EMPTY_TEMPLATE } from "../../src/engine/materialize.js";
import { loadTemplate } from "../../src/engine/loader.js";
import { join } from "node:path";

const tpl = await loadTemplate(join("templates", "ecommerce-marketplace.yaml")).then(r => {
  if (!r.ok) throw new Error("load fail");
  return r.template;
});

const base = {
  instance: { created_at: "2026-10-19T00:00:00.000Z" },
  base: "ecommerce-marketplace@1.0.0"
} as const;

it("不带 caliber_switches 的 modified：行为与既有语义一致（display/definition 覆盖）", () => {
  const mat = materialize(tpl, { ...base, caliber_switches: {}, added: [], modified: [{ name: "gmv", display_name: "成交额（调整）" }], removed: [], added_scenarios: [] } as never);
  const gmv = mat.metrics.find(m => m.name === "gmv")!;
  expect(gmv.display_name).toBe("成交额（调整）");
});

it("modified.caliber_switches：键级合并进物化指标（U1-b 写路径）", () => {
  const mat = materialize(tpl, { ...base, caliber_switches: {}, added: [], modified: [{ name: "refund_rate", caliber_switches: { refund_to_payment_period: true } }], removed: [], added_scenarios: [] } as never);
  const refund = mat.metrics.find(m => m.name === "refund_rate")!;
  expect(refund.caliber_switches.refund_to_payment_period).toBe(true);
});

it("modified.caliber_switches 与实例级 caliber_switches 并存：modified 优先（显式覆盖胜出）", () => {
  const mat = materialize(tpl, {
    ...base,
    caliber_switches: { refund_rate: { refund_to_payment_period: false } },
    added: [],
    modified: [{ name: "refund_rate", caliber_switches: { refund_to_payment_period: true } }],
    removed: [], added_scenarios: []
  } as never);
  const refund = mat.metrics.find(m => m.name === "refund_rate")!;
  expect(refund.caliber_switches.refund_to_payment_period).toBe(true);
});

it("added 指标自带 caliber_switches 原样透出（blank 基座口径确认落点）", () => {
  const blank = { instance: { created_at: "2026-10-19T00:00:00.000Z" }, caliber_switches: {}, added: [{
    name: "refund_rate", display_name: "退款额", type: "simple" as const, definition: "已完成退款金额。",
    dimensions: [], time_grains: ["month" as const], owner_role: "财务", caliber_switches: { refund_to_payment_period: false },
    provenance: { origin: "manual" as const }
  }], modified: [], removed: [], added_scenarios: [] } as never;
  const mat = materialize(EMPTY_TEMPLATE, blank);
  expect(mat.metrics[0]!.caliber_switches).toEqual({ refund_to_payment_period: false });
});
