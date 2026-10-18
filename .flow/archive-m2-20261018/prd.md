# M2 · 零配置体验：密钥自动发现 + 默认链自动启用 · PRD

> 规格源：`.flow/proposal.md`（唯一裁决源）+ `.flow/red-team.md`（go，5 条件并入）。无 issue tracker，落盘本文件。M1 地基事实见 proposal「M1 交付地基」节（commit `655b84d`）。

## Problem Statement

新用户 clone + build 之后，必须先读懂 README 的 provider 配置表、手填 `MF_LLM_MODEL` 和密钥环境变量，才能跑通第一次 generate——而这台机器上往往已经存在 pi CLI 凭据（`~/.pi/agent/auth.json`，本机实测 7 个 provider 条目，含真值表两候选）。手配是重复劳动，也是新用户第一公里的流失点。M1 交付了引擎与配置面，但「零配置」仍是 smoke 脚本里的 dev 便利，没有产品化。

## Solution

已有 pi CLI 凭据的机器上，clone + build 后**零配置**直接 generate：发现层从 `~/.pi/agent/auth.json` 读取密钥（仅内存、永不写盘），默认链自动启用（真值表已验证候选，缺 key 自动跳过）。设置页从「必填表单」降级为「查看 + 覆盖」：当前生效链、每候选密钥来源与打码可见，手配保存即覆盖（显式永远赢）。首页芯片三态化：就绪 / 未配置（正常态）/ 错误，一眼可知模型状态。没有 pi CLI 凭据的用户体验不变（手配路径完整保留）。

## User Stories

1. 作为**已装 pi CLI 的新用户**，我想 clone+build 后直接 `generate` 成功（不配置任何环境变量），以便第一公里零摩擦。
2. 作为**已装 pi CLI 的新用户**，我想默认链是已验证模型（MiniMax-M3 / mimo-v2.6-flash），以便首跑输出质量可信。
3. 作为**只有一家 key 的用户**，我想缺 key 的候选被自动跳过（发现到几家启用几家），以便不因缺一家而报错。
4. 作为**无 pi CLI 凭据的用户**，我想看到「未配置」是正常态而非报错页，并有清晰的手配指引，以便知道下一步做什么。
5. 作为**手配用户**，我想显式配置（process env / .env.local）永远覆盖自动发现，以便我的选择不被静默劫持。
6. 作为**手配用户**，我想同 provider 部分配置时（env 有模型无 key）能由发现补齐 key，以便少配一项。
7. 作为**设置页访问者**，我想看到当前生效的模型链与每个候选的密钥来源（环境变量 / .env.local / 自动发现·pi CLI / 缺失）及打码，以便理解系统在用什么。
8. 作为**设置页访问者**，我想模型/密钥字段不再必填、保存即写入 `.env.local` 覆盖、清除即回退自动发现，以便覆盖操作轻量可逆。
9. 作为**首页访问者**，我想状态芯片显示三态（就绪 / 未配置 / 错误）并可点击去设置页，以便不看文档也能判断。
10. 作为**CLI 用户**，我想 `generate`/`refine`/MCP 工具同样享受自动发现，以便 UI 内外体验一致。
11. 作为**所有用户**，我想我的密钥永不进页面明文/日志/导出物（发现来的也一样，只显示打码），以便安全预期不被打破。
12. 作为**auth.json 被 pi CLI 改坏/改结构的用户**，我想发现层静默降级为未配置（文件不存在/JSON 坏/条目非 object/OAuth 形态缺 key 均不抛错），以便坏文件不把「零配置」变成「零启动」。
13. 作为**faux 用户/测试**，我想 `MF_LLM_BACKEND=faux` 路径完全不触碰发现层，以便测试/演示零网络语义不变。
14. 作为**CI**，我想测试门在有/无真实 auth.json 的机器上结果一致，以便验证门不做环境抽签。
15. 作为**README 读者**，我想「零配置」叙事明确限定「本机已有 pi CLI 凭据」，以便不产生普遍承诺的误解。

## Implementation Decisions

