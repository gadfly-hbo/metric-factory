import { test, expect } from "vitest";
import type { Template } from "../../src/schema/template.js";
import { InstanceSchema, type Instance } from "../../src/schema/instance.js";
import { BlueprintSchema } from "../../src/schema/blueprint.js";
import { materialize, EMPTY_TEMPLATE } from "../../src/engine/materialize.js";
import { assembleSap } from "../../src/sap/assemble.js";
import { validateSapPackage } from "../../src/sap/validate.js";
import { assertExportable } from "../../src/export/gate.js";

// A1 D12：SAP 蓝图段 + 零指标包

const OPTS = { packageId: "demo-zero", generator: "metric-factory@0.0.0-test", createdAt: "2026-10-18T00:00:00.000Z" };

function emptyTemplate(): Template {
  // 空白基座（A1 D13）：引擎空基座常量，非内容模板（TemplateSchema 的 metrics/north_star 门槛不适用于空基座）
  return EMPTY_TEMPLATE;
}

function zeroMetricInstance(): Instance {
  return InstanceSchema.parse({
    // A1 D13：空白起点（无 base / 无 answers）
    instance: { created_at: "2026-10-18T00:00:00.000Z" },
    blueprint: {
      title: "零售增长路径分析体系",
      intent: "设计具体分析方案",
      purpose: "比较继续扩店、供应链建设与会员经营的长期投入依据。",
      decision: "未来资源优先投入哪条增长道路？",
      boundary: "先设计比较与验证，不批准资源。",
      deliverable: "战略选项、选择依据、关键假设与重审条件。",
      contexts: ["战略选择"],
      organizations: ["假设先行", "深度研究"],
      questions: [{ id: "q1", title: "哪条道路有可成立的投入逻辑？", metric_refs: [] }],
      hypotheses: [
        {
          id: "h1", statement: "现有店型仍有扩张空间。",
          support: "跨周期客户价值证据。", counter: "新店边际恶化。",
          change_condition: "证据持续反对时缩小试点。"
        }
      ],
      evidence_plan: [
        {
          id: "e1", name: "客户需求研究", kind: "客户访谈",
          source: "目标客群访谈", check: "保留样本边界与反例", insufficiency: "样本单一时只形成待验证判断"
        }
      ],
      options: [
        { id: "expand", name: "选择性继续扩店", tradeoff: "占用资本。" },
        { id: "supply_chain", name: "优先建设供应链", tradeoff: "短期能力投入。" }
      ],
      provenance: { origin: "manual" }
    }
  });
}

test("零指标战略设计包：装配合法、校验零问题、导出门通过（A04 兼容面）", () => {
  const t = emptyTemplate();
  const inst = zeroMetricInstance();
  const m = materialize(t, inst);
  expect(m.metrics).toHaveLength(0);

  // 导出门对零指标天然通过（无 LLM 未审条目）
  expect(() => assertExportable(m.metrics)).not.toThrow();

  const pkg = assembleSap(m, t, OPTS);
  expect(pkg.metrics).toEqual([]);
  expect(pkg.blueprint?.title).toBe("零售增长路径分析体系");
  expect(pkg.blueprint?.options.map((o) => o.id)).toEqual(["expand", "supply_chain"]);
  // review 复核状态不随包携带
  expect(pkg.blueprint && "review" in pkg.blueprint).toBe(false);

  const issues = validateSapPackage(pkg);
  expect(issues).toEqual([]);
});

test("blueprint 段引用一致性镜像：问题引用包外指标即报；包内可解析则免报", () => {
  const t = emptyTemplate();
  const inst = zeroMetricInstance();
  const m = materialize(t, inst);
  const pkg = assembleSap(m, t, OPTS);

  // 构造引用包外指标的包（手工拼装负例）
  const bad = JSON.parse(JSON.stringify(pkg)) as typeof pkg;
  bad.blueprint!.questions[0]!.metric_refs = ["ghost_metric"];
  // 指纹需同步重算以隔离变量（本例只验证引用规则，不重算指纹会同时报 fingerprint-mismatch，不影响结构断言）
  const issues = validateSapPackage(bad);
  expect(
    issues.some((i) => i.rule === "structure" && i.path.startsWith("blueprint.questions.") && i.message.includes("ghost_metric"))
  ).toBe(true);
});

test("blueprint 携带 review 的包被拒（供应侧工作态不随包携带）", () => {
  const t = emptyTemplate();
  const inst = zeroMetricInstance();
  const m = materialize(t, inst);
  const pkg = assembleSap(m, t, OPTS);
  const withReview = JSON.parse(JSON.stringify(pkg)) as Record<string, unknown>;
  (withReview.blueprint as Record<string, unknown>).review = {
    confirmed_by: "boss", confirmed_at: "2026-10-18T01:00:00Z",
    design_fingerprint: "sha256:" + "0".repeat(64)
  };
  const issues = validateSapPackage(withReview);
  expect(issues.some((i) => i.path.startsWith("blueprint"))).toBe(true);
});

test("无 blueprint 的包保持缺席语义（仅指标体系包形状不变）", () => {
  const t = emptyTemplate();
  const inst = InstanceSchema.parse({
    instance: { created_at: "2026-10-18T00:00:00.000Z" }
  });
  const pkg = assembleSap(materialize(t, inst), t, OPTS);
  expect("blueprint" in pkg).toBe(false);
  expect(validateSapPackage(pkg)).toEqual([]);
});

test("blueprint provenance=llm 未经业务复核不阻断导出（出口门 = 指标级 LLM 审核 + release 设计门）", () => {
  // 诚实边界登记：蓝图段的「业务复核」执法点在 release 设计门，不在 export gate（与包级 review 段同哲学——
  // 导出是临时产物，发布才是登记）。此测试钉死该取舍，防静默漂移。
  const bp = BlueprintSchema.parse({
    ...zeroMetricInstance().blueprint,
    provenance: { origin: "llm", model: "test/model", prompt_version: "v1.0.0" }
  });
  const inst = InstanceSchema.parse({ ...zeroMetricInstance(), blueprint: bp });
  const m = materialize(emptyTemplate(), inst);
  expect(() => assertExportable(m.metrics)).not.toThrow();
  const pkg = assembleSap(m, emptyTemplate(), OPTS);
  expect(validateSapPackage(pkg)).toEqual([]);
});
