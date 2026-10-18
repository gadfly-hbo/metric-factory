# Red-Team: M1 — 把 metric-factory LLM 层从 pi-ai compat 换成 vendored pi-agent-runtime 0.4.3 的 `runText` 通道，宣称「只换引擎，不换 UX」

已对提案的代码级假设逐条对照实证：本仓 `src/llm/*`、`test/unit/llm-adapter.test.ts`、`package.json`、`tsup.config.ts`、CI workflow、`src/ui/server.ts` + `render-settings.ts` + `env-file.ts`、`scripts/llm-smoke.sh`、README；以及对 `deep-research/vendor/pi-agent-runtime-0.4.3.tgz` 的 `package.json` 与全部 `.d.ts` 的直接解包检查、DR 的 `src/adapters/piRuntime.ts` 实际用法。

### Top Kill-Assumptions (ranked by 影响 × 可能性 × 测试成本）

**KA1 · 「环境变量配置面不变 / 设置页不变」与「真值表三分映射、其余显式拒绝」直接矛盾**
- **Claim:** 决策 #5/#6 + 目标节：只换引擎，`MF_LLM_MODEL` 等配置面不变、设置页 UX 不动、业务零改动。
- **Steelman:** 对「已验证两模型」（MiniMax-M3 / mimo-v2.6-flash）的用户，以及 `MF_LLM_BACKEND=faux` 的测试路径，配置面确实逐字节不变；DR 已用同一真值表在生产跑通，照抄风险最低。
- **Attack:** 真值表只有 2 个条目（DR `piRuntime.ts:98-118`），而本仓**自有文档与脚本全部指向会被显式拒绝的配置**：README:144 示例 `openai/gpt-4o`、`anthropic/claude-sonnet-4`；`render-settings.ts:37-38` 设置页 placeholder 就是 `openai/gpt-4o`；`env-file.ts:16-19` 内置 openai/anthropic/google/gemini 四 provider 的 key 映射；`scripts/llm-smoke.sh:7` 的发布门槛冒烟头注释写的是 `export MF_LLM_MODEL=openai/gpt-4o`——升级后**仓库自己的冒烟脚本按自文档执行即被拒**。更硬的是：DR 三分 (b) 要求 `baseUrl + api` 双输入（`resolveModelConfig` 在 `cfg.baseUrl && cfg.api` 缺一时报错，`piRuntime.ts:121-138`），而 MF 环境变量面**没有 `api` 来源**——`src/ui/server.ts:1130` 只写 `MF_LLM_MODEL` + `MF_LLM_BASE_URL` + key，提案全文未引入 `MF_LLM_API` 之类变量。所以「照抄 DR」时自定义网关路径 (b) **永远无法触发**，今天所有 `MF_LLM_BASE_URL` 网关用户（README:146 记载的核心用法）从「可用」变成「显式拒绝」，且提案内无补救路径。这不是 UX 不变，是配置语义的整体收窄。
- **Fails if:** 决策 #5 按现状进 PRD——任一现行文档配置（含本仓 smoke 脚本自带示例）在新 resolver 下落到 (c) 显式拒绝，且自定义网关路径因 `api` 无来源而不可达。
- **Evidence to get this week:** 桌面推演即可：把 README/设置页/smoke 三处记载的 4 类配置逐一代入 `resolveModelConfig` 签名，确认全部落空；同时裁决 `api` 的来源（新增 env 变量？baseUrl 缺省推断 openai-completions？真值表扩种？）。
- **Kill criterion:** 若裁决结果为「显式拒绝 + 不提供 api 来源 + 不动设置页/文档」三者同时成立，则「不换 UX」目标死亡——必须在 PRD 前改写决策 #5（三选一：引入 `MF_LLM_API`、baseUrl 存在时缺省 `openai-completions`、或把「配置面不变」目标本身降级为「配置迁移」并同步改 README/设置页/smoke）。
- **Cheapest test:** 30 行 spike：把 DR 的 `resolveModelConfig` 拷进本仓 `src/llm`，用现行 4 类文档配置跑单测，红绿立判。半天内完成，零网络。

