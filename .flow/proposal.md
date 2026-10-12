# 批次 1 · 发布与版本交付（工作台侧）· 方案（proposal）

> 规格源：2026-10-12 会话定稿，用户四项裁决已确认。上游基线：metric-factory 现状评估（同日）+ 语义资产契约 v0.2（冻结面零破坏）+ PRODUCT_PLAN v0.2。本文件是后续 PRD/GRILL/ISSUES/REVIEW 的唯一规格源。

## 目标

补齐「设计态半环」到「发布一个明确版本」的最小增量：用户在工作台建设分析体系与指标口径，发布明确版本到版本登记；为批次 2（JuanerAI 手动安装消费）提供可取得、可校验、可追溯的资产。全部零 schema 变更、零契约破坏。

## 用户裁决（2026-10-12，约束性）

1. **消费模式**：导出 SAP 资产包 → 手动交付 → JuanerAI 安装并消费；暂不做 API/MCP 接口打通，待使用成熟后再议。
2. **发布登记机制**：`releases/` 目录（快照文件 + index 登记，git 管理）。
3. **退款归属期间**：用布尔开关表达（`refund_to_payment_period` 等），不改 schema。
4. **净销售样板**：先做示例实例（`examples/`），不进行业模板；验收通过后再议是否入模板。

## 范围（三切片）

### 切片 1 · 版本与发布机制

- **新增 CLI `release` 命令**：`release <instance> --version <semver> [--note <text>]`
- 管线复用现有 SAP 导出（loadInstance → materialize → validateInstance → export gate → assembleSap → validateSapPackage），不开第二套规则
- 产出：`releases/<package-id>/<version>.sap.yaml` + 登记 `releases/index.yaml`
- 登记条目字段：id、version、content_fingerprint、package_fingerprint、created_at、released_by（`MF_REVIEWER`/`$USER`/unknown 约定）、note、文件相对路径
- **内容指纹**：规范化序列化后置空 `package.fingerprint`、`package.created_at`、`review.exported_at` 三键再取 SHA-256；同内容必同指纹（已实证这三处是重导出唯一差异源）；指纹只活在登记侧，SAP 包格式不动（**G10 修订 2026-10-12，用户批准**：现为置空五键——另含 `package.version` 与 `package.namespace`；`package.id` 与 `generator` 保留。理由与现行语义见 `.flow/prd.md` 决策 #4）
- **不变量（fail-closed）**：
  - 同 `id@version` 已存在 → 拒绝（不可变，即使内容相同）
  - 内容指纹与已有版本相同 → 允许但警告（无业务变化的无意义版本递增）
  - 发布动作本身不加审批（LLM 未审阻断门保留，是质量门）
- `export --format sap` 加可选 `--version`（缺省 0.1.0，不破坏既有测试与 golden artifact 再生成）
- UI 实例页发布入口（版本号 + 变更说明表单 → 服务端同一管线）；这是对工作台写白名单的一次显式扩展（现状仅实例/草案/.env.local，需加 releases/），同步更新使用指南边界声明

### 切片 2 · 净销售样板资产

- `examples/net-sales-instance.yaml`（fork `ecommerce-marketplace@0.1.0`）：
  - 新增 `refund_amount`（退款额；`refund_to_payment_period: true` 默认归属支付期间；`include_pending_refund: false`）
  - 新增 `net_sales`（净销售额；derived，expr 引用 gmv 与 refund_amount；实例口径设 `gmv.include_refund: true` 含退款 GMV——勾稽教学点：gmv 默认剔除退款，不翻开关会双重扣减）
  - 新增场景 `net_sales_review`：问题树（净销售额变化 ← 销售额侧/退款侧）；角色 net_sales=outcome、gmv/refund_amount=driver、refund_rate=guardrail；method_refs 保持引用标识
- 不带 bindings（映射建议属具体任务，不进通用样板）
- 同步产出该实例的 v1.0.0 发布，作为 releases/ 首个真实条目

### 切片 3 · 消费指引文档 + 回执格式

- `docs/sap-consumption-guide.md`：取得（精确版本、禁 latest）、校验步骤（移植 `src/sap/validate.ts` 需补 LLM 未审规则）、字段消费语义（开关如何影响计算、question_tree 是参考骨架非执行路径、bindings 是设计态草案、任务 Binding 为准、聚合与比例重算规则）、版本与不可变规则、内容指纹对账方法
- adoption receipt 格式定义（文档冻结；工作台侧登记命令放批次 2）：task_id / package（id@version + 双指纹）/ adopted_metrics[] / adopted_scenarios[] / issues_found[] / computed_at

## 验收标准（批次 1 完成定义）

1. 净销售实例经 CLI 与 UI 各发布一次 v1.0.0，index 登记完整、双指纹可对账
2. 同内容重导出 → 内容指纹不变；翻一个口径开关发布 v1.0.1 → 内容指纹变化，v1.0.0 快照文件字节不变
3. 同 id@version 重复发布被拒绝（有测试覆盖）
4. `validate` / `diff` / SAP 导出对样板全通过（场景引用完整）
5. 现有全量测试与契约测试不回归

## 显式不做（非目标）

- 不改 MetricSchema/InstanceSchema/SAP 包结构；不动契约 v0.2 冻结面
- 不做 API/MCP 消费接口、不做谱系 ID 机制、不做审批流
- 不做批次 2（JuanerAI 侧安装/采用/回执实现、契约 v0.3 修订）与批次 3（净销售端到端验收）
- 不做：结构化方法对象、假设库、enum 开关、维度字典、executable 状态、场景 removed/modified patch、本体对接
- 版本登记不做服务化、不做注册表

## 背景依据（现状评估结论，2026-10-12）

- `package.version` 恒 "0.1.0"，CLI/UI 无版本输入（`src/cli/index.ts` export 段、`src/export/sap.ts`）
- 时间戳计入指纹：同实例两次导出唯一差异为 created_at/exported_at/fingerprint 三行，指纹必不同（实证）
- 无发布登记/版本清单/不可变发布管理；无采用回执机制
- JuanerAI 全仓无 SAP 消费代码（实证，`~/JuanerAI`）；契约所称消费方基线（Blueprint v4.2/A-02/N04）与本机快照不符，列为批次 2 前的待核对依赖，不阻塞本批次
