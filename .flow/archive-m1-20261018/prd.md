# PRD · M1 — LLM 运行时升级：pi-ai compat → pi-agent-runtime

> 规格源：`.flow/proposal.md`（唯一裁决源）+ `.flow/red-team.md`（go 附条件，KA1–KA5 已逐条并入本 PRD）。无 issue tracker 配置，按降级路径落盘本文件。

## Problem Statement

metric-factory 的 LLM 调用层是 `@earendil-works/pi-ai` compat `complete()` 裸单发：无重试、无主备容灾、无超时保护、无恢复机制。一次网络抖动或模型截断就直接毁掉整个草案任务；兄弟产品（deep-research / reports-factory）已在生产用 `pi-agent-runtime` 的 `runText` 通道解决了同一问题。用户（业务人员在工作台跑 AI 草案、开发者在 CLI 跑 generate/refine）承担单点失败的代价，而修复所需的所有零件都已在兄弟仓验证过。

## Solution

把 LLM 引擎换成 vendored `pi-agent-runtime` 0.4.3 的 `createRuntime().runText` 通道：**只换引擎，不换 UX**——`MF_LLM_MODEL` 等环境变量配置面不变、设置页不变、`LlmClient` 业务接口不变、工人模式与 fail-closed 人审门不变。换完之后，每一次模型调用自动获得：主备候选链容灾（无 key 候选跳过）、单次超时保护、输出截断恢复（`modelRecovery`）、以及（M3 落盘前的）审计挂点。

## User Stories

