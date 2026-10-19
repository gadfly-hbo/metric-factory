# SAP 语义资产包消费指引（metric-factory → JuanerAI）

> 面向消费端（JuanerAI 侧）的安装与消费指引。供应侧事实源：契约 `docs/juanerai-semantic-asset-contract-v0.1.md`（**v0.4**：blueprint 段 + same-content 阻断，2026-10-18；v0.3 消费方基线勘误，2026-10-12；v0.2 修订冻结面零改动）+ `src/sap/release.ts`（发布登记实现）。本指引随契约版本滚动更新，属逻辑契约，非 API。

## 1. 模式与边界

- **文件交付**：metric-factory 导出 SAP 资产包，手动交付给 JuanerAI 安装消费（用户裁决 2026-10-12）；不做 API/MCP 接口打通，待使用成熟后再议。
- **单向只读**：包是不可变快照，消费方不得回写；修正以同谱系 id、版本递增的新包进行（契约 §2.1）。
- **发布 = 登记**：供应侧 `release` 是唯一产生登记的动作；`export --format sap` 恒为临时导出，不进登记。

## 2. 取得（resolve）

1. 发布物在供应侧 `releases/` 目录：
   ```
   releases/
     index.yaml                          # 登记簿（append-only 数组）
     <package-id>/<version>.sap.yaml     # 不可变快照
   ```
2. 消费方**按精确 `id@version` 取得**（index 条目的 `package` + `version` 字段），**禁止 latest 跟随**（契约 §4）。
3. `index.yaml` 条目字段：`package` / `version` / `content_fingerprint` / `package_fingerprint` / `created_at` / `released_by` / `note` / `file`。`file` 为相对 releases/ 基目录的快照路径。
4. 当前首个发布物：`net-sales-instance@1.0.0`（净销售样板，见 §6）。

## 3. 校验（validate_import）

对每个交付包独立校验，任一命中即**整体拒绝**（fail-closed，不做条目级剔除或降级放行）：

| # | 规则 | 说明 |
|---|---|---|
| 1 | 结构合法 | `sap: "0.1"` 字面；package 段齐全；scenarios/metrics/concept_refs/bindings/review 形状（`src/sap/validate.ts` SapPackageSchema） |
| 2 | 指纹一致 | 对整包规范化序列化重算 SHA-256 = `package.fingerprint`（自引用置空规则已实现于 `src/sap/canonical.ts`） |
| 3 | 无重复身份 | 指标按 `name`；concept_refs 按 `(id, version, role)`；场景按 `id@version` |
| 4 | runtime_state | 恒 `design_only`；其他值拒绝（契约 §3.6） |
| 5 | 未审 LLM 条目 | `origin=llm` 且无 `reviewed_by` 的指标 → 整批拒绝。**注意**：供应侧校验器 `src/sap/validate.ts` 有意不含此规则（正常路径被导出门拦截）；消费方移植该校验器时**必须补此规则**（纵深防御，针对手工构造包） |
| 6 | blueprint 段禁带 review（v0.4） | blueprint 出席时**不得**含 `review` 子段——复核确认是供应侧本地工作态，不随包携带；带 review 的包结构非法（供应侧导出器已剥除，此规则针对手工构造包） |
| 7 | blueprint→metrics 引用一致（v0.4） | `blueprint.questions[].metric_refs` 全部须在包内 metrics 可解析，悬空引用即拒 |

## 4. 字段消费语义（安装即生效，不是塞提示词）

消费端必须把下列字段解析进本次 Context / Binding / IR 并影响计算；把整份 YAML 放进提示词**不构成接入**：

- **`caliber_switches`（布尔开关）**：口径开关直接改变指标计算。例：`gmv.include_refund` 开/关决定成交总额是否剔除退款；`refund_amount.refund_to_payment_period` 决定退款归属支付期间还是退款期间。开关取值以**包内为准**（任务数据不得覆盖包口径）。
- **`type_params`**：公式契约。`expr`（如 `gmv - refund_amount`）中的 token 引用包内其他指标；`measure`/`numerator`/`denominator` 同理。
- **`aggregation`**：可加性契约。`allowed/disallowed_dimensions` 约束聚合范围；`ratio_policy: recompute_from_parts` 表示比率类指标必须由分子分母重算，不得对比率值直接聚合。
- **`caliber_type`**：口径族标签（如 `refund_adjustment`/`measurement_anchor`），提示该指标的口径敏感面，供消费端选择核验点。
- **`scenarios`**：**参考骨架，不是必须机械执行的固定路径**。`question_tree` 供主 Agent 理解「这个问题通常怎么拆」；`metric_usages` 的 `outcome/driver/guardrail` 角色供核验侧选择护栏指标；`evidence_requirements` 是证据要求声明。主 Agent 保留结合需求与数据动态调查的自由度。
- **`method_refs`**：纯引用标识（如 `dame.m2.driver_decomposition@1.0.0`），包内不含方法实现；消费方按自身方法库解析，解析不到不得臆造。
- **`concept_refs` / `statistic_object`**：本体概念平面引用（id@version+不透明 source），引用不拥有；未接本体时可整体忽略，不阻塞消费（契约 §3.3）。
- **`bindings`**：**设计态草案**（指标→模型.列映射建议，含置信度）。真实文件、字段、数据快照由消费端任务 Binding 承接；**不得把某次客户文件的映射当通用定义**。