**KA2 · Node 支持面：新依赖树的声明地板（22.19 / 24.21）高于本仓声明地板（20）与 CI（node 20）**
- **Claim:** 本仓 `package.json` engines `node>=20`、CI `node-version: 20`、`tsup target node20` 继续成立。
- **Steelman:** 0.4.3 tgz 的 dist 我只 grep 到 `structuredClone`（node 17+）；传递依赖 pi-ai/pi-agent-core 0.86.1 dist 里只有 `SuppressedError` / `Symbol.dispose`（node 20.10+ 可用）——engines `>=22.19.0` 很可能只是保守声明，node 20 late 实测或许全绿。
- **Attack:** 声明失配是事实而非推测：tgz `engines: node >=24.21.0`，pi-ai/pi-agent-core 0.86.1 `engines: node >=22.19.0`，本仓 `>=20`。CI 装依赖即出 EBADENGINE；`npm run test` 会先 build 再跑 vitest，而 `llm-adapter.test.ts:21` 的 faux 测试**真实执行** pi-client 新引擎代码——若任何运行路径碰到 node>20.x API，CI 直接红。本机是 v24.21.0，本地开发测不出来，只有 CI（或主动降版本）能暴露。这是「声明的支持面」与「实际能跑的面」之间的未验证裂缝。
- **Fails if:** pi-agent-runtime 0.4.3 或其锁死的 pi-ai 0.86.1 在 node 20.x 运行期抛 ReferenceError/TypeError/SyntaxError。
- **Evidence to get this week:** spike 分支引入 tgz 后，用 nvm/Volta 切 node 20 最新版跑 `npm ci && npm run test`（faux 路径即执行新引擎，零网络零 key）。
- **Kill criterion:** node 20 下任何来自 pi-agent-runtime/pi-ai 0.86.1 的运行期错误 → 要么把本仓 engines + CI + README 一起抬到 >=22.19/24.21（一个提案只字未提的用户面兼容决策），要么 vendored tgz 路线此版本判死。
- **Cheapest test:** 同上，半日；纯本地，无外部依赖。

**KA3 · 「五个决策足以描述装配」不成立：createRuntime 的必填输入提案漏了两项**
- **Claim:** 决策 #4（limits 两键）+ #7（authorize 缺省放行）+ M3 才做审计，已覆盖 M1 装配所需。
- **Steelman:** 提案明确说「照抄 DR」，DR 的 `buildLimits` 与 audit sink 是现成代码，补齐只是抄写，无设计风险。
- **Attack:** 对照 0.4.3 tgz 类型定义：`RuntimeOptions.authorize` 与 `audit` **均非可选**（`types.d.ts` 中 `authorize: (action, signal) => Promise<boolean>; audit: AuditSink;` 无 `?`）；`runText` 的 `limits` 必填且 `UncappedLimits` **恰好五键**（cumulative/maxOutputTokens/modelTimeoutMs/toolTimeoutMs/controlTimeoutMs），提案 #4 只写了两键。即 M1 必须现在就给出一个 AuditSink（哪怕是 no-op），「审计属 M3」不成立——M3 做的是「审计**落盘与轮转**」，M1 至少要裁决 no-op sink 语义；且 sink 若抛错，每次调用以 `AUDIT_FAILED` 失败。typecheck 会立刻抓住，所以这不是潜伏风险，而是规格完整性缺口——但它证明「已定决策」清单并未覆盖装配面，GRILL 前应修文而非留到实现期撞墙。
- **Fails if:** PRD 照决策 #4/#7 字面落地——typecheck 即失败（limits 缺三键、audit 缺失），或临时补一个会抛错的 sink 导致全调用 AUDIT_FAILED。
- **Evidence to get this week:** 已在此报告中（tgz `dist/types.d.ts` 原文行）。无需新证据，只需修文。
- **Kill criterion:** 不适用（非 kill 级，必修项）。验收标准应显式写入：no-op/memory AuditSink 的语义决策 + 五键 limits builder（照 DR：tool/controlTimeoutMs 各 30s）。
- **Cheapest test:** spike 分支跑一次 `npm run typecheck`，编译器免费给出完整缺项清单。

**KA4 · 「faux 零回归」与开放问题 #6（整体移除 pi-ai）不能同时成立**
- **Claim:** 红线「faux 后端不变、现有 LLM 测试不改语义全过」，同时开放问题 #6 考虑整体移除 `@earendil-works/pi-ai`。
- **Steelman:** `MF_LLM_BACKEND=faux` 走的是 `createFakeClient`（`fake-client.ts`，零 pi 依赖），该路径确实与引擎无关、天然零回归。
- **Attack:** 但还存在第二条 faux 路径：`src/llm/faux.ts:1` import `registerFauxProvider, fauxAssistantMessage` 自 `@earendil-works/pi-ai/compat`，`llm-adapter.test.ts:21-28` 用它驱动 `createPiClient` 走「真实 pi 管线」——而 pi-client 正是本次要重写的文件，其构造签名（当前吃 pi-ai 的 `Model<Api>`）必然改变。且 pi-agent-runtime 0.4.3 的 `/testing` 出口只有 record/replay（`createRecorder`/`createReplay`），**没有** faux provider 等价物。更微妙的是：tgz 依赖里钉死 `pi-ai 0.86.1`，本仓现有 `^0.87.1`——「整体移除」只移除顶层声明，0.86.1 仍经传递依赖留在树里，faux.ts 若继续 import 就变成幻影依赖（靠 npm hoisting 运气解析，版本还与类型面 0.87 分叉）。
- **Fails if:** Q6 裁决为「移除 pi-ai」而 faux.ts/该测试未同步重建（手写一个脚本化 `ModelTransport`——它只是个函数，约 10 行）或未把 pi-ai 降为显式 devDependency。
- **Evidence to get this week:** 无需新数据，是决策题：Q6 三选一（保留 devDep / 手写 fake ModelTransport / 删除该测试改信 record-replay），并写进验收。
- **Kill criterion:** spike 分支上若 faux 回归测试在「无顶层 pi-ai」配置下无法转绿，则裁决保留 pi-ai 为 devDependency 并关闭 Q6——不 kill M1，kill 的是「移除」选项。
- **Cheapest test:** spike 分支删掉 pi-ai 顶层声明 + 把 faux 测试改写为手写 ModelTransport，`npm run test` 一次见分晓。