- **D1 · 发现层独立纯模块**：新增密钥发现模块（src/llm 内，guard 边界内），导出纯函数——输入 auth.json 路径，输出 `provider → key` 映射。**工厂 `createLlmClientFromEnv` 保持 env-only 纯函数，发现逻辑不进工厂**（红队 KA2）。发现到的 key 仅内存使用，永不写盘、永不进日志/导出物（红线）。
- **D2 · auth.json 解析与容错**：扁平结构 `{provider: {key?: string, ...}}`；文件不存在 / JSON 解析失败 / 条目非 object / 缺 `key` 字段（OAuth 形态，本机 `openai-codex` 条目实证）一律**静默跳过**，整体降级为「未发现」。永不因发现层抛错（红队 KA4）。
- **D3 · 注入缝（测试密闭性）**：发现函数与 UI server 均接受 `authJsonPath` 参数（缺省 `~/.pi/agent/auth.json`）；全部测试经注入路径指向临时构造 fixture，**默认不触达真实 auth.json**；验证门在有/无真实 auth.json 两环境结果一致写入验收（红队 KA2）。**禁止 mutate process.env**（RF `loadKeysFromDisk` 的模块级 process.env 写入机制明确不抄）。
- **D4 · 共享 env 合成 helper**：新增合成函数，输入 `{processEnv, envFilePath?, authJsonPath?}`，按 **process env > .env.local > 自动发现** 合成最终 env（红队 KA2/决策 5）；发现只填充未被显式设置的 `*_API_KEY`。CLI / MCP / UI 各入口统一经此合成后调用工厂（CLI/MCP 读取 .env.local 的范围裁决见 **diff 门 ②**）。
- **D5 · 默认链自动启用**：`MF_LLM_MODEL` 未设置时，按默认链顺序探测候选 key（env → 发现），发现到几家启用几家（沿用 M1 D5 缺 key 跳过语义）；全部无 key → 未配置态（不抛错，UI 正常态呈现 / CLI 报错文案指引向手配）。默认链组成与顺序（mimo 是否升主，参考 M1 handoff 延期项 2 的质量证据）交 GRILL 裁决。默认链与 `MF_LLM_BASE_URL` 同设的交互（红队 What-I-Couldn't-Assess 项）交 GRILL。
- **D6 · provider→key 映射三处合一**：`envKeyFor`（src/llm）/ `apiKeyEnvName`（src/ui/env-file）/ 发现层 provider→auth.json 条目名，合一为 src/llm 单一映射表 + 公式化回退，UI 侧改为引用（兑现 M1 handoff 延期项 F3；消除含 `.` provider 的分叉）。
- **D7 · 设置页降级「查看+覆盖」**：模型/密钥字段不再必填；页面显示当前生效链（主 + 备）与每候选密钥来源标示 + 打码（D1 红线：只有打码）；保存 = 写入 `.env.local`（覆盖语义，沿用 writeManagedEnv 管理键集合）；清空模型字段保存 = 回退自动发现。保存校验沿用 `<provider>/<model-id>` 形式校验（422 语义不变）。
- **D8 · 首页芯片三态**：就绪（自动发现或已配置，显示生效主模型）/ 未配置（正常态，引导手配）/ 错误（配置有误，显示原因摘要）；芯片点击去设置页。确切状态机与文案交 GRILL + UI-GATE。
- **D9 · llmStatus 扩展**：状态增加密钥来源维度（每候选来源：env / env-file / discovery / missing），供设置页与芯片呈现；`configured` 分类语义不变（M1 探针行为不破）。
- **D10 · faux 短路在前**：`MF_LLM_BACKEND=faux` 分支先于一切发现/合成逻辑（红队验证：发现不泄漏进 faux 路径）。
- **D11 · 密钥安全**：发现到的 key 在 UI 只经 `maskKey` 打码呈现；不写入 `.env.local`（发现是读取，不是落盘）；不进日志（含报错文案）；不进导出物（红线）。
- **D12 · 文案口径**：README/首页「零配置」叙事限定「本机已有 pi CLI 凭据」；未配置三态为正常态而非异常（红队 KA5）。设置页「与 CLI 共用」文案按 diff 门 ② 裁决修正（红队 KA3）。
- **D13 · refine 红态处置**：按 **diff 门 ①** 裁决（目标文案降级 vs prompt 加固入批）。

