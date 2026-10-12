# 批次 1 · 任务切片（tracer-bullet 纵切；自批准，砍线 ≤6）

- [x] 1. 内容指纹 + `release` 命令全链（CLI 纵切）
- [x] 2. `export --package-version` 显式版本旗标
- [x] 3. UI 发布区块（七状态 + 服务端同一管线 + 写白名单扩展）
- [x] 4. 净销售样板资产 + v1.0.0 发布入库
- [x] 5. 消费指引文档 + adoption receipt 格式 + 使用指南边界更新

## 1. 内容指纹 + release 命令全链

**What to build**：`release <instance> <version>` CLI 命令（版本为位置参数，G1）：复用既有 SAP 导出全链（load → materialize → 全量校验 → export gate → 装配 → 整包校验），通过后计算**内容指纹**（规范化序列化置空五键（G10）：`package.fingerprint`/`package.created_at`/`review.exported_at`/`package.version`/`package.namespace`后 SHA-256；generator 不置空，红队 R1），写 `releases/<package-id>/<version>.sap.yaml` 快照 + `releases/index.yaml` append-only 数组条目（package/version/content_fingerprint/package_fingerprint/created_at/released_by/note/file 八字段）。不变量：同 id@version 已存在 → 拒绝（错误含「已发布于 <时间>，请升级版本号」）；index 存在但损坏 → 拒绝发布不静默重建（G3）；内容指纹与既有条目相同 → 允许但警告（G5，输出含既有 package@version 对照）；路径仅由 slug 化 id + semver version 构造，非法写盘前拒绝（R3）。`--note` 可选；`--out` 覆盖 releases 基目录（默认 cwd 相对 `releases/`）。

**Acceptance criteria**：
- [x] `release examples/... --version` 无效语法被 commander 拒绝；`release <inst> 1.0.0` 全链成功，快照与 index 落盘
- [x] 单测：内容指纹置空五键（G10）；同构建重导出稳定；`MF_GIT_SHA` 变化 → 指纹变化且唯一差异为 generator
- [x] e2e：重复 id@version 拒绝（含指引文案）；损坏 index 拒绝；非法 version（含路径分隔符）拒绝且零写盘；同内容指纹警告后继续
- [x] index 为 append-only：二次发布不改写既有行

**Blocked by**: None

## 2. export --package-version 显式版本旗标

**What to build**：`export --format sap --package-version <semver>` 可选旗标（缺省 0.1.0，不写登记——G2）；装配器 version 参数贯通；`createSapExporter` 与 UI 下载路径行为不变。golden artifact（examples/ecommerce-instance.sap.yaml）字节不受影响（再生成 = 0.1.0）。

**Acceptance criteria**：
- [x] e2e：`export --format sap --package-version 2.0.0` 产物 `package.version == "2.0.0"`
- [x] 缺省导出与既有测试/golden artifact 零回归
- [x] `--package-version abc` 被 semver 校验拒绝

**Blocked by**: None（与 1 并行可做；release 管线不依赖本条）

## 3. UI 发布区块

**What to build**：实例页第 6 块「发布」（UI 契约 R1–R7，`.flow/ui-contract.md` 冻结）：表单（版本号 required pattern semver + 变更说明 textarea）POST `/instance/release` → 服务端复用 release 管线（与 CLI 同函数，零第二套规则）；成功/警告 200 重渲染（快照路径+index 位置+双指纹；警告条含既有对照），各类失败 422 同页重渲染 + 值保留 + 逐行错误；侧栏边界声明更新为含 releases/（D3）；写白名单显式扩展 releases/。零 JS、服务端校验权威。

**Acceptance criteria**：
- [x] UI e2e（真实 server + fetch，先例 test/ui/sap-download.test.ts）：R1 表单渲染、发布成功写盘+index 追加、重复版本 422 回显、非法 semver 422、实例校验失败零写盘、index 损坏 422
- [x] 原型七状态与实现输出一一对应（术语逐字一致）
- [x] 工作台写白名单外路径零写入（负面测试）

**Blocked by**: 1（服务端复用 release 管线函数）

## 4. 净销售样板资产 + v1.0.0 发布入库

**What to build**：`examples/net-sales-instance.yaml`（fork ecommerce-marketplace@0.1.0）：added `refund_amount`（`refund_to_payment_period: true`、`include_pending_refund: false`）与 `net_sales`（derived，expr `gmv - refund_amount`，definition 写明 gmv 含退款前提）；实例口径 `gmv.include_refund: true`；added_scenarios `net_sales_review`（问题树 净销售额变化←销售额侧/退款侧；角色 net_sales=outcome、gmv/refund_amount=driver、refund_rate=guardrail；method_refs 引用标识）。不带 bindings。经 CLI 发布 v1.0.0，快照 + index 条目随 SHIP 入库（G9）。

**Acceptance criteria**：
- [x] `validate` / `diff` / `export --format sap` 对样板全通过（场景引用完整）
- [x] `releases/net-sales-instance/1.0.0.sap.yaml` + index 条目真实存在、双指纹可对账
- [x] 样板 definition 含「gmv 含退款」前提文字（红队 R4）

**Blocked by**: 1

## 5. 消费指引文档 + receipt 格式 + 边界更新

**What to build**：`docs/sap-consumption-guide.md`：取得（精确 id@version、禁 latest、从 releases/ 取）、校验（结构/双指纹/重复身份/未审 LLM；移植供应侧校验器需补 LLM 未审规则）、字段消费语义（caliber_switches 改变计算、type_params 公式、aggregation 与比例重算、bindings=设计态草案、任务 Binding 为准、question_tree=参考骨架非执行路径）、版本不可变与内容指纹对账（含 generator 漂移语义，红队 R1）、净销售样板勾稽示例。adoption receipt 格式冻结（task_id/package 双指纹/adopted_metrics/adopted_scenarios/issues_found[kind: caliber_ambiguity|missing_data|trial_issue]/computed_at）。`docs/工作台使用指南.md` 发布区块章节 + 边界声明同步。

**Acceptance criteria**：
- [x] 指引覆盖 PRD Implementation Decisions #10/#11 全部语义点，术语与 UI 契约 T 表一致
- [x] receipt 格式含 kind 枚举与双指纹
- [x] 使用指南含发布流程与边界声明新文案

**Blocked by**: 4（指引引用真实发布物）
