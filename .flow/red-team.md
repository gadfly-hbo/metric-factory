## Red-Team: M2 零配置体验（auth.json 密钥自动发现 + 默认链自动启用 + 设置页降级 + 首页芯片三态化）

规格源仅 `.flow/proposal.md`。已对以下负载假设做了本地实证：`~/.pi/agent/auth.json` 真实结构（只看结构/键名，未读值）、M1 handoff 与 smoke 留档、`src/llm/*`、UI 四处文件、CLI/MCP 调用点、reports-factory 先例、测试套件。

### Top Kill-Assumptions (ranked)

**1. 默认链"开箱即用"的体验质量：refine 对两个真值表候选当前都是红的，且目标与验收自相矛盾**

- **Claim:** 零配置用户 clone+build 后"即可用真实模型跑通 generate/refine"（目标节原文），默认链 MiniMax-M3 主 / mimo 备是正确的首跑路径。
- **Steelman:** generate 双候选在 M1 smoke 留档（`/tmp/mf-llm-smoke-20261018-143600/`）真实成功，MiniMax 产出 14 个结构合格候选指标；modelRecovery `extraAttempts:1` 提供一次自愈；refine 失败属 prompt/schema 契合问题，fail-closed 兜住未产垃圾，且 handoff 将其列为延期项、本批明确不动 prompt/schema。
- **Attack:** 我读了留档原文：两个候选的 `refine-summary.txt` 均为 0 字节、双双带 `smoke-failure.txt`（exit=1）——**refine 对默认链两个候选当前全灭**，WARN 发布门尚待人工评估。handoff 延期项 2 另记 MiniMax-M3 generate JSON 系统性畸形（留档那次成功了，说明该观察不稳定或靠 recovery 救回——首跑体验赌的是主候选的抖动率）。更锋利的是 proposal 内部矛盾：目标写"跑通 generate/refine"，验收方向却只验证 generate。**若 refine 红态延续，零配置新用户的第二次操作就撞上硬失败，"开箱即用"叙事即破。**
- **Fails if:** 默认链任一候选 refine 仍被 schema 拒（现状即如此），或 MiniMax-M3 generate 畸形 JSON 在新机首跑复现。
- **Evidence to get this week:** 已到手（留档实证 refine 双红）；补一次手动 smoke 确认 MiniMax generate 畸形是否复现。
- **Kill criterion:** PRD 定稿时 refine 双候选红态既未修复（M1 延期项 1 未入批）也未从目标文案降级——目标与验收的矛盾原样带进 PRD 即 kill 该版目标；或 smoke 复跑 MiniMax generate 畸形率 >0/3。
- **Cheapest test:** `zsh scripts/llm-smoke.sh` 手动复跑一次（已有脚本，两条真调），只盯 refine-summary 与 MiniMax generate JSON。

**2. 自动发现的接入点会撞碎测试密闭性与 G3 不变式——"天然接在这里"是未做的设计决策，不是事实**

- **Claim:** "工厂入参 env 即唯一密钥来源，自动发现天然接在这里"——发现逻辑可以低成本接入而不破坏既有结构。
- **Steelman:** G3 属实（`resolveOne` 只读注入 env、无 process.env 桥、cacheKey 含 key 指纹）；guard 只锁 pi import，src/llm 读文件不违规；RF 先例证明文件解析可行。若发现做成"产出 env 的前置纯步骤"，工厂保持纯净， claim 成立。
- **Attack:** 先例的机制恰恰不能抄：RF `loadKeysFromDisk()` 在模块 import 时**直接 mutate process.env**——这是 M1 明确删除的 process.env 桥。而把发现放进 `createLlmClientFromEnv` 或 UI 默认路径的任何天真实现都会立即使测试机器相关：`test/unit/llm-config.test.ts:111` 断言无 key 时抛 `/MINIMAX_CN_API_KEY/`、`test/ui/settings.test.ts:19` 断言"未配置"、`test/ui/drafts.test.ts:138` 断言 422——**本机 auth.json 恰好有两个候选的 key，发现一旦默认生效，这些断言在开发机上全翻绿转红，在无 auth.json 的 CI 上又通过**：验证门变成环境抽签。UI 测试注入了 `envFilePath` 却没有 auth.json 路径的对应缝。这不是"顺手接"，是一个必须显式设计的注入缝（authJsonPath / 关闭开关），proposal 全文未提。
- **Fails if:** 发现逻辑无注入缝/关闭开关，任何测试的成败取决于真实 `~/.pi/agent/auth.json` 是否存在；或发现以 mutate process.env 方式实现，G3 名存实亡。
- **Evidence to get this week:** 设计评审一句话即可判定：PRD 是否写明"工厂保持 env-only 纯函数，发现为可注入路径的前置步骤，测试默认不触达真实 auth.json"。
- **Kill criterion:** PRD 定稿仍无 discovery 注入缝/关闭开关条款；或 spike 实现后 `npm run test` 在有/无 auth.json 两机结果不一致。
- **Cheapest test:** 半日 spike + 在本机（有 auth.json）跑全量测试门；或更便宜——PRD 评审时检查上述句子是否存在。