## Testing Decisions

- 好测试标准：只测外部行为（解析输出、合成优先级、UI 呈现），不测内部实现；既有先例：`test/unit/llm-config.test.ts`（配置缝纯函数）、`test/unit/llm-runtime.test.ts`（引擎缝）、`test/ui/settings.test.ts`（HTTP 边界）。
- **发现解析器单测**（新）：构造 fixture——正常扁平条目、OAuth 形态条目（无 key）、JSON 截断、非 object 条目、空文件、文件不存在——全部静默语义断言。
- **合成优先级单测**（新）：process env > .env.local > 发现；部分配置组合（env 有模型无 key + 发现有 key → 补齐；env key ≠ 发现 key → env 赢）。
- **默认链单测**（新）：无模型配置时链组成、缺 key 跳过、全无 key → 未配置；faux 短路不触发现（构造 authJsonPath 指向必爆 fixture 证明不读）。
- **测试密闭性验收**：全量验证门在有/无真实 auth.json 两环境结果一致（本机真实路径 + 临时 HOME 隔离路径各跑一次）。
- **UI 测试**：设置页来源标示三态、保存/清除覆盖回退、首页芯片三态（HTTP 边界，注入临时 envFile + authJsonPath）。
- **真实依赖用例**：无 `MF_LLM_MODEL`、无 provider key 环境变量时，CLI `generate` 经发现 + 默认链真实跑通（本机 auth.json 两候选在手）。
- guard 测试、全量 e2e faux 回归：验证门不变（`npm run lint && npm run typecheck && npm run test && npm run contract-test`）。

## Out of Scope

- M3 全部：审计 JSONL 落盘+轮转、预算账本、provenance 记录实际出稿 provider/model、设置页调用统计。
- M4：runAgent 会话/工具化草案（红线否决）。
- auth.json 以外密钥来源（系统 keychain、1Password CLI 等）。
- 多用户密钥托管（本地单用户定位不变）。
- refine prompt 枚举加固 / 松解析（M1 handoff 延期项 1，产品决策——除非 diff 门 ① 裁决入批）。
- CLI/MCP 读取 `.env.local`（除非 diff 门 ② 裁决入批）。
- 密钥写入/编辑 auth.json（发现只读）。

## Further Notes

- 爆炸半径声明：src/llm（发现模块 + 合成 helper + 映射合一）、src/ui（server/render-settings/render-home/env-file）、CLI/MCP 调用点（diff 门 ② 决定深度）、README、设置页/首页文案、测试。引擎通道（pi-client runtime 装配）不动。
- 验证门沿用：`npm run lint && npm run typecheck && npm run test && npm run contract-test`；真实依赖用例 = 零配置 CLI generate（本机 auth.json）。

---

## Diff-gate 待裁决项（2026-10-18，auto 模式：涉 proposal 决策变更，升级用户裁决）

### ① refine 红态了断（红队 KA1：proposal 目标「跑通 generate/refine」与验收方向「只验证 generate」自相矛盾）

- **选项 A（推荐）**：目标文案降级——本批验收零配置 **generate** 跑通；refine 双候选红态如实披露为已知项（M1 handoff 延期项 1，fail-closed 兜住零写盘、smoke WARN 门挂着），prompt 加固/松解析维持「产品决策」不入批。理由：refine 红态是 M1 已挂门的延期伤而非 M2 新伤；prompt 加固是评估循环驱动的独立工作流，与 M2 工程批性质不同；红队明确「非本批新伤，但矛盾须了断」。
- **选项 B**：refine prompt 枚举加固纳入本批（+约半日~1日 prompt 迭代 + 真实评估），目标文案保持 generate/refine 全验收。

### ② CLI/MCP 的 .env.local 语义（红队 KA3：「显式永远赢」当前仅 UI 成立——CLI/MCP 只读 process env，全仓无 .env.local 读取）

- **选项 A（推荐）**：CLI/MCP 改走共享 env 合成（process env > `.env.local`（cwd）> 发现）——「显式永远赢」在所有入口一致兑现；消除「设置页保存覆盖、CLI 静默不理」的失效陷阱（M2 设置页降级后这个陷阱会更扎眼）；红队估约半日；「工作台与 CLI 共用」文案由假变真。
- **选项 B**：保守限定——CLI/MCP 只加发现合成（process env > 发现），不读 .env.local；设置页「与 CLI 共用」文案改为如实描述；覆盖语义验收限定 UI。