1. 作为**工作台业务用户**，我希望 AI 草案任务在主力模型超时/截断时自动恢复或切换备模型，而不是直接失败，以便我不必重跑整份草案。
2. 作为**CLI 用户**，我希望 `MF_LLM_MODEL=openai/gpt-4o`（README 文档配置）升级后照常可用，以便我不需要改任何本机配置。
3. 作为**CLI 用户**，我希望 `MF_LLM_BASE_URL` 指向 OpenAI 兼容网关的用法升级后照常可用，以便内部网关部署不中断。
4. 作为**CLI 用户**，我希望可以用 `MF_LLM_FALLBACK_MODELS` 声明一串备模型，以便主模型故障时自动降级。
5. 作为**CLI 用户**，我希望候选链里没配 key 的模型被静默跳过、全部无 key 时才报错，以便错误文案告诉我具体缺哪个环境变量。
6. 作为**测试作者**，我希望 faux 脚本化后端继续零网络驱动全部 LLM 测试，以便 CI 不需要任何真实密钥。
7. 作为**测试作者**，我希望引擎级测试（走真实 runtime 管线、脚本化 transport）保留，以便三分映射逻辑被真实执行路径覆盖。
8. 作为**维护者**，我希望 guard 测试同时锁定 `pi-agent-runtime`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-ai` 三个包名，以便适配层边界在换包名后不失效。
9. 作为**维护者**，我希望 `LlmClient.complete()` 接口逐字节不变、业务模块零改动，以便本次升级的爆炸半径收敛在 `src/llm`。
10. 作为**维护者**，我希望 `INVALID_OUTPUT`（含截断）映射为空文本并落入既有解析失败桶（结构化 `{ok:false}`、零写盘），以便 fail-closed 语义不被引擎更换稀释。
11. 作为**维护者**，我希望模型解析对未验证模型显式拒绝且报错文案列出可用配置路径，以便配置错误在调用前暴露。
12. 作为**发布者**，我希望 CI 的 node 版本与 `engines` 声明和新依赖树一致，以便声明的支持面就是实测过的面。
13. 作为**审计者（M3 预埋）**，我希望 M1 的装配点已存在审计 sink 挂点（当前为 no-op），以便 M3 只替换实现、不动装配结构。

## Implementation Decisions

### 依赖与装配

- **D1 · 依赖**：新增 vendored 依赖 `pi-agent-runtime@0.4.3`（`file:vendor/...`，tgz 拷自 deep-research 仓 vendor，随仓提交——`.gitignore` 不排除 `vendor/`，兄弟仓同法）。保留 `@earendil-works/pi-ai@^0.87.1` 顶层依赖（关闭提案开放问题 Q6：**不移除**；理由见 KA4 + D4(c) 的目录回退需要）。两版 pi-ai（顶层 0.87 / 传递 0.86.1）并存无类型互操作：适配层只以纯数据（provider/id/protocol/endpoint 字符串）喂给 runtime，不跨包传递类型实例。
- **D2 · 引擎装配（收敛于 `src/llm` 适配层）**：`createRuntime` + `createPiTransport`，`RuntimeOptions` 必填项全给：`authorize` = 无条件放行常量（单机语义，决策 #7）；`audit` = **no-op sink**（吞事件、永不抛错——sink 抛错会以 `AUDIT_FAILED` 杀掉每次调用；M3 才替换为 JSONL 落盘实现，KA3 收口）；`budgets` 可选不传（M3 账本）。
- **D3 · runtime 生命周期（关闭提案 Q3）**：进程级惰性单例，按解析后的候选链做缓存键（照 DR channel 先例；不引入 10 万次重建阈值——MF 调用量每任务个位数，阈值无意义；UI server 长跑场景由单例天然覆盖）。
- **D4 · 模型解析四分映射（改写提案决策 #5，收口 KA1，待 diff 门确认）**：
  - (a) **真值表精确匹配**：内置已验证模型（MiniMax-M3 `minimax-cn`/anthropic-messages；mimo-v2.6-flash `xiaomi-token-plan-cn`/openai-completions，照 DR 真值表逐字段拷贝）。
  - (b) **`MF_LLM_BASE_URL` 存在** → 自定义网关：protocol 缺省 `openai-completions`（README 对该变量的既有语义即「OpenAI 兼容网关覆盖」），新增可选 `MF_LLM_API=anthropic-messages` 覆盖。解决提案中「api 无来源、(b) 永不触发」的硬伤。
  - (c) **pi-ai 内置静态目录回退**（`getBuiltinModels`——现行解析路径原样保留）：`openai/gpt-4o`、`anthropic/claude-sonnet-4` 等全部文档配置继续可用；catalog 条目映射为 runtime `ModelConfig`（数据级字段拷贝，contextWindow/maxOutputTokens 取目录值、缺省 128k/8k）。
  - (d) **其余显式拒绝**，报错文案列出三条可用路径（真值表候选 / 网关变量 / catalog provider）。
- **D5 · 主备链**：`MF_LLM_MODEL`（主）+ 可选 `MF_LLM_FALLBACK_MODELS`（逗号分隔，追加为 fallbacks，每项同样走 D4 解析）。`transportFor` 无 key 返回 null 跳过（照 DR/RF）；provider→环境变量名映射 = pi-ai 目录约定（`<PROVIDER>`_API_KEY`，连字符转下划线大写）+ 已知名表（minimax-cn→`MINIMAX_CN_API_KEY` 等，照 DR）。全部候选无 key 才抛错，文案列出各候选所需环境变量名。
- **D6 · limits 五键 builder（收口 KA3）**：`cumulative: unlimited`、`maxOutputTokens: 32_768`、`modelTimeoutMs: 300_000`（可用 `MF_LLM_TIMEOUT_MS` 覆盖）、`toolTimeoutMs: 30_000`、`controlTimeoutMs: 30_000`（照 DR `buildLimits` 逐值拷贝）。`modelRecovery: { extraAttempts: 1 }`。
- **D7 · 三分映射**：`succeeded` → 返回文本；`failed:INVALID_OUTPUT`（含截断）→ 返回空字符串，落入 `generate.ts` 既有解析失败桶（`{ok:false, stage}`、零写盘，红队已核实该桶存在且行为等价）；其余 `failed/blocked` → 抛错（进入既有异常桶）。`taskId` 命名 `mf:<调用方标识>`（关闭提案 Q5）。
- **D8 · 引擎级 faux（收口 KA4）**：`src/llm/faux.ts` 弃用 pi-ai compat `registerFauxProvider`，改写为**手写脚本化 `ModelTransport`**（约 10 行，响应队列 + 调用计数），经新引擎装配成 `LlmClient`；测试外部行为（脚本文本、callCount）不变。`MF_LLM_BACKEND=faux` 主路径（`createFakeClient`）本就不碰引擎，零改动。
- **D9 · guard 升级（收口 KA5，提为验收门槛）**：边界测试断言串扩为三个——`pi-agent-runtime`、`@earendil-works/pi-agent-core`、`@earendil-works/pi-ai`；新增一条负例测试（在临时源码串中注入违规 import，断言 guard 逻辑能检出），guard 主测试保持对 `src/` 全量扫描。
- **D10 · Node 支持面（收口 KA2，待 diff 门确认）**：`engines` 抬至 `>=22.19.0`（= pi-ai/pi-agent-core 0.86.1 声明地板；tgz 声明的 >=24.21 经红队 dist 静态检查为保守声明，实际仅用 node17+ API）；CI `node-version` 20 → 22；tsup target node20 → node22；本机用 fnm 的 v22.23.3 实测全量验证门作为地板证据；README 安装节披露地板变化与理由。
- **D11 · 文档同步**：README「模型访问统一走 pi-ai 适配层」改为 pi-agent-runtime 表述；provider 配置表补 `MF_LLM_FALLBACK_MODELS` / `MF_LLM_API` / `MF_LLM_TIMEOUT_MS`；`llm-smoke.sh` 头注释示例补真值表候选（保留 openai 示例——D4(c) 下仍可用）；设置页文案本批不动（M2 才重做）。

