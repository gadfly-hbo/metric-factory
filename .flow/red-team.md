## Red-Team: M3 治理闭环（审计 JSONL 落盘+轮转 + 预算账本 + provenance 真值 + 调用统计）

> 证据基线：`vendor/pi-agent-runtime-0.4.3.tgz`（dist/types.d.ts、dist/index.js、dist/budget.js、docs/UNCAPPED-BUDGET-CONTRACT.md 逐行核验）、deep-research 生产实现（`src/adapters/piRuntime.ts`、`src/server/fileBudgetStore.ts`）、metric-factory 现行代码与测试全量走读、M1/M2 handoff。以下每条论断均附出处。

### 先回答四个指定核查点（结论前置）

**(a) RuntimeOptions 原生支持 budgets 吗？——支持，且 M3 必须用原生缝。** `RuntimeOptions.budgets?: BudgetStore`（types.d.ts），缺省 `createMemoryBudgetStore()`（dist/index.js:22，"Same-process reference only; no durability, no cross-process lock"）。关键约束：MF 走 `UncappedLimits`（cumulative:"unlimited"），runtime 在 uncapped 策略下**要求 store 必须实现 `claimUncapped`，否则直接 `CAPABILITY_UNAVAILABLE` 拒绝**（dist/index.js:220-222）；且 `reserveModelUpTo(maximum)` 必须恰好返回 `maximum`，否则 `STATE_FAILED`——host 不能在预留环节缩量，**累计上限只能在 claim 时以抛 `RuntimeFault('BUDGET_EXHAUSTED')` 拒绝**，映射为 `status:'blocked'` + `reason:'BUDGET_EXHAUSTED'`（dist/index.js:82-90），经 pi-client 抛错落入 generate.ts 的 `stage:"call"` 桶——恰好符合红线「阻断只作用于新调用发起」。DR 已有完整文件版先例 `FileBudgetStore`（model-budget.json、tmp+rename 原子写、O_EXCL 跨进程锁 `.model-budget-lock`、死 owner 接管、10 万条 FIFO 剪老）。结论：账本**应该**走原生 BudgetStore 缝，不是自造旁路。

**(b) AuditEvent 足以重建 provenance 真值吗？——足以，机制已逐行验证。** 每个事件的 `provider`/`model` 取自 `current()`（当前候选，dist/index.js:103、append 构造处）；fallback 发生时：失败候选先发 `model.finished{reason:'MODEL_FAILED', failureCategory}` → `candidateIndex++` → 下一候选发 `model.admitted`（attempt 递增，dist/index.js:280-303）。**获胜模型 = `run.finished` 之前最后一对无 failure reason 的 `model.admitted`/`model.finished` 的 provider/model**。MF 恒传 `modelRecovery:{extraAttempts:1}` → attempt 字段恒在场。RunResult 确实不含 provider/model（types.d.ts RunResult 定义），M1 判断正确。

**(c) 抛错 sink 杀调用——确认，且比 proposal 写的更糟一点。** dist/index.js:112-116：`append` 的 catch 置 `fault = RuntimeFault('AUDIT_FAILED')`，run 以 AUDIT_FAILED 终结。**且每个 append 被 `controlled()` 包住，受 `controlTimeoutMs`（MF 现值 30s）约束、串行 await（auditTail 链）**：磁盘挂起不是「静默慢」，是每事件最多拖 30s 然后**杀死调用**。DR 的 sink（piRuntime.ts:166-178）**会抛**（appendFile 错误透传 + `signal.aborted` 主动抛）——DR 生产接受了「保账本杀调用」语义。proposal 把它列为开放问题是对的，但漏了两点：① 30s×≥4 事件的挂起维度；② **runtime 还有第三条通道 `onEvent`——fire-and-forget、错误显式吞掉**（dist/index.js:124，"Observation cannot grant authority or block execution"），是结构上不可能杀调用的观察缝，proposal 全文未提及。另注意时序开放问题已有确定答案：**audit sink 的 `run.finished` append 在 runText 返回前被 await**（dist/index.js:382 后紧跟 return），同进程 sink 捕获无竞态；onEvent 无此保证。

**(d) 测试密闭性——现状干净，M3 有三个具体破口。** 现行测试全密闭：unit llm 测试用内存 sink + `__testHooks.clearCache()`（test/unit/llm-runtime.test.ts:16-18,70）；UI 测试 faux 后端 + mkdtemp（test/ui/drafts.test.ts:14-23，faux 在 createLlmClientFromEnv 即短路，永不触 pi）；CLI e2e 全 faux。破口见失败模式 #5。

### Top Kill-Assumptions (ranked)

#### 1. 「四项共用同一数据源（审计事件）」——**事实错误，已证伪**