> 两项均给「推荐」。批准即按推荐入 PRD 正文（D13/D12 落定）；逐项裁决亦可。

---

## Diff-gate 附录（2026-10-18 用户批准）

- **批准 ①A**：目标文案降级——本批验收零配置 **generate**；refine 双候选红态（M1 smoke 留档实证：模型自创 `sum`/`measure` 枚举被 schema 拒，fail-closed 零写盘）如实披露为已知延期项，prompt 加固/松解析维持产品决策不入批。D13 落定。
- **批准 ②A**：CLI/MCP 改走共享 env 合成（process env > `.env.local`(cwd) > 自动发现），四入口「显式永远赢」语义统一；设置页「与 CLI 共用」文案由假变真。D4/D12 落定。
- 自批增量（红队条件并入）：D1 工厂 env-only 纯函数+发现前置纯步骤（KA2）、D2 auth.json 全容错静默降级（KA4）、D3 注入缝+测试密闭性验收+禁 mutate process.env（KA2）、D12 文案口径（KA5）、D6 映射三处合一（M1 F3 兑现）。

---

## GRILL 附录（2026-10-18，2x9 预算）

### Round 1（author-blind 子代理，9 包；8 包按推荐自批，包 4 涉 proposal 决策 2 冲突留升级）

- **G1（包1-A）· 注入缝三入口统一**：新增环境变量缝 `MF_LLM_AUTH_JSON_PATH`（发现层缺省路径的唯一覆盖点，合成 helper 缺省读它；README 补行）+ `buildMcpServer(opts?: { authJsonPath?, envFilePath? })` 参数化 + CLI 不加 flag（e2e 以 `MF_LLM_AUTH_JSON_PATH` 指向不存在路径密闭）。CI「有/无真实 auth.json 两环境各跑一次」（D3 验收）只需 flip 一个变量。
- **G2（包2-A）· 合成 helper 返回 `{ env, sources }`**：`sources: Record<string, "process" | "env-file" | "discovery" | "default-chain">`，覆盖 `MF_LLM_MODEL`/`MF_LLM_FALLBACK_MODELS`/`MF_LLM_BASE_URL`/每个被触及的 `*_API_KEY`；空串一律按未设置（与工厂 `if (!spec)` 及 readEnvFile trim 语义一致）。llmStatus/设置页/芯片三 UI 面共用同一事实源，优先级逻辑单份化（防 F3 类漂移）。
- **G3（包3-A）· 默认链在合成 helper 内物化**：仅当 `MF_LLM_MODEL` 未设 **且 `MF_LLM_BASE_URL` 未设** 且默认链至少一个候选 key 可解析（env 或发现）时，注入 `MF_LLM_MODEL`+`MF_LLM_FALLBACK_MODELS`（sources 标 `default-chain`）；baseUrl 已设 → 不注入、维持未配置正常态（避开 G6 真值表+网关矛盾陷阱，文案指引网关需显式设模型）；只设 fallbacks 不设主模型 → 不注入、维持 M1 急切抛错（残缺显式配置应响亮）。工厂一行不动（D1 全保）。
- **G5（包5-A）· 设置页遮蔽警告**：②A 优先级（process env > .env.local）下，渲染与保存后重渲染均对「.env.local 有值但被 process env 覆盖」的键显示警告（需先 unset 才生效）——「保存即覆盖」承诺在 shadow 场景不失信；纯 sources 消费，无新机制。
- **G6（包6-A）· 空模型保存 ≡ /settings/clear 语义**：`MF_LLM_MODEL`/`MF_LLM_BASE_URL`/前一 provider key 全置 null，忽略 api_key/base_url 输入并页面注明「模型留空保存 = 清除覆盖、回退自动发现」；模型填+key 空 = 只存模型（「留空则不修改」语义延续，来源标示显示 key 来自发现或缺失）；slash 之外不做保存时解析校验（维持现状，错误由状态区/芯片浮现）。422 测试仅对 slash 违例保留。
- **G7（包7-A）· 首页芯片四分支呈现、三态语义**：`configured`（不分来源）→ 绿 chip「就绪 · <生效主模型>」+ 来源小字（自动发现/手动配置）；`unconfigured` → 灰 chip 正常态 + 引导链接；`error` → 红 chip + 原因摘要（工厂报错只含变量名不含 key 值，已逐条核实可透出）；`faux` → 维持现有 accent「演示模式」chip（第四分支，不占三态名额——D10 短路的直接推论）。芯片点击去 /settings。
- **G8（包8-A）· 零配置时代未配置文案**：工厂报错升级为条件式表述——「自动发现未找到可用候选凭据（~/.pi/agent/auth.json 不存在或无真值表候选 key）。手配路径：1) 工作台设置页保存（写 .env.local，CLI/MCP 同读）；2) export MF_LLM_MODEL=… + 对应 *_API_KEY；3) MF_LLM_BACKEND=faux」——保留 `MF_LLM_MODEL` 与 `faux` 两 token（MCP 测试断言不断）；工厂不感知发现过程（env-only 纯洁），路径细节放 README。
- **G9（包9-A）· 设置页「查看」面三细节**：(a) 画全链——每候选一行：模型名+来源标签（环境变量/.env.local/自动发现 · pi CLI/缺失（调用时自动跳过））+有 key 时打码；(b) 链外凭据提示——仅列 provider 名（永不列 key）：「另检测到 N 个 pi CLI 凭据：…（手配对应模型即可用）」；(c) 表单输入框 value 永远留空、placeholder 显示当前生效模型——「查看」与「覆盖」物理分离，不与 G6 空保存语义互搏。
- R1 自查即答（附证据入录）：①发现结果**不缓存**、每次合成即重读（resolveLlmEnv 现状即每请求重读，KB 级 JSON 成本可忽略，保存后/pi CLI 改动后自然生效，无需 mtime）；②D6 公式化回退取 `apiKeyEnvName` 的 `[^A-Z0-9]→_`（envKeyFor 现行公式对含 `.` provider 产出非法变量名），已知表取两边并集；③CLI/MCP 的 draft modelLabel 改读合成后 env（链首语义与 M1 一致；记录实际出稿 provider 是 M3 明确不做项）；④auth.json 空串/纯空白 key 视同缺失（与 smoke 判空先例一致）。
- **包 4 保留升级**：默认链顺序（mimo 升主 vs 维持 MiniMax-M3 主）与 proposal 已定决策 2 冲突，主代理核对属实，依规则 5 升级用户裁决（见文末「GRILL 升级项」）。