### 不变式重申（验收逐条核对）

工人模式（无 runAgent 工具循环）、fail-closed 人审门、faux 主路径、`LlmClient` 接口、`.env.local` 手配 UX、密钥不进页面/日志/导出物——全部不变。

## Testing Decisions

- **好测试的标准**：只测外部行为（解析结果、映射结果、报错文案、guard 检出），不测 runtime 内部；引擎测试必须走真实 `createRuntime` 管线 + 脚本化 transport（prior art：`test/unit/llm-adapter.test.ts` 的 faux 引擎测试）。
- **新增/改写单测（`test/unit/`，vitest）**：
  1. D4 四分映射：真值表命中 / baseUrl 缺省 openai-completions / baseUrl+`MF_LLM_API` 覆盖 / catalog 回退（openai/gpt-4o）/ 显式拒绝报错文案——每条一个用例（红队 KA1 cheapest test 的正式化）。
  2. D5 链语义：无 key 候选跳过、全无 key 报错文案含环境变量名、fallbacks 顺序保持。
  3. D7 三分映射：脚本化 transport 分别返回成功 / 触发 INVALID_OUTPUT / 触发其他失败，断言 文本 / 空串 / 抛错。
  4. D2 no-op audit sink：连续调用不抛错（防 `AUDIT_FAILED` 回归）。
  5. D9 guard 负例：注入违规 import 字串 → guard 检出。
  6. 改写：引擎级 faux 测试（D8）走新管线，断言行不变。
- **端到端**：既有 CLI/UI/MCP e2e（全部走 `MF_LLM_BACKEND=faux` 主路径）零改动通过，即 faux 零回归证据。
- **真实依赖用例（VERIFY 强制）**：`zsh scripts/llm-smoke.sh` 用本机 `~/.pi/agent/auth.json` 的 minimax-cn / xiaomi-token-plan-cn 密钥注入环境，对真值表两候选各跑一次真实调用，留档输出供人工评估；密钥不可用才允许降级并记录。
- **node 地板实测**：fnm v22.23.3 下跑完整验证门（D10）。
- **验证门（VERIFY 候选命令）**：`npm run lint && npm run typecheck && npm run test && npm run contract-test`（沿用上一 flow 实测命令）。

## Out of Scope

- M2 全部：密钥自动发现（`~/.pi/agent/auth.json`）、默认链自动启用、设置页降级为「查看+覆盖」、首页芯片三态化。
- M3 全部：审计 JSONL 落盘与轮转（M1 只挂 no-op 点）、预算账本、provenance 记录实际出稿模型、设置页调用统计。
- `runAgent` 工具循环 / 会话化草案（红线否决）。
- 多用户密钥托管；pi-agent-runtime 上游版本跟踪策略（0.5.x 漂移留待升级决策时处理）。
- 设置页 UI 改版、新页面（本批无用户可见新表面：设置页保持现状，仅芯片状态语义可能随链解析变化——属既有状态的更准确呈现，非新 UI）。

## Further Notes

- 爆炸半径刻意收敛：`src/llm/*` 适配层 + `test/unit/llm-adapter.test.ts` + 工程化文件（package.json / CI / tsup / README / smoke 注释）。业务模块（engine/export/sap/ui/mcp/cli）零改动是验收项而非愿望。
- 提案开放问题处置：Q1 vendor 提交（D1 提交 vendor/）、Q2 guard（D9）、Q3 生命周期（D3）、Q4 报错文案（D4(d)/D5）、Q5 taskId（D7）、Q6 pi-ai 去留（D1 保留）——全部关闭。

---

## Diff-gate 附录（2026-10-18 用户批准）

- **批准 ①**：提案决策 #5 改写为 D4 四分映射（真值表 → baseUrl 缺省 openai-completions + `MF_LLM_API` 覆盖 → pi-ai catalog 回退 → 显式拒绝）。依据：红队 KA1，原文与「配置面不变」主目标冲突。
- **批准 ②**：`engines >=22.19.0` + CI node 22 + tsup target node22 + fnm v22.23.3 地板实测 + README 披露。依据：红队 KA2。
- 自批增量：Q1–Q6 关闭（D1/D3/D5/D7）、no-op audit（D2）、limits 五键（D6）、faux 脚本化 transport（D8）、guard 三串+负例（D9）、`MF_LLM_FALLBACK_MODELS`/`MF_LLM_API`/`MF_LLM_TIMEOUT_MS` 三新可选 env、文档同步（D11）。

---

## GRILL 附录（2026-10-18，2x9 预算，2 轮收敛）

