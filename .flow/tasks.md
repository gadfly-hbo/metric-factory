# M2 · 任务切片（tracer-bullet 垂直切片）

> 规格源：`.flow/prd.md`（含 diff-gate 附录 ①A②A、GRILL 附录 G1–G9/G4 裁决 B）+ `.flow/ui-contract.md`（S1–S9/H1–H5）。无 tracker，落盘本文件。切片自批记录见 state.json history。

- [x] 1. 发现层 + 合成 helper 地基（prefactor）
- [x] 2. 默认链自动启用 + CLI/MCP 接线（零配置 tracer）
- [x] 3. 设置页写侧：save/clear 降级 + 遮蔽警告
- [x] 4. 设置页读侧「查看」面 + 首页芯片 + 文案同步
- [x] 5. 密闭性双环境验证 + 零配置真实用例

---

## 1. 发现层 + 合成 helper 地基（prefactor）

**Blocked by**: 无
**User stories**: US11、US12、US14（+D1/D2/D3/D4/D6/G1/G2）

### What to build

密钥自动发现与三层 env 合成的纯函数地基：发现模块读 auth.json（扁平 `{provider:{key?}}`），文件不存在/JSON 坏/条目非 object/缺 key（OAuth 形态）/空串 key 一律静默跳过、永不抛错、永不写盘；合成 helper 返回 `{env, sources}`——`process env > .env.local > 发现` 三层合并，空串按未设置，sources 覆盖 `MF_LLM_MODEL`/`MF_LLM_FALLBACK_MODELS`/`MF_LLM_BASE_URL`/被触及的 `*_API_KEY`（取值 `process|env-file|discovery|default-chain`）；provider→环境变量名映射三处合一（已知表并集 + `[^A-Z0-9]→_` 公式，env-file 侧改为引用）；环境变量缝 `MF_LLM_AUTH_JSON_PATH` 作为发现路径唯一覆盖点。工厂 `createLlmClientFromEnv` 一行不动。

### Acceptance criteria

- [ ] 发现容错单测全绿：正常条目、OAuth 条目、JSON 截断、非 object、空串 key、文件不存在——全部静默语义
- [ ] 合成优先级单测：process > .env.local > 发现；部分配置组合（env 有模型无 key + 发现有 key → 补齐；env key ≠ 发现 key → env 赢）
- [ ] sources 断言：每被触及键的来源正确；空串按未设置
- [ ] 映射合一：含 `.` provider 产出合法变量名；已知表存量（MINIMAX_CN_API_KEY 等）不变；env-file 与 llm 模块单一名义源
- [ ] `MF_LLM_AUTH_JSON_PATH` 覆盖缺省路径（单测证明）；全量验证门绿

## 2. 默认链自动启用 + CLI/MCP 接线（零配置 tracer）

**Blocked by**: 1
**User stories**: US1、US2、US3、US5、US6、US10（+D5/G3/G4/G8/G1）

### What to build

零配置端到端走通：合成 helper 内物化默认链——`MF_LLM_MODEL` 未设且 `MF_LLM_BASE_URL` 未设且默认链（MiniMax-M3 主 / mimo-v2.6-flash 备，G4 裁决 B）至少一个候选 key 可解析时注入 `MF_LLM_MODEL`+`MF_LLM_FALLBACK_MODELS`（sources 标 `default-chain`）；发现到几家启用几家。CLI generate/refine 与 MCP 两工具改走共享合成（processEnv + cwd/.env.local + 发现，②A），draft modelLabel 读合成后 env；`buildMcpServer` 参数化（authJsonPath/envFilePath 可注入）；工厂未配置报错文案升级（保留 `MF_LLM_MODEL`/`faux` token，MCP 测试断言不断）。

### Acceptance criteria

- [ ] 默认链单测：双 key → 主+备注入；单 key → 主+备（备缺失跳过）；零 key → 不注入（未配置）；baseUrl 在场 → 不注入；只设 fallbacks → 不注入（M1 急切抛错维持）
- [ ] CLI/MCP 零配置合成生效（注入 fixture 证明链生效）；`buildMcpServer(opts)` 注入缝可用
- [ ] 未配置新文案含三条手配路径 + 两 token；既有 MCP 断言不改语义通过
- [ ] 全量验证门绿（既有 e2e 以 `MF_LLM_AUTH_JSON_PATH` 密闭）

## 3. 设置页写侧：save/clear 降级 + 遮蔽警告

**Blocked by**: 2
**User stories**: US5、US8（+D7/G5/G6/契约 S7/S8/S9/S4）

