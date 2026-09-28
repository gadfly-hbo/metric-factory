import { stringify as stringifyYaml } from "yaml";
import type { Template } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";

export const PROMPT_VERSION = "v2.0.0";

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
    "   added：数组，元素结构同指标定义（name/display_name/type/definition/dimensions/time_grains/owner_role），只补真正缺失的指标。",
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
