# Red-Team: 批次 1 · 发布与版本交付（工作台侧）

> 评审对象 .flow/proposal.md。判定：**go**（无 kill 判据已满足）。1 项 top kill-assumption 的表述需在 PRD 中收窄（不改变裁决）。

## Top Kill-Assumptions (ranked)

### 1. 「同内容必同指纹」的边界被 generator 字段打破（最高风险）
- **Claim**: 内容指纹置空 fingerprint/created_at/exported_at 三键后，同内容重导出必同指纹。
- **Fails if**: 跨工具构建重导出——`generator` 字段为 `metric-factory@<version>+<git-sha>`，重建/升级后 sha 变化，内容指纹随之变化，而业务定义未变。已实证的稳定性证据仅覆盖**同一次 dist 构建**内的两次导出；proposal 的"同内容必同指纹"表述过强。
- **Evidence to get this week**: 已有实证装置（两次导出 + diff）；补一条跨 sha 模拟（MF_GIT_SHA 覆盖）确认漂移存在即可，5 分钟。
- **Kill criterion**: 若 generator 漂移导致**同一 build 内**指纹也不稳定，才构成 kill（即算法本身错）——现有实证已排除。
- **Cheapest test**: 测试断言「同 build 重导出内容指纹稳定」+「MF_GIT_SHA 变化时内容指纹变化且仅 generator 字段差异」。处置：验收 #2 限定"同 build"；消费指引写明 generator 属包内容（工具来源变化=内容变化，登记侧双指纹可见）。

### 2. 重复发布拒绝破坏幂等工作流
- **Claim**: 同 id@version 已存在 → 拒绝（不可变纪律）。
- **Fails if**: 用户/脚本把 `release` 当幂等命令重复执行（CI 重跑、UI 双击），报错被当成故障。
- **Evidence**: 无自动化重跑场景的证据；单人手动流为主。
- **Kill criterion**: 无（纪律正确，摩擦可接受）。
- **Cheapest test**: 错误信息明确指引（"已发布于 <created_at>，升级版本号"）；测试覆盖拒绝路径。不加 --force（不可变是 proposal 决策）。

### 3. UI 写白名单扩展引入路径风险
- **Claim**: 实例页发布入口写 `releases/<package-id>/<version>.sap.yaml` 是安全的显式扩展。
- **Fails if**: package-id 或 version 未受约束导致路径穿越或写入任意位置。
- **Evidence**: 供应链已有防线——package-id 走 slugify（`^[a-z][a-z0-9-]*$` 校验器兜底）、version 强制 semver regex；UI 侧需同样走装配管线而非自由拼路径。
- **Kill criterion**: 无（约束现成）。
- **Cheapest test**: 路径构造单测：非法 version / 含路径分隔符的 id 被拒。

### 4. 净销售样板的勾稽口径含糊
- **Claim**: `net_sales = gmv(含退款) - refund_amount` 不产生双重扣减歧义。
- **Fails if**: 样板 definition 与消费指引不写明"gmv.include_refund=true 是 net_sales 成立的前提"，消费者按模板默认（剔除退款）套公式即双重扣减。
- **Evidence**: gmv 模板默认 `include_refund: false`（实证）；样板实例必须显式翻转并在 definition 中声明前提。
- **Kill criterion**: 无（教学点正是本样板价值）。
- **Cheapest test**: validate 通过 + 指引文档含勾稽说明；真实性计算验证显式留在批次 3（proposal 已如此划定）。

## What's Well-Reasoned

- **复用导出管线、不开第二套规则**：仓库已有"CLI 与 UI 双出口同语义"惯例（v5 history 与 server.ts 注释实证），release 接入该管线是顺势而非新发明。
- **零 schema/契约破坏的边界执行**：内容指纹只在登记侧、可采用状态放登记文件、布尔开关沿用"开关即证据"SOP——三条都精确绕开了契约 v0.2 冻结面。
- **不可变纪律与审批的区分**：拒绝重复版本但不加审批流，与用户裁决 2/4 一致。

## What I Couldn't Assess

- JuanerAI 载体对 releases/index 字段的真实需求（载体未指认，批次 2 依赖；字段设计已取最小集且 additive 可扩，风险后置）。
- `docs/sap-consumption-guide.md` 的语义是否与 JuanerAI 侧实际运行时假设吻合——属批次 2 核对项，本批次只能写工作台侧确定语义。
