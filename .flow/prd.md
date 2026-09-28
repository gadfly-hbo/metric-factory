# Metric Factory MVP · PRD

> 规格源：`.flow/proposal.md`（PRODUCT_PLAN.md v0.1）+ `.flow/red-team.md`（2026-09-28，判定 go）
> 发布：本仓库未配置 issue tracker，按降级路径落盘 `.flow/prd.md`。

## Problem Statement

中文环境下，企业要从业务目标推导指标体系（北极星 + 指标树 + 指标字典）时没有任何工具：请顾问开工作坊贵且慢；抄同行图、用 Miro + PPT + Excel 拼凑则口径不清、无法系统化。产出物与下游定义态工具（dbt MetricFlow / Cube）之间存在手工转录断层——设计成果落不了地。

## Solution

Metric Factory MVP：一条「问卷 → 行业模板匹配 → 口径微调 → 校验 → 导出」的 CLI 流水线。

- 内置 2 个深度行业模板：电商交易平台（`ecommerce-marketplace`）、SaaS 订阅（`saas-subscription`），每个 ≥40 个含完整口径与出处的指标
- 问卷按收入模式 / 用户结构 / 核心循环匹配模板并应用口径开关（`caliber_switches`，如 GMV 是否含退款/运费）
- 企业实例 = 模板 fork + diff patch 落盘，「改了什么、为什么」永远可追溯
- 导出：dbt MetricFlow YAML（进 dbt Semantic Layer）/ Excel 指标字典（含出处列）/ Mermaid 指标树
- 每个指标强制带出处（provenance）；`origin=llm` 且未经人工审核的指标在导出层被阻断（fail-closed）

## User Stories

1. 作为数据团队负责人，我想回答一份关于商业模式的问卷（收入模式 / 用户结构 / 核心循环 / 供给约束 / 渠道结构），得到一棵适配我业务的指标树初稿，这样我不需要从白纸开始设计。
2. 作为数据团队负责人，我想在问卷中声明口径偏好（如 GMV 是否含退款、是否含运费），让模板自动应用对应口径，这样导出的字典与我们的财务口径一致。
3. 作为数据团队负责人，我想导出 dbt MetricFlow YAML 并直接放入 dbt 项目进入 Semantic Layer，这样设计产物不需要人工转录。
4. 作为数据团队负责人，我想导出 Excel 指标字典（含出处列），用于治理评审和给业务方传阅。
5. 作为数据团队负责人，我想导出 Mermaid 指标树图，用于汇报与跨团队对齐。
6. 作为数据团队负责人，我想随时查看实例相对模板的差异（diff），这样微调历史可追溯、可解释。
7. 作为数据团队负责人，我想在导出前校验实例（口径完整、维度引用完整、出处存在），这样错误在本地被拦截而不是评审会上被发现。
8. 作为数据团队负责人，我想看到北极星候选指标与决策指引（交易平台优先 GMV / 品牌 DTC 优先复购收入），这样选型有依据。
9. 作为独立顾问，我想基于行业模板快速给客户产出第一版指标字典，把时间花在定制判断而不是排版制表。
10. 作为数据工程师，我想看到每个指标的类型（simple / ratio / derived / cumulative）、维度、时间粒度，这些字段与 MetricFlow 契约对齐，可以直接进语义层。
11. 作为业务负责人（审阅者），我想看到每个指标的中文展示名、业务定义与归口角色（owner_role），评审时不需要翻译技术字段。
12. 作为开源贡献者，我想 fork 模板并提 PR 增补行业模板，提交前能得到模板 lint 反馈（口径必填、维度引用完整、出处存在）。
13. 作为 CI 维护者，我想在 CI 里跑模板 lint 与实例校验，防止坏模板合入主干。
14. 作为 CI 维护者，我想用非交互方式（answers 文件）跑完整向导流程，用于测试与自动化演示。
15. 作为后续引入 LLM 生成的维护者，我想让「未人工审核的 LLM 指标在导出时被硬阻断」，这样口径可信性不依赖使用者自觉。
16. 作为 agent 调用方（Claude / 未来 MCP 客户端），我想通过 CLI 非交互完成 init → export 全流程，这样零 UI 也能接入。
17. 作为首次使用者，我想 `npx metric-factory init` 后 30 分钟内拿到 dbt SL 可解析的 MetricFlow YAML，这样第一次使用就能看到完整价值。

## Implementation Decisions

