import { stringify as stringifyYaml } from "yaml";
import type { Template } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { MethodTemplate } from "../schema/method.js";

export const PROMPT_VERSION = "v2.1.0";
// A1 D9：blueprint prompt 独立版本族（指标 prompt 维持 v2.1.0 不动，避免无内容变更的 provenance 扰动）
export const BLUEPRINT_PROMPT_VERSION = "v1.0.1";

export interface Prompt {
  system: string;
  user: string;
}

// 工人模式 prompt（参考方案 §2.3）：模板即 few-shot，输出契约钉死，模型不握方向盘
export function buildGeneratePrompt(template: Template, instance: Instance, describe: string): Prompt {
  const system = [
    `你是资深指标体系设计师（Metric Factory 生成器，prompt ${PROMPT_VERSION}）。`,
    "基于给定的行业模板，为业务描述生成缺失的个性化候选指标。",
    "",
    "硬性规则：",
    "1. 只输出 JSON 数组，每个元素是一个指标对象，不输出任何其他文字。",
    '2. 字段：name（小写 snake_case，英文）、display_name（中文）、type（simple|ratio|derived|cumulative）、definition（中文口径，必须写清分子/分母/统计周期/剔除规则）、dimensions（只能从给定维度清单选取）、time_grains（day|week|month|quarter|year）、owner_role（中文角色名）。',
    "3. 不要重复模板已有的指标；只生成模板没有、该业务确实需要的增量指标（通常 3–8 个）。",
    "4. 口径必须可执行：比率类写明分子分母，累计类写明窗口，禁止「相关数据的合理统计」这类空话。",
    "5. 你的输出将由人审核，未审核不可导出。"
  ].join("\n");

  const reviewed = instance.added.filter((m) => m.provenance.origin !== "llm" || m.provenance.reviewed_by);
  const user = [
    "# 行业基模板（全量，作为指标风格与深度的基准）",
    stringifyYaml({
      dimensions: template.dimensions,
      metrics: template.metrics.map((m) => ({
        name: m.name,
        display_name: m.display_name,
        type: m.type,
        definition: m.definition,
        dimensions: m.dimensions,
        time_grains: m.time_grains,
        owner_role: m.owner_role
      }))
    }),
    "",
    "# 实例中已有人工/已审核指标（不要重复）",
    stringifyYaml(reviewed.map((m) => ({ name: m.name, display_name: m.display_name }))),
    "",
    "# 可用维度清单（dimensions 只能从中选取）",
    template.dimensions.join("、"),
    "",
    "# 业务描述",
    describe,
    "",
    "# 输出",
    "JSON 数组，元素为上述字段结构的指标对象。"
  ].join("\n");

  return { system, user };
}

// refine prompt：面向存量指标微调（口径/修改/删除/增补），同样模板锚定 + 输出契约钉死
export function buildRefinePrompt(template: Template, instance: Instance, instruction: string): Prompt {
  const system = [
    `你是资深指标体系设计师（Metric Factory 微调器，prompt ${PROMPT_VERSION}）。`,
    "根据企业的微调指令，对既有指标实例产出结构化 patch 草案。",
    "",
    "硬性规则：",
    "1. 只输出一个 JSON 对象，不输出任何其他文字。字段：",
    '   caliber：对象，键为指标名，值为 {开关名: 布尔}，只调整模板已声明的开关；',
    "   modified：数组，元素 {name, definition?, display_name?, owner_role?}，只能改已有指标；",
    "   removed：数组，指标名列表，只能删模板已有指标；",
    "   added：数组，只补真正缺失的指标；元素字段硬约束（与生成器同规）：",
    "   name（小写 snake_case 英文）、display_name（中文）、type（只能是 simple|ratio|derived|cumulative 四个枚举值之一——禁止 sum/measure/count 等任何其他值）、definition（中文口径，写清分子/分母/统计周期/剔除规则）、dimensions（只能从模板维度清单选）、time_grains（只能是 day|week|month|quarter|year）、owner_role（必填，中文角色名）。",
    "2. 不确定的字段宁可不改：空 patch 是合法输出。",
    "3. 你的输出将由人审核，未审核的 LLM 新增指标不可导出。"
  ].join("\n");

  const currentPatch = {
    caliber_switches: instance.caliber_switches,
    modified: instance.modified,
    removed: instance.removed,
    added: instance.added.map((m) => ({
      name: m.name,
      display_name: m.display_name,
      provenance: `${m.provenance.origin}${m.provenance.reviewed_by ? "（已审）" : "（待审）"}`
    }))
  };

  const user = [
    "# 行业基模板（指标与口径开关全集）",
    stringifyYaml({
      dimensions: template.dimensions,
      metrics: template.metrics.map((m) => ({
        name: m.name,
        display_name: m.display_name,
        definition: m.definition,
        caliber_switches: m.caliber_switches
      }))
    }),
    "",
    "# 实例当前微调状态（caliber/modified/removed/added）",
    stringifyYaml(currentPatch),
    "",
    "# 可用维度清单（added 的 dimensions 只能从中选取）",
    template.dimensions.join("、"),
    "",
    "# 微调指令",
    instruction,
    "",
    "# 输出",
    "单个 JSON 对象：{caliber, modified, removed, added}"
  ].join("\n");

  return { system, user };
}

