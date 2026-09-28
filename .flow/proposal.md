# Metric Factory · 产品方案

**指标体系设计工具 —— 从业务目标到可落地的指标字典**

| | |
|---|---|
| 版本 | v0.1（草案） |
| 日期 | 2026-09-28 |
| 状态 | 待评审 |
| 依据 | 2026-09 市场调研（商业产品 + GitHub 开源全量检索）+ 需求讨论 |

---

## 1. 定位

**一句话**：Metric Factory 是指标体系的「设计态」工具——用「通用语法引擎 + 行业模板库 + 企业微调」三层模型，把指标体系设计从顾问工作坊变成可自助完成的结构化流程，产出对齐 dbt MetricFlow / Cube 的指标定义，直接接入现有语义层生态。

**明确不做（非目标）**：

- 不做 BI / 看板 / 问数——消费端已卷成红海
- 不做指标存储与查询服务——MetricFlow / Cube / SuperSonic 已解决
- 不做口径治理与指标平台——Kyligence / Aloudata / Dataphin 的领地
- 只做一件事：**把「业务目标 → 指标树 + 指标字典」这个环节工具化**，输出即标准格式

## 2. 问题与机会

### 2.1 现状：设计环节没有任何工具

企业建指标体系的真实路径是：请顾问开工作坊 / 抄同行的图 / 数据团队闭门开会，产出物是 Miro 画布、PPT 和 Excel。全链路三个环节的工具供给：

| 环节 | 工具供给 | 状态 |
|---|---|---|
| 设计（目标→指标树） | Kyligence Zen 行业模板库（唯一商业产品化）；神策指标体系查询平台（免费参考库）；方法论（OSM / AARRR / 北极星 / OneData）+ 顾问 | **空白** |
| 定义与口径管理 | dbt MetricFlow + Semantic Layer、Cube、Looker LookML；国内 Kyligence、Aloudata CAN、Dataphin、数势 SwiftMetrics、网易 EasyMetrics | 成熟 |
| 消费 | 各家 BI + ChatBI / AI 问数 | 成熟且内卷 |

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
| **L1 语法层** | 树形拓扑（北极星 → 规模 / 质量 / 结构 / 效率 → 用户旅程过程指标）+ 指标元模型（度量 + 维度 + 时间周期 + 口径） | 引擎内置，代码 |
| **L2 模板层** | 行业指标树实例 + 指标字典 + 维度清单 + 埋点建议 | YAML，git 管理，版本化 |
| **L3 实例层** | 企业微调产物：增删改指标、口径校准、映射真实字段 | L2 的 fork + diff |

指标清单从第二层就按商业模式分叉（订阅 / 交易 / 双边 / 广告），所以 L2 模板按「行业 × 商业模式」双向组织，而非单一行业维度。

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

导出器是插件式契约，跟随上游 schema 演进（注意 dbt Fusion v2 引擎迁移）。

## 5. 分期路线

### MVP —— 证明「模板 + 向导 + 导出」闭环有价值

- 指标元模型 + 模板 schema 定稿
- 引擎：模板加载 / 校验 / 实例化 / 导出（MetricFlow + Excel + Mermaid）
- 模板库：**2 个行业深度优先**（建议 电商交易平台 + SaaS 订阅，覆盖两种最异构的商业模式）
- CLI 向导（问卷式）
- CI：模板 lint（口径必填、维度引用完整、出处存在）

### v2 —— LLM 设计器

- LLM 生成器 + provenance 全链路 + fail-closed 审核门
- MCP server（agent 可调用「设计 / 审计 / 微调」能力）
- 模板库扩到 5–6 行业，接受社区 PR（建立模板评审流程）
- 指标审计命令：对存量指标字典跑「口径完整性 / 虚荣指标」检查（吸收 north-star 的 audit 思路）

### v3 —— 落地闭环

- 数仓反推与字段映射（dbt manifest 优先）
- 埋点建议与事件 schema 生成
- Web UI（模板浏览 / 树编辑器 / 审核流）

## 6. 关键难点与对策