- **Claim:** 审计 JSONL 是审计、预算账本、provenance、调用统计四项的共同数据源。
- **Fails if:** 按此设计统计页与账本——**AuditEvent 结构上没有任何 usage/token 字段**（types.d.ts 全字段：version/taskId/runId/sequence/kind/at/provider/model/contextVersions/digest/toolName/toolFailed/reason/attempt/failureCategory/session/invocation；dist 中 run.finished 也不带 usage，RunResult.usage 来自 lease.snapshot() 而非事件）。token 真值只存在于两处：`RunResult.usage`（**而 pi-client 的 complete() 只返回 `result.value`，usage 被丢弃**，pi-client.ts:95）和 host BudgetStore 的 `settleModelUsage(reserved, {inputTokens, outputTokens})` 回调。调用次数可从 `model.admitted` 计数（带 provider/model），tokens 不行。
- **Kill criterion:** 不杀 M3，杀这条架构表述。PRD 若保留「同一数据源」措辞并据此排任务，统计页与账本会在实现期返工。
- **Cheapest test:** 0 成本（已验）。修正方向：真值管道 = 「complete() 边界同时交还 text+usage+provider/model」或「审计事件（taskId→provider/model）⋈ 账本 settle（taskId→tokens）」。DR 正是后者形态：model-audit.jsonl 与 model-budget.json 按 taskId 可连接。

#### 2. provenance/usage 真值可在「LlmClient 接口不变」下取得——**自相矛盾，五处调用点均无关联键**

- **Fails if:** 调用点拿不到 taskId——`mf:${kind}-${seq>` 在 pi-client 内部生成（pi-client.ts:87-88），`complete(req): Promise<string>`（types.ts:7-9）既不接收也不返回关联句柄。UI draft job 是 fire-and-forget 并发（server.ts:322-350，jobs Map），「最近一次事件」式 hack 在两 job 并飞时串线。usage 同理被 complete() 丢弃。**「真值 provenance」与「LlmClient 接口不变」二者必舍其一或显式修约。**
- **Kill criterion:** spike 无干净归因（预期如此）→ PRD 必须显式修约接口（如 `complete(req, ctx?)`，ctx 承载 provenance/usage 出参，或返回类型加宽），并把「接口不变」红线改写为「业务调用点零语义变化」。
- **Cheapest test:** 20 行 spike：同 client 并发两次 complete() + capture sink，尝试把两段输出各自归因到正确的 provider/model（半小时，零网络）。

#### 3. 「DR 先例优先」覆盖预算超限行为——**DR 根本没有 token 上限先例；且原生 budgets 是 per-task 的**

- **Fails if:** 把两件事混为一谈。DR 的 `FileBudgetStore` 是**耐久性账本，零累计上限 enforcement**（fileBudgetStore.ts:169-195：uncapped 路径 reserve 永不拒绝）；DR 的「预算」是应用层 BudgetTracker（maxSearches/maxFetches/墙钟，gatherDomain.ts:334-341），非 token、非 runtime budgets。runtime 侧 budget 以 **taskId 为权威账本单位**（UNCAPPED-BUDGET-CONTRACT.md），而 MF 每次 complete() 都是**新 taskId**——原生 store 天然不跨调用累计。MF 要的「可设上限、超限有行为」是**净新设计**：上限状态必须活在 host 侧（文件/内存），要么在 claimUncapped 里查表拒绝（原生缝，换来精确的 reserve/settle 计量），要么在调用点预检（简单，但计量仍需 #1/#2 的 usage 管道）。单位、默认值、阻断/警告、重置窗口全部无先例可继承。
- **Kill criterion:** PRD 若写「超限行为沿用 DR 先例」——该句 kill，改为「DR 先例只覆盖文件布局/锁/轮转值，超限语义为本批新决策」。
- **Cheapest test:** 已完成。附带一击：**pi-client 单例缓存会静默丢弃后来的 sink/budgets**——cacheKey 只含链+key 指纹（index.ts:187,191-195），`cache.set` 仅在键缺席时执行（pi-client.ts:67-69），同键第二 sink 无效。M3 若审计路径随 env/测试注入变化，缓存命中即写错地方。3 行测试可证：同 cacheKey 两次构造、不同 sink，断言第二 sink 收不到事件。**杀点：cacheKey 不并入 sink/store 身份 → 测试密闭性必破。**

#### 4. JSONL 落盘换掉 no-op 后调用可靠性不降——**磁盘故障变成「模型调用失败」，且轮转有丢行窗口**

