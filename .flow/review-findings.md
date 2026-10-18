# M1 · REVIEW cycle 2（RE-REVIEW，fresh context，2026-10-18，裁决 **PASS**）

> 评审对象：`git diff b3ca612`（工作区，HEAD==b3ca612，无中间提交）+ 未跟踪文件（vendor/、vitest.config.ts、src/llm/scripted-transport.ts、test/unit/llm-runtime.test.ts、test/unit/llm-config.test.ts、.flow/archive-ab-20261018/）。规格源：.flow/proposal.md + .flow/prd.md（含 diff-gate ①② 与 GRILL G1–G10）。排除：.codebase-memory/。仓内无通用编码标准文档（CONTRIBUTING.md 仅模板 PR 规范），Standards 轴 = Fowler smell 基线 + 本 flow 红线不变式。

## 验证门自跑（评审员独立重跑，非采信记录）

- **node v24.21.0（默认）**：`npm run lint && npm run typecheck && npm run test && npm run contract-test` → **exit 0**（53 文件 338/338 + contract 1/1，14:48:03–14:48:47）。
- **node v22.23.3（`fnm exec --using v22.23.3`）**：同一命令 → **exit 0**（53 文件 338/338 + contract 1/1，14:50:34–14:51:04）。
- 与冻结证据（338 tests + contract 1）一致；测试作证据非批准，下文逐条对抗复核。

## F1/F2 blocking 修复复核（对抗性验证结论：均成立）

**F1（e2e 5s 默认超时过紧）→ 已修复。** vitest.config.ts:8 仅设 `testTimeout: 15_000`（无 retry/hook 等断言削弱配置；此前无任何 vitest 配置文件，无冲突）；node 22 全量门三份绿证（mf-n22-gate.log 14:16、mf-g22-.log 14:40、评审员自跑 14:50）+ node 24 两份（mf-g24.log、自跑）。进程边界 e2e 路径本 flow 零改动（src/engine、src/cli 未触碰），超时放宽未掩盖真实挂死（两轮墙钟 24s/29s 正常）。**复检通过。**

**F2（smoke 循环逐候选容错）→ 已修复。** scripts/llm-smoke.sh:87-104：失败候选 `tee smoke-failure.txt` 后继续、结尾汇总、FAILED>0 → exit 1、RAN=0 → exit 1。留档实证机制真实运作：/tmp/mf-llm-smoke-20261018-143600/ 中 MiniMax-M3 失败（smoke-failure.txt 14:36）后 mimo 仍执行（14:36–14:37），双候选 generate 真实输出齐全（14/8 条候选指标，草案落盘待审），mf-smoke-r2.log 汇总「执行 2 候选，成功 0，失败 2」。**复检通过。**

## 规格符合性（Spec 轴，逐条核实）

D1 ✓（tgz sha512 与 deep-research vendor 逐字节一致；file: 引用入 lockfile 且纯增量零既有版本变动；pi-ai 顶层 0.87.1 + 传递 0.86.1 并存如声明；vendor/ 未被 .gitignore 排除）· D2 ✓（authorize 放行、NOOP_AUDIT 永不抛、budgets 不传）· D3/G3 ✓（惰性单例、缓存键=候选链+key sha256 指纹、改 key 同进程生效有测、process.env 桥已删）· D4 四分映射 ✓（每路单测；真值表与 DR piRuntime.ts 逐字段一致；G1 协议映射表、google 拒绝文案含网关指引、(d) 三路径报错）· D5/G5 ✓（笔误点名、缺 key 跳过、全缺列环境变量名、保序）· D6 ✓（五键与 DR buildLimits 逐值一致 + MF_LLM_TIMEOUT_MS 覆盖；extraAttempts:1）· D7/G8 ✓（三分映射 + 其余全 status 抛错含 reason；generate.ts 解析失败桶 {ok:false,stage} 原样在位零写盘）· D8 ✓（compat import 零残留；引擎级测试断言行不变）· D9 ✓（guard 三串 + 负例检出）· D10 ✓（engines/CI/tsup/README + 评审员 node 22 实测）· D11/G10 ✓（README 三新 env + catalog 最佳-effort 披露 + google 迁移指引 + 失效 claude-sonnet-4 已修；设置页 placeholder 对齐真值表）· G2 ✓（解析/缺 key 急切、createRuntime 惰性）· G4 ✓（mf:<kind>-<seq> 跨 cacheKey 唯一，审计事件观测测试）· G6 ✓（三处急切校验各有测）· G7 ✓（auth.json 注入不覆盖、双候选循环、头注释声明）· G9 ✓（主 (+N 备) 有测）。红线全保：LlmClient 接口/types.ts 未动、业务模块（engine/cli/mcp/schema/export/sap）零改动、faux 主路径未动、无 runAgent、密钥仅 maskKey 呈现。runtime 语义已对 dist 源码核实（fallback/recovery/cap 钳制/INVALID_REQUEST 候选唯一性均与适配层假设吻合；fallbacks 配置时各候选 maxOutputTokens 必填——四条构建路径均已给值）。

