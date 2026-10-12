# v5 决策场景区块 · UI 契约（UI-GATE 冻结件）

> 状态：**冻结候选**（待用户验收）。规格源仅限：`.flow/proposal.md`、`.flow/prd.md`（含 GRILL 决议）、`src/ui/server.ts`、`src/ui/render.ts`、`test/ui/instance-open.test.ts`。本契约在实现批次动生产代码前冻结用户可见界面与交互；与 PRD 冲突处以 GRILL 决议（2026-10-09）为最高优先。
>
> 配套可点击原型：`.flow/ui/index.html`（本契约 1:1 落样）。

## 0. 范围与位置（钉死）

- 场景区块是**实例页（GET /instance）现有卡片流中的新卡片**，不新增导航项、不新增独立工作台页面入口。
- 实例页区块顺序钉死（自上而下）：
  1. 实例概览卡（既有）
  2. 相对模板的变更（fork diff，既有）
  3. 指标树 · 杜邦式分解（既有）
  4. 微调实例 patch 表单（既有）
  5. **决策场景（新增，页面最后一块）**
- 排布理由：场景的 question_tree/metric_usages 引用**物化后的指标**，属指标层之上的分析层；置于指标树与指标微调之后符合「先看指标、再配场景」的自底向上阅读序，且不打断既有指标编辑动线。
- 表单页（新建/编辑）是独立 GET 页面（复用问卷向导 `/init/*` 的独立页模式），不出现在实例页内。
- 无实例打开时实例页维持既有 empty 态，场景区块不渲染（行为不变）。

## 0.1 路由（钉死）

| 路由 | 方法 | 作用 | 成功 | 失败 |
|---|---|---|---|---|
| `/instance` | GET | 实例页含场景区块（S1 列表态 / S2 空态） | 200 | — |
| `/instance/scenarios/new` | GET | 新建场景表单（S3） | 200 | — |
| `/instance/scenarios/:id/edit` | GET | 编辑场景表单（S4，`:id` = 场景 id） | 200 / 404（id 不存在→empty 卡） | — |
| `/instance/scenarios` | POST | 新建提交 | 303 → `/instance` | 422 重渲染 S3′（值保留 + 错误列表） |
| `/instance/scenarios/:id` | POST | 编辑提交（id 以路径为准） | 303 → `/instance` | 422 重渲染 S4′（值保留 + 错误列表） |

- 422 重渲染**不使用** `formErrorPage` 的 `javascript:history.back()` 返回链接（该链接依赖 JS）；改用问卷向导 `/init/create`、草案 `/drafts/generate` 已有的「同页重渲染 + 值保留」模式——错误列表样式仍逐条沿用 `formErrorPage` 的 `[rule] path: message` `ul.error-list` 风格。这是零脚本底线（US7）的必然要求，非新组件形态。
- 提交后端管线与 patch 表单同构：DSL 解析 → 合入实例 `added_scenarios`（同 id 覆盖，fork 语义）→ schema → materialize → 引擎 validate 全过 → 写盘；任一步失败 422 零写盘。UI 不做任何客户端预校验。

## 1. Surfaces（场景卡片全部状态）

### S1 列表态（实例页场景区块，≥1 个场景）

- 区块标题：view-title `决策场景 · 分析体系`（H2 级），下附说明行（见 §4 T-01）。
- 一张 `card`（内边距归零、横向可滚动的 `.tbl` 表格，与 fork diff 表同构）+ 右上「新建场景」主按钮。表头五列：

| 列 | 内容 | 样式 |
|---|---|---|
| 场景 | `title`（加粗行）+ 换行 `id` | id 用 `.mono` |
| 决策用途 | `decision_purpose` 全文（v0.1 不截断，摘要=全文） | 正文 |
| 指标角色 | `N 个`（`.num`）+ 括注 `outcome x · driver y · guardrail z` | 计数来自 metric_usages |
| 来源 | chip：`模板种子`（chip-ok）/ `实例新增`（chip-accent）/ `实例覆盖种子`（chip-accent） | 色 BELOW 文字，双通道 |
| 操作 | `编辑` 按钮（`.btn`，GET 链接到 edit 页） | — |

