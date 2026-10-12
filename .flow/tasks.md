# 批次 A+B · 任务切片（tracer-bullet 纵切；自批准，砍线 ≤6）

- [x] 1. F6 前置：装载行为特征测试（cli 坏模板目录 / 坏映射文件）
- [x] 2. F6 共享装载核重构（loader/io 共享核 + cli/release 薄包装；cli 多坏文件终态=全量打印〔GRILL 目标〕、release 坏模板/映射输出保持基线格式，均以 e2e 钉住）
- [x] 3. F3 CLI release 输出补登记序号
- [x] 4. receipt 核心 + CLI `receipt add/list`（schema/对账/收编/重复拒绝）
- [x] 5. UI 回执区块（第 7 块：列表/徽标/粘贴登记，POST /instance/receipts）
- [x] 6. B2 净销售 v1.0.1 预发布 + 指引补句

## 1. F6 前置：装载行为特征测试

**What to build**：重构前钉住 cli 装载行为的特征 e2e——(a) 坏模板目录（合法模板 + 损坏 YAML 同目录）跑 `validate <inst> -t <dir>`：非零退出、输出含坏文件路径与错误文本；(b) `export <inst> --format metricflow --mapping <损坏文件>`：非零退出、输出含 `[mapping]` 与路径。特征测试先行且通过（钉行为，非红绿）。

**Acceptance criteria**：
- [ ] 两条特征测试通过并保留（重构后仍绿）

**Blocked by**: None

## 2. F6 共享装载核重构

**What to build**：`src/engine/loader.ts` 增 `loadTemplatesFromDir(dir)`（扫描+loadTemplate+**收集全部错误**不短路，抛错变体含全部格式化错误）；`src/engine/io.ts` 增 `defaultMappingPath` 与 `loadMappingFile(path)`（result 风格解析校验核）。cli `discoverTemplates`、`loadMapping`/`defaultMappingPath` 与 release `findBaseTemplate`、`loadMappingForRelease` 全部改薄包装（各自错误策略不变：cli 打印全量+exit / release 转 ReleaseError）。`src/ui/server.ts` 拷贝不动。

**Acceptance criteria**：
- [ ] 切片 1 特征测试 + 全量既有测试零回归（cli/release 行为逐字不变）
- [ ] release 的错误行为（首个坏文件、映射 required 损坏）有既有 e2e 背书

**Blocked by**: 1

## 3. F3 CLI release 输出补登记序号

**What to build**：`release` 成功输出「登记」行改 `登记：<indexPath>（追加为第 N 条）`。

**Acceptance criteria**：
- [ ] release e2e 断言 stdout 含「（追加为第 1 条）」

**Blocked by**: None

## 4. receipt 核心 + CLI

**What to build**：`src/sap/receipt.ts`：契约 v0.3 §6.2 zod schema（task_id 非空；package{id,version semver,content_fingerprint,package_fingerprint sha256:64hex}；adopted_metrics/adopted_scenarios 空数组合法；issues_found[]{kind 三枚举,metric?,detail 非空}；computed_at 非空；未知字段忽略）；对账（读 releases/index.yaml 查 id@version 比对 content_fingerprint → 对账一致/对账不一致）；`registerReceipt`（schema 校验→对账→收编副本 `releases/receipts/<slug(task_id)>.receipt.yaml` 含供应侧 received_at+reconciliation；重复文件名拒绝含原 task_id 与已登记时间；index 缺失/损坏拒绝提示先发布或 git 恢复；schema 违规逐行 `[receipt] path: message` 零写盘）；`listReceipts(packageId?)`（received_at 倒序）。CLI 嵌套子命令 `receipt add <file>` / `receipt list [--package <id>]`（列表六列：task_id/package@version/对账状态/adopted 数/issues 数/received_at）。

**Acceptance criteria**：
- [ ] 单测：schema 逐字段 + 未知字段忽略 + kind 枚举 + 空数组合法
- [ ] e2e：add 成功（副本落盘含供应侧字段+对账一致）/重复拒绝/schema 违规零写盘/index 缺失拒绝/损坏拒绝/list 与 --package 过滤

**Blocked by**: None

## 5. UI 回执区块

**What to build**：`.flow/ui-contract.md` RC0–RC6 逐字落地：`src/ui/render.ts` receiptsBlock（列表六列+chip-ok/chip-warn 徽标+空态；粘贴表单 textarea name=receipt 必填）挂实例页第 7 块；`src/ui/server.ts` POST `/instance/receipts`（成功 200 重渲染清空表单+列表含新行；失败 422 值保留逐行错误：schema `[receipt]`/重复含原 task_id+时间/index 缺失或损坏拒绝文案）。

**Acceptance criteria**：
- [ ] UI e2e：列表空态/条目+双徽标/RC3 清空表单/RC3m warn 徽标/RC4 值保留零写盘/RC5/RC6/G5 非本包回执不显示
- [ ] 术语逐字（采用回执/登记回执/对账一致/对账不一致）；零 JS；boundary 文案不改（O1）

**Blocked by**: 4

## 6. B2 净销售 v1.0.1 预发布 + 指引补句

**What to build**：`examples/net-sales-instance.yaml` 的 `refund_amount.refund_to_payment_period` true→false（实例保留翻转态，G10）；CLI 发布 v1.0.1（note="演示：退款归属期间翻转（支付期间→退款完成期间），供消费端验收计算变化"）；`docs/sap-consumption-guide.md` §6 补 v1.0.1 一句。仓库产物（快照+index）随 SHIP 入库。

**Acceptance criteria**：
- [ ] 发布输出无同内容警告；index 恰两条目且内容指纹不同；v1.0.0 快照字节不变（对账复核）
- [ ] 指引 §6 含 v1.0.0/v1.0.1 差异说明

**Blocked by**: None
