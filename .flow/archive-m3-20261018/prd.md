# M3 · 治理闭环：审计落盘 + 预算账本 + provenance 真值 + 调用统计 · PRD

> 规格源：`.flow/proposal.md`（唯一裁决源）+ `.flow/red-team.md`（GO，5 条件并入）。无 issue tracker，落盘本文件。地基事实见 proposal「M1/M2 交付地基」节（commits `655b84d`、`902574c`）。

## Problem Statement

M1/M2 之后 LLM 调用仍是无痕的：审计 sink 是 no-op（调用不留痕）、没有预算概念（失控调用无闸）、draft 的 provenance.model 是配置面链首标签（主备容灾下失真——M2 零配置默认链下「谁实际出稿」不可知）、设置页看不到用量。治理挂点已埋好（auditSink / taskId / caller 参数），但没接真实账本。

## Solution

把挂点接上账本，一次治理闭环：**审计 JSONL 落盘+轮转**（每次调用留痕：何时/哪个模型/成败/tokens，never-throw 降级语义）；**预算账本**（原生 runtime budgets 缝 + host 文件 store，可设上限、超限阻断新调用并有清晰报错）；**provenance 真值**（complete() 边界交还 text+usage+实际出稿 provider/model，组装层回填 draft）；**设置页调用统计**（按账本回看次数/tokens）。真值管道为**双源**：审计事件（provider/model/kind/taskId）⋈ usage 计量（RunResult/BudgetStore settle），按 taskId 连接——红队证伪了「审计单一数据源」（AuditEvent 无 usage 字段）。

## User Stories

1. 作为**用户**，我想每次 LLM 调用留痕到 JSONL（时间/模型/成败/tokens/用途），以便审计与排查。
2. 作为**用户**，我想设 token 预算上限，超限后**新调用**被阻断且报错点名预算，以便控成本（不影响已产草案的人审/导出）。
3. 作为**用户**，我想预算接近上限时看到警告，以便提前处理。
4. 作为**用户**，我想 draft 的 provenance 记录**实际出稿**的 provider/model（主备回退后显示备候选），以便知道草案到底谁写的。
5. 作为**用户**，我想在设置页看到调用统计（次数/tokens，按模型/用途），以便回看用量。
6. 作为**用户**，我想审计写盘失败**不杀死**模型调用（降级继续 + 页面提示），以便审计故障不变成可用性故障。
7. 作为**用户**，我想审计文件自动轮转（不无限增长），以便长期使用。
8. 作为**用户**，我想预算的解除简单（改 env 上限或清账本文件即恢复），以便快速恢复。
9. 作为**CLI/MCP 用户**，我想 CLI 与 MCP 调用记同一本账（同路径账本），以便 UI/CLI 一本账。
10. 作为**测试/CI**，我想审计/账本路径可注入临时目录、faux 路径零文件依赖，以便测试密闭（全门跑完 git status 零新增）。
11. 作为**用户**，我想密钥与 prompt 明文永不进审计文件（只有 sha256 digest），以便安全预期不变。

## Implementation Decisions

- **D1 · 双源真值管道**：审计事件供 provenance 与调用次数（每事件带 provider/model/kind/taskId/runId/attempt）；tokens 真值从 `RunResult.usage` 交还；两源按 taskId 连接。**不采信「审计事件含 usage」**（红队 KA1 证伪）。
- **D2 · LlmClient 返回加宽（调用点零语义变化）**：`complete()` 返回 `{ text, usage?, provider?, model?, taskId? }`——现有调用点取 `.text`（或解构同名）语义不变；**禁止**「最近一次事件」式全局回填 hack（UI 并发 draft job 会串线）。形状细节（返回对象 vs ctx 出参）GRILL 定，倾向返回对象。
- **D3 · 审计 JSONL sink（never-throw）**：`opts.auditSink` 替换为文件实现——append 时才 mkdir（惰性构造，设置页探针不落文件）；内部串行队列保行序；**一切 I/O 异常吞掉**（内存丢弃 + 一次性降级标志，设置页呈现「审计降级」态）——审计是事后记账，故障不得杀调用（红线；红队 KA4：抛错语义 = AUDIT_FAILED 杀调用 + 30s×N 挂起，明确不采）。轮转照 DR 值：**50MB × 保留 2 代、`.1` 后缀、并发窗口丢 1-2 行披露**。
- **D4 · 预算账本走原生 budgets 缝**：`createRuntime({ budgets })` 接 host `FileBudgetStore`（照 DR 布局：JSON 状态文件、tmp+rename 原子写、O_EXCL 跨进程锁、死 owner 接管、FIFO 剪老）；uncapped 策略必须实现 `claimUncapped`；**超限 = claim 抛 `BUDGET_EXHAUSTED`** → runText blocked → pi-client 抛错文案点名预算 → generate.ts call 桶（天然只阻断新调用，红线保住）。上限配置走 env（维度/默认值 GRILL 定，形态 `MF_LLM_BUDGET_*`）；**超限语义为本批净新决策**（DR 无 token 上限先例，红队 KA3）。
- **D5 · provenance 真值回填**：generate/refine 组装层（engine/generate.ts）从 complete() 返回的真值写 `draft.provenance.model = "<provider>/<model>"`（实际出稿），`prompt_version` 保留；modelLabel 同步取真值（CLI 摘要/MCP note/UI 摘要里的模型名不再用配置面标签）。
- **D6 · caller 标签接上**：五处调用点（CLI generate/refine、MCP mf_generate/mf_refine、UI draft job）传 `caller: "generate" | "refine"`——taskId 变 `mf:generate-<seq>` 等，审计/统计可按用途区分。
- **D7 · 设置页调用统计**：新卡片（不改既有卡片语义），读账本聚合（口径 GRILL 定 + UI-GATE 契约）；审计降级态在此页呈现。
- **D8 · pi-client 单例缓存键并入 sink/store 身份**：cacheKey 增加审计路径/预算 store 身份指纹（红队 KA3 附带一击：否则测试注入被缓存吞掉）；faux 分支不受影响。
- **D9 · faux 不记账**：faux 在工厂短路，天然零文件依赖（红线「测试/演示零网络」不破；统计页对 faux 显示「不记账」说明）。
- **D10 · 审计/账本文件不进 git**：`.gitignore` 补条目；验收门加「全门跑完 `git status --porcelain` 零新增」+ 负测试「仅构造 client 不落任何文件」。
- **D11 · 审计行内容口径**：只写 AuditEvent 原生字段（含 prompt 的 sha256 digest——内容指纹非明文）；永不写 env/key/prompt 明文。
- **D12 · 密闭注入缝**：审计路径与账本路径均可经参数/env 注入（测试指向 mkdtemp）；默认路径 GRILL 定（工作区相对 vs `~/.metric-factory`，红队未能裁决）。