- 来源三态推导：materialize = 模板种子 ∪ 实例 added（同 id 覆盖）——GRILL Q3。未改动 = 模板种子；实例新建 = 实例新增；编辑过种子后保存 = 实例覆盖种子。
- `version` 不在列表行展示（ScenarioSpec v0.1 由服务端固定 `0.1.0`，非用户输入）。

### S2 空态（0 个场景）

- 同位置 view-title + 既有 `.empty` 虚线框：主文案「暂无决策场景」+ 一句价值说明（T-02）+ `新建场景` 主按钮（GET → new 页）。
- 5 个无种子模板的新实例、以及用户删光 added（CLI 侧）时呈现此态——「其余 5 模板空场景合法」（GRILL Q2）。

### S3 新建表单态（独立页 `/instance/scenarios/new`）

- 页面：导航仍激活「我的实例」；page-title `决策场景 · 新建`；page-desc T-03。
- 单个 `<form method="post" action="/instance/scenarios">`，三张 `card` 分组（组内 `.fld` 字段，字段清单与文案见 §3/§4）：
  1. **基本信息**：场景 id（text）、标题（text）、决策用途（textarea）
  2. **问题树与指标角色**：问题树 DSL（textarea）、指标角色 DSL（textarea）——两域均为 mono 字体、`wrap="off"`
  3. **方法与治理**：方法引用（textarea 逐行）、证据要求（textarea）、输出（textarea）、复盘规则（textarea）
- 卡顶辅助行（text-3 小字）：`ScenarioSpec v0.1 · version 0.1.0 由服务端固定`。
- 动作行：`校验并写回场景`（btn-primary，submit）+ `取消`（btn，GET 链接回 `/instance`）。

### S4 编辑表单态（独立页 `/instance/scenarios/:id/edit`）

- 与 S3 同构，差异仅四处：
  1. page-title `决策场景 · 编辑`；page-desc T-04（含「保存后以实例版本生效，覆盖模板种子」的 fork 语义提示；仅当编辑对象来源=模板种子时显示该句）。
  2. 表单 action=`/instance/scenarios/:id`。
  3. **id 只读**：呈现为 mono 文本 + `hidden input`（不提交可见控件）。id 创建后不可改（added 段以 id 为键，v5 无 removed 段，改 id 不可表达——推导自 Implementation Decisions「数据接入」+ proposal 显式不做）。
  4. 全字段预填当前值：question_tree/metric_usages 按行回填 DSL 原文（`id|label|parent|metric` / `metric|role|note`）。
- 编辑对象不存在 → 404 empty 卡「场景不存在」+ 返回实例按钮（复用既有 404 empty 模式）。

### S5 保存成功（回列表）

- 303 → `/instance`，无 flash 消息（与 patch 写回一致——列表中新/改行即确认）。
- 用户可感知变化：列表行出现/更新；编辑种子后该行来源 chip 变 `实例覆盖种子`。
- 原型中以「保存成功回列表」状态呈现：列表较 S1 多出新建的 `takeoff_diagnosis` 行。

### S6 校验失败 422（含 DSL 逐行错误回显）

- 422 重渲染 S3/S4 同页：page-desc 换为 T-05（「全量校验未通过（零写盘）——修正下列问题后重试」）。
- 表单顶部（第一张卡上方）插入错误卡：`card` + `card-h`（fail 色）`校验失败` + `ul.error-list` 逐条 `[rule] 位置: 消息`（样式与 formErrorPage 完全一致）。
- 错误文法钉死：
  - 四规则名直取 PRD 校验规则：`scenario-purpose` / `scenario-id` / `scenario-tree-ref` / `scenario-metric-ref`（**不新造规则名**）。
  - DSL 行级错误归属：question_tree 行格式/引用错误 → `scenario-tree-ref`；metric_usages 行格式/role 枚举/引用错误 → `scenario-metric-ref`；行号以「第 N 行」嵌入消息（N = textarea 内 1 起算物理行号，`wrap="off"` 保证视觉行=物理行）。
  - 成环等跨行错误无行号，给出链路：`[scenario-tree-ref] question_tree: 检测到环 a → b → a（禁止循环与自指）`。
  - 其余 schema 层错误（如 title 空）按既有 InstanceSchema 回显格式 `path: message`（无规则名前缀）。
