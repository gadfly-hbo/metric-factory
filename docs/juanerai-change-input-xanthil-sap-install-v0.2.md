# JuanerAI Change 输入包 · Xanthil 安装并采用 metric-factory SAP 资产包 v0.2

> 性质：**输入包，不是规格**。供 JuanerAI 侧按其工程宪法（UI 门 → OpenSpec → Test → Worker → Validator）启动 Change 时作为产品意图与验收行为定义的输入。撰写方：metric-factory（供应侧，2026-10-19）。
> **v0.2 取代 v0.1**（`juanerai-change-input-xanthil-sap-install-v0.1.md`）：覆盖契约 v0.4 新增面——blueprint 段（分析体系蓝图）与零指标包的消费行为定义、same-content 纪律；v0.1 的指标安装行为定义全部保留有效。
> 事实源：metric-factory `docs/juanerai-semantic-asset-contract-v0.1.md`（v0.4）§2/§3.7/§5/§6/§6.1/§6.2；`docs/sap-consumption-guide.md`（v0.4 更新，§3/§4/§4.1/§4.2/§5/§9）。

## 1. 产品意图（What & Why）

让 Xanthil（现有 local-analysis 切片）能够**安装** metric-factory 发布的 SAP 语义资产包（手动文件交付，精确 `id@version`），并分两类采用：

1. **指标口径类**（v0.1 已定义）：把包内指标口径真实用于一次分析任务的口径计算与核验，使分析结果可追溯到明确的口径版本。
2. **分析体系类（v0.2 新增）**：把包内 blueprint 段作为**设计语境**消费——问题结构、判断边界、假设清单、证据计划、候选道路进入分析任务的 Context 组织，使 JuanerAI 的分析产出可对照「该业务问题本应怎样分析」的已交付设计，而不是临场即兴拆解。

首个真实任务（验收场景，两类各一）：

- **净销售复盘**（v0.1 既有）：净销售样板包 `net-sales-instance@1.0.0` 对订单+退款数据文件完成净销售额计算与归因。
- **经营诊断对照**（v0.2 新增）：安装分析体系样板包（blueprint 段含目的/问题/假设/证据计划），对一个经营复盘需求产出诊断结构，并**逐条对照包内 blueprint**——问题覆盖、假设未证实的表述纪律、证据待获取的边界声明（§3 行为定义 4）。

## 2. 行为定义（外部可见，架构中立）

### 2.1 安装（v0.1 既有 + v0.4 规则扩充）

用户提供 SAP 包文件（或包文件 + releases/index.yaml）。系统执行 `validate_import`，任一命中即整体拒绝并逐条报因：

1. 结构不合法（v0.1 既有）；
2. 未知 sap 版本（v0.1 既有）；
3. 含未审核 LLM 条目（v0.1 既有，移植校验器必须补此纵深规则）；
4. `runtime_state ≠ design_only`（v0.1 既有）；
5. 指纹失配（v0.1 既有）；
6. 重复 id@version（v0.1 既有）；
7. **blueprint 段含 `review` 子段（v0.4 新增）**——复核是供应侧本地工作态，不随包携带；
8. **blueprint.questions[].metric_refs 在包内 metrics 不可解析（v0.4 新增）**——悬空引用即拒。

拒绝 = 零安装痕迹（不产生半安装状态）。

### 2.2 指标口径采用（v0.1 既有，不变）

安装成功的包成为可调用的口径版本：`caliber_switches` 直接改变计算；`type_params`/`aggregation` 是公式与可加性契约；`bindings` 是设计态草案，真实映射由任务 Binding 承接。整份 YAML 塞进提示词不构成接入。

### 2.3 blueprint 段消费（v0.2 新增）

blueprint 出席时，消费端必须：

1. **把 `purpose`/`decision`/`boundary`/`deliverable` 作为任务语境**：分析产出的范围与承诺输出对照蓝图边界（越界判断须显式声明偏离，不得静默扩权）。
2. **按 `contexts` 选择解释纪律**：`战略选择` 语境下，禁止从短期下滑直接判定方向失败；`独立数据专题` 语境下，相关差异不得自动升级为因果效果。
3. **把 `questions[]` 作为问题覆盖清单**：诊断结构应覆盖包内问题（或显式说明为何不适用）；`metric_refs` 是只读引用，口径唯一权威来源是包内 metrics 段。
4. **遵守假设表述纪律**：`hypotheses[]` 中的内容**全部是待验证语义**——产出中引用假设必须保持「待验证/未证实」表述，不得把假设写成事实或结论（判断性质与核验状态分轴：`verified` 是供应侧工作态，不构成消费侧证据）。
5. **遵守证据边界**：`evidence_plan[]` 是证据**计划**（来源/核验/不足处置），计划完整 ≠ 证据已取得；产出不得把证据计划表述为已有证据，证据不足时按包内 `insufficiency` 声明降级（如「缺失时不输出仿成功结论」）。
6. **把 `options[]` 作为候选枚举**：战略类产出在包内候选道路集合上比较（含各自 tradeoff），不得替换为自创方案集而不声明。

blueprint **不是**：执行能力（不代表已接通任何数据）、业务事实（不代表任何结论成立）、供应侧背书（包内无 review，复核状态不随包）。

### 2.4 零指标包（v0.2 新增）

`metrics: []` 且含 blueprint 的包是合法的战略定性设计包。消费端必须：

