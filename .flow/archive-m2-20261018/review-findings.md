# M2 · 零配置体验 — 独立复审报告（review_base = 655b84d + 未跟踪 flow 产物）

**裁定：FAIL（3 项 blocking，均为窄修复；核心实现忠实于规格，验证门可精确复现）**

复审范围：`git diff 655b84d`（src/cli、src/llm、src/mcp、src/ui、README、tests、.flow/*.md）+ 未跟踪 src/llm/{key-discovery,env-auto,provider-keys}.ts、test/unit/llm-env-auto.test.ts、test/cli/env-synthesis.e2e.test.ts、.flow/ui/、.flow/ui-contract.md。排除 baseline_dirty（.codebase-memory/、my-instance/，未审未flag）。未修改任何文件。

## 0. 验证证据复核（最高优先级项）

| 记录证据 | 复跑结果 | 裁定 |
|---|---|---|
| `npm run lint && typecheck && test && contract-test` exit=0（7 templates / tsc 绿 / 55 files 361 tests / contract 1，node v24） | node v24.21.0，lint 7 templates PASS，tsc 无输出，55 files / 361 tests 全绿，contract 1/1，VERIFY_EXIT=0 | 一致，无造假 |
| 双环境密闭（MF_LLM_AUTH_JSON_PATH 指向不存在文件） | 3 files / 32 tests 全绿；/tmp/mf-t5-envB.log 在场 | 一致 |
| 零配置真实用例留档 | /tmp/mf-zeroconfig-20261018-171506/ 在场：try3 exit=0「草案已写入…（新增 14 个候选指标）」，provenance.model: minimax-cn/MiniMax-M3，try1/2 malformed-JSON fail-closed 拒绝 | 实质成立，留档描述有误（见 F4） |

## Spec 轴

规格符合度总评：D1–D13、G1/G2/G3/G5/G6/G7/G8/G9、②A、①A（refine 红态未动 ✓）、G4 裁决 B（链序 MiniMax 主 ✓，README 风险注记在场 README.md:147）、M3 零越界——主线全部落地。

### F1 ·【blocking · UI-contract §3+§2-7+§7.4】S8 422 重渲染缺契约钉死的 aria 关联
- 证据：src/ui/render-settings.ts:142 模型输入无 `aria-invalid="true"`、无 `aria-describedby="settings-issues"`；render-settings.ts:65 error-list 无 `id="settings-issues"`。契约 §3 与原型 .flow/ui/settings-invalid.html:207-209 已实现该结构。
- 复检标准：422 响应中 `#set-model` 含 aria-invalid 与 aria-describedby，错误列表带该 id。

### F2 ·【blocking · UI-contract §1-SE-A.1】S5 错误态未按契约以 error-list role=alert 呈现工厂报错
- 证据：src/ui/render-settings.ts:83 错误态为 `<p>` 内联文本；契约 §1/原型 settings-error.html:189 为 `<ul class="error-list" role="alert">`。报错内容透出正确，仅容器语义缺失。
- 复检标准：错误态 /settings HTML 中工厂报错位于 error-list + role=alert 容器内。

### F3 ·【blocking · 正确性边角】faux 短路判定用「合成前分层 OR」而非合成后终值，显式 BACKEND 覆盖不赢
- 证据：src/llm/env-auto.ts:34-42 在层叠合并（:46-49）之前判定 fauxBackend。process env 显式设 MF_LLM_BACKEND=<非faux> 且 .env.local 手写 faux 时：终 env BACKEND 为 process 值（工厂不走 faux），但发现层被短路、默认链不注入——与 D4/决策 5「显式永远赢」及 G2「合成后 env 是唯一事实源」相悖。
- 复检标准：`resolveLlmEnvAuto({processEnv:{MF_LLM_BACKEND:"pi"}, envFilePath:含faux, authJsonPath:含key fixture})` 合成后语义应触发现（或落盘豁免说明）。

### F4 ·【non-blocking · verify 记录失准】「28-metric draft」实为 14 指标（name:/display_name: 行误计）；exit=0 与 provenance 断言真实无误。
### F5 ·【non-blocking · D3 字面】llm-env-auto.test.ts:88-91/:121-124 两测试未注入 authJsonPath，裸验证门下触达真实 auth.json；断言与发现无关，双环境一致性仍成立。
### F6 ·【non-blocking · 契约 §7.3 字面】render.ts 增量含 .banner/.banner-ok 超出「零新类」声明（横幅机制本身是 §1 要求，契约内部张力）。
### F7 ·【non-blocking · 契约 §4】H3 引导小字缺 `去设置` 锚点（芯片本体可点击，导航可达）。
### F8 ·【non-blocking · 契约 §4 措辞】API Key label 无 key 分支缺钉死句「留空则不修改」（无 key 时无可改项，判定裁量）。
### F9 ·【non-blocking · G3 文案】fallbacks-only 残缺配置报错归因「发现未找到」失真（行为正确）。
### F10 ·【non-blocking · G1 字面延伸】MF_LLM_AUTH_JSON_PATH 额外从 .env.local 读取（无害，与 ②A 分层一致）。

## Standards 轴（无文档化标准违例；guard 不变量锁定通过）

### F11 ·【non-blocking · 死代码】env-file.ts:79-81 resolveLlmEnv 零引用；render-settings.ts:33-36 SettingsValues + opts.values 不再消费；SOURCE_LABEL/SOURCE_CHIP 的 default-chain 行不可达。
### F12 ·【non-blocking · 重复/绕弯】nonEmpty 与 nonEmptyEnv 两处同逻辑；nonEmpty(...) !== undefined 绕弯布尔；modelSource0 别名；无 slash spec 的 slice 口径不一致（工厂先行抛错兜底）。
### F13 ·【non-blocking · 分层】src/llm → src/ui 反向依赖（env-auto imports env-file；模块级无环，包级双向）。

## UI 契约 §5 负例逐条反证（1–10）：全部成立（密钥只 maskKey 出口、faux 恒演示模式不显链、未配置恒灰、发现层错误不显示、来源不越界遮蔽只含变量名、422 仅 slash、芯片四分支、value 永不回填、发现 key 永不写盘/日志/导出、零配置叙事限定 pi CLI 凭据）。

## 任务/验证门交叉核对：切片 1–5 验收逐条对得上，任务清单 [x] 与实际交付一致，无虚报；工厂签名未动（D1 守住，仅 G8 文案与 envKeyFor 委托两处规格内改动）。

**最终裁定：FAIL** —— F1/F2/F3 修复（合计约十数行 + 1 个测试补例）后可复评审通过；验证门与留档证据本身真实且可精确复现。
