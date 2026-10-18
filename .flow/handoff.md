# Handoff · A1 批次（2026-10-18，待提交）· 分析体系工作台落地

> 前序 M1–M3 交接见 `.flow/archive-m3-20261018/handoff.md`。本批落地已批准的《分析体系工作台产品方案 v0.2》（权威：`/Users/huangbo/Documents/Codex/2026-10-18/task/metric-factory-product-prototype/方案.md`），复用 pi-agent-runtime，未另建链路。裁决登记：`.flow/proposal.md`（D1–D13）。

## 已交付（T1–T14 全勾）

- **分析体系蓝图（AnalysisBlueprint v0.1）**：实例可选顶层段 `blueprint`——title/intent/purpose/decision/boundary/deliverable + contexts（三类语境可组合不分级）/organizations + questions[]（metric_refs 只引用）+ hypotheses[]（判断性质与证据状态分轴；支持/反对/改变条件三要素）+ evidence_plan[]（计划完整≠证据已取得）+ options[] + provenance。schema `src/schema/blueprint.ts`。
- **写时/交付双门**：`validateDesign(..., { writeMode: true })` 只执法引用完整性（blueprint-question-ref / scenario-method-ref / 未知角色 / 悬空指标）；设计完整性（purpose/假设三要素/D6 证据核验/证据三要素）与方法适用性（语境/必需角色覆盖）留交付门。引擎拆分 `validateBlueprintRefs`+`validateBlueprintCompleteness`、`validateMethodBindingRefs`+`validateMethodBindingFit`（原函数名=全量组合，被引擎测试「统一入口」钉死）。写路径显式传 `{ skipReviewGate: true, writeMode: true }`；导出/release/MCP/CLI validate 默认全量。
- **业务复核绑定设计快照**：`design_fingerprint` = canonical(blueprint 去 review + scenarios + 指标身份面去 provenance) sha256；相关修改使确认失效（stale），查看/切换视图不影响。`POST /instance/review/confirm` 仅 designIssues 零可确认（fail-closed）。
- **ScenarioSpec v0.2**：可选 `method_bindings[]`（method_ref/role/metric），**无 default、空时键缺席**——已发布包指纹不受影响（net-sales-oracle 指纹哨兵全绿）。
- **方法模板库**：`templates/methods/` 三内置（profit-change-diagnosis / strategic-options-comparison / association-vs-increment，均 0.1.0）；场景「另存方法」（角色从 metric_usages 派生：outcome/driver 必需、guardrail 可选，版本固定 0.1.0，id 冲突拒写）；粘贴导入支持 method/metric 两类（预览→保存，lint 执法，拒绝覆盖）。
- **四视图工作台**（零客户端 JS）：`/instance/overview` 体系总览（蓝图卡 + AI 助手 + 假设判断状态表单）/ `/instance` 指标体系（字典表行内「删除…」+ fork diff + 指标树 + 微调）/ `/instance/scenarios` 场景与方法（场景列表 + 方法库内嵌 + 绑定 DSL `方法id@版本|角色|指标`）/ `/instance/delivery` 检查与交付（设计缺口清单 + 复核确认 + 导出 + 发布 + 回执）。
- **NL 主入口**：首页「用一句话开始」→ `/blueprint/generate` → job 轮询 → 预览（影响明示）→ 采纳创建 / 放弃零改动；草案落 `<workspaceDir>/draft.pending.create.yaml`（实例流仍用实例旁 `draft.pending.yaml`）；蓝图 job 复用 jobs map 与 `/drafts/jobs/:id`，`DraftJob.returnTo` ∈ drafts/blueprint/blueprint-create 决定重定向。
- **删除影响先知**：`/instance/metrics/:name/delete-intent` 展示六路引用（问题/场景树/场景角色/方法绑定/树/公式），确认才执行；被引用即阻断。
- **SAP 合同 v0.4**：blueprint 可选段（剥 review，携带即拒绝）+ 零指标包合法 + release `same-content` 阻断（未修改不重复发版）；§10 登记 A1 五项事实；**消费侧读取未验证**诚实标注。
- **LLM**：`BLUEPRINT_PROMPT_VERSION="v1.0.0"`（generate/refine 双提示词，provenance 携带）。

