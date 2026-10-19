# JuanerAI 接入启动文档 · metric-factory 语义资产包（SAP）安装与采用

| 项 | 值 |
|---|---|
| 日期 | 2026-10-19 |
| 发起方 | metric-factory（供应侧，`/Users/huangbo/Dev/Projects/metric-factory`） |
| 接收方 | JuanerAI（消费侧，`/Users/huangbo/JuanerAI`） |
| 性质 | 接入启动文档（kickoff）；产品意图与行为定义的权威细节在 §3 列出的三份输入文档，本文件只做导引与边界 |
| 交换模式 | **文件手动交付**（导出 → 交付 → 安装消费；用户裁决 2026-10-12），不做 API/MCP/服务化 |

## 1. 一句话任务

让 Xanthil（JuanerAI 现有 local-analysis 切片）能够**安装** metric-factory 发布的 SAP 语义资产包（精确 `id@version`、fail-closed 校验），并分两类**采用**：指标口径类（口径真实参与计算）+ 分析体系类（blueprint 段作为设计语境进入 Context 组织）。

## 2. 背景（三十秒版）

metric-factory 是语义资产供应侧：业务人员在其工作台完成「描述业务问题 → AI 起草分析体系 → 修正 → 业务复核 → 发布」，产出不可变 SAP 资产包。供应侧接入准备已全部完成并验证（契约 v0.4 实现、六个样板包版本入库、真实 LLM 冒烟通过、校验器/指纹/回执通道齐备）。**消费侧没有任何 blueprint/SAP 消费面——本 Change 是从零建设，不是改造既有功能。**

## 3. 权威输入（按此顺序读，再动手）

1. **Change 输入包 v0.2**（产品意图 + 行为定义 + 验收场景 A1-A10，你的直接输入）：
   `/Users/huangbo/Dev/Projects/metric-factory/docs/juanerai-change-input-xanthil-sap-install-v0.2.md`
2. **消费指引**（校验表 7 条规则 / 字段消费语义 / blueprint 消费语义 / 零指标包 / 样板登记）：
   `/Users/huangbo/Dev/Projects/metric-factory/docs/sap-consumption-guide.md`
3. **交换契约 v0.4**（冻结面：包格式 / 身份与版本 / 指纹 / 治理不变量）：
   `/Users/huangbo/Dev/Projects/metric-factory/docs/juanerai-semantic-asset-contract-v0.1.md`

## 4. 你要做什么（按 JuanerAI 工程宪法）

按宪法流程启动 Change（UI 门 → OpenSpec → Test → Worker → Validator）：

1. **安装**：执行 `validate_import` 全规则（见 §5），任一命中即整体拒绝、零安装痕迹；
2. **采用·指标口径类**：`caliber_switches` / `type_params` / `aggregation` 真实参与分析任务的口径计算与核验；`bindings` 是设计态草案，真实映射由任务 Binding 承接；
3. **采用·分析体系类**：blueprint 段六条消费行为（输入包 §2.3）落入 Context 组织与产出校验——任务语境、语境解释纪律、问题覆盖、假设「待验证」表述纪律、证据边界（计划≠已取得）、候选道路枚举。

## 5. 硬规则（fail-closed，违反即验收不通过）

- validate_import 全规则：结构合法 / 指纹一致 / 未知 sap 版本 / **含未审 LLM 条目**（移植供应侧校验器时必须自行补此纵深规则，供应侧校验器有意不含）/ `runtime_state = design_only` / 重复 id@version / **blueprint 段禁带 review** / **blueprint.questions[].metric_refs 必须在包内 metrics 可解析**；
- 把整份 YAML 塞进提示词**不构成接入**（指标口径如此，blueprint 语境亦如此）；
- blueprint 语义边界：假设全为「待验证」语义；证据计划 ≠ 证据已取得；包内无 review = 无供应侧背书；零指标包不得补造指标；
- 安装后产出 adoption receipt（格式冻结，契约 §6.2），交付供应侧登记对账；
- 版本纪律：精确 `id@version` 取得，禁止 latest 跟随；同 id@version 不同字节 = 交付事故；same-content 重复发版不会出现（供应侧拒绝），收到即流程异常。

## 6. 供应侧提供的对照物

| 物 | 位置 |
|---|---|
| 样板包 · 指标口径类 | `releases/net-sales-instance/`：`1.0.0`（基线）与 `1.0.1`（退款归属口径翻转，验收计算变化对照）；另有 1.1.x 修正版 |
| 样板包 · 分析体系类 | `releases/coffee-weekly-review/1.0.0.sap.yaml`（blueprint + 3 审核指标）· `releases/store-expansion-strategy/1.0.0.sap.yaml`（零指标战略包）——真实 LLM 出稿经人工审核后发布 |
| 登记簿 | `releases/index.yaml`（append-only，含双指纹与快照相对路径） |
| 校验器参考实现 | `src/sap/validate.ts`（纯函数；blueprint 规则 7-8 已实现，可直接对照移植） |
| 指纹算法参考 | `src/sap/canonical.ts`（五键内容指纹 + 包指纹） |

## 7. 验收场景（行为级，转写为你的测试）

A1-A4 指标口径类（安装成功 / 指纹篡改拒绝 / 口径翻转生效 / 未审包拒绝）；A5-A9 分析体系类（含 blueprint 包装装 / 语境对照 / 零指标包 / 带 review 拒绝 / 悬空引用拒绝）；A10 回执登记对账。逐条期望行为见输入包 v0.2 §3。

## 8. 边界（不做什么）

- 不改 metric-factory 侧任何行为；不回写包内容；不拥有口径真值（发布门语义留消费方）；
- **不预设 JuanerAI 内部架构**——安装落在哪一层、blueprint 对照在八阶段管线的哪个接点、回执产出位置与交付方式、术语定名，都是 JuanerAI Spec 的裁量（开放决策清单见输入包 §5）；
- 涉及用户可见 UI 先过 UI 门；
- executable 状态、本体（Semantica/Protégé）对接、跨包依赖不在本 Change 内；
- 交互形态（CLI 旗标 / Console 页面 / 两者）由 JuanerAI 裁决。

## 9. 现状基线（供应侧实测 2026-10-12，核对记录见契约 §9）

JuanerAI 唯一真实分析面 = Xanthil local-analysis 切片（`apps/cli/xanthil.ts` + `packages/product-core/local-analysis.ts`：单案例受控执行、CSV 源 SHA-256 钉死、八阶段管线）。此前文档所记 Blueprint v4.2 / A-02 / N04 在本机不可定位——**以实测为准**。

## 10. 语义疑问

回来对契约与消费指引，不要猜；供应侧事实源 = §3 三份文档（如有冲突以契约为准）。
