# M3 · 任务切片（tracer-bullet 垂直切片）

> 规格源：`.flow/prd.md`（D1–D12 + GRILL 附录 G1–G8 + R2 探索即答）+ `.flow/ui-contract.md`（ST1–ST5/F1）。无 tracker，落盘本文件。

- [x] 1. 真值管道（tracer：complete() 返回加宽 + onEvent 捕获）
- [x] 2. 审计 JSONL sink + 数据目录 + 缓存键身份
- [x] 3. 预算账本（原生 budgets + 四要素阻断）
- [x] 4. caller 标签 + provenance 回填 + 三入口接线
- [x] 5. 统计卡 + 密闭性验收 + 真实用例 + README

---

## 1. 真值管道（tracer）

**Blocked by**: 无
**User stories**: US4（+D1/D2/D5/G4/G5）

### What to build

`LlmClient.complete()` 返回加宽为 `{ text, usage?: { modelCalls; inputTokens?; outputTokens }, provider?, model?, taskId? }`：pi-client 用 `createRuntime({ onEvent })` 同步写闭包内 `Map<taskId, {provider, model}>`（取无 reason 的 `model.finished` last-wins），runText 后按本调用 taskId 取真值并删除；INVALID_OUTPUT 路径返回 `{text:"", usage, provider, model, taskId}`（截断但出稿照带真值）；失败仍 throw。faux/fake-client 返回 `{text}`。usage 收窄三字段。既有引擎缝断言机械更新。

### Acceptance criteria

- [ ] 双候选主畸形回退：complete() 的 provider/model = 备候选（scripted transport，无网络）
- [ ] usage/taskId 透传断言；INVALID_OUTPUT 带真值；faux 只带 text
- [ ] 并发两次 complete() 各自归因正确（关联键证明，零串线）
- [ ] typecheck + 全量单测绿

## 2. 审计 JSONL sink + 数据目录 + 缓存键身份

**Blocked by**: 1
**User stories**: US1、US6、US7、US10、US11（+D3/D8/D10/D11/D12/G2/G3）

### What to build

`src/llm/audit-sink.ts`：never-throw 文件 sink——内部串行队列保行序、append 时才 mkdir（惰性）、一切 I/O 异常吞掉 + per-path 一次性降级标志（导出 getter）、轮转 50MB×2 代 `.1` 后缀（上限可注入供测试）。数据目录：`MF_DATA_DIR` env（缺省 `~/.metric-factory/`，文件名 `model-audit.jsonl`/`.model-budget-lock` 等 DR 原名）+ **vitest 守卫**（VITEST 在场且未注入时缺省解析 throw）。工厂接线：真实后端的 auditSink 从 no-op 换文件实现（路径从注入 env 读）。pi-client 缓存键并入审计路径指纹（I/O-free 字符串）。`.gitignore` 补条目。

### Acceptance criteria

- [ ] 事件链完整落盘（run.started→model.admitted→model.finished→run.finished 顺序与字段，含 digest 字段）
- [ ] 轮转触发（注入小上限 → rename 出 `.1`）；仅构造 client 不落任何文件（负测试）
- [ ] never-throw：注入抛错 sink → complete() 仍成功 + 降级标志置位（getter 可读）
- [ ] 缓存键：同链同 key 不同审计路径 → 各自收到事件（红队 3 行测试）
- [ ] vitest 守卫测试：测试环境未注入 MF_DATA_DIR 构造真实后端 → 急切 throw
- [ ] 全量验证门绿；门后 `git status --porcelain` 零新增

## 3. 预算账本（原生 budgets + 四要素阻断）

**Blocked by**: 2
**User stories**: US2、US3、US8（+D4/G1/G2/G6/G7）

### What to build

`src/llm/budget-store.ts`：照 DR 布局的 FileBudgetStore（JSON 状态文件、tmp+rename、O_EXCL、死 owner 接管、FIFO 剪老），**锁改 per-op 短临界区**（不横跨模型调用）、文件为唯一权威；`claimUncapped` 入口聚合全部 `mf:*` 条目（tokens=Σ(in+out)、calls=ΣmodelCalls）超限抛 `BUDGET_EXHAUSTED`；store/锁惰性到首次 complete()。env：`MF_LLM_BUDGET_TOKENS`/`MF_LLM_BUDGET_CALLS`（照 parseTimeoutMs 急错，缺省不限）。pi-client 错误组装点拼四要素文案（预算字样/已用 X 上限 Y/账本路径/两条出路）。缓存键并入上限值。

### Acceptance criteria

