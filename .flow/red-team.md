# Red-Team: Metric Factory v2 · LLM 设计器

> 评审对象：`.flow/proposal.md`（v2 flow，2026-09-29）
> 结论：**go**（无 kill 判据已满足；两项风险需在实现中对冲，一项需发布前人工验证）

## Top Kill-Assumptions（按 影响 × 错误概率 × 测试便宜度 排序）

### 1. LLM 生成的口径质量达到「人审可采纳」（采纳率 ≥60% 的根基）

- **Claim**：模板锚定（RAG 注入 L2 模板上下文）足以让 LLM 产出「口径正确」的候选指标。
- **Steelman**：DataLeap 已验证「AI 映射 + 人工 Review」模式可行；生成锚定在专家审校过的模板上，自由生成仅限模板没有的新指标，幻觉空间被结构性压缩。
- **Fails if**：LLM 生成的指标「听起来对但口径错」（分子分母颠倒、时间窗与业务不符），人审变成逐条挑错的高成本活动，采纳率 <60%，产品口碑变成「AI 瞎编指标」——这正是 proposal §3.2 自认的最大风险点。
- **Evidence to get this week**：真实模型冒烟——用 3–5 个真实业务描述跑生成（不用 fake provider），人工评每条候选的口径正确性。
- **Kill criterion**：冒烟中口径错误率 >30%，或人审后采纳率 <40%。
- **Cheapest test**：发布前内部冒烟（开发期无法替代，fake provider 只能验证管道不能验证质量）。

### 2. 模板全量注入的 token 可行性（RAG 层次选型的硬约束）

- **Claim**：模板 RAG 可行。但 53 指标电商模板全量序列化约 15–20k token，4 个新模板后上下文膨胀。
- **Steelman**：现代模型 128k+ 上下文放得下单个模板 + 已审核实例；生成场景一次只锚定 1 个基模板。
- **Fails if**：注入全部指标导致 prompt 超限或注意力稀释，生成质量下降；或按需检索（关键词）召回不足，锚定失效退化为自由生成。
- **Evidence to get this week**：实现时实测单模板序列化 token 数；若 <25k 则「单模板全量注入」成立，RAG 降级为「模板选择」问题（复用 MVP 匹配内核）。
- **Kill criterion**：单模板序列化 >50k token 且关键词检索召回在构造测试中 <70%。
- **Cheapest test**：token 计数脚本 + 检索单测（无网络）。

### 3. 真实 LLM provider 路径零测试覆盖（fake provider 的盲区）

- **Claim**：适配器 + fake provider 能保证真实路径正确。
- **Steelman**：适配层薄（构造请求 → 解析 JSON 响应），业务逻辑全在 provider 无关层；JSON Schema 校验兜底输出格式。
- **Fails if**：真实 API 的结构化输出不稳（截断、markdown 包裹、拒绝）、鉴权/网络错误未被正确转化为用户可读信息——用户第一次真实使用就崩。
- **Evidence to get this week**：真实 provider 冒烟脚本（同 #1 复用）；错误路径（无 key、坏 key、超时）在 CLI 层的可读报错测试。
- **Kill criterion**：无（工程对冲项，不是战略假设）；但发布前必须留一次真实调用记录。
- **Cheapest test**：`generate --dry-run`（只打印 prompt 不调用）+ 冒烟脚本。

### 4. 单人产出 4 个新行业模板（≥40 指标/行业）

- **Steelman**：MVP 已交付 2 个深度模板，方法（OneData/北极星公开方法论 + 领域常识 + lint 门）可复制；「LLM 出初稿 + 专家审校」流水线正是本产品自己主张的。
- **Fails if**：行业领域知识不足导致口径经不起从业者追问（供应链的 OTIF、云成本的摊销口径是专业深水区）。
- **Evidence to get this week**：timebox 一个最陌生行业（云成本）的 40 指标初稿，请从业者盲评。
- **Kill criterion**：盲评「不如内部 Excel」或关键口径错误率 >10%。
- **Cheapest test**：单模板 timebox（MVP 已跑通过 2 次）。

### 5. audit 启发式规则有实际价值

- **Steelman**：north-star 仓库验证了 audit 需求；「口径缺失/虚荣指标/无归口」三条规则与语义层治理实践对齐。
- **Fails if**：规则太浅，输出是人人皆知的噪音清单，用户跑一次就不再用。
- **Evidence to get this week**：对 MVP 两个自带实例跑 audit（应干净），对构造坏实例跑（应分类命中）。
- **Kill criterion**：对合法实例误报 >10%，或规则覆盖不了最常见的三类真实问题。
- **Cheapest test**：单测 + 两模板自检（无网络）。

## What's Well-Reasoned

- **四件套顺序对**：先 review 审核流补全 fail-closed 闭环，再做生成器——门先于内容，与「口径可信性是产品本体」一致。
- **fake provider 隔离**：测试不碰网络是正确的工程纪律；验收明确区分「可执行」与「运行时」指标，不虚报可验证性。
- **MCP 成本低、下行小**：一个 SDK + 三个工具包装既有引擎能力，即使无人使用也不构成战略损失。
- **复用 MVP 地基**（provenance schema、fail-closed 门、匹配内核、lint），v2 没有推倒任何已验证的东西。

## What I Couldn't Assess

- **Prompt 设计质量**：方案未给出生成 prompt 的结构（角色/上下文/输出契约/few-shot），这直接决定 kill-assumption #1 的成败，PRD 必须定形。
- **review 命令的交互形态**：逐条 approve/reject 的终端交互 vs 批量文件式（CI/agent 场景需要非交互路径），方案未定。
- **refine（MCP 微调）与 generate 的边界**：refine 是改口径开关还是改指标集合，工具粒度未定义。
- **模板 PR 评审流程的落地形态**（文档约定 vs 工具化 checklist）。

---
*判定：go。最优先行动项 = kill-assumption #2 的 token 实测（实现第一天就能做，决定 RAG 层次）与 #1 的真实模型冒烟（发布门槛）。*
