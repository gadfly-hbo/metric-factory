import { test, expect } from "vitest";
import { TemplateSchema, type Template } from "../../src/schema/template.js";
import { InstanceSchema, type Instance } from "../../src/schema/instance.js";
import { materialize } from "../../src/engine/materialize.js";
import { assembleSap, type SapPackageV01 } from "../../src/sap/assemble.js";
import { packageFingerprint } from "../../src/sap/canonical.js";
import { validateSapPackage } from "../../src/sap/validate.js";

// 负例构造 = 合法装配产物单点破坏；每类拒绝规则一条（契约 §6 validate_import 供应侧镜像）

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
        statistic_object: {
          id: "concept-order",
          version: "1.0.0",
          source: "protege:snapshot/order@1.0.0",
          role: "statistic_object"
        },
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
        id: "concept-member",
        version: "2.1.0",
        source: "protege:snapshot/member@2.1.0",
        role: "dimension_semantics"
      }
    ]
  });
}

function validPackage(): SapPackageV01 {
  const template = makeTemplate();
  const instance = makeInstance();
  return assembleSap(materialize(template, instance), template, {
    ...OPTS,
    instanceConceptRefs: instance.concept_refs
  });
}

test("正例：装配产物 validateSapPackage 返回 issues == []", () => {
  expect(validateSapPackage(validPackage())).toEqual([]);
});

test("structure：未知 sap 合同版本（0.2）拒绝（fail-closed）", () => {
  const issues = validateSapPackage({ ...validPackage(), sap: "0.2" });
  expect(issues).toEqual([
    { rule: "structure", path: "sap", message: expect.stringContaining("0.1") }
  ]);
});

test("runtime-state：非 design_only（executable）拒绝，独立 rule 名", () => {
  const issues = validateSapPackage({ ...validPackage(), runtime_state: "executable" });
  expect(issues).toEqual([
    { rule: "runtime-state", path: "runtime_state", message: expect.stringContaining("design_only") }
  ]);
});

test("fingerprint-mismatch：声明指纹改一位即拒绝", () => {
  const pkg = validPackage();
  const fp = pkg.package.fingerprint;
  const flipped = (fp.startsWith("sha256:a") ? "sha256:b" : "sha256:a") + fp.slice(8);
  const issues = validateSapPackage({ ...pkg, package: { ...pkg.package, fingerprint: flipped } });
  expect(issues).toEqual([
    { rule: "fingerprint-mismatch", path: "package.fingerprint", message: expect.stringContaining("指纹") }
  ]);
});

test("duplicate-identity：指标重名拒绝", () => {
  const pkg = validPackage();
  const dup = { ...pkg, metrics: [pkg.metrics[0], pkg.metrics[0]] };
  // 破坏内容后按规则重算指纹，隔离 duplicate-identity 单规则断言
  const fixed = { ...dup, package: { ...dup.package, fingerprint: packageFingerprint(dup) } };
  expect(validateSapPackage(fixed)).toEqual([
    { rule: "duplicate-identity", path: "metrics.gmv", message: expect.stringContaining("gmv") }
  ]);
});

test("duplicate-identity：concept_refs 重复键（同 id+version+role）拒绝", () => {
  const pkg = validPackage();
  const dup = { ...pkg, concept_refs: [...pkg.concept_refs, pkg.concept_refs[0]] };
  const fixed = { ...dup, package: { ...dup.package, fingerprint: packageFingerprint(dup) } };
  expect(validateSapPackage(fixed)).toEqual([
    {
      rule: "duplicate-identity",
      path: "concept_refs.3",
      message: expect.stringContaining("concept-order")
    }
  ]);
});

test("structure：必填段缺失（review 整段删除）拒绝", () => {
  const bad: Record<string, unknown> = { ...validPackage() };
  delete bad.review;
  const issues = validateSapPackage(bad);
  expect(issues).toEqual([
    { rule: "structure", path: "review", message: expect.any(String) }
  ]);
});

test("structure：bindings 条目不合 MappingEntry 形状（缺 model/column）拒绝", () => {
  const bad = { ...validPackage(), bindings: [{ metric: "gmv", confidence: 0.9 }] };
  const issues = validateSapPackage(bad);
  expect(issues.length).toBeGreaterThan(0);
  expect(issues[0]!.rule).toBe("structure");
  expect(issues[0]!.path).toMatch(/^bindings/);
});
