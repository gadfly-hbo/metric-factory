# Metric Factory v2 · PRD（LLM 设计器）

> 规格源：`.flow/proposal.md` + `.flow/red-team.md`（2026-09-29，go）
> 发布：无 issue tracker，按降级路径落盘 `.flow/prd.md`。

## Problem Statement

MVP 交付了「模板 + 向导 + 导出」闭环，但企业的个性化指标仍只能手工编辑 YAML patch；「LLM 出初稿、人当守门员」的设计器缺失——这是产品对 Kyligence Zen（平台附属）与开源草根集群（只有提示词没有引擎）的核心差异化。同时 agent 生态（Claude 等）无法一等公民地调用设计能力，存量指标字典也无工具化审计。

## Solution

v2 四件套 + 模板扩产：

1. **generate**：自然语言业务描述 → 匹配内核选基模板 → LLM 在模板锚定下生成候选指标草案 → `apply` 合入实例（LLM 新增强制 provenance.origin=llm + review.required=true）→ `review` 人审（批准写 reviewed_by / 拒绝移除）→ fail-closed 拦截未审导出
2. **refine**：对已有实例的自然语言微调指令 → LLM 产出 patch 草案（caliber/modified/removed/added）→ 同样走 apply + review
3. **audit**：对实例跑口径完整性、虚荣指标、归口缺失、孤儿指标四类规则，输出分类问题清单
4. **MCP server**：stdio 协议暴露 generate / audit / refine 三个主工具 + validate / diff / export 辅助工具
5. **模板库 2 → 6**：内容社区 App、数字营销、供应链物流、云成本四个新行业模板（各 ≥40 指标），配 CONTRIBUTING 模板评审清单

## User Stories

1. 作为数据团队负责人，我想用一段自然语言描述我的业务（「我们是跨境电商平台，主打低价秒杀」），让工具在行业模板锚定下生成个性化候选指标，这样不用从模板 50 个指标里手工挑改。
2. 作为数据团队负责人，我想在生成后看到结构化 diff（新增了什么、为什么），这样我能判断 AI 建议的质量。
3. 作为数据团队负责人，我想逐条批准或拒绝 LLM 生成的指标，且批准动作被记录（审核人），这样口径可信性有据可查。
4. 作为数据团队负责人，我想让未审核的 LLM 指标在任何导出格式下都被硬阻断，这样错误口径不会流出。
5. 作为数据团队负责人，我想对既有实例下自然语言微调指令（「把 GMV 的退款口径改为包含退款中」），得到 patch 草案而不是直接改文件，这样 AI 不会未经我确认就动口径。
6. 作为数据团队负责人，我想审计我的指标字典（口径完整性 / 虚荣指标 / 无归口 / 孤儿指标），这样存量问题有清单可治。
7. 作为 CI 维护者，我想用非交互方式批准/拒绝审核项（--approve / --reject），这样审核流可以进 CI 与 agent 场景。
8. 作为 agent 用户（Claude / MCP 客户端），我想通过 MCP 协议调用设计、审计、微调与导出能力，这样零 CLI 知识也能用上引擎。
9. 作为开源贡献者，我想按 CONTRIBUTING 清单提交行业模板 PR 并过 lint 门，这样模板库可持续扩产。
10. 作为新行业（内容社区/营销/供应链/云成本）从业者，我想直接 fork 深度模板微调，这样起点不是白纸。
11. 作为无 API key 的试用者，我想用 --dry-run 看到 generate 会发送的完整 prompt，这样能评估 prompt 质量与 token 成本再决定接 provider。
12. 作为运维者，我想通过环境变量配置 provider（base URL / key / 模型名），这样不改代码切换 OpenAI 兼容 / Anthropic / 内部网关。

## Implementation Decisions