### What to build

设置页写侧降级：模型字段不再 required；空模型保存 ≡ `/settings/clear` 语义（`MF_LLM_MODEL`/`MF_LLM_BASE_URL`/前一 provider key 全置 null，忽略 api_key/base_url 输入，页面注明「模型留空保存 = 清除覆盖、回退自动发现」）；模型填+key 空 = 只存模型（「留空则不修改」延续）；422 仅 slash 违例；保存/清除成功 303 + `?saved=1`/`?cleared=1` 一次性横幅；渲染与保存后重渲染均对被 process env 遮蔽的键显示警告行（需先 unset 才生效，只含变量名）。

### Acceptance criteria

- [ ] 空模型保存 = clear 键集合（单测逐键断言）；模型+空 key 只存模型；slash 违例 422 同页重渲染、查看面不扰动
- [ ] 横幅 `?saved=1`/`?cleared=1` 一次性呈现；裸 GET 无横幅
- [ ] 遮蔽警告：process env 覆盖 .env.local 键时渲染出现（含保存后重渲染），文案只含变量名
- [ ] 既有 settings 测试适配（注入 authJsonPath 空 fixture）+ 全量验证门绿

## 4. 设置页读侧「查看」面 + 首页芯片 + 文案同步

**Blocked by**: 3
**User stories**: US4、US7、US9、US15（+D7/D8/D9/D12/G7/G9 + UI 契约全状态）

### What to build

读侧呈现按 UI 契约落地：llmStatus 消费 `{env, sources}`；设置页状态 chip 四分支、生效链全表格（每候选：角色/模型/来源 chip/打码或 `—`）、链外 pi CLI 凭据提示行（仅 provider 名）、表单 value 永空 + placeholder 生效模型；首页芯片四分支三态（就绪绿+来源小字/未配置灰正常态/配置错误红 `.chip-fail`/演示模式 accent）可点击去设置；术语改词（「配置错误」「演示模式」）；CSS 增量两行（契约 §7.3）；README 零配置叙事（限定 pi CLI 凭据、MiniMax 已知风险注记带留档、`MF_LLM_AUTH_JSON_PATH` 补行、provider 表更新）。

### Acceptance criteria

- [ ] UI 测试覆盖契约关键态：S1/S2/S3/S4/S5 + H1/H3/H4（HTTP 边界，注入临时 envFile + authJsonPath fixture）
- [ ] 契约负例逐条成立：密钥只打码、faux 恒演示模式、未配置恒灰、发现层错误不显示、表单 value 永不回填
- [ ] `a.chip`/`.chip-fail` CSS 落地；术语与契约 §4 钉死文案一致
- [ ] README 四处同步（零配置节/风险注记/新 env 行/provider 表）；全量验证门绿

## 5. 密闭性双环境验证 + 零配置真实用例

**Blocked by**: 4
**User stories**: US1、US14（+D3 验收/验证门）

### What to build

验收执行切片：双环境一致性——全量验证门在「真实 auth.json 在场」与「发现路径指向不存在文件」两环境各跑一次、结果一致（D3/KA2 验收）；零配置真实用例——清空 MF_LLM_MODEL 与 provider key 环境变量，CLI `generate` 经自动发现 + 默认链真实跑通并留档（本机 auth.json 两候选 key 在手，G4 链序 = MiniMax 主）；faux 全量回归确认。

### Acceptance criteria

- [ ] 双环境全量门 exit code 与测试数一致（留档两份日志）
- [ ] 零配置 CLI generate 真实 exit=0 + 草案留档（provenance 显示默认链链首）
- [ ] faux e2e 全量绿；验证门 `npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿

---

**VERIFY 备忘**：验证门同 M1；真实依赖用例 = 零配置 generate（本机 auth.json）；node 地板维持 22.19（engines 已声明，本批不动工程面）。

---

## REVIEW cycle 1 工作项（2026-10-18，源自 .flow/review-findings.md）

- [x] R1（F1 blocking）：S8 422 重渲染——表单 error-list 加 `id="settings-issues"`，模型输入在错误态加 `aria-invalid="true"` + `aria-describedby="settings-issues"`（契约 §3）
- [x] R2（F2 blocking）：S5 错误态——工厂报错原文改经 `error-list` + `role="alert"` 容器呈现（契约 §1）
- [x] R3（F3 blocking）：faux 短路改用合成后终值（先合并层叠再判 BACKEND==="faux"），显式非 faux BACKEND 覆盖 .env.local faux 时发现层照常运行（D4 显式赢语义）
