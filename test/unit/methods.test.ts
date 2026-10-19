import { test, expect } from "vitest";
import { join } from "node:path";
import { loadMethodsFromDir, lintMethodTemplate, defaultMethodsDir } from "../../src/engine/methods.js";
import { MethodTemplateSchema } from "../../src/schema/method.js";
import { defaultTemplatesDir } from "../../src/paths.js";

// A1 D3：方法模板库装载与 lint（第二类模板）

test("内置方法库：六个内置方法全部可装载且 lint 零问题（A2 增补 demo 独有三方法）", async () => {
  const result = await loadMethodsFromDir(defaultMethodsDir(defaultTemplatesDir()));
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const ids = result.methods.map((m) => m.method.id).sort();
  expect(ids).toEqual([
    "association-vs-increment", "net-change", "profit-change-diagnosis",
    "repeat-review", "strategic-options-comparison", "weekly-review"
  ]);
  for (const m of result.methods) {
    expect(lintMethodTemplate(m)).toEqual([]);
    expect(m.method.references.length).toBeGreaterThan(0);
    expect(m.steps.length).toBeGreaterThan(0);
  }
  // 定性战略方法允许零必需角色（方案 §6：假设检验与定性研究可没有必需量化角色）
  const strategic = result.methods.find((m) => m.method.id === "strategic-options-comparison")!;
  expect(strategic.roles).toEqual([]);
  // 效果判断方法必需三角色
  const effect = result.methods.find((m) => m.method.id === "association-vs-increment")!;
  expect(effect.roles.filter((r) => r.required).map((r) => r.id)).toEqual([
    "outcome_measure",
    "cohort_base",
    "outcome_group"
  ]);
});

test("方法目录不存在 = 空方法库（合法，不强制既有部署立刻有方法）", async () => {
  const result = await loadMethodsFromDir(join(process.cwd(), "no-such-methods-dir"));
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.methods).toEqual([]);
});

test("lint：provenance.template_ref 与方法标识不一致即报；references 空即报", () => {
  const good = MethodTemplateSchema.parse({
    method: { id: "m1", name: "方法", version: "1.0.0", description: "d", references: ["r"] },
    contexts: ["经营改善"], family: "f", purpose: "p",
    roles: [], steps: [{ title: "s" }], evidence: "e", limits: "l",
    provenance: { origin: "template", template_ref: "m1@1.0.0" }
  });
  expect(lintMethodTemplate(good)).toEqual([]);

  const badRef = { ...good, provenance: { origin: "template" as const, template_ref: "other@9.9.9" } };
  expect(lintMethodTemplate(badRef).some((i) => i.rule === "provenance-ref")).toBe(true);

  const noRefs = MethodTemplateSchema.parse({
    ...good,
    method: { ...good.method, references: [] }
  });
  expect(lintMethodTemplate(noRefs).some((i) => i.rule === "method-references")).toBe(true);
});

test("schema：角色 id 重复 / 语境重复 / 步骤为空被拒；origin=llm 缺模型被拒", () => {
  const base = {
    method: { id: "m1", name: "方法", version: "1.0.0", description: "d", references: [] },
    contexts: ["经营改善"], family: "f", purpose: "p",
    roles: [], steps: [{ title: "s" }], evidence: "e", limits: "l",
    provenance: { origin: "template", template_ref: "m1@1.0.0" }
  };
  expect(MethodTemplateSchema.safeParse(base).success).toBe(true);
  expect(
    MethodTemplateSchema.safeParse({ ...base, roles: [{ id: "a", name: "A" }, { id: "a", name: "B" }] }).success
  ).toBe(false);
  expect(MethodTemplateSchema.safeParse({ ...base, steps: [] }).success).toBe(false);
  expect(MethodTemplateSchema.safeParse({ ...base, contexts: [] }).success).toBe(false);
  expect(
    MethodTemplateSchema.safeParse({ ...base, provenance: { origin: "llm", prompt_version: "v1" } }).success
  ).toBe(false);
});
