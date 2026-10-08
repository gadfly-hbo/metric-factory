# Metric Factory · 产品方案

**分析体系工作台 —— 从业务问题到可复用、可运行的分析配置与指标字典**

| | |
|---|---|
| 版本 | v0.2（修订） |
| 日期 | 2026-10-08 |
| 状态 | 已批准修订（用户批准 2026-10-08） |
| 依据 | 2026-09 市场调研（v0.1，继续有效）+ JA-ABS-PRD-001《分析体系工作台方案 v1.0》+ 2026-10-08 产品定位裁决 |
| v0.1 基线 | 2026-09-28 草案已 pin（commit `5d67334`）；调研结论与核心理念不推翻，本版扩展定位与范围 |

---

## 1. 定位

**一句话**：Metric Factory 是「分析体系工作台」（JA-ABS-PRD-001 的产品实现，英文参考名 Analysis Blueprint Studio）——**分析体系设计 + 指标体系建设**的「设计态」工具。用户在这里明确业务目标、拆问题树、设计指标、选择分析方法、绑定数据，并评审发布可复用配置；它回答「这个业务问题应该怎样分析、衡量」。产出对齐 dbt MetricFlow / Cube 的指标定义与语义资产包，直接接入现有语义层生态，并作为 JuanerAI 平台插件被其运行时消费。

**与相关工具/组件的分工（2026-10-08 裁决，正式蓝图命名同步后置）**：

| 角色 | 是什么 | 负责 | 不负责 |
|---|---|---|---|
| **Metric Factory** | 面向业务的工作台 | 分析配置与指标契约：问题树、指标、方法选择、数据绑定、评审发布可复用配置 | 本体权威维护（引用不拥有）；底层语义组件选型 |
| **Protégé** | 专业本体建模辅助工具 | 专家维护客户、订单、商品等概念、关系与逻辑约束；本体有明确维护与发布归属（Owner） | 指标定义、分析流程、工作台产品 |
| **Semantica** | 背后的工程组件候选 | 组织、检索概念与知识关系，为工作台或 JuanerAI 语义运行时提供支持 | 工作台产品流程；不自动定义正确指标 |

三方共享概念 ID 和版本，但不默认 OWL 导入与推理已经互通。示例（提升会员复购）：在 Metric Factory 中设计问题树、复购指标与验证方法；指标引用本体中「会员」「订单」「有效购买」等已确认概念（复杂本体可借助 Protégé 建模检查）；发布后 JuanerAI 的 Semantic Context Runtime 解析适用定义、指标与数据绑定，交给 Analysis Core / IR 组织执行，Semantica 可参与语义检索与组织。

**与 JuanerAI 的接入方式**：以 `docs/juanerai-semantic-asset-contract-v0.1.md`（语义资产交换契约，v0.1 草案待 readiness review）为准——单向只读快照、引用不拥有本体、fail-closed 不变量过界保持。Metric Factory 保持独立开源（Apache-2.0，模板库即生态位），不并入任何平台代码体系。

**明确不做（非目标）**：

- 不做 BI / 看板 / 问数——消费端已卷成红海
- 不做指标存储与查询服务——MetricFlow / Cube / SuperSonic 已解决
- 不做口径治理与指标平台——Kyligence / Aloudata / Dataphin 的领地
- 不做本体权威维护——概念/关系/逻辑约束的建模与发布归 Protégé 工作流与 Ontology Owner，本工具只引用已确认概念（共享 ID@version）
- 只做一件事：**把「业务问题 → 分析配置（问题树+方法+证据标准）+ 指标字典」这个环节工具化**，输出即标准格式

## 2. 问题与机会

### 2.1 现状：设计环节没有任何工具

企业建指标体系的真实路径是：请顾问开工作坊 / 抄同行的图 / 数据团队闭门开会，产出物是 Miro 画布、PPT 和 Excel。全链路三个环节的工具供给：

| 环节 | 工具供给 | 状态 |
|---|---|---|
| 设计（目标→指标树） | Kyligence Zen 行业模板库（唯一商业产品化）；神策指标体系查询平台（免费参考库）；方法论（OSM / AARRR / 北极星 / OneData）+ 顾问 | **空白** |
| 定义与口径管理 | dbt MetricFlow + Semantic Layer、Cube、Looker LookML；国内 Kyligence、Aloudata CAN、Dataphin、数势 SwiftMetrics、网易 EasyMetrics | 成熟 |
| 消费 | 各家 BI + ChatBI / AI 问数 | 成熟且内卷 |

