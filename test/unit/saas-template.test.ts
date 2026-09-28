import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { loadTemplate } from "../../src/engine/loader.js";

const PATH = "templates/saas-subscription.yaml";

test("SaaS 模板指标数 ≥40 且每条口径完整、出处齐全", async () => {
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
  };

  expect(doc.metrics.length).toBeGreaterThanOrEqual(40);

  const metricNames = new Set(doc.metrics.map((m) => m.name));
  for (const m of doc.metrics) {
    expect(m.definition.length, `${m.name} 缺口径`).toBeGreaterThan(0);
    expect(m.dimensions.length, `${m.name} 缺维度`).toBeGreaterThan(0);
    expect(m.time_grains.length, `${m.name} 缺时间粒度`).toBeGreaterThan(0);
    expect(m.provenance.origin, `${m.name} 出处错误`).toBe("template");
    expect(m.provenance.template_ref).toBe("saas-subscription@0.1.0");
  }
  for (const tree of doc.trees) {
    for (const child of tree.children) {
      expect(metricNames.has(child), `trees 引用了不存在的指标 ${child}`).toBe(true);
    }
  }
  for (const c of doc.north_star.candidates) {
    expect(metricNames.has(c.metric), `north_star 引用了不存在的指标 ${c.metric}`).toBe(true);
  }
});

test("SaaS 模板通过引擎加载与 lint", async () => {
  const loaded = await loadTemplate(PATH);
  expect(loaded.ok).toBe(true);
  if (loaded.ok) {
    expect(loaded.template.template.id).toBe("saas-subscription");
    expect(loaded.template.matching.revenue_models).toContain("订阅");
  }
});
