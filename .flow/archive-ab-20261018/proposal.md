# 批次 A+B · 评审收尾与回执登记备料 · 方案（proposal）

> 规格源：2026-10-12 会话，用户裁决"做 A+B"。上游基线：批次 1 评审遗留（.flow/archive-b1-20261012/review-findings.md F3/F6）+ 消费指引 §7 回执格式（契约 v0.3 §6.2 升格正文）+ 批次 3 验收点 2 备料需求。本文件是后续 PRD/GRILL/ISSUES/REVIEW 的唯一规格源。

## 目标

三件事：①清掉批次 1 评审遗留的两项 Low（F3 CLI 序号输出、F6 装载编排去重）；②把 adoption receipt 的**供应侧接收端**建起来（登记 + 对账 + 查看——不依赖 JuanerAI，消费端 2b 启动后直接对接）；③预发布净销售 v1.0.1 演示包（批次 3 验收点 2 备料）。

## 范围（四项）

### A-F3 · CLI release 输出补追加序号

- 成功输出的「登记」行补「追加为第 N 条」（N = `ReleaseResult.indexEntryNumber`，UI 侧已展示，CLI 缺）
- e2e 断言补齐

### A-F6 · 模板/映射装载编排去重

- `src/engine/loader.ts` 增共享 `loadTemplatesFromDir(dir)`（扫描 + loadTemplate + 格式化错误，抛错变体）；`src/cli/index.ts` discoverTemplates 与 `src/sap/release.ts` findBaseTemplate 改为薄包装（各自保留错误策略：cli 打印退出 / release 转 ReleaseError）
- 映射装载共享核移入 `src/engine/io.ts`（`defaultMappingPath` + 解析校验核心，result 风格）；cli loadMapping 与 release loadMappingForRelease 改薄包装
- `src/ui/server.ts` 既有拷贝**本批不动**（记录后续合并）
- 全量测试零回归（cli/server/release 行为不变）

### B1 · adoption receipt 供应侧登记/对账/查看

- **回执格式**：契约 v0.3 §6.2 已冻结（task_id / package 四件 / adopted_metrics / adopted_scenarios / issues_found[kind 三枚举] / computed_at），zod schema 落地
- **登记**：回执文件放入约定目录（目录定名 GRILL 裁决，候选 `releases/receipts/`），CLI `receipt <file>` 校验后收编为 `<task_id>.receipt.yaml`；schema 违规拒绝零写盘；同 task_id 重复登记拒绝
- **对账**：登记时对照 `releases/index.yaml`——package@version 存在且 content_fingerprint 一致 → 状态「对账一致」；不一致或包不在登记 → 状态「对账不一致」（**记录不拒绝**——失真回执也是反馈）
- **查看**：CLI `receipt list`（列表：task/包/状态/issue 数）；UI 实例页新增回执区块（本包回执列表 + 对账状态徽标；登记入口 = 粘贴 YAML 表单，零 JS 服务端校验，失败保留值逐行报错）
- 指纹对账用 G10 五键算法（既有 `contentFingerprint`）

### B2 · 净销售 v1.0.1 演示包预发布

- 翻转 `refund_amount.refund_to_payment_period`（true → false，归属退款完成期间），发布 v1.0.1（note 说明演示用途）
- 不变量自证：v1.0.0 快照字节不变、内容指纹不同、无同内容警告、index append-only
- 消费指引 §6 补一句 v1.0.1 已发布（供批次 3 验收点 2 直接使用）

## 验收标准

1. `release` CLI 输出含「追加为第 N 条」（e2e）
2. F6 重构后全量门零回归；cli/release 的错误行为逐条不变（有既有测试背书）
3. receipt：合法回执登记成功（文件收编 + 状态「对账一致」）；schema 违规拒绝零写盘；重复 task_id 拒绝；对账不一致 → 记录 + 状态徽标；`receipt list` 可见
4. UI 回执区块：列表/状态徽标/粘贴登记成功与失败（保留值 + 逐行错误）均有测试；术语与契约 v0.3 §6.2 一致
5. v1.0.1 发布后：index 两条目、内容指纹不同、v1.0.0 字节不变
6. 全量门（lint + typecheck + test + contract-test）不回归

## 显式不做（非目标）

- 消费端（JuanerAI 侧）安装/采用实现——批次 2b 等通知
- receipt 自动接收/网络回传——文件交付手工模式
- server.ts 既有装载拷贝合并（记录，后续批次）
- 假设库/策略库/结构化方法对象/enum 开关/维度字典/谱系 ID/场景 patch 段/executable 状态——维持后置裁决
- 发布历史列表 UI（批次 1 负面清单 N5 维持）

## 背景依据

- 批次 1 REVIEW#1 发现 #3/#4（F3/F6，记录未动）；用户 2026-10-12 裁决"做 A+B"
- 契约 v0.3 §6.2 回执格式已冻结；批次 3 验收点 2 需要 v1.0.1 演示包
