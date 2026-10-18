# M3 · 治理闭环：审计落盘 + 预算账本 + provenance 真值 + 调用统计 · 方案（proposal）

> 规格源：2026-10-18 会话三仓对比与 M1/M2/M3 迭代方案定稿（用户裁决「M1 先行，M2 紧跟，M3 可拆独立 PR」）+ M1/M2 交付事实（commits `655b84d`、`902574c`）与两份 handoff（`.flow/archive-m1-20261018/handoff.md`、`.flow/archive-m2-20261018/handoff.md`）。本文件是后续 PRD/GRILL/ISSUES/REVIEW 的唯一规格源。**本 flow 只做 M3**。
> 诚实披露：迭代方案 M3 节原文未完整落盘，本文件从 M1 proposal「明确不做」节原文四项 + M2 handoff M3 前置重构，稀薄处标注，GRILL 补全。

## 目标

把 M1 埋好的治理挂点接上真实账本：**审计 JSONL 落盘+轮转**（每次 LLM 调用留痕可查）、**预算账本**（可设上限、超限有行为）、**provenance 记录实际出稿 provider/model**（不再是配置面的链首标签，而是真值）、**设置页调用统计**（用账本数据回看用量）。四项共用同一数据源（审计事件），一次闭环。

## M1/M2 交付地基（事实）

- **auditSink 挂点**：`createPiClient` 的 `opts.auditSink`（缺省 no-op 永不抛错）——M1 注释明言「M3 替换为 JSONL 落盘实现」，单点替换。
- **AuditEvent 形状**（vendored runtime 实测）：`{version:"1.0", taskId, runId, sequence, kind: run.started|model.admitted|model.finished|run.finished|…, at, provider, model, contextVersions, digest?, reason?, attempt?, failureCategory?}`——**每事件带 provider+model**（provenance 真值来源；runText 的 RunResult 不含 model，fallback 发生在 runtime 内部）。
- **RunResult**：`{taskId, runId, usage, usageKnown, status…}`——usage 带 token 计数（预算账本数据源）。
- **taskId**：`mf:<kind>-<seq>`（进程内全局自增）；`createLlmClientFromEnv(env, caller?)` 已支持可选 caller——**四个调用点（CLI generate/refine、MCP 两工具、UI draft job）尚未传 generate/refine 标签**，M3 接上。
- **modelLabel 现状**：读合成 env 的 `MF_LLM_MODEL`（链首语义）——主备容灾下备候选出稿时标签失真，正是本批要修的。
- **审计不落密钥的结构保证**：AuditEvent 无任何 key 字段（provider 名、模型 id、taskId、usage、reason——无密钥材料）；红线「密钥永不进日志」由此结构保住。
- 先例：deep-research 生产在跑审计 JSONL + 轮转 + 预算账本（M1 对比分析已研读；实现细节本批 GRILL 时对照）。

## 已定决策（从迭代方案继承，为约束而非开放问题）

1. **审计 JSONL 落盘 + 轮转**：auditSink 从 no-op 换成 JSONL 追加写；轮转策略防无限增长（具体策略 GRILL 定，DR 先例优先）。
2. **预算账本**：可设预算上限，超限有明确行为（阻断/警告，GRILL 定）；数据源 = 审计事件/usage。
3. **provenance 记录实际出稿 provider/model**：draft 的 provenance.model 从「配置面链首标签」改为「实际出稿真值」（来源：审计事件）。
4. **设置页调用统计**：设置页新增用量回看（次数/tokens，按模型），数据源 = 账本。
5. **caller 标签接上**：四个调用点传 generate/refine 标签（taskId 变 `mf:generate-<seq>` 等，审计可按用途区分）。

## 红线（既有设计不变式，全程保留）

- **工人模式不变**：审计/预算/统计全部是**事后记账**，不改变单发结构化调用形态，不引入工具循环。
- **fail-closed 人审门不变**：预算超限的「阻断」语义（若 GRILL 定为阻断）只作用于**新的 LLM 调用发起**，不影响已产草案的人审/导出流程。
- **pi 依赖收敛 `src/llm`**：guard 测试锁定；审计落盘模块若需 AuditEvent 类型，放 src/llm。
- **faux 后端不变**：faux 零网络语义不动（faux 是否记账 GRILL 定，但 faux 路径不得因账本而需要网络/文件才可用——测试密闭性不能破）。
- **密钥永不进页面/日志/导出物**——审计文件是日志类产物，**AuditEvent 结构上无密钥**，且落盘实现不得把 env/key 写入任何行。
- **审计/账本文件不进 git**（本机运行时产物，.gitignore 处理）。

## 明确不做（本批范围外）

- M4：runAgent 会话/工具化草案（明确否决）。
- 多用户密钥托管/多租户账本（本地单用户）。
- refine prompt 加固（M1 延期项 1，仍是独立产品决策——除非用户在 diff 门裁决入批）。
- M2 遗留 non-blocking 收口包与代码卫生包（handoff 延期项 3/4/5）——默认不入本批，避免范围蔓延；用户可另行安排。
- 审计数据的跨实例聚合/导出报表（本批只做单机文件 + 设置页回看）。

## 验收方向（草案级，PRD 细化）

- 验证门不变：`npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿。
- **真实用例**：真实 LLM 调用后审计文件出现该 run 的完整事件链（含 provider/model 真值）；draft provenance.model = 实际出稿模型（主备容灾场景可验证——主候选畸形回退备候选时 provenance 应显示备）。
- 轮转可触发（构造超限文件证明轮转动作）。
- 预算上限可配置且超限行为符合 GRILL 裁决。
- 设置页统计与账本文件对得上（手工核对样本）。
- faux 路径零回归；guard 测试通过；测试不因账本写盘而互相污染（测试用临时目录注入）。

## 开放问题（GRILL 补全候选）

- 审计文件路径与命名（工作区相对？全局 ~/.metric-factory？实例级？）；CLI/MCP/UI 是否同路径。
- 轮转策略：按大小/按条数/按日期；保留几份（DR 先例值）。
- 预算维度与单位：tokens（input/output 分开？）/ 调用次数 / 两者；默认上限（还是缺省无限制）。
- 超限行为：硬阻断（抛错）/ 软警告（审计里记 budget 事件 + 页面提示）；阻断后设置页如何呈现与解除。
- provenance 真值的接法：auditSink 捕获 model.admitted/model.finished 回填 draft？还是 runText 后查账本？时序（事件异步与否——M1 实测 append 在 runText 完成前被调用）。
- 设置页统计的口径：时间窗（今日/累计）、维度（按模型/按用途）、展示形态（表格/计数 chip）。
- faux 是否记账（记了统计才完整；不记则 faux 保持零依赖纯净——测试密闭性考量）。
- 审计写入失败的容错（磁盘满/权限）：降级为内存丢弃（保调用）还是抛错（保账本完整性）——审计 sink 抛错会以 AUDIT_FAILED 杀调用（M1 已知），no-op 兜底语义与落盘语义的取舍。
- 预算账本的存储形态：独立文件/审计文件派生/JSON 状态文件；并发（UI fire-and-forget job 与 CLI 并行）下的写冲突。