// ===== A1 批次：分析体系（blueprint）生成与修正 prompt =====

const BLUEPRINT_OUTPUT_CONTRACT = [
  "输出契约（硬性规则）：",
  "1. 只输出一个 JSON 对象，不输出任何其他文字。字段：",
  "   blueprint：分析体系草稿；added_metrics：建议新增指标数组（可为空）；added_scenarios：建议分析场景数组（可为空）。",
  "2. blueprint 字段：title（中文体系名）、intent（只能是「建设可复用体系」或「设计具体分析方案」）、purpose（业务目的）、decision（研究问题或要做的选择）、boundary（范围边界）、deliverable（输出要求）、",
  "   contexts（只能从「经营改善」「战略选择」「独立数据专题」选，可组合，至少一个）、organizations（只能从「假设先行」「深度研究」「自主探索」选，至少一个）、",
  "   questions（2–5 个，元素 {id 小写 snake_case, title, detail, metric_refs[]}，metric_refs 只能引用建议指标或既有指标）、",
  "   hypotheses（元素 {id, statement, judgment 只能是「待验证假设」, support 支持证据, counter 反对证据, change_condition 改变判断的条件, verified 只能是 false}），",
  "   evidence_plan（元素 {id, name, kind 证据类型中文, source 来源, check 核验办法, insufficiency 不足处置, status 只能是「待获取」}），",
  "   options（候选道路，元素 {id, name, tradeoff 取舍}；战略选择类至少 2 条，其他可为空）。",
  "3. added_metrics 元素硬约束：name（小写 snake_case 英文）、display_name（中文）、type（只能是 simple|ratio|derived|cumulative 之一）、definition（中文口径，写清分子/分母/统计周期/剔除规则）、dimensions（只能从给定维度清单选）、time_grains（只能是 day|week|month|quarter|year）、owner_role（必填中文角色名）。",
  "4. added_scenarios 元素：id（小写 snake_case）、title、decision_purpose（必填决策用途）、question_tree（节点数组，元素 {id 小写 snake_case, label 必填中文问题, parent? 父节点id, metric? 已有指标名}；节点使用 label，不使用 title；无节点时为 []）、metric_usages（[{metric, role: outcome|driver|guardrail, note?}]，metric 必须存在）、method_refs（只能从给定方法库选，格式 <方法id>@<版本>；禁止发明方法 id）、method_bindings（[{method_ref, role, metric}]，role 必须是该方法的已声明角色，metric 必须存在）。",
  "   evidence_requirements、output_spec、review_rules 三个字段都必须是字符串，不能是数组或对象；多条要求写在同一个字符串中，无内容时为 \"\"。",
  "5. 禁止编造业务事实与数值结论：证据 status 一律「待获取」，verified 一律 false，judgment 一律「待验证假设」。",
  "6. 定性战略设计允许 added_metrics 为空数组；不为填满指标表编造量化定义。",
  "7. 你的输出将由人审核与业务复核，未复核不可交付。"
].join("\n");