## Testing Decisions

- 好测试标准：外部行为（返回值、文件内容、页面呈现），不测内部实现。先例：llm-runtime.test.ts（引擎缝 scripted transport + capture sink）、llm-env-auto.test.ts（配置缝纯函数）、settings.test.ts（HTTP 边界）。
- **引擎缝单测**：双候选主畸形回退 → complete() 返回备候选 provider/model（无网络复现红队建议的容灾 provenance 场景）；usage 透传；taskId 返回；never-throw（注入抛错 sink → complete() 仍成功 + 降级标志置位）。
- **审计文件单测**：事件链完整落盘（run.started/model.admitted/model.finished/run.finished 顺序与字段）；轮转触发（小上限构造 → rename 出 `.1`）；仅构造不落文件（负测试）；并发行序（串行队列）。
- **预算单测**：构造低上限 store → complete() 抛错含 BUDGET_EXHAUSTED/预算字样；settle 后账本文件 tokens 正确；解除（清账本文件/调高上限）恢复。
- **缓存键单测**：同链同 key 不同 sink/store → 各自收到事件（红队 3 行测试）。
- **UI 测试**：统计卡片呈现（注入临时账本）；审计降级态；预算超限错误页点名预算。
- **密闭性验收**：全门后 `git status --porcelain` 零新增；faux 路径无文件产出。
- **真实用例**：真实调用后审计文件出现完整事件链 + provenance.model = 实际出稿模型（本机 auth.json 默认链）。
- 验证门不变：`npm run lint && npm run typecheck && npm run test && npm run contract-test`。

## Out of Scope

- M4：runAgent 会话/工具化草案（红线否决）。
- 多用户密钥托管/多租户账本。
- refine prompt 加固（M1 延期项 1，独立产品决策）。
- M2 遗留 non-blocking 收口包与代码卫生包（handoff 延期项 3/4/5）。
- 审计数据跨实例聚合/导出报表。
- 金额计价（本批只记 tokens/次数，不折算货币）。

## Further Notes

- 爆炸半径：src/llm（pi-client 返回加宽 + 缓存键 + 审计 sink 模块 + 预算 store 模块）、src/engine/generate.ts（provenance 组装）、五调用点（caller 标签 + 返回值取用）、src/ui（设置页统计卡片 + 降级态）、.gitignore、README、测试。env-auto/faux 路径不动。
- 事实修正披露：proposal 目标句「四项共用同一数据源（审计事件）」经红队证伪（AuditEvent 无 usage 字段），PRD 改为双源管道——proposal 已定决策 2 本就并列「审计事件/usage」，决策未变，仅叙事修正。

---

## GRILL 附录（2026-10-18，2x9 预算）

### Round 1（author-blind 子代理，8 包全按推荐裁决）