- 错误条目文案样例（逐字钉死，见 §4 E-00…E-08）。
- 表单全部字段**保留用户提交值**（坏 DSL 原文仍在 textarea 中，行号可对照）；错误列表 `role="alert"`；两个 DSL textarea `aria-describedby` 指向错误列表。
- 单行坏 DSL 只产生错误条目，不阻断其余行/字段回显，页面结构完整不崩（Negative N4）。

## 2. Click paths

| # | 路径 | 步骤 |
|---|---|---|
| P1 浏览 | 实例页 → 场景区块 | 打开 `/instance` 即见 S1/S2；每行「编辑」→ S4 |
| P2 新建 | S1/S2 「新建场景」→ S3 → 填写 → `校验并写回场景` →（全过）303 → S5 | 取消 → 回 `/instance` |
| P3 编辑 | S1 行内「编辑」→ S4（预填）→ 修改 → `校验并写回场景` → 303 → S5 | 取消 → 回 `/instance` |
| P4 保存成功 | POST 全过 → 303 `/instance` → 列表出现/更新该行（S5） | — |
| P5 校验失败 422 | POST 任一环节失败 → 422 同页重渲染（S6）：错误列表置顶 + 值保留 → 修正后重新提交 | — |
| P6 空场景 | 无场景实例打开 `/instance` → S2 → 「新建场景」→ S3 | — |
| P7 DSL 逐行错误 | S3/S6：textarea 第 N 行写坏（格式/坏引用/坏 role）→ 提交 → S6 错误条目含「第 N 行」与具体槽位 → 用户对照 textarea 修正 | — |

- 全部跳转为原生 GET 链接或 form POST + 303；无任何客户端脚本参与业务行为（原型文件内的 JS 仅为演示状态切换，见 §7）。

## 3. Affordances

### 3.1 控件清单（字段序 = DOM 序 = Tab 焦点序，钉死）

| 序 | 字段 | 控件 | 必填 | 备注 |
|---|---|---|---|---|
| 1 | 场景 id | `input[type=text]`（S3）/ mono 文本 + hidden（S4） | 是 | snake_case；服务端校验实例内唯一（GRILL Q2：DSL 不生成 id，由表单显式给出） |
| 2 | 标题 title | `input[type=text]` | 是 | 非空 |
| 3 | 决策用途 decision_purpose | `textarea` | 是 | 非空——ABS AT02 门（Negative N3） |
| 4 | 问题树 question_tree | `textarea` mono + `wrap="off"` | 否 | 逐行 DSL `id|label|parent|metric`（GRILL Q1 冻结） |
| 5 | 指标角色 metric_usages | `textarea` mono + `wrap="off"` | 否 | 逐行 DSL `metric|role|note`（GRILL Q1 冻结） |
| 6 | 方法引用 method_refs | `textarea` mono | 否 | 逐行一个自由串 |
| 7 | 证据要求 evidence_requirements | `textarea` | 否 | 文本段 |
| 8 | 输出 output_spec | `textarea` | 否 | 文本段 |
| 9 | 复盘规则 review_rules | `textarea` | 否 | 文本段 |
| 10 | 校验并写回场景 | `button[type=submit].btn-primary` | — | — |
| 11 | 取消 | `a.btn` → GET `/instance` | — | — |

- label 与控件以 `for`/`id` 显式关联（既有 `.fld` 仅前后排布，此处为可访问性增量，不改变视觉）。
- DSL 两域在 label 下方附**常显示例行**（text-3 小字，非 placeholder——placeholder 输入即消失，不能承担格式说明职责；既有 sap-export-note 同款）。

### 3.2 可访问性（色 + 文字双通道，钉死）