## Findings（severity 排序；blocking 判定规则 = 规格轴落空 | 文档化标准违反 | 任何正确性缺陷）

1. **Low（non-blocking）· 记录证据路径失实**：冻结证据列 `/tmp/mf-g22-{1,2,3}.log` 三份日志，磁盘上均不存在；实际为单份 `/tmp/mf-g22-.log`（14:40，全门绿——循环重定向变量未展开致三次覆盖为一份）+ `/tmp/mf-n22-gate.log`（14:16，全门绿）。实质主张（node 22 门绿）经评审员自跑独立证实，唯「3/3」次数据当时产物不可完全回溯。属证据卫生问题，无产品正确性影响。上游：VERIFY/记录纪律。复检：证据引用的每个文件路径在磁盘逐一存在。
2. **Low（non-blocking）· smoke 逐候选留档缺失败细节**：scripts/llm-smoke.sh:59 `| tee "$dir/refine-summary.txt"` 仅捕 stdout，而失败诊断（zod issues + 模型原始输出）走 stderr（src/cli/index.ts:522-526 `console.error`）→ 两候选目录 refine-summary.txt 均 0 字节，smoke-failure.txt（llm-smoke.sh:90）却写「详见本目录留档」；失败细节仅存于外层控制台日志 mf-smoke-r2.log。复检：制造一次候选失败，候选目录内即可读到拒绝原因（如 `2>&1 | tee`），或修正指引文案。
3. **Low（non-blocking）· 错误文案可错引 taskId**：src/llm/pi-client.ts:86 自增、:88 组 taskId、await 之后 :98 throw 时**重读全局 taskSeq**——并发交错下另一条 complete() 已推进序号，抛出文案里的 taskId 与实际 runtime 键控 taskId 不符（runtime 自身审计/结果中的 taskId 正确，仅人类可读诊断串可能错位；UI server 长跑场景理论可达）。复检：序号在 await 前存入局部变量；并发交错两条调用，两错误文案 taskId 各与其实际调用一致。
4. **Info · smoke 发布门当前处 WARN 态**：双候选 refine 输出均被 schema 拒绝（MiniMax 返回 `type:"sum"`、mimo 返回 `type:"measure"` 且缺 owner_role——模型自创枚举，fail-closed 零写盘兜住，行为完全如设计）；generate 双候选真实成功。引擎链路两候选端到端已证，refine 的模型口径契合度属脚本自声明的「人工评估后放行」事项；refine prompt 与 schema 本 flow 未动，非引擎回归。放行前需人工评估留档。
5. **Info · tasks.md 切片 1–4 复选框仍 `- [ ]`**（验收项均已实测满足，R1/R2 已勾）；另 src/llm/pi-client.ts:62 文案残留 DR 术语「transportFor」（本仓无此名）。flow 卫生，顺手修。
6. **Info · 范围备注**：.flow/ui* 等删除与未跟踪 .flow/archive-ab-20261018/ 为同批 A+B 归档家务（需一并提交）；faux 未 setResponses 先调用时返回占位串而非报错（旧 compat faux 行为不同，测试均先设脚本，无实际影响）。

**已核实符合（择要）**：guard 三串 + 负例、双轨验证门、真值表逐字段一致、fallbacks 候选 cap 必填已满足、INVALID_OUTPUT→空串→解析失败桶零写盘、设置页 save 422 零写盘语义未变、llmStatus configured/error 分类经 eager 工厂保持、faux 全量 e2e 零回归、无 process.env 桥、无 scope 越界（diff 全落在 PRD Further Notes 声明的爆炸半径内）。

**结论**：F1/F2 修复经对抗复核成立，规格 D1–D11/G1–G10 全项落地且有行为级测试背书，双 node 轨验证门评审员自跑全绿；3 项 Low + 3 项 Info 均非 blocking（无规格落空、无文档化标准违反、无产品正确性缺陷），交上游按复检准则处置。**裁决 PASS。**