**3. ".env.local 手配路径保留、显式永远赢"对 CLI/MCP 当前不成立——覆盖语义是 UI 限定版**

- **Claim:** 决策 3/5：`.env.local` 显式配置覆盖自动发现，手配永远赢；设置页文案"工作台与 CLI 共用"。
- **Steelman:** UI 侧属实：`resolveLlmEnv` 把 .env.local 叠在 process.env 上，设置页保存同进程生效；决策 5 与 smoke"已设变量优先"语义一致。
- **Attack:** 实证：`src/cli/index.ts:374,512` 与 `src/mcp/server.ts:65,96` 均 `createLlmClientFromEnv()` 默认吃 process.env，**全仓没有任何 CLI/MCP 代码读 .env.local**——"共用"文案今天就是假的。M2 把设置页降级为"查看+覆盖"后，用户在设置页保存覆盖、CLI `generate` 却走自动发现——**"显式永远赢"对 CLI 静默失效**，而这恰是验收方向第 3 条声称要验的覆盖语义。验收只写了 CLI 的零配置路径，没写 CLI 的覆盖路径。
- **Fails if:** PRD 不裁决"CLI/MCP 是否接入共享 env 解析（.env.local + 发现）"，覆盖语义在 CLI 侧无人实现也无人验证。
- **Evidence to get this week:** 已到手（grep 实证四处调用点）。只差一个范围裁决。
- **Kill criterion:** PRD 验收含"CLI 覆盖语义"但范围不含 CLI 读取 .env.local（或不含改写文案）——即验收了没人打算建的东西。
- **Cheapest test:** 已完成（grep）。修复本身也便宜：CLI/MCP 改走共享 resolver 约半日，或砍文案五分钟。

**4. auth.json 是 pi CLI 的私有未承诺格式，且真实文件已含非 key 形态条目**

- **Claim:** 决策 1：`~/.pi/agent/auth.json` 作为密钥来源"本机实测在手"，是可靠的发现源。
- **Steelman:** 本机实证为真：文件存在，顶层 7 个 provider 条目，`minimax-cn` 与 `xiaomi-token-plan-cn` 均有 `key` 字段；smoke 脚本与 RF 先例都用扁平 `a[provider].key` 读取且工作正常；容错已列入开放问题。
- **Attack:** 实测结构同时暴露了漂移的鲜活样本：7 条目里 `openai-codex` 是 OAuth 形态（`access/refresh/expires`，**无 `key` 字段**）——"条目缺 key"不是假想边界，本机就有。且 RF 源码注释把结构写成嵌套 `providers["minimax-cn"].key` 而代码读扁平——**连同一个作者生态内对该文件结构的认知都已经漂移过一次**。该文件是 pi CLI 的私有实现细节，无任何稳定性承诺；发现解析器若不容错（非 object 条目、缺 key、JSON 坏），坏文件会把"零配置"变成"零启动"。失败方向是安全的（静默降级为未配置），所以这一条排第四而非第一。
- **Fails if:** pi CLI 改结构/换路径/加密，或解析器对 OAuth 形态条目不容错而抛错。
- **Evidence to get this week:** 已到手（结构实证：扁平 `{provider:{type,key?}}`，6/7 带 key）。PRD 只需把容错规则写成验收：坏文件/坏条目一律静默跳过。
- **Kill criterion:** 无硬性 kill——降级方向安全；但若 PRD 把 auth.json 写成唯一发现源且无容错验收条款，视为设计缺陷打回。
- **Cheapest test:** 用构造的畸形 fixture（OAuth 条目、JSON 截断、非 object 条目）跑三个单测——写 PRD 前即可定义。

**5. "新用户零配置"实际只覆盖"装有 pi CLI 且配过这两家 CN provider 的机器"**