v0.2 补注：该空白对「指标体系」成立，对更广义的「分析体系」（问题树、方法配置、证据标准）同样成立——JA-ABS-PRD-001 已将其正式化，本工具范围随之扩展（见 §5 v4–v6）。

### 2.2 调研结论（2026-09，商业 + 开源双重核查）

**商业侧**：

- 设计态没有通用工具。Kyligence Zen 的行业模板库（供应链 / 物流 / 零售电商 / 数字营销 / App / 云成本）是唯一产品化的「行业模板 + 微调」流程，但它是指标平台的 onboarding 附属品，不是独立设计工具
- 唯一验证过的 AI 辅助设计功能是 ClearPoint Strategy 的「Suggest some KPIs」，停留在记分卡层面
- AI 浪潮全部落在消费侧（ChatBI / 问数 agent），生成侧无人做

**开源侧**（`gh` CLI 全量检索，2026-09-28）：

- 设计态只存在一个草根集群，最高 29★，清一色 Claude / AI 形态：
  - [ThePowerOfAnalytics_ClaudeSkills](https://github.com/florianbonnet14/ThePowerOfAnalytics_ClaudeSkills)（29★）：10 个 Claude Skills（北极星 / KPI 树 / 分析规划…），方法论来自作者 2025-06 出版的书；提示词包，无模板库、无引擎
  - [ai-analyst-lab/north-star](https://github.com/ai-analyst-lab/north-star)（8★）：Claude Code 北极星教练，审计候选指标 → 拆输入指标树，结论逐条引用 Amplitude Playbook；只覆盖产品分析一个域
  - [PolycultureResearch/breakdown](https://github.com/PolycultureResearch/breakdown)（6★）：工程实质最强——YAML 定义指标树 → 因果 DAG，确定性公式用 Shapley 归因、概率关系用贝叶斯时序（BSTS）学习，打通 dbt MetricFlow，带 MCP server；但做的是「定义后的归因分析」，不是「从业务目标生成」
  - [kpi-tree.com](https://kpi-tree.com/)（日本在线工具）：点几下画 KPI 树图，纯画图，无字典无模板
- **没有任何项目有行业模板库**。「指标体系」在中文 GitHub 只出现在数仓教程的章节标题里，中文设计态开源为零
- 定义态开源非常成熟：Cube 20.9k★、SuperSonic（腾讯音乐）5.1k★、MetricFlow 1.8k★、Rill 2.9k★、Alibaba UnifiedModel 409★

**行业趋势**：dbt 与 Fivetran 2026-06 合并，主打「为可信 AI agent 提供数据基础设施」；Cube 重新定位 agentic analytics——语义层整体向「给 AI 供口径」收敛。**上游的指标生成反而成了无人区，而它恰是这一切的源头。**

### 2.3 机会判断

1. **双重空白**：设计态在商业侧只有半成品（Kyligence Zen 附属品），开源侧连半成品都没有
2. **LLM 让设计首次可程序化**：过去设计质量取决于顾问的业务抽象能力，无法软件化；LLM + 模板 RAG 把「方法论 → 结构化生成」变成工程问题。开源草根集群（全部 2025–2026 出现）验证了方向，但全部卡在同一处：只有语法，没有行业模板库
3. **生态接口现成**：MetricFlow / Cube 的 schema 是稳定契约，设计态工具可以站在巨人肩膀上只补缺的那一块

## 3. 核心理念

### 3.1 通用的不是指标清单，是语法

「在通用指标体系上微调」是正确直觉，正确的工程化是三层：

| 层 | 内容 | 载体 |
|---|---|---|
| **L1 语法层** | 指标元模型（度量 + 维度 + 时间周期 + 口径）+ 分析配置语法（决策场景、问题树、方法引用、证据标准） | 引擎内置，代码 |
| **L2 模板层** | 行业指标树实例 + 指标字典 + 维度清单 + 分析方案模板 + 埋点建议 | YAML，git 管理，版本化 |
| **L3 实例层** | 企业微调产物：增删改指标、口径校准、方案适配、映射真实字段 | L2 的 fork + diff |

指标清单从第二层就按商业模式分叉（订阅 / 交易 / 双边 / 广告），所以 L2 模板按「行业 × 商业模式」双向组织，而非单一行业维度。L1 的分析配置语法随 v5 批次落地（§5）。

### 3.2 口径是硬知识，可信性是产品本体

口径错误的指标比没有指标更糟——这是语义层赛道存在的理由（Airbnb Minerva / metrics layer 的起源），也是本产品最大的风险点。设计原则：

- **每个指标必须有出处（provenance）**：模板引用 / LLM 生成（模型 + prompt 版本 + 审核人）/ 人工
- **fail-closed 审核门**：`provenance.origin == "llm"` 且未经人工审核的指标**不可导出**——不是提示，是阻断
- 参照火山引擎 DataLeap 已验证的模式：「AI 映射语义 → 人工 Review」——AI 当高速初稿机，人当守门员

### 3.3 Git-native，agent 原生

- 模板库 = git 仓库（YAML），天然支持 fork、PR、版本、评审——模板的演进历史本身是产品价值
- 引擎以 CLI + 库交付，MCP 接口一等公民（供 Claude 等 agent 调用）——开源侧被验证的形态就是 agent skill，顺着来
- Web UI 是壳不是核，后置

## 4. 产品架构

### 4.1 内容模型与核心 Schema

指标元模型对齐两个已验证标准：阿里 OneData 的「原子指标 + 修饰词 + 派生指标」语法（中文世界的行业语言）与 dbt MetricFlow 的 metric type（机器契约）。

模板示例 `templates/ecommerce.yaml`：

```yaml
template:
  id: ecommerce-marketplace
  industry: 电商
  business_models: [交易平台, 品牌 DTC]
  version: 0.1.0
  references:
    - "OneData 指标建模方法"
    - "AARRR / 北极星框架"

north_star:
  candidates:
    - metric: gmv
      rationale: 交易规模，同时带动供需双边
  decision_guide: 交易平台优先 GMV；品牌 DTC 优先复购收入

trees:
  - id: revenue
    formula: "gmv = uv * cvr * aov"
    children: [uv, cvr, aov]
  - id: retention
    category: 质量
    children: [buy_repeat_rate, retention_30d]

metrics:
  - name: gmv
    display_name: 成交总额
    type: derived            # simple | ratio | derived | cumulative
    definition: 支付成功订单的金额合计
    dimensions: [channel, category, region, user_tier]
    time_grains: [day, week, month]
    owner_role: 电商业务负责人
    caliber_switches:        # 口径开关：微调向导直接改这里
      include_refund: false
      include_shipping: false
    provenance:
      origin: template
      template_ref: ecommerce-marketplace@0.1.0
    review:
      required: false        # 模板指标随模板整体评审
```

企业实例（微调产物）= 模板 fork + diff patch，永远可以回答「我们改了什么、为什么」。

v0.2 补注：分析配置对象（决策场景 ScenarioSpec、问题树、方法引用、证据标准，见 JA-ABS-PRD-001 §6–8）在 v5 批次进入同一 L1/L2/L3 体系，与指标元模型并列而非另起炉灶。

### 4.2 微调机制：三条路径按期叠加

**P1 规则向导（MVP，零幻觉）**

问卷 → 模板匹配 → 增删改。问卷维度：

- 收入模式：交易抽佣 / 订阅 / 广告 / 服务费 / 混合
- 用户结构：2C / 2B / 双边市场
- 核心循环：交易 / 内容消费 / 创作消费 / 协作
- 供给约束、渠道结构…

答案映射到 L2 模板的选择与口径开关（`caliber_switches`），产出实例树。

**P2 LLM 生成器（v2，人审门内运行）**

自然语言描述业务 → 生成候选指标树 → 结构化 diff 展示 → 人工审核。工程要点：

- **模板 RAG**：生成锚定在 L2 模板与已审核实例上，自由生成仅限「模板没有的新指标」
- **出处强制**：每个生成指标落盘必须带 `provenance.origin=llm` + 模型 + prompt 版本，无出处无法写入
- **fail-closed**：未审核指标在导出、git commit（hook）两个层面被阻断

**P3 数仓反推（v3）**

连接数仓（dbt manifest / information schema）→ 发现已有表和字段 → 推荐「指标 → 模型字段」映射（同样走 AI 推荐 + 人工 Review 门）。这一步解决落地断层，顺带产出「模板指标 vs 企业现状」的差距清单。

### 4.3 输出与集成

| 输出 | 用途 |
|---|---|
| dbt MetricFlow YAML | 直接进 dbt Semantic Layer |
| Cube data model | Cube 生态 |
| Excel 指标字典（含出处列） | 治理评审、传统组织 |
| Mermaid / SVG 指标树 | 汇报与对齐 |
| 埋点 / 事件建议清单 | 与 P3 的字段映射闭环 |
| 语义资产包（SAP 0.1） | 作为 JuanerAI 平台插件的交换格式（契约 v0.1，见 `docs/juanerai-semantic-asset-contract-v0.1.md`） |

导出器是插件式契约，跟随上游 schema 演进（注意 dbt Fusion v2 引擎迁移）。

## 5. 分期路线

### MVP —— 证明「模板 + 向导 + 导出」闭环有价值（✅ 已交付，commit `0ad90aa`）

- 指标元模型 + 模板 schema 定稿
- 引擎：模板加载 / 校验 / 实例化 / 导出（MetricFlow + Excel + Mermaid）
- 模板库：**2 个行业深度优先**（电商交易平台 + SaaS 订阅）
- CLI 向导（问卷式）
- CI：模板 lint（口径必填、维度引用完整、出处存在）

### v2 —— LLM 设计器（✅ 已交付，commit `1e6eda3`）

- LLM 生成器 + provenance 全链路 + fail-closed 审核门
- MCP server（agent 可调用「设计 / 审计 / 微调」能力）
- 模板库扩到 6 行业，接受社区 PR
- 指标审计命令

### v3 —— 落地闭环（✅ 已交付，commit `c62d218`…`3ba9835`）

- 数仓反推与字段映射（map 命令族，dbt manifest + catalog 双输入）
- 埋点建议与事件 schema 生成（track 命令）
- Web 工作台（本地 UI：问卷向导 / 实例微调 / 审核中心 / 导出下载）

### v4 —— 指标契约升级 + 本体概念引用（规划）

- Metric schema 对齐指标契约 L1：汇总规则（可加/不可加维度、比例重算）、统计对象引用、口径类型
- `concept_refs` 落地：指标以 id@version 引用已确认本体概念（共享 ID/版本，不默认 OWL 互通）
- 语义资产包（SAP 0.1）按契约 v0.1 导出；PRODUCT_PLAN / README 同步

### v5 —— 分析体系编辑器（规划）

- 决策场景卡、问题树、方法引用、证据标准、输出与复盘规则（JA-ABS-PRD-001 F03）落地，进入 L1/L2/L3 体系
- `scenarios` 进入语义资产包；模板升级为 Domain Pack 候选格式
- 评审发布：设计型/运行型双状态、版本清单、按场景增量发布（治理语义对齐 JA-ABS-PRD-001 §10）

### v6 —— JuanerAI 接缝对接（规划，依赖消费方真实实现）

- 按语义资产契约对接 JuanerAI A-02/N04；`executable` 状态语义与导入触发方式随消费方实现修订
- Metric Factory 保持独立开源与 git-native，不并入平台代码体系

验收纪律（各期通用）：不以文件存在当完成，以被真实任务消费为完成；每个切片独立可验收，超 2 个实现切片仍不能验收即砍退回（沿用 v3 范围纪律）。

## 6. 关键难点与对策

| # | 难点 | 对策 |
|---|---|---|
| 1 | **经济模型**：设计是低频高判断活动，纯设计工具难以独立收费 | 开源核心（Apache-2.0）+ 模板库内容化，先赢开源生态位（该位置现在完全空着）再谈商业化；JuanerAI 插件接入是另一条价值回路，不替代开源定位 |
| 2 | **口径准确性**：LLM 会生成听起来对但口径错的指标 | 3.2 节全套：模板兜底 + 出处强制 + fail-closed 审核门；v4 指标契约 L1（汇总规则）把防线上移到 schema 层 |
| 3 | **模板深度是壁垒**：代码量不大，行业颗粒度决定价值 | 深度优先不铺广度；模板 = git 上的结构化资产，接受社区 PR 但需评审；「LLM 出初稿 + 领域专家审校」流水线扩产 |
| 4 | **落地断层**：从漂亮的指标树到真实数据字段的映射是最大流失点 | P3 数仓反推；导出物直接是 dbt / Cube 可用 schema；语义资产包对接平台运行时 |
| 5 | **上游契约漂移**：dbt Fusion v2、Cube schema 演进 | 导出器插件化 + 契约测试（导出物在目标引擎解析通过率 100%） |
| 6 | **三方语义一致性**（v0.2 新增）：工作台、本体工具、语义组件共享概念 ID/版本 | 契约平面引用（`concept_refs`）+ 消费方发布门确认；不假设 OWL 导入与推理互通；概念权威归属 Ontology Owner 不动摇 |

## 7. 成功指标

**MVP 验收（✅ 已达成）**：

- 一个电商业务从跑向导到导出 dbt Semantic Layer 可解析的 MetricFlow YAML，全程 ≤ 30 分钟
- 导出 YAML 在 dbt SL 解析通过率 100%（契约测试）
- 模板指标覆盖：核心指标树 ≥ 40 指标 / 行业，每条含完整口径与出处

**v2 验证（✅ 已达成）**：

- LLM 生成指标经人工审核的采纳率 ≥ 60%（运行时指标，发布后观测）
- 「未审核指标导出被阻断」有测试覆盖（fail-closed 不是口头承诺）
- 收到外部模板 PR ≥ 3 个（运行时指标）

**产品北极星**：每周「被导出并被目标引擎解析成功」的指标实例数——只数走通全链路的，不数生成了的。

**v4–v6 追加（规划）**：语义资产包被消费方成功导入并过发布门的包数；分析配置（场景）真实复用率（对齐 JA-ABS-PRD-001 §18 度量口径）。验收用例以 JA-ABS-PRD-001 §17 AT 系列与语义资产契约自检表为输入，逐批次冻结。

## 8. 风险与开放问题

1. **模板口径的法律边界**：参考公开方法论（书 / playbook / OneData 文档）时标注出处，不直接搬运付费内容
2. **中英双语**：schema 原生双语字段；内容先中文后英文，引擎契约走英文标准
3. **单人维护模板库的可行性**：深度优先；「LLM 出初稿 + 专家审校」扩产
4. **与 Kyligence Zen 的差异化**：git-native 开放标准 + agent 原生，正面战场在开源生态
5. **相邻需求**：指标审计以 v2 命令形式承接，不扩产品边界
6. **范围膨胀（v0.2 新增）**：工作台双范围（分析体系 + 指标体系）有重叠工具化风险——坚持 §5 切片纪律，场景编辑器按 JA-ABS-PRD-001 F03 一个功能组一个切片；与本体工具的边界以 §1 分工表为准，不越界复制 Ontology 权威

## 附录 A · 调研来源（2026-09）

**商业产品**：Kyligence Zen / Copilot / DeepInsight（kyligence.io）；Aloudata CAN；阿里 Dataphin（OneData「规范定义」：数据域 → 业务过程 → 维度 → 原子指标 → 派生指标）；数势 SwiftMetrics（与信通院合著指标体系图书，设计靠咨询交付）；火山引擎 DataLeap（口径 = 硬知识，AI 映射 + 人工 Review）；神策指标体系查询平台（免费）；ClearPoint Strategy（唯一验证的 AI 辅助设计功能）；dbt + Fivetran 合并（2026-06-01）。

**开源（`gh` 检索 2026-09-28）**：定义态——cube-js/cube 20.9k★、tencentmusic/supersonic 5.1k★、rilldata/rill 2.9k★、dbt-labs/metricflow 1.8k★、alibaba/UnifiedModel 409★；设计态——ThePowerOfAnalytics_ClaudeSkills 29★、ai-analyst-lab/north-star 8★、PolycultureResearch/breakdown 6★、peno022/kpi-tree-generator（kpi-tree.com）4★、rainbowroy/metric-tree-architect 1★。

**方法论**：OSM / UJM、AARRR、北极星指标（Amplitude Playbook）、KPI 树、OneData 指标建模。

**v0.2 新增依据**：JA-ABS-PRD-001《JuanerAI 分析体系工作台_正式产品方案 v1.0》（2026-09-29，有效，作为本产品范围与验收的产品方案基线）；`docs/juanerai-semantic-asset-contract-v0.1.md`（语义资产交换契约 v0.1-draft.2，待 readiness review）。