- [ ] 低上限构造 → complete() 抛错含「预算已耗尽」四要素；settle 后账本文件 tokens 正确
- [ ] 解除：删账本文件 / 调高 env（新构造）→ 恢复
- [ ] UI/CLI 并发安全：per-op 锁下交替变更无损坏（单测模拟交错）
- [ ] 警告数据：用量 ≥80% 可查询（供 T4/T5 消费）；calls 按 attempt 计（重试=2）
- [ ] 全量验证门绿；门后 git status 零新增

## 4. caller 标签 + provenance 回填 + 三入口接线

**Blocked by**: 3
**User stories**: US4、US9（+D5/D6/G7）

### What to build

五调用点（CLI generate/refine、MCP 两工具、UI draft job）传 `caller: "generate"|"refine"`（taskId `mf:generate-<seq>`）；`generateDraft/generateRefineDraft` 组装层从 complete() 真值写 `provenance.model = provider ? "<provider>/<model>" : modelLabel`（modelLabel 降级 fallback，faux 用 "fake"）；CLI stage:call 对含「预算」错误改独立标题（不挂「模型原始输出」头）；CLI/MCP 调用后 stderr 一行预算警告（≥80% 时，每次调用至多一条）。

### Acceptance criteria

- [ ] taskId 前缀按用途（审计事件断言）；provenance.model = 实际出稿（引擎缝双候选回退场景端到端断言到 draft 字段）
- [ ] CLI 预算错误输出无「模型原始输出」标题、含四要素（e2e）
- [ ] 全量验证门绿（既有 e2e 断言机械更新）

## 5. 统计卡 + 密闭性验收 + 真实用例 + README

**Blocked by**: 4
**User stories**: US5、US10、US11（+D7/D9/G8 + UI 契约全状态）

### What to build

设置页统计卡按契约 ST1–ST5（两行汇总 chip 今日/累计、按模型表含用途拆分与合计勾稽、留存脚注、预算警告 chip、降级态、faux 整卡替换、空态）——读路径渲染时只读两文件（无锁）+ 降级 getter（进程态）；F1 错误页零 UI 改动验证。README：预算双 env + `MF_DATA_DIR` + 数据目录说明 + 统计卡口径 + digest 注记。验收执行：全门后 git status 零新增；真实用例——真实零配置调用后审计文件事件链完整 + provenance 真值 + 账本文件 tokens 与 usage 一致。

### Acceptance criteria

- [ ] UI 测试覆盖 ST1/ST2/ST3/ST4/ST5 关键断言（注入临时 MF_DATA_DIR 构造账本/审计 fixture）+ 契约负例抽检（faux 零数字、降级不给假模型列、未设上限无警告）
- [ ] 真实用例：真实调用 exit=0 + 审计事件链留档 + provenance.model 真值 + 账本 tokens 勾稽
- [ ] README 四处同步；全量验证门绿；门后 git status 零新增

---

**VERIFY 备忘**：验证门同 M1/M2；真实依赖用例 = 零配置真实调用后审计/provenance/账本三件套勾稽；密闭性门 = git status 零新增。

---

## REVIEW cycle 1 工作项（2026-10-18，源自 .flow/review-findings.md）

- [x] RB1（B1 blocking）：ST3 降级卡补塌缩单行表（不可用｜账本 calls｜账本 tokens｜不可用｜不可用）+ SE-B 全句降级脚注 + 留存脚注；ST3 测试改正向断言
- [x] RB2（B2 blocking）：F1 四要素 X/Y 千分位；taskId 移出四要素串（模板止于「删除账本文件重新计数。」）
- [x] RB3（B3 blocking）：ST5 空态补留存脚注
- [x] RB4（B4 blocking）：汇总行 chip 语义归位——今日/累计为 chip-queue 标签、数字 .num 在外（ST1-ST5 全态一致）

---

## REVIEW cycle 2 工作项（2026-10-18）

- [x] RB5（B1'）：五态汇总行删除纯文本「今日/累计」前缀（唯一 chip 标签），测试加负断言 not.toContain("<p>今日 <span")
- [x] RB6（B2'+B3'）：ST3 卡顶补一句说明（原型 degraded:212 逐字）+ 今日行 chip 归位（今日进 chip、不可用纯文本）
- [x] RB7（B4'+N-A）：F1 两条出路按超限维度择一 env 名（仅双维同超才并列）；维度短语后空格对齐原型
- [x] RB8（N-B/N-D）：预算测试补千分位实断言（预置大用量账本 ≥10⁴）；ST3 测试加 warn chip 形断言
