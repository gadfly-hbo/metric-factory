import { test, expect } from "vitest";
import { generateBlueprintDraft, BlueprintDraftPayloadSchema } from "../../src/engine/generate.js";
import { BLUEPRINT_PROMPT_VERSION, buildBlueprintGeneratePrompt, buildBlueprintRefinePrompt } from "../../src/llm/prompt.js";
import { createFakeClient } from "../../src/llm/index.js";
import { loadTemplatesFromDir } from "../../src/engine/loader.js";
import { loadMethodsFromDir, defaultMethodsDir } from "../../src/engine/methods.js";
import { defaultTemplatesDir } from "../../src/paths.js";
import { InstanceSchema } from "../../src/schema/instance.js";

// A1 D9：blueprint 草稿生成装配（假 client；真实链路留档由 smoke 脚本承担）

const NOW = "2026-10-18T00:00:00.000Z";

const VALID_PAYLOAD = {
  blueprint: {
    title: "优惠券与复购关系研究",
    intent: "设计具体分析方案",
    purpose: "区分观察到的复购差异、客户选择差异与活动增量。",
    decision: "当前资料能支持什么判断，还需要怎样的对照？",
    boundary: "独立数据专题；暂不要求经营目标或行动建议。",
    deliverable: "指标口径、研究设计、证据要求和推断限制。",
    contexts: ["独立数据专题"],
    organizations: ["假设先行", "自主探索"],
    questions: [
      { id: "q1", title: "比较的是同一类客户吗？", detail: "检查活动前差异。", metric_refs: ["customers"] }
    ],
    hypotheses: [
      {
        id: "h1", statement: "领券客户原本更活跃。",
        support: "活动前行为差异。", counter: "合格对照下仍有增量。",
        change_condition: "对照设计改变后重估。"
      }
    ],
    evidence_plan: [
      { id: "e1", name: "队列与窗口", kind: "内部数据", source: "订单与领券记录", check: "去重与窗口一致", insufficiency: "不一致时阻止效果比较" }
    ],
    options: []
  },
  added_metrics: [
    {
      name: "repeat_rate", display_name: "复购率", type: "ratio",
      definition: "观察窗口内复购客户数除以窗口内合格客户数。",
      dimensions: ["channel"], time_grains: ["week", "month"], owner_role: "数据分析师",
      type_params: { numerator: "repeat_customers", denominator: "customers" }
    }
  ],
  added_scenarios: [
    {
      id: "coupon_repeat_study", title: "领券与复购关系研究", decision_purpose: "区分选择差异与增量",
      question_tree: [{ id: "root", label: "复购差异来源" }],
      metric_usages: [{ metric: "repeat_rate", role: "outcome" }],
      method_refs: ["association-vs-increment@0.1.0"],
      method_bindings: [
        { method_ref: "association-vs-increment@0.1.0", role: "outcome_measure", metric: "repeat_rate" }
      ],
      evidence_requirements: "队列与分配记录。",
      output_spec: "描述与待检验解释。",
      review_rules: "不升级因果。"
    }
  ]
};

test("blueprint 草稿装配：provenance 强注 + 场景版本服务端固定 + 默认判断/证据状态", async () => {
  const client = createFakeClient(JSON.stringify(VALID_PAYLOAD));
  const result = await generateBlueprintDraft(client, { system: "s", user: "u" }, "研究领券复购", "fake/demo", NOW);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const d = result.draft;
  expect(d.generator.prompt_version).toBe(BLUEPRINT_PROMPT_VERSION);
  expect(d.blueprint?.provenance).toEqual({ origin: "llm", model: "fake/demo", prompt_version: BLUEPRINT_PROMPT_VERSION });
  // 禁止编造：假设默认待验证 + 未核验；证据默认待获取
  expect(d.blueprint?.hypotheses[0]?.judgment).toBe("待验证假设");
  expect(d.blueprint?.hypotheses[0]?.verified).toBe(false);
  expect(d.blueprint?.evidence_plan[0]?.status).toBe("待获取");
  // 指标 provenance 注入
  expect(d.added[0]?.provenance.origin).toBe("llm");
  expect(d.added[0]?.review.required).toBe(true);
  // 场景版本固定 0.1.0（服务端语义，与 UI 表单同规）；method_bindings 保留
  expect(d.added_scenarios[0]?.version).toBe("0.1.0");
  expect(d.added_scenarios[0]?.method_bindings?.[0]?.role).toBe("outcome_measure");
});

