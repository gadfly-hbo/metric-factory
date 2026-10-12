# Red-Team: v5 分析体系编辑器

> 评审对象 .flow/proposal.md。判定：**go**（无 kill 判据已满足；范围纪律是最高风险，proposal 已内置砍除项）。

## Top Kill-Assumptions

### 1. 范围膨胀：场景编辑器长成第二工作台（最高风险）
- **Claim**：ScenarioSpec 最小集（8 字段级）+ added-only diff + 表单复用能在一个 flow 内交付。
- **Fails if**：结构设计滚大（问题树变画布、方法引用变方法库、发布变审批流）——JA-ABS-PRD-001 全对象是产品长期态不是 v5 态。
- **Kill criterion**：ISSUES 拆解 > 6 切片 → 当场砍（优先砍：UI 表单深度降为文本域、模板种子只做 1 个、diff 展示延后）。
- **Cheapest test**：拆解本身（ISSUES 阶段计数）。

### 2. scenarios 结构冻结质量：v6 消费方不认
- **Fails if**：ScenarioSpec v0.1 与 JuanerAI 侧场景/分析配置对象不兼容（其对等物是 ABS ScenarioSpec，但消费方实际落地的是 A-02/IR 世界）。
- **缓解**：结构对齐 ABS F03 命名（decision_purpose/metric_usages/question_tree 直取）；契约预留条款已声明结构随 v5 冻结后进契约修订；v6 有修订窗口。
- **Cheapest test**：结构与 ABS §7.1 ScenarioSpec 行逐字段对照（GRILL 做）。

### 3. 模板种子场景的内容成本
- **Fails if**：7 模板 × 种子场景的内容创作拖垮批次（回填试点已证内容工作量大）。
- **对策**：GRILL 裁决试点范围（倾向 ecommerce+apparel 各 1 个高质量种子，其余模板空场景合法）。

### 4. UI 表单复杂度违反零脚本底线
- **Fails if**：question_tree 结构化编辑需要 JS。
- **对策**：紧凑文本 DSL（逐行 `label < parent`）+ 服务端校验回显——GRILL 冻结。

## What's Well-Reasoned
- Domain Pack 依据条件条款移出（SDK 不存在的证据已核）；added-only 最小 diff；配置无 provenance 的边界讲清。
## What I Couldn't Assess
- JuanerAI 侧未来场景对象的最终形态（无实现）——结构兼容是方向性对齐不是保证。