**独立检查义务**：消费端须自行检查支持范围（如聚合函数种类）与包内引用完整性（scenarios→metrics、type_params→metrics、aggregation 两表 ⊆ dimensions）；供应侧已保证包内闭包，消费端不复核上游语境校验（如 aggregation 两表 ⊆ 模板 dimensions），但必须复核**自身可计算性**。

## 4.1 blueprint 段消费语义（v0.4 新增）

`blueprint`（AnalysisBlueprint v0.1）是**可选段**：指标体系包可无蓝图，蓝图包也可零指标。出席时消费语义如下——blueprint 是**设计语境**，不是执行能力、不是业务事实：

| 字段 | 消费语义 |
|---|---|
| `purpose` / `decision` / `boundary` / `deliverable` | 本包设计的业务目的、研究问题（或选择）、范围边界、承诺输出。消费端可用作任务语境与产出对照；**不代表供应侧承诺结论成立** |
| `contexts` | 适用语境（`经营改善`/`战略选择`/`独立数据专题`，可组合不分级）。消费端可按语境选择解释纪律（如战略选择类禁止从短期下滑直接判定方向失败） |
| `organizations` | 调查组织方式（`假设先行`/`深度研究`/`自主探索`），供消费端安排调查路径参考 |
| `questions[]` | 问题结构；`metric_refs` 是**只读引用**（指标定义的唯一权威来源是包内 metrics 段，问题不重复定义口径） |
| `hypotheses[]` | 关键假设。**判断性质与核验状态分轴**：`judgment`（事实/解释/待验证假设/建议）是性质声明，`verified` 是供应侧核验工作态——**所有假设交付时均为「待验证」语义；假设被写入包不等于已被证实** |
| `evidence_plan[]` | 证据**计划**（来源/核验办法/不足处置）。**计划完整 ≠ 证据已取得**——交付时全部证据状态为「待获取」语义；消费端不得把证据计划当作已有证据 |
| `options[]` | 候选道路与取舍（战略选择类必带）。是设计枚举，不是推荐结论 |

**硬边界**（与 §4 同等地位）：

- blueprint 段**不携带**供应侧复核状态（`review` 已剥离）——包内无任何「已复核/已确认」声明；消费端不得臆造供应侧背书。
- 蓝图完整性由供应侧交付门保证（目的/三要素/复核有效才可发布）；消费端**不**复核上游设计门，只需按 §3 表校验结构与引用。
- 蓝图中的方法引用（`method_refs`）与场景一致：纯引用，解析不到不得臆造。

## 4.2 零指标包（v0.4 合法）

`metrics: []` 且含 blueprint 的包是**合法的战略定性设计包**（如「是否继续扩店」的道路比较设计，全部交付物为问题/假设/候选道路/证据计划）。消费语义：

- 无可计算口径——消费端**不得**为该类包补造指标或把假设当事实消费；
- 消费形态是**设计参考**（问题结构、判断边界、候选道路枚举），不是执行输入；
- `questions[].metric_refs` 必然为空（否则触发 §3 规则 7 拒绝）。

## 5. 版本、不可变与对账

- **同 id@version 不可重复发布**：供应侧拒绝；消费端如收到同 id@version 的两个不同字节包，视为交付事故（校验指纹即暴露）。
- **same-content 拒绝重复发版（v0.4）**：与既有发布内容指纹完全相同的发布请求被供应侧拒绝（未修改不重复发版）。消费端不会收到「版本号变了但业务内容零变化」的包——若收到，视为供应侧流程异常，可对账内容指纹求证（正常情况下同内容 ⇒ 同内容指纹）。
- **`content_fingerprint`（内容指纹）**：登记侧对包做规范化序列化、置空五键（`package.fingerprint`、`package.created_at`、`review.exported_at`、`package.version`、`package.namespace`）后取 SHA-256。
  - **同内容重导出 → 内容指纹不变**（时间戳不干扰对账）
  - **版本递增但业务内容零变化 → 内容指纹不变**（供应侧会发同内容警告）
  - **业务内容变化（口径/公式/场景/指标集）→ 内容指纹必变**
  - **`generator` 变化（工具重建/升级）→ 内容指纹变**：工具来源属包内容（红队 R1 裁决）；对账时如仅 generator 行差异，属工具链漂移而非业务变化
