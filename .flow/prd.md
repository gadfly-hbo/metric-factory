# 批次 1 · 发布与版本交付（工作台侧）· PRD

> 规格源：`.flow/proposal.md`（用户四项裁决 + 三切片范围）；红队处置：`.flow/red-team.md`（R1–R4）。无 issue tracker，按仓库惯例落盘本文件。

## Problem Statement

工作台已能把分析体系与指标口径导出为 SAP 语义资产包，但**版本恒为 0.1.0、没有发布登记、导出时间戳污染指纹**：用户无法回答"我们发布过哪些版本、每个版本的业务内容变没变、被谁用过"。批次 2 的手动安装消费因此没有可安全取得、可校验、可追溯的交付物。同时，净销售场景（销售额/退款额/净销售额/退款归属期间）没有一套可直接示范"口径可被合法修改并真实影响计算"的样板资产，也没有消费端指引说明包内字段应如何被采用。

## Solution

三件事：

1. **发布即登记**：新增 `release` 动作，把当前实例按明确版本号发布为不可变快照，写入 `releases/`（快照文件 + index 登记），用**内容指纹**（排除时间戳与指纹自引用后的 SHA-256）区分"业务定义变化"与"重新导出"。
2. **净销售样板**：一个示例实例（含退款额、净销售额、退款归属期间开关、复盘场景），既是用户的学习样例，也是批次 2/3 验收的固定资产。
3. **消费指引与回执格式**：一份文档冻结包内字段的消费语义（含"问题树是参考骨架非执行路径"）与 adoption receipt 格式，供 JuanerAI 侧安装消费时对照。

## User Stories

1. As a 业务分析人员, I want 在工作台实例页输入版本号与变更说明一键发布, so that 不用终端就能交付一个明确的资产版本
2. As a 业务分析人员, I want 发布时看到"本次与上一发布版本的内容指纹是否相同"的提示, so that 不发出无业务变化的版本
3. As a 数据工程师, I want 用 CLI `release` 命令带 `--note` 发布, so that 发布记录进入 git 可评审的历史
4. As a 数据工程师, I want 同一 id@version 的重复发布被硬拒绝, so that 已发布版本永不被覆盖
5. As a 数据工程师, I want 内容指纹在同构建重导出时保持不变, so that 我能用它做内容对账而不被时间戳干扰
6. As a 数据工程师, I want `export --format sap --version` 指定版本号, so that 非发布场景的导出也能携带明确版本
7. As a 消费端工程师 (JuanerAI 侧), I want 按 `releases/index.yaml` 以精确 id@version 取得快照并核对双指纹, so that 我消费的口径可追溯到不可变来源
8. As a 消费端工程师, I want 指引文档写明 caliber_switches/how 各字段影响计算, so that 口径真实进入我的绑定与计算而不是被当文档塞进提示词
9. As a 消费端工程师, I want 指引明确问题树是参考骨架而非必须机械执行的路径, so that 主 Agent 保持动态调查的自由度
10. As a 消费端工程师, I want adoption receipt 格式定义, so that 我能按最小契约回传采用了哪些定义与版本、发现了哪些口径问题
11. As a 模板/样板维护者, I want 净销售样板只进 examples/ 不进行业模板, so that 未经验证的口径不污染模板资产
12. As a 审计者, I want releases/index.yaml 记录 released_by 与 created_at, so that 每个版本的发布人与时间可查
13. As a 业务分析人员, I want 净销售样板的 definition 写明"gmv 含退款是 net_sales 成立的前提", so that 我不会把模板默认口径（剔除退款）套进公式造成双重扣减

## Implementation Decisions