- 按 §2.3 消费 blueprint（全部为设计参考）；
- **不得**为该类包补造指标，不得把假设当事实、把候选道路当推荐结论；
- 该类包无口径计算面——「安装成功」的验收以 blueprint 可读取、可对照为准。

### 2.5 版本与对账（v0.1 既有 + v0.4 扩充）

- 精确 `id@version` 取得，禁止 latest 跟随（v0.1 既有）；
- 同 id@version 收到不同字节 = 交付事故（v0.1 既有）；
- **same-content 纪律（v0.4）**：供应侧拒绝内容指纹不变的重复发版；消费端如收到「版本递增但业务内容零变化」的包，视为供应侧流程异常，可对账内容指纹求证；
- adoption receipt：安装后产出采用回执（格式冻结，契约 §6.2），交付 metric-factory 侧登记对账（v0.1 既有）。

## 3. 验收场景（行为级，供 Test 阶段转写）

| # | 场景 | 期望行为 |
|---|---|---|
| A1 | 安装 `net-sales-instance@1.0.0`（v0.1 既有） | validate_import 通过；净销售任务按包内口径计算；结果可追溯到 id@version |
| A2 | 篡改包内容后安装（v0.1 既有） | 指纹失配，整体拒绝，零安装痕迹 |
| A3 | 口径翻转对照（v0.1 既有） | `refund_to_payment_period` 开/关两版本计算结果不同且各自与手工核算一致 |
| A4 | 含未审 LLM 指标的手工包（v0.1 既有） | 整批拒绝（纵深规则生效） |
| A5 | **安装含 blueprint 段的分析体系包（v0.2 新增）** | validate_import 通过（§2.1 规则 7-8 不命中）；blueprint 各字段可读取 |
| A6 | **blueprint 语境对照（v0.2 新增）** | 经营诊断产出覆盖包内 questions；假设引用保持「待验证」表述；证据表述不越界（计划≠已取得）；产出范围不越 `boundary`（越界处显式声明偏离） |
| A7 | **安装零指标战略包（v0.2 新增）** | validate_import 通过；无可计算面不报错；blueprint 消费按 §2.4（无指标补造） |
| A8 | **blueprint 含 review 子段的手工包（v0.2 新增）** | 结构非法，整体拒绝 |
| A9 | **blueprint 悬空 metric_refs 的手工包（v0.2 新增）** | 引用不一致，整体拒绝 |
| A10 | adoption receipt 登记对账（v0.1 既有） | 回执字段齐全；metric-factory 侧 `registerReceipt` 可登记；对账一致 |

## 4. 非目标（Out of Scope）

- 不做 API/MCP/服务化接入（文件交付为唯一方式，用户裁决 2026-10-12）
- 不改 metric-factory 侧任何行为；不回写包内容；不拥有口径真值（发布门语义仍留消费方）
- 不预设安装功能的交互形态（CLI 旗标 / Console 页面 / 两者）——UI 门后由 JuanerAI 裁决；若涉及用户可见 UI，按宪法先过 UI 门
- 不在本 Change 内实现 executable 状态、本体（Semantica/Protégé）对接、跨包依赖
- **不把 blueprint 消费做成提示词拼接**（§2.3 六条行为必须落入 Context 组织与产出校验，而非一次性文本注入）

## 5. 留给 JuanerAI Spec 的开放决策（供应侧不预设）

1. 安装能力落在哪一层（Application/Ports/Adapter 的哪一项；local-analysis 切片如何扩展为可接收口径输入与蓝图语境输入）
2. 口径层与蓝图语境层同现有八阶段管线的接点（blueprint 对照在哪个阶段发生：诊断结构生成后对照？产出校验时断言？）
3. adoption receipt 的产出位置与交付方式（文件落盘路径/命名；metric-factory 侧登记如何接收）
4. 术语：包/安装/采用/蓝图语境/回执在 CONTEXT.md 中的正式定名

## 6. 供应侧可提供的配合

- **样板包**（metric-factory 仓库 `releases/`，已入库）：
  - `net-sales-instance@1.0.0/1.0.1/1.1.0/1.1.1`（指标口径类，含口径翻转对照）
  - `coffee-weekly-review@1.0.0`（blueprint + 3 审核指标，验收 A5/A6 对照物）
  - `store-expansion-strategy@1.0.0`（零指标战略包，验收 A7 对照物）
- 校验器参考实现：metric-factory `src/sap/validate.ts`（移植须补未审 LLM 规则——契约 §6 表注；blueprint 规则 7-8 已在供应侧实现，可直接对照移植）
- 指纹算法参考：`src/sap/canonical.ts`（五键内容指纹 G10 + 包指纹）
- 消费指引：`docs/sap-consumption-guide.md` §3（校验表）/§4（字段消费语义）/§4.1（blueprint 消费语义）/§4.2（零指标包）——本输入包 §2 行为定义的逐条展开
- 真实 LLM 冒烟证据（2026-10-19）：`scripts/llm-smoke.sh` 全链路成功（xiaomi mimo-v2.6-flash），fail-closed 审核门实测拦截未审指标

## 7. 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v0.2 | 2026-10-19 | 覆盖契约 v0.4：blueprint 段消费行为（§2.3 六条）+ 零指标包（§2.4）+ same-content 纪律（§2.5）+ 校验规则 7-8（§2.1）+ 验收场景 A5-A9（§3）+ 非目标增补（提示词拼接不构成蓝图消费）；取代 v0.1 |
| v0.1 | 2026-10-12 | 首版：指标口径安装与采用（净销售复盘验收场景） |