- 所有 chip（来源、角色计数）都自带文字，颜色仅辅助；错误态不依赖红色单独表意（每条错误含规则名 + 位置 + 行号文字）。
- 必填以文字「非空」标注于 label（T-06…T-08），不用颜色/星号单通道。
- 既有 `:focus-visible` 橘色外廓保留；Tab 序 = §3.1 字段序（DOM 序即焦点序，无 tabindex 干预）。
- 错误列表 `role="alert"`；DSL textarea `aria-describedby` → 错误列表 id；`wrap="off"` 使行号可对照。
- 表格（列表）使用真 `<table>`（既有 .tbl），th/td 语义天然成立。

## 4. Terminology（用户可见串逐字钉死）

主术语（PRD 直取）：**决策场景、决策用途、问题树、指标角色、方法引用、证据要求、输出、复盘规则**；角色枚举用户可见值保留英文 `outcome | driver | guardrail`（spec 冻结值，与 DSL 一致，不造中文译名）。

| # | 位置 | 文案（逐字） |
|---|---|---|
| T-01 | S1 view-title 下说明行 | `把「这个业务问题应该怎样分析」固化为配置：决策用途、问题树、指标角色、方法引用。场景随实例写盘并进入 SAP 语义包；写回前经全量校验，失败零写盘。` |
| T-02 | S2 empty 主文案 | 主：`暂无决策场景`；说明：`决策场景回答「怎样分析这个问题」：先写清决策用途，再拆问题树、挂指标角色。`；按钮：`新建场景` |
| T-03 | S3 page-desc | `新建决策场景并写回实例（写回前经全量校验，失败零写盘）。` |
| T-04 | S4 page-desc | `编辑决策场景（写回前经全量校验，失败零写盘）。` + （来源=模板种子时紧跟同段追加）`保存后此场景以实例版本生效（覆盖模板种子）。`（两句连排为同一段，如原型 S4 所示） |
| T-05 | S6 page-desc | `全量校验未通过（零写盘）——修正下列问题后重试。`；错误卡标题：`校验失败` |
| T-06 | 字段 1 label | `场景 id（snake_case，实例内唯一，创建后不可修改）` |
| T-07 | 字段 2 label | `标题 title（非空）` |
| T-08 | 字段 3 label | `决策用途 decision_purpose（非空——无决策用途不可保存）` |
| T-09 | 字段 4 label | `问题树 question_tree（逐行 id|label|parent|metric，空槽留空；parent 留空即根节点）` |
| T-10 | 字段 4 示例行 | `例：root|GMV 差距诊断|　·　traffic|流量端|root|uv　（节点id|节点label|父节点id|指标名）` |
| T-11 | 字段 5 label | `指标角色 metric_usages（逐行 指标名|role|note，role 须为 outcome | driver | guardrail，note 可留空）` |
| T-12 | 字段 5 示例行 | `例：gmv|outcome|月度缺口归因　·　uv|driver|流量端抓手　·　refund_rate|guardrail|防以退款换增长` |
| T-13 | 字段 6 label | `方法引用 method_refs（逐行一个自由串，可空，如 dame.m2.driver_decomposition@1.0.0）` |
| T-14 | 字段 7 label | `证据要求 evidence_requirements（文本段，可空）` |
| T-15 | 字段 8 label | `输出 output_spec（文本段，可空）` |
| T-16 | 字段 9 label | `复盘规则 review_rules（文本段，可空）` |
| T-17 | 提交按钮 | `校验并写回场景`；取消按钮：`取消` |
| T-18 | S1 表头/按钮 | 表头：`场景 / 决策用途 / 指标角色 / 来源 / 操作`；新建按钮：`新建场景`；行内：`编辑` |
| T-19 | 卡顶辅助行 | `ScenarioSpec v0.1 · version 0.1.0 由服务端固定` |

**DSL 语法以 GRILL Q1（2026-10-09）冻结版为准**：question_tree 逐行 `id|label|parent|metric`（4 槽竖线分隔，空槽留空）、metric_usages 逐行 `metric|role|note`（note 可空）。PRD「Implementation Decisions · UI」段内早稿记法 `节点label < 父id : 指标名` / `指标名 : 角色 : 备注` **已被 GRILL Q1 取代**，UI 全部文案、示例、错误提示一律用竖线版——实现批次不得混用。

