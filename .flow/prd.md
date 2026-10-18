# A1 · 分析体系核心批次 — PRD

规格源：`.flow/proposal.md`（D1–D12）+ 方案 v0.2。验收编号对齐方案 §9（A01–A15）。

## R1 领域模型（schema）

### R1.1 BlueprintSchema（instance.yaml 可选顶层段 `blueprint`）

```
title, intent(建设可复用体系|设计具体分析方案),
purpose(业务目的), decision(研究问题或选择), boundary(范围边界), deliverable(输出要求),
contexts: ≥1 ∈ {经营改善, 战略选择, 独立数据专题}（可组合，去重）
organizations: ≥1 ∈ {假设先行, 深度研究, 自主探索}（可组合，去重）
questions: [{id(snake), title, detail?, metric_refs[]}]
hypotheses: [{id, statement, judgment ∈ {事实,解释,待验证假设,建议}(默认待验证假设),
              support, counter, change_condition, verified(bool 默认 false)}]
evidence_plan: [{id, name, kind, source, check, insufficiency,
                 status ∈ {待获取,取得待核,已核验,支持不足,存在冲突}(默认待获取)}]
options: [{id(snake), name, tradeoff}]   # 候选道路，可空
provenance: 复用 ProvenanceSchema（llm 强制 model+prompt_version；由装配层注入）
```

### R1.2 MethodTemplateSchema（`templates/methods/*.yaml`）

```
method: {id(kebab), name, version(semver), description, references?[]}
contexts: ≥1（同 R1.1 枚举）   family: 专业方法（自由文本）
purpose: 方法服务的判断
roles: [{id(snake), name, required(bool 默认 true)}]   # 输入角色，可空（定性方法）
steps: [{title, detail?}] ≥1
evidence: 证据要求（文本）   limits: 限制（文本）
provenance: 复用（template 须 template_ref）
```

### R1.3 ScenarioSpec v0.2（D4）

ScenarioSchema 新增可选 `method_bindings: [{method_ref, role, metric}]`；method_ref 形如 `<method-id>@<semver>`。其余 v0.1 冻结字段不动。

## R2 引擎规则（validate/lint 镜像 + 新规则码）

- `blueprint-purpose`：purpose/decision/boundary/deliverable 非空（缺 → issue，交付阻断级）
- `blueprint-question-ref`：questions.metric_refs 必须存在于物化指标集
- `hypothesis-completeness`：support/counter/change_condition 三要素非空
- `hypothesis-verification`：D6（verified 需已核验证据；事实/解释未 verified → 阻断）
- `evidence-completeness`：source/check/insufficiency 三要素非空
- `scenario-method-context`：method_bindings 引用方法的 contexts 与 blueprint.contexts 无交 → 阻断（用途不匹配，说明原因）
- `scenario-method-role`：方法每个 required role 必须有 ≥1 条 method_binding 且 metric 存在 → 缺 → 阻断；binding metric 不存在 → 阻断
- `method-lint`：模板 lint 镜像（roles id 唯一、contexts 合法、steps 非空、provenance）
- 设计检查聚合 `designReview(materialized, instance)`：四路汇总（blueprint/指标/场景绑定/复核状态）→ `{issues, blocking, reviewState}`，供检查与交付视图与导出门调用
- `findMetricReferences(materialized)`：D8 六路引用 → `Map<metric, refs[]>`（type_params/trees/north_star/questions/metric_usages/method_bindings）
- 复核指纹 `designFingerprint(materialized)`：canonical(blueprint+scenarios+metrics 身份面) sha256；`reviewStatus` = 未复核 | 已复核有效 | 已失效（指纹失配）

## R3 LLM 草稿（D9）

- `buildBlueprintGeneratePrompt({describe, templates, methods})` / `buildBlueprintRefinePrompt({instance, materialized, instruction})`；PROMPT_VERSION = v3.0.0
- 生成 payload：`{blueprint, added_metrics[], added_scenarios[]}`（refine 同形全量替换 blueprint）；zod 硬校验 + provenance 装配注入（origin=llm, model=真值, prompt_version）
- DraftSchema 扩展：`blueprint?: BlueprintSchema`、`added_scenarios?: ScenarioSchema[]`；applyDraft 支持两段合并；零写入门不变
- 起点路由：用户一句话 → 生成 blueprint 草稿（含建议指标/场景）；「建立可复用指标体系」意图 → 可仅指标（沿用现有 generate）

## R4 UI（D10）

- 视觉壳：侧栏 230px（字标 + 创建分析体系 + 我的体系 + 模板库[指标/方法] + 设置）、顶栏 64px（面包屑 + 专业详情入口）、主区 + 助手栏 320px；token 对齐 visual-system.md
- 首页：NL 输入「你想弄清什么，或做出什么选择？」+ 三起点（描述需求 / 从指标模板创建 / 导入资料）；无强制问卷
- 四视图路由：`/instance`（体系总览）、`/instance/metrics`（指标体系）、`/instance/scenarios`（场景与方法）、`/instance/delivery`（检查与交付）
- 业务复核：delivery 视图集中复核 → POST 确认（写 confirmed_by/at/fingerprint）；任何相关写入后显示「复核已失效，需重新确认」
- 删除保护：删指标 → 影响页列出六路引用 → 有引用时禁止确认删除（须先解除）
- 助手：blueprint 视图 NL 修改 → refine job → 建议差异预览 → 采纳（写同一工作稿）/放弃（不改）
- 场景与方法视图：方法库列表/详情（语境/角色/步骤/证据/限制）、场景绑定必需角色、另存方法（场景→方法模板草稿）
- 导入：粘贴 CSV/文本 → 识别预览 → 缺口定位 → 存为模板（写 templates/）；失败保留输入
- 窄屏：四视图 nav 横向滚动；助手栏移至成果之后

## R5 SAP / 交付（D7/D11/D12）

- SAP 包新增可选 `blueprint` 段（BlueprintSchema 透传）；SapPackageSchema 显式可选字段；validate 镜像 blueprint 内部引用一致性（questions.metric_refs 包内可解析）
- 零指标包：结构合法 + 导出门通过 + 测试钉死；kind 仍 `instance`、runtime_state 仍 `design_only`
- release：同内容重发 → 阻断（`same-content` error，CLI/UI 一致提示「内容未变化，无需重复发版」）；蓝图段随快照覆盖完整设计
- 合同文档 v0.4 登记：blueprint 段 + ScenarioSpec v0.2 method_bindings + 同内容阻断；标注消费侧未验证

## R6 验收（方案 A 系列映射）

- AT1 经营诊断任务（销售增长利润下降）：NL → 草稿含数值分解场景 + 假设 + 证据计划；分解不升级因果（limits 文案 + evidence 状态）
- AT2 零指标战略（扩店/供应链/会员）：零指标草稿可保存可复核可发版；≥2 候选道路 + 反证 + 重审条件
- AT3 独立数据专题（领券复购）：队列/窗口/选择差异/因果限制；不强制经营行动
- AT4 回归：指标创建/模板导入/两类模板/仅指标交付/引用保护/修改失效/版本快照/既有 395+ 测试全绿

## 状态边界（诚实声明）

设计态工具：证据状态为用户声明的设计内容；复核通过 ≠ 结论成立/因果成立/经营效果验证；实际证据获取与执行在执行侧（JuanerAI），本批不实现。