- **Claim:** 目标："新用户 clone + build 后无需手配任何环境变量即可用真实模型跑通"。
- **Steelman:** 工作台定位本地单用户，proposal 明确把系统 keychain/1Password 等其他来源划到批外，"本机已有凭据"措辞本身限定了范围；三态芯片覆盖无发现情形。
- **Attack:** 对没有 `~/.pi/agent/auth.json` 的一般新用户，M2 交付的发现层**恒发现为空**，零配置承诺不兑现，体验退回今天的"去设置模型"。真值表两家（minimax-cn / xiaomi-token-plan-cn）是操作者自己的 provider 生态，不是市场默认。这不是工程缺陷而是叙事口径问题：README 若按"零配置为主线叙事"（验收方向原文）写，会对非 pi 用户过度承诺。
- **Fails if:** README/首页文案把零配置写成普遍承诺而非"已有 pi CLI 凭据则零配置"。
- **Evidence to get this week:** 无需新数据；文案评审一次。
- **Kill criterion:** 无 kill；PRD 文案口径不收敛则打回文案，不动工程。
- **Cheapest test:** README diff 评审。

### What's Well-Reasoned

- **接缝判断属实**：G3（工厂 env 唯一密钥来源）代码实证成立——`resolveOne` 只读注入 env、cacheKey 含 key 指纹（改 key 同进程生效，发现到的 key 轮换也天然生效）、guard 只锁 pi import 不挡 fs 读取。发现"产 env、工厂保持纯"的正确形态存在且便宜。
- **优先级语义有据**：显式>发现 与 smoke 脚本"已设变量优先，不覆盖"及 RF 先例逐字一致；D5 缺 key 跳过语义与默认链自动启用天然复合（发现到几家启用几家）。
- **auth.json 存在性 claim 实证为真**：本机文件含两个真值表 provider 的 key（结构核验，未读值），proposal 验收"两候选 key 实测在手"成立。
- **漂移风险自认且属实**：`envKeyFor`（map+fallback 只转 `-`）与 `apiKeyEnvName`（map+fallback 转一切非字母数字）对含 `.` provider 结果确实分叉（`FOO.BAR_API_KEY` vs `FOO_BAR_API_KEY`）；对两个真值表 provider 碰巧一致。M2 将引入第三处映射（provider→auth.json 条目名），handoff F3 的合一建议在本批兑现是对的方向。
- **红线兼容**：发现仅内存使用与"密钥永不进页面/日志/导出物"兼容；`LlmStatus.keyMasked` 已有打码通道，faux 后端短路在工厂最前，发现逻辑不会泄漏进 faux 路径。
- **诚实披露到位**：规格稀薄处自标、开放问题清单（容错/合一/缓存时机/来源标示）基本是对的清单——唯一漏掉的是上面的 #2（测试密闭性缝）与 #3（CLI 侧 .env.local）。

### What I Couldn't Assess

- pi CLI 对 auth.json 的格式承诺与演进方向（外部依赖，无本地证据）。
- MiniMax-M3 generate JSON 畸形的复现率（留档当次成功，handoff 注记或来自未留档运行；需 smoke 复跑，见 #1）。
- 默认链自动启用与 `MF_LLM_BASE_URL` 同设时的交互（G6 真值表+网关矛盾抛错在"用户没设 MF_LLM_MODEL 但设了网关"的自动启用路径下行为未定义——留给 GRILL 的正当开放问题）。
- 三态芯片的确切状态机（proposal 自标 GRILL 补全；"未配置/已自动发现/已手配/错误"是四态还是三态归并，无证据可判）。

---

**Verdict: go** — 无已触发的 kill 标准（#1 的 refine 红态是 M1 已挂 WARN 门的延期项，非本批新伤；但它与目标文案的矛盾必须在 PRD 内了断）。以下条件折叠进 PRD：

1. **发现缝显式化**（对应 #2）：工厂保持 env-only 纯函数；发现实现为可注入路径（authJsonPath 或等效开关）的前置步骤，测试默认不触达真实 auth.json；验收加一条"测试门在有/无 auth.json 两环境下结果一致"。禁止 mutate process.env（RF 机制不抄）。
2. **了断 refine 矛盾**（对应 #1）：PRD 二选一——把 M1 延期项 1（refine prompt 枚举加固）纳入本批，或把目标文案降级为 generate 并写明 refine 已知红态与处置计划；默认链排序须参考 handoff 延期项 2 评估 mimo 升主。
3. **裁决 CLI/MCP 的 .env.local 语义**（对应 #3）：要么 CLI/MCP 改走共享 env resolver（同时获得 .env.local 与发现），要么删掉"工作台与 CLI 共用"文案并把覆盖验收限定在 UI。
4. **auth.json 容错写入验收**（对应 #4）：文件不存在/JSON 坏/条目非 object/缺 `key`（OAuth 形态）一律静默跳过，降级为未配置；发现到的 key 在设置页/芯片带来源标示且只显示打码。
5. **文案口径**（对应 #5）：零配置叙事限定为"本机已有 pi CLI 凭据"，一般新用户的三态芯片未配置路径保留为正常态而非异常态。