### Round 2（主代理，0 新包 + 3 项探索即答）

- 探索即答：①合成 helper 落 `src/llm/env-auto.ts`（guard 边界内，CLI/MCP/UI 均可 import），`resolveLlmEnvAuto({processEnv, envFilePath?, authJsonPath?}) → {env, sources}`；env-file.ts 保留 read/write/mask，`resolveLlmEnv` 由新 helper 取代（D4 形状落定）；②`MF_LLM_API`/`MF_LLM_TIMEOUT_MS` 走 process env + .env.local 透传，发现只补 `*_API_KEY`，sources 不追踪此二键（网关路径专用，G2 键集合边界内）；③clear 写键集合不扩（G6 已含 baseUrl/prev-key）——`.env.local` 残留 `MF_LLM_FALLBACK_MODELS` 的边界无害：llmStatus 在 spec 缺失时直接返 unconfigured（不触工厂），CLI 由 G8 新文案指引，不改 M1 报错语义。
- **GRILL converged after 2 rounds**（预算 2x9；R2 新增开放问题归零）。全程 1 次升级（包 4）。

### GRILL 升级项裁决（2026-10-18 用户裁决）

- **包 4 → B：维持 MiniMax-M3 主 / mimo-v2.6-flash 备**（proposal 决策 2 原文不改）。配套：README 零配置节把「MiniMax-M3 输出畸形」从观察注记升级为带留档的已知风险注记（M1 handoff 延期项 2；fail-closed 兜住零写盘，重试或切备候选可恢复）。G4 落定。