### Round 1（author-blind 子代理，8 包全按推荐裁决；主线：配置错误急切响亮失败，运行时条件才静默跳过）

- **G1（Q1-A）· catalog protocol 映射表**：D4(c) 字段拷贝前加显式映射 `{openai-responses → openai-completions}`（pi-ai 0.87.1 目录实测：openai 41 模型全为 openai-responses）；`google-generative-ai` 及其余未知 api 值落 D4(d) 显式拒绝，报错与 README 披露「gemini 直连暂经网关路径 (b) 接入」。**披露**：google 直连（env-file 有 key 映射但 README 未文档化的路径）在 M1 回归，迁移路径存在。
- **G2（Q2-A）· 急切度**：D4 解析与 D5 缺 key 错误在 `createLlmClientFromEnv()` 工厂急切抛出（保住 UI `llmStatus` 探针与 US11）；惰性的只有 `createRuntime` 对象（D3 不变）。
- **G3（Q3-A）· 密钥来源与缓存键**：transport 从注入 env 实参读 key；单例缓存键 = 解析后候选链 + 各 key 指纹哈希（仅内存，永不进日志）；**删除 process.env 桥**——顺带修复现存暗坑（设置页改 key 同进程不生效，与 env-file「保存即生效」承诺相悖），并消除 vitest 进程内环境变量污染。
- **G4（Q4-A）· taskId**：`mf:<kind>-<seq>`；kind 来自可选工厂参数 `createLlmClientFromEnv(env, caller?)`（缺省 `complete`，四个调用点零改动，US9 不破）；seq 进程内自增保唯一（照 DR 唯一性先例；runtime 以 taskId 键控 idle/budget）。
- **G5（Q5-A）· fallback 解析失败**：格式错/未知模型条目急切抛错且文案点名坏条目（配置笔误必须暴露）；缺 key 条目跳过（运行时条件）。trim、忽略空项、保序不去重。
- **G6（Q6-A）· 新 env 校验**：`MF_LLM_API` 必须枚举两协议之一否则工厂抛错；`MF_LLM_TIMEOUT_MS` 必须正有限整数否则抛错（防 NaN 静默即时超时）；真值表命中 + `MF_LLM_BASE_URL` 同设 → 抛「baseUrl 对内置已验证模型不生效」（今日无此配置组合，无存量破坏）。
- **G7（Q7-A）· llm-smoke 扩展**：脚本 +~15 行——对应 key 环境变量缺失时经 `node -e` 从 `~/.pi/agent/auth.json` 抽取注入（已设优先不覆盖）；循环两真值表候选各跑一次 generate 留档；头注释声明 smoke 专用 dev 便利、与 M2 产品面无关（VERIFY 强制门须一条命令可执行）。
- **G8（Q8-A）· status 穷尽**：D7 措辞修为「`succeeded` → 文本；`failed:INVALID_OUTPUT` → 空串；**其余全部 status**（含 blocked/cancelled/waiting/suspended）→ 抛错」。不可达分支意外触发必须响亮失败，不污染解析失败桶。
- R1 已自行查证并入：INVALID_OUTPUT 可经脚本化 transport 返 `stop:'length'` 触发；limits 32k 被 runtime 按 `Math.min(limits, modelCap)` 钳制（照 DR 值即生产持平）；README `anthropic/claude-sonnet-4` 示例 id 在 pi-ai 0.87 目录已不存在（现存 `claude-sonnet-4-5` 等）——现存文档漂移，D11 顺手修。

### Round 2（主代理，2 包 + 3 项探索即答）

- **G9 · llmStatus 链呈现**：`status.model` = 主模型 spec；配置 fallbacks 时设置页/芯片显示 `主 (+N 备)`。纯显示语义，无新表面。
- **G10 · catalog 回退最佳-effort 披露**：README provider 节注明「真值表两模型为已验证路径；catalog 回退为兼容兜底，推理/特殊模型在 completions 端点行为未勘」。
- 探索即答（不占包）：①tsup 默认全量打包依赖，tgz dist 无动态 require/fs 读取（grep 实证），单文件 dist 安全，无需 noExternal；②`file:` 依赖需本地 `npm install` 刷新 package-lock 并提交（CI `npm ci` 走 lockfile，DR 同法生产在跑）；③D5 envKeyFor 的公式化回退（连字符→下划线大写）对 minimax-cn/xiaomi-token-plan-cn 结果与 DR 名表一致，google→GEMINI_API_KEY 仅 env-file UX 关切，适配层按 D5 既定即可。

**GRILL converged after 2 rounds（预算 2x9 用完，新增开放问题归零）。全程零升级：无 proposal 冲突、无不可逆/扩范围且无推荐项。**