- `package_fingerprint` 含时间戳成分，每次导出必不同——**不可**用它做业务对账，只做包完整性校验。
- 消费端建议在安装记录中同时保存双指纹（receipt 格式见 §7）。

## 6. 净销售样板（首个样板资产）

`net-sales-instance@1.0.0`，fork 自 `ecommerce-marketplace@0.1.0`：

- 指标：`gmv`（开关翻为 `include_refund: true` 含退款）、`refund_amount`（退款额；`refund_to_payment_period` 默认开 = 归属支付期间；`include_pending_refund` 默认关）、`net_sales`（`expr: "gmv - refund_amount"`）
- **勾稽前提**：`net_sales` 公式成立要求 `gmv.include_refund = true`——模板默认是关（剔除退款），直接套公式会**双重扣减**。消费端核验时应检查该前提（definition 内已声明）。
- **合法口径修改示例**：把 `refund_amount.refund_to_payment_period` 翻为 `false`（归属退款完成期间）→ 发布新版本 → 同一批数据的 `net_sales` 计算结果真实变化（退款计入不同期间）。**该演示已发布**：`net-sales-instance@1.0.1`（v1.0.0 = 归属支付期间，v1.0.1 = 归属退款完成期间；内容指纹不同，v1.0.0 快照字节不变），消费端可直接用两版做"合法改口径 → 计算真实变化"的对照验收。
- 场景：`net_sales_review`（净销售额 ← 销售侧 gmv / 退款侧 refund_amount；guardrail `refund_rate`）。问题树是参考骨架——Agent 发现退款数据缺失或归属歧义时应转向调查（如先补数据），不得硬算。

### 6.1 修正版（v1.1.x，2026-10-13）

`net-sales-instance@1.1.0`（退款金额归属支付期间）与 `@1.1.1`（归属退款完成期间）为**修正版自洽资产**，修复 v1.0.x 的三处缺陷：① 移除 `gmv = uv*cvr*aov` 恒等式（与 `aov.numerator=gmv` 成环，且 cvr 按用户、aov 按订单，不构成金额恒等式）；② GMV 明确为合格成功支付订单的**原始成交金额**（含后来退款的订单、gross 只计一次、不先净额化）；③ `refund_rate` 补显式分子 `refunded_order_count`／分母 `order_count`（支付队列口径，含已退款订单，1:N 退款按订单去重，两版队列一致）。场景升级 `net_sales_review@0.2.0`（13 周周序列 + 两期描述性拆解 Δ净额=Δ成交总额−Δ退款额 + 总体/category 分组 + 受限完成规则）；方法引用 `dame.descriptive_delta_decomposition@0.1.0` 为**设计态定义**（`docs/net-sales-method-refs-v0.1.md`），消费方未实现前不得臆造或硬别名到 `dame.m2`。两版仅 `refund_amount.refund_to_payment_period` 一个开关不同。所选闭包 = 上述 6 指标 + 该场景；**其余 49 项模板指标与 `gmv_gap_diagnosis` 场景保留为未消费设计参考**（模板默认口径，未随本修正重做，勿与修正闭包混用）。供应侧可重放 oracle 见 `test/unit/net-sales-oracle.test.ts`（证明定义/发布一致，不证明消费侧已接通）。v1.0.0/1.0.1 原样保留作历史与反例。

## 7. adoption receipt（采用回执，格式冻结）

消费端每完成一个真实任务，回传一份 YAML 回执；工作台侧登记（批次 2 实现）：

```yaml
task_id: <消费端任务唯一标识>
package:
  id: net-sales-instance
  version: 1.0.0
  content_fingerprint: sha256:<64hex>     # 与 releases/index.yaml 对账
  package_fingerprint: sha256:<64hex>     # 包完整性校验
adopted_metrics:                            # 实际进入本次计算口径的指标（非全部包内指标）
  - name: net_sales
  - name: gmv
  - name: refund_amount
adopted_scenarios:
  - id: net_sales_review
issues_found:                               # 口径歧义 / 缺失信息 / 试用问题
  - kind: caliber_ambiguity                # 枚举：caliber_ambiguity | missing_data | trial_issue
    metric: refund_amount                  # 可选，指向具体指标/场景
    detail: <一句话问题描述>
computed_at: <ISO-8601>
```