- **模型访问层（对齐 JuanerAI agent 底座参考方案）**：统一走 pi-ai（`@earendil-works/pi-ai@0.87.x`，公共 npm 已核验），OpenAI 兼容 / Anthropic / 自定义网关由 pi-ai 供应商目录承载（环境变量配置 base URL / key / 模型名）；**全部 pi 依赖收敛到单一适配模块 `src/llm/`**，业务代码禁止直接 import pi 包（上游 pre-1.0 breaking change 只打一个文件）；测试用 pi-ai faux provider，零网络。版本钉死 0.87.x，升级走专项。无 key 时 generate/refine 明确报错并提示 --dry-run。
- **模式定位（参考方案 §2.3）**：v2 全部 LLM 调用为**工人模式**——单次结构化调用，模型不握方向盘：输出经 Zod 校验，不合格整批拒绝并报 provider 原文（fail-closed，不做静默修复）；草案-应用-审核三步模型即参考方案的「写确认门」形态。不引入 runAgentLoop（拴绳主导留给未来交互式设计会话，按参考方案阶段 2 路径）。
- **RAG 层次（红队 #2 决议）**：不做嵌入检索。检索 = MVP 匹配内核按描述选 1 个基模板；上下文 = 该模板全量 YAML + 实例已审核 added 段 + 业务描述。实现首日实测 token，单模板 >50k 才升级检索。
- **Prompt 契约**：系统角色（指标体系设计师）+ 输出必须是符合指标 JSON Schema 的数组 + few-shot 由基模板自身充当（模板即 few-shot）；输出经 Zod 校验，不合格候选整批拒绝并报 provider 原文（fail-closed，不做静默修复）。
- **草案-应用-审核三步模型**：generate/refine 产出 `draft.yaml`（含 added/modified/removed/caliber 与 origin=llm provenance），`apply <instance> <draft>` 合入实例文件；LLM 新增指标强制 review.required=true；modified/removed 属 fork patch 直接应用（diff 可见、可回退）。
- **review 命令**：交互逐条 approve/reject（@inquirer）+ `--approve <name>` / `--reject <name>` 非交互；批准写 `provenance.reviewed_by`（取 `--reviewer` 或 `MF_REVIEWER` 或系统用户名）。
- **audit 规则集**：①口径缺失（definition/维度/时间粒度任一为空）②无归口（owner_role 缺）③虚荣指标启发式（纯计数类命名黑名单：点击量/曝光量/下载量/注册量 等且无对照比率指标）④孤儿指标（不在任何 tree、非北极星候选、非任何 type_params 引用）。输出分级（ERROR/WARN）+ `--json`。
- **MCP server**：`metric-factory mcp` 子命令，@modelcontextprotocol/sdk stdio transport；工具：mf_generate / mf_audit / mf_refine / mf_validate / mf_diff / mf_export。
- **模板扩产顺序**：内容社区 App（复用 AARRR 离电商最近）→ 数字营销 → 供应链物流 → 云成本；每个 ≥40 指标、过 lint + 质量测试；CONTRIBUTING.md 落评审清单。
- **冒烟脚本**：`scripts/llm-smoke.sh` 真实 provider 各跑一次 generate，输出与耗时留档（发布门槛，不进 CI）。

## Testing Decisions

- 主接缝不变：CLI 进程边界（generate --dry-run 产物、apply 合入后实例 diff、review 批准后 fail-closed 放行、audit 分类输出、mcp 以 SDK in-process client 握手并列工具）。
- 纯函数低层：prompt 构造（含 token 估算）、audit 规则（独立字面量期望）、draft 合并逻辑。
- pi-ai faux provider 全程注入，测试零网络依赖；真实 provider 只在冒烟脚本触碰（参考方案 §5.3 的回放夹具模式在 v2 单调用场景暂不引入，faux 足够）。
- 新模板照抄 MVP 模板质量测试（≥40、口径完整、引用一致）。

## Out of Scope

- Web UI（v3）
- 数仓反推 / 字段映射 / 埋点 schema（v3）
- 嵌入式 RAG、生成质量调优（运行时迭代，靠采纳率数据驱动）
- 真实 LLM 输出质量验证（发布门槛，非开发期可验证）
- LLM 采纳率 ≥60% 与外部 PR ≥3 的达成（运行时生态指标）

## Further Notes

- 红队最优先行动项映射：#2 token 实测 → RAG 决议已内化（全量注入 + 阈值）；#1 真实冒烟 → llm-smoke.sh 作为发布门槛；#4 模板盲评 → 每模板完成后人工盲评（流程外动作）。
- apply 的 modified/removed 直接应用依据：fork patch 本身可 diff、可回退，且 review 门语义是「AI 新增口径」而非「人确认过的修改」；如实践发现风险，v3 再收紧。

---