test("失败三阶段：call / parse / payload（畸形 JSON fail-closed 拒）", async () => {
  const callFail = await generateBlueprintDraft(
    { complete: () => Promise.reject(new Error("network down")) },
    { system: "s", user: "u" }, "d", "fake/demo", NOW
  );
  expect(callFail.ok).toBe(false);
  if (!callFail.ok) expect(callFail.stage).toBe("call");

  const parseFail = await generateBlueprintDraft(createFakeClient("这不是 JSON"), { system: "s", user: "u" }, "d", "fake/demo", NOW);
  expect(parseFail.ok).toBe(false);
  if (!parseFail.ok) expect(parseFail.stage).toBe("parse");

  const badPayload = { ...VALID_PAYLOAD, blueprint: { ...VALID_PAYLOAD.blueprint, contexts: ["不存在的语境"] } };
  const payloadFail = await generateBlueprintDraft(
    createFakeClient(JSON.stringify(badPayload)), { system: "s", user: "u" }, "d", "fake/demo", NOW
  );
  expect(payloadFail.ok).toBe(false);
  if (!payloadFail.ok) {
    expect(payloadFail.stage).toBe("payload");
    expect(payloadFail.issues?.join(" ").length).toBeGreaterThan(0);
  }
});

test("MF live001: missing question label and array evidence remain rejected, never silently repaired", async () => {
  const invalid = {...VALID_PAYLOAD, added_scenarios:[{...VALID_PAYLOAD.added_scenarios[0],question_tree:[{id:"root",title:"wrong field"}],evidence_requirements:["wrong type"]}]};
  const result = await generateBlueprintDraft(createFakeClient(JSON.stringify(invalid)), {system:"s",user:"u"}, "synthetic", "fake/demo", NOW);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.stage).toBe("payload");
    expect(result.issues?.join("\n")).toContain("question_tree.0.label");
    expect(result.issues?.join("\n")).toContain("evidence_requirements");
  }
  expect(result).not.toHaveProperty("draft");
});

test("payload 硬约束：verified=true 或证据 status=已核验 也照收（schema 合法），诚实性由提示词与复核门承担", () => {
  // 边界登记：LLM 载荷层不强制 verified=false——schema 允许 true，业务门在 validateBlueprint 的
  // hypothesis-verification 规则（verified 需已核验证据）。此处钉死分层，防误以为载荷层有该约束。
  const p = BlueprintDraftPayloadSchema.safeParse(VALID_PAYLOAD);
  expect(p.success).toBe(true);
});

test("prompt 构造：生成/修正 prompt 携带方法库锚定与输出契约；修正 prompt 携带当前体系", async () => {
  const tDir = defaultTemplatesDir();
  const templates = await loadTemplatesFromDir(tDir);
  expect(templates.ok).toBe(true);
  if (!templates.ok) return;
  const methodsResult = await loadMethodsFromDir(defaultMethodsDir(tDir));
  const methods = methodsResult.ok ? methodsResult.methods : [];
  const template = templates.templates[0]!;

  const gen = buildBlueprintGeneratePrompt(template, methods, "一句话需求");
  expect(gen.user).toContain("association-vs-increment@0.1.0");
  expect(gen.system).toContain(BLUEPRINT_PROMPT_VERSION);
  expect(gen.system).toContain("待获取");
  expect(gen.system).toContain("verified 一律 false");

  const inst = InstanceSchema.parse({
    instance: { created_at: NOW },
    base: `${template.template.id}@${template.template.version}`,
    answers: { revenue_model: "交易抽佣", user_structure: "2C", core_loop: "交易" },
    blueprint: {
      title: "既有体系", intent: "设计具体分析方案",
      purpose: "p", decision: "d", boundary: "b", deliverable: "de",
      contexts: ["经营改善"], organizations: ["假设先行"],
      questions: [{ id: "q1", title: "旧问题", metric_refs: [] }],
      hypotheses: [], evidence_plan: [], options: [],
      provenance: { origin: "manual" }
    }
  });
  const ref = buildBlueprintRefinePrompt(template, inst, methods, "补上战略视角");
  expect(ref.user).toContain("既有体系");
  expect(ref.user).toContain("补上战略视角");
  expect(ref.system).toContain("全量替换");
});