## 8. 批次状态

**批次 2（2026-10-12）**：

- **2a 已完成**：契约修订为 v0.3（消费方基线事实勘误——Blueprint v4.2/A-02/N04 本机不可定位，实测基线 = Xanthil local-analysis 切片；手动安装模式与 adoption receipt 升格为 §6.1/§6.2 正文）
- **2b 已备料待启动**：JuanerAI 侧 Change 输入包见 `docs/juanerai-change-input-xanthil-sap-install-v0.1.md`（按 JuanerAI 自身宪法流程带入：UI 门 → OpenSpec → Test → Worker → Validator）；metric-factory 不直接改 JuanerAI 代码
- 批次 3（净销售端到端五点验收）待 2b 落地后执行

**接入准备批（2026-10-19，本批）**：

- 契约 v0.4 供应侧实现登记完成（blueprint 段/零指标包/same-content；A1+A2 批次验证门全绿）
- 本指引补齐 v0.4 消费面：§3 校验表规则 6-7（blueprint 形状/引用一致）、§4.1 blueprint 消费语义、§4.2 零指标包、§5 same-content
- **真实 LLM 冒烟已跑**（`scripts/llm-smoke.sh`，2026-10-19）：xiaomi mimo-v2.6-flash 全链路成功（generate/refine 出稿 + fail-closed 审核门正常拦截）；minimax MiniMax-M3 输出解析失败（沿用 A1 挂账，发布候选模型以真值表已验证者为准）。留档 `/tmp/mf-llm-smoke-20261019-112633/`（本机）
- **Change 输入包升级 v0.2**：`docs/juanerai-change-input-xanthil-sap-install-v0.2.md`（覆盖 blueprint 段/零指标包消费行为定义与验收场景，取代 v0.1）
- blueprint 样板包已登记（§9）：`coffee-weekly-review@1.0.0`（蓝图+指标）与 `store-expansion-strategy@1.0.0`（零指标战略包），真实 LLM 出稿经人工审核后发布

## 9. blueprint 样板资产（v0.4，接入开发对照物）

2026-10-19 由真实 LLM 出稿（xiaomi mimo-v2.6-flash）、经人工审核与业务复核后发布，已入库 `releases/`（源实例在 `examples/`）：

| 包 | 版本 | 类型 | 内容指纹 | 说明 |
|---|---|---|---|---|
| `coffee-weekly-review` | 1.0.0 | blueprint + 3 指标 | `sha256:f3b46a21cb5d06cdd4b730530adeb33497101c4026bfa9643d8fe56a7e84d29d` | 连锁咖啡门店周度经营复盘体系：purpose/decision/boundary/deliverable 完整；2 问题（挂 3 指标）、2 假设（三要素）、2 证据计划（含不足处置降级）；3 指标均 LLM 出稿经人工审核（`reviewed_by` 在包）——覆盖 §2.3 全部六条行为的正面样例 |
| `store-expansion-strategy` | 1.0.0 | **零指标战略包** | `sha256:6c801e451b0d3bf646347f9cdf7cdb8c8bf008ccf0ce1caf46ccc45a29ee33c3` | 扩店 vs 存量盈利战略比较：`contexts: 战略选择`；2 候选道路含 tradeoff；questions 零 metric_refs；假设全部为「待验证」语义——§4.2 零指标包消费语义的正面样例 |

配套验收场景见 Change 输入包 v0.2 §3：A5/A6 用 `coffee-weekly-review@1.0.0`，A7 用 `store-expansion-strategy@1.0.0`，A8/A9 的反面手工包可由消费方按规则 7-8 自行构造。

**真实 LLM 出稿备注**（2026-10-19 冒烟与出稿实测）：

- xiaomi mimo-v2.6-flash 全链路可用，但**冗长需求会触发输出截断（parse 阶段整批拒绝）**；紧凑需求（指标≤3/问题≤2/明确不生成场景）一次成功。发布门 fail-closed 行为正常（截断/形状错误均零落盘）。
- 该模型在 `added_scenarios.question_tree` 上易产出字符串而非对象（payload 阶段拒绝）——消费方若未来走「模型直产场景」路径需留意；本批两样板均零场景，不受影响。
- minimax MiniMax-M3 解析失败（A1 起挂账）；候选模型以真值表已验证者为准。