**KA5 · guard 测试对新包名即刻失效（已被提案列为开放问题，但严重度被低估）**
- **Claim:** 红线「pi 依赖收敛在 src/llm，guard 测试锁定」全程有效。
- **Steelman:** 提案 Q2 已自知需同步 guard 白名单写法，方向正确。
- **Attack:** 现有断言（`llm-adapter.test.ts:47`）只 grep 字面量 `@earendil-works/pi-ai`；新包名是无 scope 的 `pi-agent-runtime`，**不含该子串**——从合入第一分钟起，任何业务文件直接 `import "pi-agent-runtime"` guard 都绿灯。红线在过渡期处于无执法状态；把它留在「开放问题」而非「验收标准」意味着它可能被推迟到泄露之后。
- **Fails if:** 合入时 guard 断言未同时覆盖 `pi-agent-runtime`（与 `@earendil-works/pi-agent-core`）。
- **Evidence to get this week:** 无；一行断言改动 + 一个故意违规的负例测试即可验证。
- **Kill criterion:** 不适用（必修项）；建议从开放问题提升为验收门槛：guard 红-绿负例各一。
- **Cheapest test:** 在业务文件临时加一行 `import "pi-agent-runtime"`，guard 应变红——5 分钟。

### What's Well-Reasoned（核实为真，不制造怀疑）

- **引擎可行性已实证**：0.4.3 tgz 的 `TextRequest` 有 `taskId/prompt/system/limits/modelRecovery{extraAttempts: 0|1}`，`RunResult` 的 `succeeded / failed:INVALID_OUTPUT / 其他` 与提案三分映射逐点对得上；`system` 参数存在，`LlmClient` 接口不变、`runText` 承载 system+user 在类型层面成立。「不引入 runAgent」红线与 runText 通道天然兼容。
- **主备链语义有生产先例**：DR `transportFor`（无 key 返回 null）+ `getRuntime`（候选为空才抛错）正是提案 #6 的语义，且已在 DR 生产跑通——照抄的是活代码不是纸面设计。
- **fail-closed 兜底成立**：`generate.ts:62-77` 对 call 异常与 `JSON.parse` 失败都返回 `{ok:false, stage}` 结构化结果，INVALID_OUTPUT→空文本落到 parse 桶即失败、零写盘。（措辞修正：空文本先到 `JSON.parse` 而非「schema 校验」，结局等价。）
- **vendor 策略可行**：`.gitignore` 未排除 `vendor/`；DR 用同一 `file:vendor/*.tgz` 声明在生产运行；本机已存在 `deep-research/vendor/pi-agent-runtime-0.4.3.tgz` 源文件。
- **验收命令真实存在**：`package.json` 中 lint/typecheck/test/contract-test 四脚本齐全；faux 主路径（`createFakeClient`）零 pi 依赖，与引擎解耦，确实天然零回归。

### What I Couldn't Assess

- pi-ai 0.86.1 / pi-agent-core 在 node 20 的**运行期**真实表现（静态 grep 未见致命 API，但 engines 声明失配只能实测收口——见 KA2）。
- 本机 `pi-agent-runtime` 源码仓已到 0.5.1（新增 openai 依赖、exports 面变化），而提案锁 0.4.3：上游 0.x 漂移速度对「vendored 快照」维护成本的影响，提案未表态跟踪策略。
- 真实用户中是否存在提案作者之外的 openai/anthropic 存量配置（单机本地工具，KA1 实际爆炸半径可能只有作者自己+本仓文档——但文档与脚本自相矛盾本身就必须修）。
- MiniMax-M3 / mimo key 在本机的可用性（验收已允许 smoke 降级留档，非阻断）。

### 本周行动顺序

1. KA1 桌面推演 + `api` 来源裁决（决策题，半天）——PRD 前必须改写决策 #5。
2. KA2 spike 分支：vendor tgz + node 20 跑 `npm ci && npm run test`（半天）。
3. KA3/KA4/KA5 随 spike 一并收口：typecheck 列缺项、faux 去 pi-ai 改写、guard 双串断言。

`VERDICT: go`（附条件：KA1 的决策 #5 改写与 KA2 的 node-20 实测是 PRD 前置项；两者都不是方向性错误——引擎与映射已实证可行——而是规格缺口，补齐成本均在半天级。无任何 kill-assumption 的 kill criterion 在今日已成立。）
