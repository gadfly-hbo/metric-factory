# M2 · 零配置体验：密钥自动发现 + 默认链自动启用 · 方案（proposal）

> 规格源：2026-10-18 会话三仓（metric-factory / deep-research / reports-factory）agent-runtime 接入对比与 M1/M2/M3 迭代方案定稿（用户裁决「M1 先行，M2 紧跟，M3 可拆独立 PR」）+ M1 flow 交付事实（commit `655b84d`）与 `.flow/archive-m1-20261018/handoff.md`。本文件是后续 PRD/GRILL/ISSUES/REVIEW 的唯一规格源。**本 flow 只做 M2**；M3（审计落盘与 provenance 闭环）明确不在本批。
> 诚实披露：迭代方案的 M2 节原文未完整落盘，本文件从 M1 proposal「明确不做」节原文、红线括注（设置页降级为「查看+覆盖」）与 handoff 重构，稀薄处在「开放问题」标注，由 GRILL 补全。

## 目标

让新用户 clone + build 后**无需手配任何环境变量**即可用真实模型跑通 generate/refine：从本机已有凭据自动发现密钥、自动启用默认链；设置页从「必填表单」降级为「查看 + 覆盖」；首页状态芯片三态化。

## M1 交付地基（事实）

- 引擎：vendored `pi-agent-runtime@0.4.3` `runText` 通道（三分映射、limits 五键、modelRecovery）；`LlmClient` 接口不变。
- 配置面：四分映射——真值表两已验证模型（`minimax-cn/MiniMax-M3`、`xiaomi-token-plan-cn/mimo-v2.6-flash`）/ `MF_LLM_BASE_URL` 网关 / pi-ai 目录回退 / 显式拒绝。
- `MF_LLM_FALLBACK_MODELS` 主备链（缺 key 候选跳过）；密钥从注入 env 直读，process.env 桥已删——**工厂入参 env 即唯一密钥来源，自动发现天然接在这里**。
- `scripts/llm-smoke.sh` 已有 auth.json 密钥注入循环（smoke 专用 dev 便利；M2 是把它**产品化**）。
- 本机 `~/.pi/agent/auth.json` 实测含 minimax-cn、xiaomi-token-plan-cn 等 7 个 provider 凭据。
- 先例：reports-factory `src/agent/model.ts` 候选链与密钥发现（M1 对比分析已研读过）。
- M1 延期项中与本批相关者：`envKeyFor`（src/llm/index.ts）与 `apiKeyEnvName`（src/ui/env-file.ts）两处实现漂移风险（handoff 延期项 3）。

## 已定决策（从迭代方案与 M1 proposal 继承，为约束而非开放问题）

1. **密钥自动发现**：来源以 `~/.pi/agent/auth.json` 为先（pi CLI 凭据文件，本机实测在手）；发现到的 key 仅内存使用，**永不写盘、永不进页面/日志/导出物**（红线延续）。
2. **默认链自动启用**：未配置 `MF_LLM_MODEL` 且发现到真值表候选 key 时，自动以默认链（MiniMax-M3 主 / mimo-v2.6-flash 备）工作——「开箱即用」的落点。
3. **设置页降级为「查看 + 覆盖」**：手配路径保留（`.env.local` 显式配置覆盖自动发现结果），但模型/密钥不再是必填表单。
4. **首页芯片三态化**：承接 v1 设置芯片后续（M1 proposal「明确不做」节原文项）。
5. **优先级语义：显式配置（.env.local / process env）> 自动发现**——手配永远赢（与 M1 smoke 注入「已设变量优先」语义一致）。
6. **M3 项明确不在本批**：审计 JSONL 落盘+轮转、预算账本、provenance 记录实际出稿 provider/model、设置页调用统计。

## 红线（既有设计不变式，全程保留）

- **工人模式不变**：LLM 只产草案不写盘；generate/refine 保持单发结构化调用，不引入 `runAgent` 工具循环。
- **fail-closed 人审门不变**：草案带 provenance + 待审标记，未审核导出硬阻断。
- **pi 依赖收敛 `src/llm`**：guard 测试锁定业务代码零 pi import。
- **faux 后端不变**：`MF_LLM_BACKEND=faux` + `MF_FAUX_RESPONSE` 确定性脚本，测试/演示零网络。
- **密钥永不进页面/日志/导出物**：自动发现路径同样约束——页面只可显示打码形式。
- **`.env.local` 手配路径保留**：覆盖语义，不删既有 UX 能力。

## 明确不做（本批范围外）

- M3：审计 JSONL 落盘+轮转、预算账本、provenance 实际出稿记录、设置页调用统计。
- M4：runAgent 会话/工具化草案（明确否决，见红线）。
- 多用户密钥托管（工作台定位本地单用户不变）。
- auth.json 以外的更多密钥来源（系统 keychain、1Password CLI 等——留开放问题评估，默认不做）。

## 验收方向（草案级，PRD 细化）

- 验证门不变：`npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿。
- **零配置路径真实验证**：无 `MF_LLM_MODEL`、无 provider key 环境变量时，CLI `generate` 经自动发现 + 默认链跑通真实调用（本机 auth.json 两候选 key 实测在手）。
- **覆盖语义**：手配 `MF_LLM_MODEL`/key 时自动发现让位（显式永远赢）。
- faux 路径零回归；guard 测试通过。
- README/设置页文案同步（零配置为主线叙事，手配为覆盖路径）。

## 开放问题（GRILL 补全候选）

- auth.json 读取失败/格式漂移容错（文件不存在、JSON 坏、条目缺 `key` 字段、非 object 条目）。
- 发现的 provider→key 映射与 `envKeyFor` 是否合一（M1 handoff 延期项 3：两处实现漂移风险，本批顺手合一？）。
- 默认链的组成与顺序（是否就是真值表两候选；缺 key 跳过语义是否沿用 M1 主备链语义）。
- 设置页「查看+覆盖」具体呈现：自动发现来源标示、打码形式、覆盖写 `.env.local` 的交互与校验。
- 首页芯片三态的状态定义与文案（三态如何映射 未配置/已自动发现/已手配/错误？）。
- CLI 无配置且无发现时的报错文案（现时「请设置 MF_LLM_MODEL」指引手配，零配置时代如何改写）。
- 同 provider 部分配置组合边界（如 env 有模型无 key + auth.json 有 key → 是否补齐；env key 与 auth.json key 不一致时谁赢——决策 5 已答显式赢，细节待 GRILL）。
- 发现结果的缓存与重读时机（进程生命周期内缓存？设置页保存后是否重读？auth.json mtime 变化？）。
- 自动发现是否写入 llmStatus/设置页的来源标示（「密钥来源：自动发现（pi CLI）」类文案）。
