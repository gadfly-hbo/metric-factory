import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { readFile } from "node:fs/promises";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

const NEW_TEMPLATES = [
  { file: "content-community.yaml", id: "content-community", ref: "content-community@0.1.0", answers: "content-answers.yaml" },
  { file: "digital-marketing.yaml", id: "digital-marketing", ref: "digital-marketing@0.1.0", answers: "marketing-answers.yaml" },
  { file: "supply-chain-logistics.yaml", id: "supply-chain-logistics", ref: "supply-chain-logistics@0.1.0", answers: "supply-chain-answers.yaml" },
  { file: "cloud-cost.yaml", id: "cloud-cost", ref: "cloud-cost@0.1.0", answers: "cloud-cost-answers.yaml" },
  { file: "apparel-brand-retail.yaml", id: "apparel-brand-retail", ref: "apparel-brand-retail@0.1.0", answers: "apparel-answers.yaml" }
] as const;

test.each(NEW_TEMPLATES)("模板质量：$file ≥40 指标且口径完整、引用一致", async ({ file, ref }) => {
  const doc = parseYaml(await readFile(`templates/${file}`, "utf8")) as {
    template: { id: string };
    metrics: {
      name: string;
      definition: string;
      dimensions: string[];
      time_grains: string[];
      provenance: { origin: string; template_ref: string };
      type_params?: Record<string, unknown>;
    }[];
    trees: { children: string[]; formula?: string }[];
    north_star: { candidates: { metric: string }[] };
    dimensions: string[];
  };

  expect(doc.template.id).toBeTruthy();
  expect(doc.metrics.length).toBeGreaterThanOrEqual(40);

  const metricNames = new Set(doc.metrics.map((m) => m.name));
  for (const m of doc.metrics) {
    expect(m.definition.length, `${m.name} 缺口径`).toBeGreaterThan(0);
    expect(m.dimensions.length, `${m.name} 缺维度`).toBeGreaterThan(0);
    expect(m.time_grains.length, `${m.name} 缺时间粒度`).toBeGreaterThan(0);
    expect(m.provenance.origin).toBe("template");
    expect(m.provenance.template_ref).toBe(ref);
    // 维度引用合法
    for (const d of m.dimensions) expect(doc.dimensions, `${m.name} 维度 ${d} 未声明`).toContain(d);
    // type_params 引用合法
    const tp = m.type_params;
    if (tp) {
      for (const k of ["measure", "numerator", "denominator"] as const) {
        if (typeof tp[k] === "string") expect(metricNames, `${m.name}.${k}=${tp[k]} 不存在`).toContain(tp[k] as string);
      }
      if (typeof tp.expr === "string") {
        for (const t of tp.expr.match(/[a-z_][a-z0-9_]*/g) ?? []) {
          expect(metricNames, `${m.name} 公式引用 ${t} 不存在`).toContain(t);
        }
      }
    }
  }
  for (const tree of doc.trees) {
    for (const c of tree.children) expect(metricNames, `树引用 ${c} 不存在`).toContain(c);
    if (tree.formula) {
      for (const t of tree.formula.match(/[a-z_][a-z0-9_]*/g) ?? []) {
        if (metricNames.has(t) || /^\d+$/.test(t) || /[×=()]/.test(t)) continue;
        expect(metricNames, `树公式引用 ${t} 不存在`).toContain(t);
      }
    }
  }
  for (const c of doc.north_star.candidates) expect(metricNames).toContain(c.metric);
});

test.each(NEW_TEMPLATES)("lint 通过：$file", ({ file }) => {
  const r = run(["lint", `templates/${file}`]);
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout).toContain("PASS");
});

test.each(NEW_TEMPLATES)("跨模板匹配：$answers 选中 $id", ({ id, answers }) => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-tpl-"));
  const r = run(["init", "--answers", `examples/${answers}`, "--out", outDir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain(id);
  const inst = parseYaml(readFileSync(join(outDir, "instance.yaml"), "utf8")) as { base: string };
  expect(inst.base.startsWith(id)).toBe(true);
});

test.each(NEW_TEMPLATES)("实例走通 export：$file", ({ answers }) => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-tpl-exp-"));
  const init = run(["init", "--answers", `examples/${answers}`, "--out", outDir]);
  expect(init.status).toBe(0);
  const instPath = join(outDir, "instance.yaml");
  expect(run(["validate", instPath]).status).toBe(0);
  expect(run(["audit", instPath]).status, "审计须无误报").toBe(0);
  const exp = run(["export", instPath, "--format", "metricflow", "--out", outDir]);
  expect(exp.status, `stderr: ${exp.stderr}`).toBe(0);
});
