import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

// 直接读盘解析模板数据文件（模板是数据资产，经 schema 之外的质量门）
const PATH = "templates/ecommerce-marketplace.yaml";

test("电商模板指标数 ≥40 且每条口径完整、出处齐全", async () => {
  const doc = parseYaml(await readFile(PATH, "utf8")) as {
    metrics: {
      name: string;
      definition: string;
      dimensions: string[];
      time_grains: string[];
      provenance: { origin: string; template_ref: string };
    }[];
    trees: { children: string[] }[];
    north_star: { candidates: { metric: string }[] };
    caliber: string[];
  };

  expect(doc.metrics.length).toBeGreaterThanOrEqual(40);

  const metricNames = new Set(doc.metrics.map((m) => m.name));
  for (const m of doc.metrics) {
    expect(m.definition.length, `${m.name} 缺口径`).toBeGreaterThan(0);
    expect(m.dimensions.length, `${m.name} 缺维度`).toBeGreaterThan(0);
    expect(m.time_grains.length, `${m.name} 缺时间粒度`).toBeGreaterThan(0);
    expect(m.provenance.origin, `${m.name} 出处错误`).toBe("template");
    expect(m.provenance.template_ref).toBe("ecommerce-marketplace@0.1.0");
  }

  // trees 与北极星候选引用的指标必须存在
  for (const tree of doc.trees) {
    for (const child of tree.children) {
      expect(metricNames.has(child), `trees 引用了不存在的指标 ${child}`).toBe(true);
    }
  }
  for (const c of doc.north_star.candidates) {
    expect(metricNames.has(c.metric), `north_star 引用了不存在的指标 ${c.metric}`).toBe(true);
  }

  // 口径开关覆盖三类决策：退款 / 运费 / 渠道
  const allSwitches = new Set<string>();
  for (const m of doc.metrics as unknown as { caliber_switches: Record<string, boolean> }[]) {
    for (const k of Object.keys(m.caliber_switches ?? {})) allSwitches.add(k);
  }
  expect([...allSwitches].some((k) => k.includes("refund")), "缺退款类口径开关").toBe(true);
  expect([...allSwitches].some((k) => k.includes("shipping")), "缺运费类口径开关").toBe(true);
  expect([...allSwitches].some((k) => k.includes("channel")), "缺渠道类口径开关").toBe(true);
});