错误条目文案（E-00…E-08，逐字；`«…»` 为运行时值）：

| # | 触发 | 文案 |
|---|---|---|
| E-00 | usages 行格式坏（槽数∉{2,3} 或空 metric） | `[scenario-metric-ref] metric_usages 第 «N» 行: 格式须为 metric|role|note（note 可留空）`（REVIEW#2 补录，与 dsl.ts 实现串逐字） |
| E-01 | decision_purpose 空 | `[scenario-purpose] scenarios[«id»].decision_purpose: 决策用途不能为空（无决策用途不可保存）` |
| E-02 | 场景 id 重复 | `[scenario-id] scenarios: 场景 id "«id»" 已存在（实例内唯一；编辑已有场景请从列表「编辑」进入）` |
| E-03 | tree 行格式坏 | `[scenario-tree-ref] question_tree 第 «N» 行: 格式须为 id|label|parent|metric（4 槽竖线分隔，空槽留空）` |
| E-04 | parent 引用不存在 | `[scenario-tree-ref] question_tree 第 «N» 行: parent "«parent»" 不存在（须引用同场景内已定义的节点 id）` |
| E-05 | 成环/自指 | `[scenario-tree-ref] question_tree: 检测到环 «a» → «b» → «a»（禁止循环与自指）` |
| E-06 | 节点 id 场景内重复 | `[scenario-tree-ref] question_tree 第 «N» 行: 节点 id "«id»" 在本场景内重复` |
| E-07 | 指标引用不存在 | `[scenario-metric-ref] «question_tree 第 «N» 行 / metric_usages 第 «N» 行»: metric "«metric»" 不是物化指标（可用指标见指标树与指标字典）` |
| E-08 | role 非枚举值 | `[scenario-metric-ref] metric_usages 第 «N» 行: role "«role»" 无效（须为 outcome | driver | guardrail）` |

## 5. Negative cases

| # | 场景 | 契约行为 |
|---|---|---|
| N1 | 禁用 JavaScript | 全部状态可达可用：浏览/新建/编辑均为原生 GET 链接 + form POST；422 页不依赖 `history.back()`（值保留重渲染，见 §0.1）。生产代码零 `<script>`（与既有工作台一致） |
| N2 | 保存失败零写盘 | 422 页明示「零写盘」（T-05）；实例文件不被修改——与 patch 表单同管线同承诺（US8） |
| N3 | 无 decision_purpose 不可保存 | 提交 → 422，E-01 置顶错误列表；字段值保留 |
| N4 | 坏 DSL 行逐行报错、不整页崩 | 每一坏行各产生一条 E-03/E-04/E-06/E-07/E-08（含行号），合法行不报错；页面完整重渲染（S6），无白屏/半渲染 |
| N5 | 场景 id 重复拒绝 | 新建撞已有 id（含模板种子 id）→ 422，E-02；零写盘 |
| N6 | 引用不存在指标/父节点/成环 | E-07 / E-04 / E-05；树悬空、环均拦截（US3） |
| N7 | 编辑不存在的场景 | GET edit 404 empty 卡「场景不存在」（复用既有 404 模式），不渲染空表单 |
| N8 | 无实例打开 | 实例页既有 empty 态，场景区块不渲染（行为不变） |

## 6. Trace links（状态 ↔ 规格映射）