1. **release 动作语义**：输入实例路径 + `--version <semver>`（必填）+ `--note`（可选）；管线 = 既有 SAP 导出全链（load → materialize → 全量校验 → export gate → 装配 → 整包校验），零第二套规则；通过后写快照与登记。
2. **releases/ 布局**：`releases/<package-id>/<version>.sap.yaml`；CLI 默认基于当前目录的 `releases/`（`--out` 可覆盖基目录）；UI 为实例所在工作区根下的 `releases/`。快照文件字节级不可变。
3. **index.yaml 形状**：顶层 `releases:` **append-only 数组**（不重排、不改写既有条目），每条含：`package`、`version`、`content_fingerprint`、`package_fingerprint`、`created_at`、`released_by`（`MF_REVIEWER`/`$USER`/unknown 约定）、`note`、`file`（相对 releases/ 基目录路径）。
4. **内容指纹算法（G10 五键修订，用户批准 2026-10-12）**：对装配后的包做规范化序列化，计算前置空**五键**：`package.fingerprint`、`package.created_at`、`review.exported_at`、`package.version`、`package.namespace`，取 SHA-256。修订依据：三键下 `package.version` 在包内必致版本递增指纹漂移，"同内容警告"成为死代码；五键使内容指纹=纯业务内容。`package.id` 保留（资产身份）；`generator` 保留（红队 R1：工具来源属内容）。**边界（红队 R1）**：`generator` 字段不置空——工具构建变化（git sha/版本）视为内容变化，属包内容的工具来源成分；"同内容必同指纹"承诺限定为同一构建内。指纹只存在于登记侧，SAP 包结构与契约 v0.2 冻结面零改动。
5. **不变量（fail-closed）**：同 `id@version` 已存在于 index → 拒绝（内容相同也拒，错误信息指引"已发布于 <created_at>，请升级版本号"，红队 R2）；内容指纹与 index 中任意既有条目相同 → 允许但显式警告；发布动作本身不加审批（既有 LLM 未审阻断门保留）。
6. **路径安全（红队 R3）**：快照与登记路径仅由 slugify 后的 package-id（`^[a-z][a-z0-9-]*$`）与 semver version（`^\d+\.\d+\.\d+$`）构造，非法输入在写盘前被拒。
7. **export --version**：`export --format sap` 增加可选 `--version`，缺省 0.1.0（既有测试与 golden artifact 再生成不受影响）；UI 下载（非发布）同样保持 0.1.0。
8. **UI 发布入口**：实例页新增发布表单（版本号 + 变更说明），POST 走服务端同一 release 管线；工作台写白名单从「实例/草案/.env.local」显式扩展为增加 `releases/`；使用指南的边界声明同步更新。表单复用零客户端脚本、服务端校验失败零写盘逐行回显的既有模式。
9. **净销售样板**：`examples/net-sales-instance.yaml` fork 自 `ecommerce-marketplace@0.1.0`；新增 `refund_amount`（`refund_to_payment_period: true` 归属支付期间、`include_pending_refund: false`）与 `net_sales`（derived，expr 引用 gmv 与 refund_amount）；实例口径显式设 `gmv.include_refund: true`，且 net_sales 的 definition 写明该前提（红队 R4）；场景 `net_sales_review`（问题树：净销售额变化 ← 销售额侧/退款侧；角色：net_sales=outcome、gmv/refund_amount=driver、refund_rate=guardrail；method_refs 保持引用标识）。不带 bindings。样板附带的 v1.0.0 发布作为 releases/ 首个真实条目。
10. **消费指引文档**：新增 `docs/sap-consumption-guide.md`，冻结以下语义：取得（精确 id@version、禁 latest）；校验（结构/双指纹/重复身份/未审 LLM——移植供应侧校验器需补 LLM 未审规则）；字段消费语义（caliber_switches 布尔开关如何改变计算、type_params 公式、aggregation 与比例重算、bindings 是设计态草案、任务 Binding 承接真实数据、question_tree 是参考骨架非执行路径）；版本不可变与内容指纹对账方法；generator 漂移语义（红队 R1）。
11. **adoption receipt 格式**（文档冻结，登记实现属批次 2）：`task_id`、`package`（id、version、content_fingerprint、package_fingerprint）、`adopted_metrics[]`、`adopted_scenarios[]`、`issues_found[]`（kind: caliber_ambiguity / missing_data / trial_issue + 描述）、`computed_at`。

## Testing Decisions

