# M1 · LLM 运行时升级：pi-ai compat → pi-agent-runtime · 方案（proposal）

> 规格源：2026-10-18 会话定稿。上游基线：同日三仓（metric-factory / deep-research / reports-factory）agent-runtime 接入方式对比分析，用户裁决「M1 先行（风险最低、收益是容灾+可观测地基），M2 紧跟，M3 可拆独立 PR」。本文件是后续 PRD/GRILL/ISSUES/REVIEW 的唯一规格源。**本 flow 只做 M1**；M2（零配置体验）/M3（审计落盘与 provenance 闭环）明确不在本批。

## 目标

把 metric-factory 的 LLM 调用层从 `@earendil-works/pi-ai` compat `complete()` 裸单发，升级为 `pi-agent-runtime` 的 `createRuntime().runText` 通道——**只换引擎，不换 UX**：环境变量配置面不变（`MF_LLM_MODEL` 等），设置页不变，业务代码零改动。

## 背景与差距（2026-10-18 对比结论）

| 维度 | metric-factory（现状） | deep-research / reports-factory |
|---|---|---|
| 依赖 | `@earendil-works/pi-ai` compat `complete()` | `pi-agent-runtime`（vendored tgz，DR 0.4.3 / RF 0.4.1） |
| 调用形态 | 裸单发，无重试/无恢复 | `createRuntime().runText` + `modelRecovery` |
| 模型解析 | 用户手填 `provider/model-id`，靠 pi-ai 内置目录（README 已记载动态目录首解析恒为空的坑） | 真值表硬编码已验证模型（MiniMax-M3 主 / mimo-v2.6-flash 备）+ baseUrl+api 自定义，其余显式拒绝 |
| 主备容灾 | 无（单模型） | 候选链 fallback，无 key 候选自动跳过 |
| 治理 | 无 | authorize 钩子 + 审计 JSONL + 预算账本 + limits 超时 |

现状代码：`src/llm/pi-client.ts`（16 行，`complete(model, {systemPrompt, messages})` + `contentText`）；`src/llm/index.ts`（`createLlmClientFromEnv`：`MF_LLM_BACKEND=faux` 走 fake；`MF_LLM_MODEL=<provider>/<model-id>` 经 `getBuiltinModels` 静态目录解析；`MF_LLM_BASE_URL` 覆盖网关；`*_API_KEY` 从注入 env 补进 process.env 且不覆盖已有键）。

## 已定决策（用户裁决 + 方案定稿，为约束而非开放问题）

1. **引入 vendored pi-agent-runtime**：`package.json` 加 `file:vendor/pi-agent-runtime-0.4.3.tgz`，tgz 从 deep-research `vendor/pi-agent-runtime-0.4.3.tgz` 拷贝（对齐版本取 DR 的 0.4.3，高于 RF 的 0.4.1）。
2. **重写 `src/llm/pi-client.ts`**：`createRuntime` + `createPiTransport`，以 `runText` 承载现有 `LlmClient.complete()`——`LlmClient` 接口不变，业务代码零改动。
3. **三分映射（照 DR）**：`succeeded` → 返回文本；`INVALID_OUTPUT`（含截断）→ 空文本交 schema 校验兜底（fail-closed 门天然兜住：草案合入前 validate 全过才写盘）；其余 failed/blocked → 抛错。
4. **limits 与恢复**：`modelTimeoutMs` 300s、`maxOutputTokens` 32k、`modelRecovery: { extraAttempts: 1 }`。
5. **模型解析改真值表三分映射（照抄 DR `resolveModelConfig`）**：(a) 内置已验证模型真值表精确匹配；(b) `MF_LLM_BASE_URL`+api 自定义；(c) 其余显式拒绝——摆脱对 pi-ai 动态目录的依赖。已验证候选：MiniMax-M3（minimax-cn，anthropic-messages）、mimo-v2.6-flash（xiaomi-token-plan-cn，openai-completions）。
6. **环境变量面保持 `MF_LLM_MODEL` 不变**，新增可选 `MF_LLM_FALLBACK_MODELS`（逗号分隔，主备链；无 key 候选跳过不抛错，全无可 candidates 才报错）。
7. ** authorize 缺省放行**：单机语义，缺省 `async () => true`；结果仅进程内返回，无工具/外发。

## 红线（既有设计不变式，全程保留）

- **工人模式不变**：LLM 只产草案不写盘；generate/refine 保持单发结构化调用，**不引入 `runAgent` 工具循环**（与「模型不握方向盘」哲学冲突）。
- **fail-closed 人审门不变**：LLM 新增自动带 provenance + 待审标记，未审核导出硬阻断。
- **pi 依赖收敛在 `src/llm`**：guard 测试锁定业务代码零 pi import；换依赖包名后 guard 仍须通过（允许同步 guard 的白名单写法，但不允许扩散到 src/llm 之外）。
- **faux 后端不变**：`MF_LLM_BACKEND=faux` + `MF_FAUX_RESPONSE` 确定性脚本，测试/演示零网络。
- **`.env.local` 手配路径保留**：UI 设置页写入模型/密钥/网关的现有 UX 本批不动（M2 才做自动发现与降级为「查看+覆盖」）。
- 密钥永不进页面/日志/导出物。

## 明确不做（本批范围外）

- M2：密钥自动发现（`~/.pi/agent/auth.json` 等）、默认链自动启用、设置页降级、首页芯片三态化。
- M3：审计 JSONL 落盘 + 轮转、预算账本、provenance 记录实际出稿 provider/model、设置页调用统计。
- M4：runAgent 会话/工具化草案（明确否决，见红线）。
- 多用户密钥托管（工作台定位本地单用户）。

## 验收方向（草案级，PRD 细化）

- `npm run build / typecheck / lint / test / contract-test` 全绿（本仓既有验证门，上一 flow 的 verify_command：`npm run lint && npm run typecheck && npm run test && npm run contract-test`）。
- guard 测试通过：pi 依赖仍只在 `src/llm`。
- faux 路径零回归：全部现有 LLM 相关测试（走 faux）不改语义地通过。
- 真实链路：llm-smoke 脚本（`zsh scripts/llm-smoke.sh`）留档真实模型输出，若本机无可用密钥则记录降级覆盖。
- README「模型访问统一走 pi-ai 适配层」等表述同步更新为 pi-agent-runtime。

## 开放问题（GRILL 补全候选）

- vendor tgz 的拷贝与 `.gitignore` / 提交策略（是否提交 vendor/）。
- guard 测试的具体断言写法（grep 串是 `@earendil-works/pi-ai` 还是更宽），换包名后如何同步。
- runtime 实例的生命周期（进程级单例 / 每次调用新建；DR 有 channel 缓存 + 10 万次重建阈值，MF 调用量极小是否需要）。
- `MF_LLM_FALLBACK_MODELS` 为空 / 全部无 key 时的报错文案与 CLI/UI 呈现。
- runText 的 taskId 命名约定（DR 用 `dr:<callKey>`）。
- pi-ai 依赖是否保留（compat 不再需要，是否整体移除 `@earendil-works/pi-ai`）。
