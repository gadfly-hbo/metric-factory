# JuanerAI Change 输入包 · Xanthil 安装并采用 metric-factory SAP 资产包 v0.1

> 性质：**输入包，不是规格**。供 JuanerAI 侧按其工程宪法（UI 门 → OpenSpec → Test → Worker → Validator）启动 Change 时作为产品意图与验收行为定义的输入。撰写方：metric-factory（供应侧，2026-10-12）；对 JuanerAI 内部架构命名、路由、持久化**不做任何预设**——那些是 JuanerAI Spec 的裁量范围。
> 事实源：metric-factory `docs/juanerai-semantic-asset-contract-v0.1.md`（v0.3）§2/§6/§6.1/§6.2；`docs/sap-consumption-guide.md`。

## 1. 产品意图（What & Why）

让 Xanthil（现有 local-analysis 切片）能够**安装** metric-factory 发布的 SAP 语义资产包（手动文件交付，精确 `id@version`），并把包内指标口径**真实用于**一次分析任务的口径计算与核验——使分析结果可追溯到明确的口径版本，而不是隐含在代码或提示词里的默认逻辑。

首个真实任务（验收场景）：**净销售复盘**——用净销售样板包 `net-sales-instance@1.0.0`（已发布于 metric-factory `releases/`，含 gmv / refund_amount / net_sales 与退款归属期间开关）对用户给定的订单+退款数据文件完成净销售额计算与归因。

## 2. 行为定义（外部可见，架构中立）

1. **安装**：用户提供 SAP 包文件（或包文件 + releases/index.yaml）。系统执行 `validate_import`，任一命中即整体拒绝并逐条报因（契约 v0.3 §6）：结构不合法 / 未知 sap 版本 / 含未审核 LLM 条目 / runtime_state ≠ design_only / 指纹失配 / 重复 id@version。拒绝 = 零安装痕迹（不产生半安装状态）。
2. **采用**：安装成功的包成为候选口径源。任务运行时，包内被采用指标的定义、布尔口径开关、公式（type_params）、聚合规则进入本次分析的口径层并**改变计算**——以 net-sales 样板为例：`net_sales = gmv − refund_amount` 的计算必须按包内 `gmv.include_refund=true`、`refund_amount.refund_to_payment_period` 取值执行，而非按系统内置默认。
3. **独立核验**：任务核验须检查(a)包内引用完整性（场景/公式引用的指标存在）、(b)数据对口径的可计算性（如订单-退款一对多关联的重复计数风险须被识别并报告，不得静默出数）、(c)口径前提（样板的 `net_sales` 依赖 `gmv.include_refund=true`，不满足即报告而非硬算）。
4. **回执**：任务完成后产出 adoption receipt（契约 v0.3 §6.2 格式）：task_id、package id@version+双指纹、adopted_metrics/adopted_scenarios、issues_found（kind ∈ caliber_ambiguity / missing_data / trial_issue）、computed_at。回执是对 metric-factory 侧的反馈通道，也是追溯"哪个任务采用了哪个版本"的依据。
5. **版本纪律**：按精确 id@version 绑定，禁 latest 跟随；同 id@version 不可变——重新交付同 id@version 的不同字节包视为交付事故（指纹校验暴露）。

## 3. 验收行为（给 Test 阶段的输入，非完整测试计划）

- 安装合法 `net-sales-instance@1.0.0` → 成功；采用后计算含退款净销售额，结果与按包内口径手工推演一致
- 篡改快照任一业务字节 → 指纹失配 → 整体拒绝，零安装痕迹
- 翻转 `refund_to_payment_period`（供应侧发布 v1.0.1 样板包）→ 新任务计算结果真实变化且回执指向新版本；旧任务回执仍指 v1.0.0
- 未审核 LLM 指标包（metric-factory `test/fixtures/instance-llm-unreviewed.yaml` 可导出前被阻；手工构造包用于消费侧负例）→ 整体拒绝
- 数据侧：一对多关联数据 → 核验报告重复计数风险；退款记录缺支付时间/退款完成时间字段 → issues_found 记录 missing_data，Agent 转向补数而非硬算
- 主 Agent 自由度：问题树仅作参考——给定与场景无关的调查发现时，Agent 转向不视为偏离（产出回执 issues_found 说明）

## 4. 边界（不做）

- 不做 API/MCP/服务化接入（文件交付为唯一方式，用户裁决 2026-10-12）
- 不改 metric-factory 侧任何行为；不回写包内容；不拥有口径真值（发布门语义仍留消费方）
- 不预设安装功能的交互形态（CLI 旗标 / Console 页面 / 两者）——UI 门后由 JuanerAI 裁决；若涉及用户可见 UI，按宪法先过 UI 门
- 不在本 Change 内实现 executable 状态、本体（Semantica/Protégé）对接、跨包依赖

## 5. 留给 JuanerAI Spec 的开放决策（供应侧不预设）

1. 安装能力落在哪一层（Application/Ports/Adapter 的哪一项；local-analysis 切片如何扩展为可接收口径输入，当前案例的问题/源是硬编码的）
2. 口径层与现有八阶段管线的接点（contract_persist 前注入？validation 阶段如何消费包内 aggregation/caliber 规则）
3. adoption receipt 的产出位置与交付方式（文件落盘路径/命名；metric-factory 侧登记如何接收）
4. 术语：包/安装/采用/回执在 CONTEXT.md 中的正式定名

## 6. 供应侧可提供的配合

- `net-sales-instance@1.0.0` 快照与 `releases/index.yaml`（metric-factory 仓库 `releases/`，已入库）
- 校验器参考实现：metric-factory `src/sap/validate.ts`（移植须补未审 LLM 规则——契约 §6 表注）
- 指纹算法参考：`src/sap/canonical.ts`（五键内容指纹 G10 + 包指纹）；样板的合法口径修改演示：翻转 `refund_to_payment_period` 后发 v1.0.1