- **Fails if:** ① ENOSPC/EACCES/只读 cwd 下，**所有** generate/refine 以 `模型调用失败（AUDIT_FAILED）` 失败——用户归因到模型而非磁盘；② 磁盘挂起时每事件最多 30s 串行拖滞（controlTimeoutMs）再杀；③ DR 式「写前 stat→rename」轮转在并发 append 下有竞窗，DR 自己披露丢 1-2 行（piRuntime.ts:162-163）；④ proposal 未提及的 `onEvent` 通道（错误吞掉、不阻塞）提供了「结构上永不杀调用」的写盘点，代价是 runText 返回时无落盘保证 + 需内部串行队列保行序。
- **Kill criterion:** 实现若让 sink 的任何 I/O 异常透传到 runtime（即复制 DR 的抛错语义）而 GRILL 未显式裁决「保账本杀调用」+ 设置页无「审计降级」呈现 → 违反「审计是事后记账」红线的精神，该实现 kill。安全下限：never-throw 包裹 + 内存丢弃 + 一次性降级提示，或整体走 onEvent。
- **Cheapest test:** 5 行 vitest：scripted-transport + 首次 append 抛错的 sink → 断言 complete() rejects /AUDIT_FAILED/（零网络）。

#### 5. 测试密闭性：「faux 不落盘」现状会自动延续——**三个具体破口**

- **Fails if:** ① **默认路径解析**：若审计路径缺省落 cwd/工作区（DR 先例恰是 workspace 相对），真实运行与非注入测试会在仓库根落文件——**现行 .gitignore 无任何审计/账本条目**（已核验）；② **急切构造**：若 sink 在 createLlmClientFromEnv 构造期就建目录/开文件，设置页 status 探测（每次渲染构造 client）会「看一眼设置就长文件」——DR 先例是 append 时才 mkdir（piRuntime.ts:168），必须照抄；③ **单例缓存**（见 #3 附带一击）：同链同 key 不同审计目录的相邻测试互相吞 sink。
- **Kill criterion:** 任何测试在其 mkdtemp 之外写审计/账本文件，或全门跑完 git status 出现未跟踪产物 → 密闭性红线破，kill 该实现。faux 记账问题随之消解：faux 在工厂短路，天然零文件依赖，GRILL 可放心裁「faux 不记账」。

### What's Well-Reasoned

- **挂点单点替换属实且够用**：`opts.auditSink` 直通 `createRuntime({audit})`（pi-client.ts:79），缺省 NOOP_AUDIT 永不抛错；M1 的「AUDIT_FAILED 杀调用」警告与 runtime 实现逐字吻合。
- **provenance 真值机制成立**（核查点 b）：事件链带每候选 provider/model + attempt，fallback 后胜者可精确重建；「runText 的 RunResult 不含 model」判断正确。
- **密钥结构性不入审计**成立：AuditEvent 无任何 key 字段；DR 落盘实现亦只写事件行。唯一新增物是 prompt 的 sha256 digest（内容指纹而非明文），与 DR 生产同口径，可接受但值得注记。
- **时序开放问题其实已关闭**：audit sink 的 run.finished 在 runText resolve 前被 await——同进程回填无竞态（onEvent 才有竞态）。
- **范围裁剪干净**：M4 否决、多租户、refine prompt 加固、M2 收口包全部挡在门外。
- **验证门与真实用例设计对**（主备容灾下 provenance 显备候选——scripted-transport 双候选畸形回退即可无网络复现）。

### What I Couldn't Assess

- 预算的**产品语义**（单位/默认上限/阻断 vs 警告/时间窗/解除交互）——proposal 显式留给 GRILL，且如 #3 所证无 DR 先例可偷，是本批最大的净新决策面。
- 审计文件路径的**用户侧合理性**（工作区相对 vs `~/.metric-factory`）。
- 统计页口径（今日/累计、按模型/按用途）纯 UI 产品决策。
- 小疵：proposal 称「四个调用点」实列五处（CLI generate/refine、MCP 两工具、UI draft job）——cosmetic。

---

**Verdict: GO** — 无 kill 准则已满足；四个指定核查点全部对 M3 有利。**并入 PRD 的条件（按序）：**

1. 删除「四项共用同一数据源（审计事件）」表述：tokens 真值管道 = complete() 边界交还 usage+provider/model，或审计事件⋈账本 settle 按 taskId 连接；并据此排任务。
2. 显式修约 LlmClient 接口（complete 增加 ctx 出参或返回加宽），红线改写为「调用点零语义变化」；禁止无关联键的全局回填 hack。
3. 预算账本走原生 `RuntimeOptions.budgets`（host BudgetStore，照 DR FileBudgetStore 的锁/原子写/接管；uncapped 策略必须实现 claimUncapped）；超限语义声明为本批净新决策，阻断经 claim 抛 `BUDGET_EXHAUSTED`（天然只作用新调用）。
4. 审计 sink 定为 never-throw（内部队列 + 降级提示），或 GRILL 显式裁决「保账本杀调用」并附设置页降级呈现；评估 onEvent 备选通道；轮转采纳 DR 值（50MB×2 代、.1 后缀、丢 1-2 行披露）。
5. pi-client 缓存键并入 sink/store 身份；sink 构造必须惰性（append 时才 mkdir）；.gitignore 补审计/账本条目；验收门加「全门跑完 `git status --porcelain` 零新增 + 负测试：仅构造不落文件」。