- **测试缝（复用现有，零新增缝）**：
  1. CLI 进程边界 e2e（先例：`test/cli/sap-export.e2e.test.ts`）：release 全流程成功、同 id@version 拒绝、同内容指纹警告、非法 version/路径拒绝、`export --version` 透传、净销售样板 validate/diff/导出通过
  2. 纯函数单测（先例：`test/unit/sap-canonical.test.ts`）：内容指纹——置空五键（G10）、同构建重导出稳定、`MF_GIT_SHA` 变化即漂移且唯一差异为 generator
  3. UI 真实 server + fetch e2e（先例：`test/ui/sap-download.test.ts`）：发布表单成功写盘与登记、校验失败零写盘、重复版本拒绝回显
- 好测试 = 只测外部行为（命令输出/文件产物/HTTP 响应），不测内部函数调用
- 回归门：`npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿

## Out of Scope

- 不改 MetricSchema/InstanceSchema/SAP 包结构；不动契约 v0.2 冻结面
- 不做 API/MCP 消费接口、谱系 ID 机制、审批流、发布门服务化
- 不做批次 2（JuanerAI 侧安装/采用/回执实现、契约 v0.3 修订、消费端载体核对）与批次 3（净销售端到端五点验收）
- 不做：结构化方法对象、假设库、enum 开关、维度字典、executable 状态、场景 removed/modified patch、本体对接、releases 登记的 registry/注册表化
- 净销售样板不进入行业模板

## Further Notes

- 验收标准（继承 proposal，红队 R1 修订后）：
  1. 净销售实例经 CLI 与 UI 各发布 v1.0.0，index 登记完整、双指纹可对账
  2. **同一构建内**同内容重导出 → 内容指纹不变；**版本递增但业务内容零变化 → 内容指纹不变且警告触发**（G10）；翻一个口径开关发布新版本 → 内容指纹变化，旧版本快照字节不变；generator 变化视为内容变化并可见于登记
  3. 同 id@version 重复发布被拒绝（有测试）
  4. `validate` / `diff` / SAP 导出对样板全通过
  5. 全量测试与契约测试不回归
- 批次 2 前置依赖（不阻塞本批次）：JuanerAI 消费端载体指认后做只读核对。

## GRILL 决议（2026-10-12，自盘问；proposal 为约束不重开）

- **G1（升级待裁）旗标语法**：commander 程序级 `--version`（`program.version("0.1.0")`）实测拦截子命令同名旗标（`export i.yaml --version 1.2.3` 只打印 0.1.0，动作未执行）。proposal 所写 `release <instance> --version` / `export --version` 语法不可用。推荐：`release <instance> <version>`（版本为位置参数，必填天然成立）；`export --package-version <semver>`（可选，缺省 0.1.0）。能力决策（"版本可显式指定"）不变，仅表面语法变更。
- **G2 export 不写登记**：`release` 是唯一写 index 的动作；export 恒为临时导出（无登记、无不可变约束）。发布=登记，避免半登记状态。
- **G3 index.yaml 损坏行为**：缺失 → 创建；存在但解析失败/形状非法 → **拒绝发布**（fail-closed，不静默重建不覆盖；修复靠 git 恢复，人工动作）。
- **G4 MCP 不暴露 release**：不加 `mf_release`。发布是人操作；MCP 工具保持草案/只读语义，agent 不得自行发布资产版本。
- **G5 同内容指纹警告呈现**：CLI 打印警告（含既有条目 package@version 对照）后继续；UI 结果页显示警告条。不阻断。
- **G6 release 成功输出**：快照路径、index 追加位置、双指纹、警告（如有）；失败输出 rule + 定位（沿用仓库错误格式）。
- **G7 样板命名**：`net-sales-instance.yaml` → package id `net-sales-instance`；快照 `releases/net-sales-instance/1.0.0.sap.yaml`。
- **G8 UI 表单不含发布人输入**：released_by 沿用 MF_REVIEWER/$USER 约定；表单字段=版本+说明（PRD 已钉）。
- **G9 样板发布产物入库**：`releases/net-sales-instance/1.0.0.sap.yaml` + `releases/index.yaml` 随 SHIP 提交，作为消费指引的真实参照物（对齐 golden artifact 惯例）。