- **技术栈**：TypeScript（Node ≥ 20，ESM）；CLI 用 commander；YAML 用 `yaml` 包解析（保留注释与出错定位）；schema 用 Zod 定义与校验；Excel 用 exceljs；Mermaid 用零依赖模板字符串生成；测试 vitest；构建 tsup；许可证 Apache-2.0。
- **仓库结构（绿地单包起步）**：引擎库与 CLI 同包 `metric-factory` 发布；模板 YAML 内嵌包内 `templates/` 目录。模板库未来拆独立 git 仓库不为本期目标，但加载器以「模板目录」为输入参数，路径不阻断后续拆分。
- **指标元模型**：对齐阿里 OneData「原子指标 + 修饰词 + 派生指标」语义与 MetricFlow metric type（simple / ratio / derived / cumulative）。双语字段：英文 snake_case 命名为机器契约，中文 display_name / definition 为展示与内容层（内容先中文）。
- **模板 schema**（YAML）：`template` 元信息（id / industry / business_models / version / references）、`north_star`（候选 + decision_guide）、`trees`（id / formula / category / children）、`metrics`（name / display_name / type / definition / dimensions / time_grains / owner_role / caliber_switches / provenance / review）。
- **实例 = fork + diff**：实例文件记录 `base: <template_id>@<version>` + 增删改 patch + 口径开关取值；`diff` 命令输出实例与模板的结构化差异。
- **向导双模式**：交互式（@inquirer/prompts）与非交互（`--answers <file>`）同级支持；问卷答案映射到模板选择与 `caliber_switches` 取值，产出实例树。非交互模式是 CI、测试与 agent 场景的入口。
- **导出器插件契约**：`export(instance): ExportResult`，MVP 交付 metricflow / excel / mermaid 三个实现；契约设计为后续 Cube data model 导出器预留同一接口。
- **provenance 强制 + fail-closed**：schema 层无 provenance 的指标无法通过校验（写入即拒绝）；`origin=llm` 且未过审核的指标在导出层抛错阻断。MVP 无 LLM 生成路径，但阻断逻辑与测试在本期落地，为 v2 铺路。
- **CLI 命令面**：`init`（问卷向导，生成实例）、`validate`（实例校验）、`lint`（模板 lint，供模板 PR / CI）、`export`（`--format metricflow|excel|mermaid`）、`diff`（实例 vs 模板）。

## Testing Decisions

- **唯一高接缝 = CLI 进程边界**：以子进程跑 `init --answers` → `export`，断言产物文件的存在性与内容结构（YAML 可解析、指标条数、出处列存在）。引擎库仅对 schema 校验与 diff 纯逻辑补充低层单测。
- **契约测试**：导出的 MetricFlow YAML 用编码其 schema 的 JSON Schema 校验，断言通过率 100%；不在 CI 安装 dbt（重依赖），另附本地 `dbt parse` 冒烟脚本供手动验证（对应验收「dbt SL 解析通过率 100%」）。
- **模板质量测试**：断言每个内置模板 ≥40 指标、每条含 definition / dimensions / time_grains / provenance（对应 MVP 验收指标）。
- **fail-closed 测试**：构造 `origin=llm` 未审核实例，断言导出被拒并有明确报错。
- **先例**：绿地仓库，无既有测试可参照；以上即本仓库测试范式的起点。测试只断言外部行为（CLI 产物、校验结果），不断言内部实现细节。

## Out of Scope

- LLM 生成器、模板 RAG、MCP server、指标审计命令（v2）
- 数仓反推、字段映射、埋点 / 事件 schema 生成（v3）
- Web UI（模板浏览 / 树编辑器 / 审核流）
- Cube data model 导出器实现（契约预留，不做实现）
- 英文内容翻译（schema 双语字段就位即可，内容中文优先）
- 口径治理 / 指标平台 / BI 消费端（永久非目标，见 proposal.md 第 1 节）

## Further Notes

- 红队判定 go（`.flow/red-team.md`）；与开发并行的最优先验证行动：把电商模板做成静态成品给 3–5 名目标用户走查（零代码），直接检验 kill-assumption #1「模板本身有价值」。
- 「30 分钟」验收计时口径：从 `npx metric-factory init` 起，至导出 YAML 通过契约校验止。
- 目标用户画像（补红队缺口，proposal 未定义）：MVP 服务中文环境下需要从零或重构指标体系的中小企业 / 创业公司数据负责人，以及服务此类客户的独立数据顾问；早期分发押注开源 + agent 社区。

