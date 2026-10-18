# 批次 A+B · 评审收尾与回执登记备料 · PRD

> 规格源：`.flow/proposal.md`（用户裁决"做 A+B"）；红队处置：`.flow/red-team.md`（R1–R3）。无 issue tracker，落盘本文件。

## Problem Statement

批次 1 交付了"发布一个明确版本"的闭环，但还有三处尾巴：①CLI 发布输出缺登记序号（UI 有、CLI 无）；②模板/映射装载逻辑在 CLI 与 release 两处编排重复，存在漂移风险；③adoption receipt 格式已随契约 v0.3 冻结，但供应侧没有任何接收端——消费端（2b 启动后）回执无处登记，批次 3 的"追溯哪个任务采用了哪个版本"没有承载物。此外批次 3 验收点 2 需要的"口径翻转演示包"尚未备好。

## Solution

四件事：①CLI `release` 输出补登记序号（F3）；②把模板目录装载与映射装载抽成共享核，CLI 与 release 改薄包装（F6，重构前先钉行为测试）；③实现回执的 zod schema + `releases/receipts/` 登记 + 对照 releases/index.yaml 的自动对账 + CLI 登记/列表命令 + 实例页回执区块（粘贴登记 + 列表 + 对账状态徽标）；④翻转净销售样板退款归属期间开关，预发布 v1.0.1 演示包。

## User Stories

1. As a 数据工程师, I want CLI 发布输出显示登记条目序号, so that 终端发布与工作台发布的信息面对等
2. As a 数据工程师, I want 模板/映射装载只有一份共享实现, so that 未来改装载规则不会出现 CLI 与发布两处漂移
3. As a 消费端工程师, I want 把回执 YAML 交给供应侧登记, so that 我的口径歧义与缺失数据反馈有正式通道
4. As a 业务分析人员, I want 在实例页看到"哪些任务采用了这个包的哪些版本、对账是否一致、提出了什么问题", so that 资产被真实使用的反馈可见
5. As a 业务分析人员, I want 粘贴 YAML 即可登记回执, so that 不用终端也能完成登记
6. As a 审计者, I want 失真回执（指纹对不上）被记录但显式打上"对账不一致"徽标, so that 反馈不丢失也不被误信
7. As a 消费端工程师, I want 供应侧预先发布 v1.0.1 演示包（归属期间翻转）, so that 我验收"合法改口径→计算真实变化"时有现成对照物

## Implementation Decisions

1. **F3**：CLI `release` 成功输出「登记」行改为 `登记：<indexPath>（追加为第 N 条）`；e2e 补断言。
2. **F6 共享核**：
   - `src/engine/loader.ts` 新增 `loadTemplatesFromDir(dir): Promise<Template[]>`——扫描 + loadTemplate + **收集全部错误**（不短路，红队 R1）后以抛错变体返回；`src/cli/index.ts` 的 `discoverTemplates` 与 `src/sap/release.ts` 的 `findBaseTemplate` 改薄包装（cli 保留打印+exit 策略，release 保留 ReleaseError 策略，行为逐字不变）
   - `src/engine/io.ts` 新增 `defaultMappingPath(instancePath)` 与 `loadMappingFile(path): { ok: true; mapping } | { ok: false; reason: string }`（解析+校验核心）；cli 的 `loadMapping` 与 release 的 `loadMappingForRelease` 改薄包装（各自策略不变）
   - **前置**：先补 cli 坏模板目录特征 e2e（输出含坏文件路径与错误、非零退出），钉住行为再重构
   - `src/ui/server.ts` 既有拷贝本批不动（记录）
3. **回执目录与命名**：`releases/receipts/<task_id>.receipt.yaml`（登记副本，收编原文件内容规范化重排后落盘；原始上传文件不保留）；`receipts/` 子目录不参与 index 对账、不是发布物（红队 R2）。
4. **receipt schema（zod，对齐契约 v0.3 §6.2 逐字段）**：`task_id`（非空）、`package{id, version(semver), content_fingerprint(sha256:64hex), package_fingerprint(sha256:64hex)}`、`adopted_metrics[]`（name 非空，允许空数组）、`adopted_scenarios[]`（id 非空，允许空数组）、`issues_found[]`（kind ∈ caliber_ambiguity|missing_data|trial_issue，metric 可选，detail 非空，允许空数组）、`computed_at`（非空）。未知字段忽略（向前兼容）。
5. **对账规则**：登记时读 `releases/index.yaml`（缺失/损坏 → 登记拒绝，提示先发布或修复登记）——查 `package.id@version` 条目：存在且 `content_fingerprint` 一致 → `对账一致`；存在但不一致，或条目不存在 → `对账不一致`（**记录入库 + 徽标**，不拒绝——红队 R3）。
6. **CLI**：`receipt add <file>`（登记）与 `receipt list [--package <id>]`（列表）。登记成功输出：task、包@版本、对账状态、issue 数；重复 task_id → 拒绝（含已登记时间，append-only 纪律）；schema 违规 → 逐行 `[receipt] path: message`，零写盘。
7. **UI 回执区块**：实例页**第 7 块**（发布区块之后）；两部分——(a) 本包回执列表（task_id / 版本 / 对账状态徽标 / adopted 数 / issues 数，按登记时间倒序），(b) 「登记回执」粘贴表单（textarea 粘贴回执 YAML + 提交）：服务端校验 + 对账，成功 200 重渲染列表含新回执、表单清空；失败 422 保留值逐行报错（schema 错 `[receipt] …`、重复 task、index 缺失/损坏各自明确文案）。零 JS、零写盘失败纪律与发布区块同款。区块仅在工作区存在 `releases/` 或已有回执时渲染列表部分，表单恒渲染。
8. **B2 v1.0.1**：编辑 `examples/net-sales-instance.yaml` 的 `refund_amount.refund_to_payment_period` true→false，`release examples/net-sales-instance.yaml 1.0.1 --note "演示：退款归属期间翻转（支付期间→退款完成期间），供消费端验收计算变化"`；产物入库（v1.0.0 快照字节不变、内容指纹不同、无警告）；消费指引 §6 补 v1.0.1 一句。

