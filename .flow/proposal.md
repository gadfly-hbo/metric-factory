# Metric Factory · v2 方案（LLM 设计器）

> 本 flow 的规格源。上游根规格：仓库根 PRODUCT_PLAN.md（v0.1）第 5 节 v2 段与第 7 节 v2 验收。
> MVP（模板 + 向导 + 导出闭环）已于 2026-09-28 交付（commit 0ad90aa），其决策继续有效。

## 目标

把 PRODUCT_PLAN v2 段落地：**LLM 设计器**——AI 出初稿、人当守门员，四件套：

1. **LLM 生成器**：自然语言描述业务 → 基于「模板 RAG」（锚定 L2 模板与已审核实例）生成候选指标 → 结构化 diff 展示 → 写入实例（added 段，provenance.origin=llm + 模型 + prompt 版本，强制 review.required=true）
2. **人工审核流（review 命令）**：列出待审 LLM 指标 → 逐条批准（写 reviewed_by）或拒绝（移除）；未审核不可导出（fail-closed，MVP 已有地基，本 flow 补全闭环）
3. **MCP server**：以 MCP 协议暴露「设计（generate）/ 审计（audit）/ 微调（refine）」能力，Claude 等 agent 一等公民调用
4. **指标审计命令（audit）**：对实例跑「口径完整性 / 虚荣指标」检查（吸收开源 north-star 的 audit 思路），输出可执行的问题清单

**模板库扩产**：5–6 行业（现 2 个：电商交易平台、SaaS 订阅），候选方向参照 Kyligence Zen 行业带：内容社区/App、数字营销/广告、供应链物流、云成本；每个 ≥40 指标、含完整口径与出处；建立模板 PR 评审流程（lint 门 + 评审清单）。

## 验收（可执行部分）

- LLM 生成候选 100% 带 provenance（origin=llm + model + prompt_version），无出处无法写入
- 未审核 LLM 指标导出被阻断（MVP 已有测试，本 flow 扩展到 review 后放行的全链路）
- 生成的候选经 schema 校验 + 模板锚定（引用的 type_params/维度在实例域内合法）
- audit 命令对构造的坏实例输出分类问题清单（口径缺失/虚荣指标/无归口）
- MCP server 可被标准 MCP 客户端握手并列出工具（测试以 SDK in-process client 验证）
- 模板新增行业过 lint + 模板质量测试（≥40 指标口径完整）

**运行时指标（开发期不可验证，发布后度量）**：LLM 生成指标人工审核采纳率 ≥60%；外部模板 PR ≥3 个。

## 约束与既有决策（继续有效）

- 技术栈：TypeScript / Node ≥20 ESM；测试 vitest；不引入网络依赖进测试（LLM 用 faux/fake provider，真实调用由环境变量配置）
- **agent runtime / 模型访问统一参考** `~/.zcode/workspace/default/juanerai-pi-agent-foundation-plan.md`（用户指令，2026-09-29）：
  - 模型访问走 pi-ai（`@earendil-works/pi-ai`，公共 npm 0.87.1），全部 pi 依赖收敛到单一适配模块，禁止业务代码直接 import pi 包
  - v2 所有 LLM 调用为**工人模式**（单次结构化调用 + schema 校验 + fail-closed 门，模型不握方向盘）；不引入 agent 循环（runAgentLoop 属未来「拴绳主导」场景，按参考方案阶段 2 路径再引入）
  - 测试用 pi-ai faux provider；版本钉死 0.87.x，升级走专项（changelog → 夹具回放全绿 → 统一升）
- fail-closed 永不放松：任何路径写入的 LLM 指标必须走 provenance + review 门
- Web UI 仍属 v3，本 flow 不做前端
- 测试接缝沿用 MVP 确认过的：CLI 进程边界为主接缝 + 纯函数低层（生成器 prompt 构造、审计规则、RAG 检索）
- 双机同步：origin = github.com/gadfly-hbo/metric-factory.git；sync.targets = macbook:/Users/huangbo/Dev/Projects/metric-factory（已配置；SHIP 时走 commit → push → fail-closed fast-forward 同步）

## 开放问题（GRILL 处理）

- 真实 LLM provider 选型（OpenAI 兼容接口 / Anthropic / 可配置多 provider）
- RAG 的实现层次（全模板注入上下文 vs 关键词检索；嵌入检索是否引入）
- audit 的虚荣指标判定规则集
- 新增 4 个行业模板的优先级排序