## GRILL 自拷问决议（2026-09-29，按推荐自答）

> 约束：proposal.md（含 pi 底座参考方案约束）不重开；以下仅覆盖其留白处。

1. **pi-ai 接入形态（包导出实测，0.87.1）**
   问：新版 API（createModels/provider 工厂）与 compat 层（旧全局 `complete()`，已标 deprecated）选哪个？
   答：适配模块自定义 `LlmClient` 接口（`complete({system, user}): Promise<string>`），`src/llm/pi-client.ts` 是**全仓唯一 import pi 包的文件**；实现走 compat 层 `complete()`（最薄、含 env key 注入），pi 升级 / compat 删除时只改这一个文件。测试双轨：引擎级测试注入自定 fake client（快、确定性）；适配器级测试用 `registerFauxProvider` 验证 pi 接线（零网络）。模型解析：`MF_LLM_MODEL` + provider 各自 env（OPENAI_API_KEY 等）。

2. **generate 的作用对象**
   问：自然语言描述怎么进匹配内核？
   答：generate 作用于**已有实例**（init 产物），锚定其实例的 base 模板；自然语言描述只驱动生成。PRD 中「匹配内核选基模板」修正为「init 阶段已完成匹配」——从零用户的流程是 `init --answers` → `generate --describe`。理由：结构化问卷匹配已验证确定性，避免为省一步 init 而让 LLM 承担模板选择。

3. **draft.yaml schema**
   答：`{ generator: { model, prompt_version, describe, created_at }, added: Metric[], modified: ModifiedMetric[], removed: string[], caliber: 实例口径覆盖 }`，Zod `DraftSchema` 落 `src/schema/draft.ts`；apply 校验后合入。

4. **prompt 版本管理**
   答：`src/llm/prompt.ts` 内嵌 `PROMPT_VERSION`（自 "v2.0.0" 起），prompt 模板与版本号同文件、随 git 演进；写入 draft.generator 与指标 provenance.prompt_version。

5. **apply 合并语义（fail-closed 到 apply 层）**
   答：apply 构造新实例 → 跑 validateInstance → **全过才写盘**，任何错误零改动；added 与实例现有指标同名冲突报错；caliber 覆盖深合并（指标级覆盖）。

6. **MCP 技术与进程形态**
   答：`@modelcontextprotocol/sdk@1.30.x`，stdio transport，`metric-factory mcp` 子命令；工具实现进程内直接调引擎函数（不起 CLI 子进程）；**MCP 工具一律返回草案 JSON 不写盘**——agent 场景的「人审」由 agent 会话把草案呈现给用户，落盘仍走 CLI apply/review。

7. **虚荣指标黑名单初始集**
   答：代码常量起步：点击量、曝光量、下载量、注册量、粉丝数、访问量、页面浏览量、打开量、转发量、点赞数；命中黑名单且实例内无同名对照比率指标 → WARN「虚荣指标风险」。

8. **模板扩产数量弹性**
   答：目标 +4（总数 6），验收下限 +3（总数 5，满足 proposal「5–6」区间下限）；顺序内容社区 → 数字营销 → 供应链物流 → 云成本。预算吃紧时砍尾部不砍深度。

9. **npm 发布不在本 flow**
   答：SHIP 只做 commit → push → 双机同步；npm publish（含查名）是用户手动决策的独立动作。

10. **refine 与 generate 的边界**
    答：同一管线的两个入口——generate 只产 added（新指标），refine 产 caliber/modified/removed（改存量）+ added；两者都出 draft.yaml、都走 apply + review。MCP 的 mf_refine 即 refine 的进程内版。

## v2 REVIEW 第 1 轮决议（2026-09-29）

- 已修复：MCP dist 模板目录 BLOCKER（共享 src/paths.ts + dist 形态 stdio 回归测试）、S2 注释措辞、S3 payload 负向用例、S4 approve 待审校验、S5 mf_export 补 validateInstance 同门。
- 记录：S1 audit no-owner/orphan 实例层结构性不可达（结论落 tasks.md）。
- **边界声明**：draft.yaml 是可编辑文件，其 provenance 以文件自述为准——手改 origin=manual 绕过 review 门与手改实例 YAML 属同一信任边界（本地文件信任域）；工具产物路径（generate/refine/MCP）的组装层强制注入 llm provenance 不变。