## Testing Decisions

- 测试缝（沿用批次 1 三缝，零新增）：
  1. CLI 进程边界 e2e（先例 `test/cli/release.e2e.test.ts`）：F3 序号断言；F6 前置特征测试（坏模板目录）；`receipt add` 成功/重复/schema 违规零写盘/对账双态/`receipt list`
  2. 纯函数单测（先例 `test/unit/sap-canonical.test.ts`）：receipt schema 逐字段（含未知字段忽略、kind 枚举、空数组合法）
  3. UI 真实 server + fetch e2e（先例 `test/ui/release.test.ts`）：回执区块列表/徽标、粘贴登记成功与三类失败（schema/重复/index 损坏）、失败值保留
- 好测试 = 外部行为（命令输出/文件产物/HTTP 响应）；重构前置特征测试先行（F6）
- 回归门：`npm run lint && npm run typecheck && npm run test && npm run contract-test`

## Out of Scope

- 消费端（JuanerAI 侧）安装/采用/回执产出实现——批次 2b 等通知
- receipt 网络回传/自动接收；server.ts 装载拷贝合并；发布历史列表 UI（N5 维持）
- 假设库/策略库/结构化方法对象/enum 开关/维度字典/谱系 ID/场景 patch 段/executable 状态——维持后置

## Further Notes

- 验收标准继承 proposal §验收（六条），Testing Decisions 落地为测试后即为完成证据。
- B2 发布动作本身是数据操作（写 releases/），随本批提交入库；其验证 = 发布命令输出 + 快照对账断言（e2e 覆盖翻转路径，仓库内产物用对账脚本复核）。

## GRILL 决议（2026-10-12，自盘问；proposal/PRD 为约束不重开）

- **G1 `receipt list` 输出**：列 = task_id / package@version / 对账状态 / adopted 数 / issues 数 / received_at，按登记时间倒序；`--package <id>` 过滤。
- **G2/G3 登记副本含供应侧字段**：收编副本在契约回执格式外追加供应侧字段 `received_at`（登记时间）与 `reconciliation: { status: 对账一致|对账不一致, checked_at }`——对账只在登记时刻计算并落盘；`receipt list` 与 UI 列表读副本，零 index 运行时依赖。
- **G4 task_id 字符集**：不限制消费端 task_id 字符集（契约只定非空）；收编文件名 = `slugify(task_id) + ".receipt.yaml"`（沿用发布侧 slug 惯例）；重复检测按收编文件名——slug 冲突即重复拒绝，文案含原 task_id 与已登记时间。
- **G5 登记与实例解耦**：`receipt add` 与 UI 粘贴登记**不**校验回执 package 与当前实例一致（回执按全局收编）；UI 列表按当前实例包 id 过滤展示，表单辅助文案说明「回执按包全局登记，此处仅展示当前包」。
- **G10 B2 实例终态**：`examples/net-sales-instance.yaml` 保留翻转后状态（`refund_to_payment_period: false`），使发布物与源实例一致；消费指引 §6 补 v1.0.0/v1.0.1 差异说明。
- **F6 错误策略**（红队 R1 兑现）：共享核收集全部错误不短路；cli 打印全量后退出，release 转 ReleaseError 报首个坏文件。**收敛勘误（REVIEW#1 后）**：①基线 cli 实为「首个坏文件即退出」，红队 R1 所记「收集全部」系目标行为而非基线——cli 终态按 GRILL 目标执行（全量打印），多坏文件特征测试钉住；②共享实现为 result 风格（`TemplatesDirResult`，策略归调用方），非 PRD #2 字面的抛错变体，行为要求（收集全部不短路）不变；③release 坏模板输出保持基线逐字格式（首个坏文件全部 zod 错误、`[schema]` 前缀，基线 f525be6 比对）；装载策略较基线收紧为整目录健康门（基线在坏文件排序位于目标模板之后时会跳过坏文件，REVIEW#2 F-1 实验证实），方向为收紧、无正确性风险。
- commander 嵌套子命令 `receipt add|list` 已实证可用（v15）。