function methodsDigest(methods: MethodTemplate[]): string {
  return stringifyYaml(
    methods.map((m) => ({
      ref: `${m.method.id}@${m.method.version}`,
      name: m.method.name,
      contexts: m.contexts,
      family: m.family,
      roles: m.roles.map((r) => ({ id: r.id, name: r.name, required: r.required })),
      limits: m.limits
    }))
  );
}

// NL → 分析体系设计草稿（一句话起点；模板与方法库作为锚定上下文）
export function buildBlueprintGeneratePrompt(
  template: Template,
  methods: MethodTemplate[],
  describe: string
): Prompt {
  const system = [
    `你是资深分析体系设计师（Metric Factory 分析体系生成器，prompt ${BLUEPRINT_PROMPT_VERSION}）。`,
    "用户用一句话描述想弄清的问题或要做的选择。你产出一份可讨论的分析体系设计草稿：",
    "把业务目的、研究问题、问题结构、关键假设、证据计划、候选道路（如涉及选择）、建议指标与建议分析场景连成同一份设计。",
    "事实、解释、假设和建议分别表达；不确定的事实保留为待确认，不编造。",
    "",
    BLUEPRINT_OUTPUT_CONTRACT
  ].join("\n");

  const user = [
    "# 行业基模板（指标风格基准；建议指标不要重复其中已有的）",
    stringifyYaml({
      dimensions: template.dimensions,
      metrics: template.metrics.map((m) => ({ name: m.name, display_name: m.display_name }))
    }),
    "",
    "# 可用维度清单（added_metrics 的 dimensions 只能从中选取）",
    template.dimensions.join("、"),
    "",
    "# 方法模板库（method_refs 只能从中选取）",
    methodsDigest(methods),
    "",
    "# 用户的需求描述",
    describe,
    "",
    "# 输出",
    "单个 JSON 对象：{blueprint, added_metrics, added_scenarios}"
  ].join("\n");

  return { system, user };
}

// NL 修正指令 → 修订后的完整 blueprint（全量替换语义）+ 可选增量指标/场景
export function buildBlueprintRefinePrompt(
  template: Template,
  instance: Instance,
  methods: MethodTemplate[],
  instruction: string
): Prompt {
  const system = [
    `你是资深分析体系设计师（Metric Factory 分析体系修正器，prompt ${BLUEPRINT_PROMPT_VERSION}）。`,
    "根据用户的修正指令，输出修订后的完整分析体系草稿（blueprint 为全量替换），以及可选的增量指标与场景。",
    "未提及的部分保持不变；不确定的宁可不改。",
    "",
    BLUEPRINT_OUTPUT_CONTRACT
  ].join("\n");

  const bp = instance.blueprint;
  const user = [
    "# 当前分析体系（修订对象）",
    bp
      ? stringifyYaml({
          title: bp.title,
          intent: bp.intent,
          purpose: bp.purpose,
          decision: bp.decision,
          boundary: bp.boundary,
          deliverable: bp.deliverable,
          contexts: bp.contexts,
          organizations: bp.organizations,
          questions: bp.questions,
          hypotheses: bp.hypotheses,
          evidence_plan: bp.evidence_plan,
          options: bp.options
        })
      : "（当前无分析体系，按指令新建草稿）",
    "",
    "# 既有指标（metric_refs / metric_usages / method_bindings 只能引用这些或 added_metrics 新指标）",
    stringifyYaml(template.metrics.map((m) => m.name).concat(instance.added.map((m) => m.name))),
    "",
    "# 可用维度清单",
    template.dimensions.join("、"),
    "",
    "# 方法模板库（method_refs 只能从中选取）",
    methodsDigest(methods),
    "",
    "# 修正指令",
    instruction,
    "",
    "# 输出",
    "单个 JSON 对象：{blueprint, added_metrics, added_scenarios}"
  ].join("\n");

  return { system, user };
}