- **G1（Q1-a）· 上限判定点**：MF FileBudgetStore 在 `claimUncapped` 入口对文件内全部 `mf:*` 条目聚合（tokens=Σ(input+output)，calls=ΣmodelCalls），超限抛 `BUDGET_EXHAUSTED`——保住 D4「原生缝+claim 抛错」字面与 DR 落盘形状。披露三口径：在飞越限（claim 检查/settle 后置，并发 job 可联合越过一个在飞量——成本闸可忍）；FIFO 剪老后累计只数留存条目；崩溃未结算 reservedOutputTokens 计入（保守方向，更早断闸）。
- **G2（Q2-a）· 跨进程锁改 per-op 短临界区**：acquire(O_EXCL)→读→变更→tmp+rename→release，锁绝不横跨模型 HTTP 调用；文件为唯一权威（弃 DR 进程持锁+内存权威——那是单进程服务器形态，照抄会让 UI 开着时 CLI 首调即崩）；DR 五件套（JSON 状态/tmp+rename/O_EXCL/死 owner 接管/FIFO 剪老）保留，仅持锁时长偏离。**store 与锁惰性到首次 complete()**（与 audit sink 同一口径，保 D10 负测试）。红利：文件即权威后无需路径级单例，D8 store 指纹退化为纯路径+上限值（I/O-free）。
- **G3（Q3-a）· 数据目录**：缺省 `~/.metric-factory/`（三入口 cwd 不齐，唯 home 成全 story 9 一本账与全局上限；DR 工作区相对的 git 同步动机与 MF「不进 git」红线相反）；单一 `MF_DATA_DIR` 覆盖；文件名保 DR 原名（`model-audit.jsonl`(+.1)/`model-budget.json`/`.model-budget-lock`）；**vitest 守卫**：测试环境（VITEST 变量在场）未注入时缺省解析直接 throw，堵 home 泄漏对 git 门的盲区。
- **G4（Q4-a）· complete() 返回定稿**：`Promise<{ text: string; usage?: { modelCalls: number; inputTokens?: number; outputTokens: number }; provider?: string; model?: string; taskId?: string }>`；faux 返回 `{text}`；INVALID_OUTPUT 返回 `{text:"", usage, provider, model, taskId}`（截断但出稿的调用统计/provenance 不留口径洞）；失败仍 throw（调用形态不变）。usage 收窄三字段防误用（toolCalls 等恒 0 不暴露）。`modelLabel` 参数降级为 fallback 标签（仅 faux 用）。机械更新既有 llm-runtime 断言。
- **G5（Q5-a）· provenance 捕获走 onEvent**：`createRuntime({ onEvent })` 同步写 client 闭包内 `Map<taskId, provider/model>`，complete() 后取本调用 taskId 并删除——按关联键归因，并发零串线（DR lastProviderByTask 同构、生命周期缩到单调用）；取 `model.finished` 无 reason 者 last-wins。时序疑点已关闭（onEvent 同步处理器在 runText resolve 前执行完毕，dist 逐行核验）。auditSink 保持哑写盘单一职责。
- **G6（Q6-a）· 预算维度与缺省**：`MF_LLM_BUDGET_TOKENS`（input+output 合计）与 `MF_LLM_BUDGET_CALLS`（attempt 计量，容灾重试=2 calls 如实披露）双维度可选；**均缺省不限**（保 M2 零配置语义）；窗口=账本文件生命周期（重置=删文件或调高 env 即时生效）；校验照 parseTimeoutMs 急错先例；警告阈**固定 80% 不加 env**（配置面最小化）。
- **G7（Q7-a）· 阻断与警告呈现**：四要素文案（预算字样/已用 X 上限 Y/账本路径/两条出路）在 pi-client 错误组装点拼装——三入口零额外改造即「点名预算」自带解除指引；CLI stage:call 对含「预算」的错误改独立标题（不挂「模型原始输出」头，消排障陷阱）；警告：CLI/MCP stderr 一行（每次调用后至多一条）+ UI 统计卡 warn chip；不做提交前预检拦截（双真相源）。
- **G8（Q8-a）· 统计卡口径**：两行汇总 chip（今日/累计——本地时区自然日，来源审计 `at`）+ 表（行=provider/model，列=次数、tokens(in+out)、用途 generate/refine 拆分——taskId 前缀红利）；faux 整卡换「faux 不记账」说明；脚注「累计=审计与账本留存期内」诚实披露轮转/FIFO 边界；审计降级时 token 总量照显（账本源）而模型/时间列标「不可用」。按模型计数数 `model.admitted/model.finished` 而非 run.started（后者带链首）。读路径渲染时只读两文件（rename 原子、append 尾读安全，无需锁）。

### Round 2（主代理，0 新包 + 4 项探索即答/精化）

- 探索即答：①**MF_DATA_DIR 走 env 而非新参数**——工厂从注入 env 读 `MF_DATA_DIR`（与 MF_LLM_* 家族同构；UI 测试写 .env.local、CLI/MCP 测试设 process env 即注入，零新 API 面；vitest 守卫挂在缺省解析处：VITEST 在场且无 MF_DATA_DIR 即 throw）；②**审计降级标志暴露**——sink 模块级 per-path 一次性标志 + 导出 getter，设置页读 UI server 自身进程态（跨进程降级不可见，单用户可接受，脚注披露）；③轮转上限可注入（测试用小值触发，生产 50MB 不变）；④README 增量清单：预算双 env + MF_DATA_DIR + 数据目录说明 + 统计卡 + 密钥/digest 口径注记。
- **GRILL converged after 2 rounds**（预算 2x9；R2 新增开放问题归零）。全程零升级——8 包均为 D1-D12 与红线的补全而非重开。