| 状态/决策 | PRD 用户故事 | PRD 决议/GRILL | proposal |
|---|---|---|---|
| S1 列表态（行=title+用途+指标数；来源 chip） | US7 | Implementation Decisions「UI」段（GRILL Q3 冻结版）；GRILL Q3（∪ 覆盖语义） | 范围 5 |
| S2 空态 | US7 | GRILL Q2（其余 5 模板空场景合法） | 范围 5 |
| S3 新建表单态 | US7 | Implementation Decisions「UI」段；GRILL Q1（DSL 竖线版）、Q2（表单含 id 字段） | 范围 5 |
| S4 编辑态（id 只读、预填、覆盖种子提示） | US7 | GRILL Q2、Q3；Implementation Decisions「数据接入」（同 id 实例覆盖） | 范围 5 |
| S5 保存成功回列表 | US7 | Implementation Decisions「UI」段（提交走引擎 validate 全过写回） | 范围 5 |
| S6 422 逐行错误态 | US8 | Implementation Decisions「UI」段（错误逐行回显）；GRILL Q1（服务端解析、逐行回显）；校验规则四条名（Implementation Decisions「校验规则」） | 不变量（写回前全量校验失败零写盘） |
| N1 零脚本 | US7（禁 JS 可用） | Implementation Decisions「UI」段（零客户端脚本） | 不变量（UI 不引入客户端脚本依赖） |
| N3/E-01 | US3 | 校验规则 `scenario-purpose`（ABS AT02 门） | 范围 1 |
| N5/E-02 | US3 | 校验规则 `scenario-id`；GRILL Q2 | 范围 3 |
| N4/N6/E-03…E-08 | US3、US8 | 校验规则 `scenario-tree-ref`/`scenario-metric-ref`；GRILL Q1 | 范围 3 |
| 指标角色枚举展示 | US2 | ScenarioSpec v0.1（role: outcome \| driver \| guardrail） | 范围 1 |
| SAP 提示文案（T-01） | US5 | Implementation Decisions「SAP」 | 范围 4 |
| 场景无删除入口 | — | proposal「显式不做」（removed/modified 段 v5 不做）——范围确认，非缺口 | 显式不做 |

## 7. 工件声明

| 工件 | 路径 | 说明 |
|---|---|---|
| UI 契约 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui-contract.md` | 本文件 |
| 可点击原型 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/index.html` | 静态单页，内联 CSS/JS、零外部依赖、双击可开（logo 用仓库内相对路径 `../../assets/juanerai-logo-slogan.png`） |

原型约定：

- CSS **逐字取自** `src/ui/render.ts` 顶部 CSS 块（2026-09-28 亮橘契约 #e8643a 系 tokens），场景区块不引入新组件形态，仅复用既有类（card/view-title/tbl/chip/btn/fld/empty/error-list/mono/num）；文件末尾另有明确标注的「演示专用」样式块（状态切换器，紫色 queue 系）。
- 原型内 JS **仅用于切换六个冻结状态的演示**（含 `aria-pressed` 切换与文档标题更新），不代表生产行为；生产实现零 `<script>`（N1）。
- 演示数据为虚构的电商实例（`shop-demo/instance.yaml`，基模板 ecommerce-marketplace@0.1.0）：指标名/展示名取自 `templates/ecommerce-marketplace.yaml` 真实字典（gmv 成交总额、uv 访客数、cvr 下单转化率、aov 客单价、marketing_roi 营销投放 ROI、subsidy_rate 补贴率、refund_rate 退款率、sell_through_rate 动销率、out_of_stock_rate 缺货率、paid_user_count 付费用户数）；种子场景 `gmv_gap_diagnosis`（GMV 差距诊断）对应 GRILL Q2 试点内容方向，实例新增 `promo_roi_review`（大促 ROI 复盘）与新建演示 `takeoff_diagnosis`（新品爬坡诊断）为虚构演示值。
- 原型覆盖状态：S1 列表 / S2 空 / S3 新建 / S4 编辑 / S5 保存成功回列表 / S6 422（E-01、E-02、E-03（第 4 行）、E-04（第 3 行）、E-07（第 1 行）、E-08（第 2 行）各一条，值保留）。

## 8. BLOCKED / 开放项（不扩范围，交实现批次裁决）

| # | 事项 | 状态 |
|---|---|---|
| **B1（已定案 2026-10-09，REVIEW#1 后）**：树行槽形严格版——非 {3,4} 槽即 E-03（根节点尾部空槽可省一节），多竖线不吞并；usages 对称 {2,3}（note 尾槽可省）。裁决落点 src/ui/dsl.ts + 专测「多竖线不吞并」；原开放项关闭
| B2 | decision_purpose 长度上限/摘要截断：spec 未定义，v0.1 展示全文 | 无需裁决（记录在案） |
| B3 | 场景删除：v5 无 removed 段 → UI 不提供删除（范围确认，非缺口） | 关闭 |

—— 契约正文完 ——