| # | 难点 | 对策 |
|---|---|---|
| 1 | **经济模型**：设计是低频高判断活动，企业认真做一次后只小修；纯设计工具难以独立收费 | 开源核心（Apache-2.0）+ 模板库内容化（方法论 / 课程 / 咨询引流），不押注 SaaS 订阅；先赢开源生态位（该位置现在完全空着）再谈商业化 |
| 2 | **口径准确性**：LLM 会生成听起来对但口径错的指标 | 3.2 节全套：模板兜底 + 出处强制 + fail-closed 审核门；模板本身经专家审校并标注方法论出处 |
| 3 | **模板深度是壁垒**：代码量不大，行业颗粒度决定价值 | MVP 深度优先不铺广度；模板 = git 上的结构化资产，接受社区 PR 但需评审；用「LLM 出初稿 + 领域专家审校」流水线扩产 |
| 4 | **落地断层**：从漂亮的指标树到真实数据字段的映射是最大流失点 | P3 数仓反推；导出物直接是 dbt / Cube 可用 schema，而非又一份文档 |
| 5 | **上游契约漂移**：dbt Fusion v2、Cube schema 演进 | 导出器插件化 + 契约测试（导出物在目标引擎解析通过率 100%） |

## 7. 成功指标

**MVP 验收（可执行检查）**：

- 一个电商业务从跑向导到导出 dbt Semantic Layer 可解析的 MetricFlow YAML，全程 ≤ 30 分钟
- 导出 YAML 在 dbt SL 解析通过率 100%（契约测试）
- 模板指标覆盖：核心指标树 ≥ 40 指标 / 行业，每条含完整口径与出处

**v2 验证**：

- LLM 生成指标经人工审核的采纳率 ≥ 60%
- 「未审核指标导出被阻断」有测试覆盖（fail-closed 不是口头承诺）
- 收到外部模板 PR ≥ 3 个（模板库有生态迹象）

**产品北极星**：每周「被导出并被目标引擎解析成功」的指标实例数——只数走通全链路的，不数生成了的。

## 8. 风险与开放问题

1. **模板口径的法律边界**：参考公开方法论（书 / playbook / OneData 文档）时标注出处，不直接搬运付费内容
2. **中英双语**：schema 原生双语字段；内容先中文（空白最大）还是先英文（生态在 dbt）？——建议先中文后英文，引擎契约走英文标准
3. **单人维护模板库的可行性**：MVP 只做 2 个深度模板，先证明价值再谈广度
4. **与 Kyligence Zen 的差异化**：它是「平台附属 onboarding」，本产品是「git-native 开放标准 + agent 原生」——正面战场在开源生态而非企业销售
5. **相邻需求**：指标审计（north-star 已验证）以 v2 命令形式低成本承接，不扩产品边界

## 附录 A · 调研来源（2026-09）

**商业产品**：Kyligence Zen / Copilot / DeepInsight（kyligence.io）；Aloudata CAN；阿里 Dataphin（OneData「规范定义」：数据域 → 业务过程 → 维度 → 原子指标 → 派生指标）；数势 SwiftMetrics（与信通院合著指标体系图书，设计靠咨询交付）；火山引擎 DataLeap（口径 = 硬知识，AI 映射 + 人工 Review）；神策指标体系查询平台（免费）；ClearPoint Strategy（唯一验证的 AI 辅助设计功能）；dbt + Fivetran 合并（2026-06-01）。

**开源（`gh` 检索 2026-09-28）**：定义态——cube-js/cube 20.9k★、tencentmusic/supersonic 5.1k★、rilldata/rill 2.9k★、dbt-labs/metricflow 1.8k★、alibaba/UnifiedModel 409★；设计态——ThePowerOfAnalytics_ClaudeSkills 29★、ai-analyst-lab/north-star 8★、PolycultureResearch/breakdown 6★、peno022/kpi-tree-generator（kpi-tree.com）4★、rainbowroy/metric-tree-architect 1★。

**方法论**：OSM / UJM、AARRR、北极星指标（Amplitude Playbook）、KPI 树、OneData 指标建模。