---

## GRILL 自拷问决议（2026-09-28，按推荐自答）

> 约束：proposal.md 已定决策不重开；以下仅覆盖其留白处。

1. **MetricFlow 导出物在无数仓时的形态**
   问：模板只有业务指标、没有物理模型，MetricFlow 的 metric 必须锚定 semantic model + measure，怎么导出合法结构？
   答：导出双段 YAML——`semantic_models`（占位：`ref_model` 指向约定的占位模型名，measures 由模板指标机械生成、标注「待映射」）+ `metrics`（完整业务定义）。契约测试校验两段引用一致性；真实 dbt 项目内 parse 属 P3 数仓映射解决，MVP 以本地冒烟脚本手动验证。理由：不让「没有数仓」阻断设计态价值交付，占位是显式契约而非隐藏假设。

2. **实例 patch 格式**
   问：实例 diff 用 JSON Patch 还是自定义格式？
   答：自定义结构化 YAML（`base` + `caliber_switches` 取值 + `added` / `removed` / `modified` 三段，modified 按字段列出旧新值）。理由：JSON Patch 对人不可读，违背「永远可以回答我们改了什么、为什么」的产品承诺；diff 命令基于同一结构渲染。

3. **问卷 → 模板匹配机制**
   问：匹配规则硬编码还是数据驱动？
   答：数据驱动——模板 YAML 自带 `matching` 段（声明适配的收入模式 / 用户结构 / 核心循环取值），向导按规则打分选择模板；答案文件本身有 Zod schema，`--answers` 非交互入口与交互式共用同一映射内核。理由：v2 扩到 5–6 行业时不改引擎代码。

4. **Excel 导出形态**
   答：多 sheet——① 指标字典（含出处列）② 口径开关取值 ③ 北极星候选与决策指引 ④ 实例 vs 模板变更清单。理由：对应治理评审、业务传阅、选型、追溯四个真实消费场景，单 sheet 会挤掉出处列的可读性。

5. **Mermaid 形态**
   答：`flowchart TD`，节点带中文 display_name + 公式标签，按 trees 结构与 category 分组着色。理由：mindmap 不支持公式与分组语义；汇报场景需要从北极星自上而下读。

6. **双语字段落地**
   答：schema 层 `display_name_en` / `definition_en` 为可选字段（Zod optional），MVP 模板内容可留空；英文 snake_case `name` 为机器主键。理由：契约就位、内容后补，与 proposal「先中文后英文」一致。

7. **npm 包名**
   答：开发期单包名 `metric-factory`；发布前查重，若被占用降级 `@metricfactory/cli`。MVP 验收不依赖 npm 发布（`npx` 验收以 `npm link` / 仓内执行为准）。理由：命名冲突不应阻塞引擎与模板开发。

8. **CI 落地**
   答：package.json scripts（`lint` / `test` / `typecheck` / `contract-test`）为事实源；GitHub Actions workflow 文件随仓库落盘但本期无 remote 不做在线验证。理由：本地可跑的验证门优先于不可验证的远端配置。

9. **仓库目录布局**
   答：`src/schema`（Zod 元模型）/ `src/engine`（loader / instantiate / lint / diff）/ `src/export`（三导出器）/ `src/cli`（commander 命令）/ `templates/`（行业模板）/ `examples/`（答案与实例样例）。理由：导出器与引擎分离以兑现插件契约；模板在包内但不进 src，保持「数据资产 vs 代码」边界。

---

## REVIEW 第 1 轮决议（2026-09-28）

**已修复（阻断项，见 .flow/review-findings.md）**：交互向导口径语义反转、export 前全量校验、init 口径目标写盘前拦截、mermaid 按 category 单一 subgraph、type_params 引用 lint 规则、契约 schema 补 metrics/window 编码、diff 仅列真实口径变化、恒真断言、cumulative 导出覆盖测试、prelint 钩子、冒烟脚本死代码与前置修正。

**记录不动的降级决策（非阻塞）**：模板中 43/101 个 ratio/derived 指标暂缺 type_params（分子/分母/公式引用），MetricFlow 导出对这部分指标降级为 simple 占位并在 description 标注原类型。补齐需要按指标补建分子分母计数指标（如 refunded_order_count 等），属于模板内容深化工作，排入 MVP 后续迭代；导出语义不误导（标注待补），验收标准「导出物 type 与模板声明一致达 100%」由后续迭代兑现。
