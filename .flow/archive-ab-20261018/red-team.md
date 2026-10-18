# Red-Team: 批次 A+B · 评审收尾与回执登记备料

> 评审对象 .flow/proposal.md。判定：**go**（无 kill 判据已满足）。

## Top Kill-Assumptions (ranked)

### 1. F6 共享装载核的行为等价性（最高风险）
- **Claim**: cli 的 `discoverTemplates` 与 release 的 `findBaseTemplate` 可共享同一装载核而行为不变。
- **Fails if**: 共享核只返回首个错误——cli 现行为是**收集全部坏模板错误逐行打印再退出**，合并后变成只报第一个（静默行为变化，且该错误路径可能无既有测试捕获）。
- **Evidence**: cli/index.ts:95-119 现实现为循环收集 `loaded.errors` 全量打印；release.ts:106-146 首个 !ok 即抛。
- **Kill criterion**: 若共享核无法同时满足"全量收集"与"抛错"两策略才构成 kill——收集全部错误的 result 结构显然可以，不成立。
- **Cheapest test**: 共享核返回全部错误（不短路）；重构前先补一条 cli 特征测试（坏模板目录 → 输出含坏文件路径与错误文本、非零退出），钉住行为再动。

### 2. receipts 目录置于 releases/ 下的语义稀释
- **Claim**: 回执与发布登记同目录（`releases/receipts/`）语义相容。
- **Fails if**: 用户把 releases/ 理解为"纯发布物"目录，回执混入造成对账脚本（按 index.yaml 遍历快照）误读子目录。
- **Evidence**: 现无任何对账脚本按目录遍历（对账走 index.yaml 条目），风险仅在约定层面。
- **Kill criterion**: 无。
- **Cheapest test**: 目录定名在 GRILL 定（候选 `releases/receipts/`）；指引写明 receipts 子目录不参与 index 对账。

### 3. 对账不一致"记录不拒绝"
- **Claim**: 失真回执应记录并打徽标，而非拒绝。
- **Fails if**: 用户期待强一致，把"对账不一致仍入库"当缺陷上报。
- **Evidence**: 失真回执正是要捕获的反馈信号，拒绝会丢信息；徽标状态在 UI/CLI 均显式可见。
- **Kill criterion**: 无。
- **Cheapest test**: 状态双态有测试（一致/不一致各一）。

## What's Well-Reasoned

- F3/F6 是评审遗留项的原样清偿，范围与评审报告逐字对应，无范围膨胀。
- B1 只做供应侧接收端（文件交付手工模式），与"暂不做 API/MCP"裁决零冲突；对账自动化（对照 releases/index.yaml）是真实价值点而非摆设。
- B2 一次 CLI 命令即完成备料，且有批次 1 不变量（append-only/字节不变/指纹差异）背书。

## What I Couldn't Assess

- JuanerAI 侧回执产出的实际字段填法（2b 未启动）——schema 已按契约 v0.3 §6.2 冻结，风险后置。