## 版本身份（本批新增/变更）

| 身份 | 版本 | 位置 |
|---|---|---|
| AnalysisBlueprint | v0.1 | `src/schema/blueprint.ts` |
| ScenarioSpec | v0.2（method_bindings 可选） | `src/schema/scenario.ts` |
| BLUEPRINT_PROMPT_VERSION | v1.0.0 | `src/llm/prompt.ts` |
| SAP 合同 | v0.4 | `docs/juanerai-semantic-asset-contract-v0.1.md` |
| 方法模板 ×3 | 0.1.0 | `templates/methods/` |

## 架构要点（后续批次的既有事实）

- **路由注册顺序**：`/templates/methods(/:id)` 必须先于 `/templates/:id` 注册（防通配吞掉）。
- **内置方法三必需角色**：`profit-change-diagnosis@0.1.0` = profit_result / gross_profit_comp / expense_constraint——绑定测试漏绑 gross_profit_comp 曾失败，勿当 bug 修。
- **`packageIdFromInstancePath`** = 实例**文件名** slug（非目录名）：向导/NL 创建的 `<name>/instance.yaml` 包 id 恒为 "instance"（既有语义，未改）。
- **faux e2e 注入**：`writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: JSON.stringify({blueprint, added_metrics, added_scenarios}) })`；轮询 `/drafts/jobs/:id` 至 303。
- **边界文案**：「写操作仅限本地实例、模板库（导入/另存方法）、映射文件与 releases/ 发布登记」（render.ts + 两测试同步）。
- **删除影响页正例**：电商模板全部指标均有引用，fixture `test/fixtures/instance-blueprint.yaml` 自带无引用指标 `scratch_quality_score` 供正例。
- **假设状态写时不阻断 D6 缺口**：判断越过证据 = 交付缺口非写入错误；交付视图呈现并阻断 release。

## 验证证据

- 验证门全绿：`npm run lint && typecheck && test && contract-test`——64 文件 433 tests + 模板 lint + MetricFlow 契约。
- AT1/AT2/AT3 验收流（faux 确定性后端 + 真实 server + fetch）：AT2 零指标战略全流程发布、AT1 模板起点蓝图发布（SAP 含 blueprint 段剥 review）、AT3 放弃零改动；`test/ui/blueprint.test.ts` 12 tests。
- 引擎 writeMode 拆分正负例钉死；SAP 校验器 blueprint 规则正负例（`test/unit/sap-blueprint.test.ts`）。

## 未验证项披露（须明示）

- **真实 LLM 冒烟未跑**：BLUEPRINT_PROMPT_VERSION v1.0.0 的 generate/refine 提示词仅有 faux 测试背书，真实模型出稿质量未评估（建议 `zsh scripts/llm-smoke.sh` 形态补冒烟）。
- **JuanerAI 消费 blueprint 未验证**：blueprint 段与零指标包在 JuanerAI 侧读取未经实测（消费方唯一真实分析面仍为 Xanthil local-analysis 切片）；Change006 既有指标资产消费者路径不受影响。
- 未修改 JuanerAI、未推进插件集成、未启动 Semantica＋Protégé（本批范围外）。

## 延期项（沿用 M3 挂账，全部 non-blocking）

1. MiniMax-M3 generate 稳定性（~2/5 成功率，fail-closed 可恢复；README 已注记，用户裁决 B 维持）。
2. M3 复审遗留（cycle1 N1-N7 + cycle3 观察 1-5）：死三元/文案负断言/「已用 X/上限 Y」三处拼装/taskId 尾缀文档回写/审计中间态契约背书/预算 store 死 owner 接管/锁判死活/CLI 预算错误 e2e/stderr 警告行数措辞。
3. M2 遗留收口包（N1-N3 + F11-F13 代码卫生）；M1 遗留（smoke tee 未并 stderr；通用错误 taskId 并发文案错位）。

## 工作区残留

- `my-instance/`（M1 评审探针产物，可删）；`.codebase-memory/`（索引产物，决定提交或 gitignore）——本批提交均不包含。
