# v5 分析体系编辑器 · PRD

> 规格源：`.flow/proposal.md` + 红队 `.flow/red-team.md`（go）。无 issue tracker，落盘 `.flow/prd.md`。

## Problem Statement

metric-factory 的双范围只交付了一半：指标体系（L1 三件套 + SAP 导出）完整，「分析体系设计」在产品中不存在——决策场景、问题树、方法/证据要求只能手写无 schema 的自由文本，SAP 包 `scenarios` 恒为空数组，契约 Q7 的结构冻结时点已到期。用户无法回答「这个业务问题应该怎样分析、衡量」中『怎样分析』的那一半。

## Solution

冻结 **ScenarioSpec v0.1**（最小结构，命名直取 JA-ABS-PRD-001 F03/§7.1）并全链路落地：模板种子场景 → 实例 `added_scenarios`（fork+diff 对称段）→ 引用完整性校验（validate/lint 镜像）→ diff 场景计数 → SAP `scenarios` 段装配 → 实例页「场景」区块（结构化表单 + 文本 DSL，零客户端脚本）。

## User Stories

1. As a 业务分析人员，I want 在实例中添加决策场景（用途/问题树/指标角色/方法/证据要求），so that 「怎样分析这个问题」成为结构化可复用配置。
2. As a 业务分析人员，I want 场景的指标角色区分 outcome/driver/guardrail，so that 同一指标在不同场景中角色明确、不重复定义。
3. As a 数据工程师，I want 校验拦截坏场景（引用不存在指标/父节点/成环/无决策用途），so that 场景数据与指标数据同一可信标准。
4. As a 数据工程师，I want diff 显示场景变更计数，so that fork+diff 语义覆盖场景段。
5. As a 平台侧工程师，I want SAP 包携带 scenarios 段（结构冻结），so that 消费方拿到完整语义资产。
6. As a 模板维护者，I want 模板携带种子场景（ecommerce/apparel 试点），so that 新实例开箱有分析骨架。
7. As a 业务用户，I want 在工作台实例页浏览/新建/编辑场景（表单+DSL，禁 JS 可用），so that 不写 YAML 也能维护场景。
8. As a 业务用户，I want 场景保存失败时看到逐条错误且零写盘，so that 与既有 patch 表单同一信任体验。
9. As a 审核人，I want 场景不带 provenance 而实例 provenance 链不变，so that 配置与指标的治理边界清晰。

## Implementation Decisions

- **ScenarioSpec v0.1（冻结）**：
  ```yaml
  scenarios:
    - id: <snake_case>            # 场景内唯一；实例内全局唯一
      version: 0.1.0
      title: <非空>
      decision_purpose: <非空>     # ABS AT02 门
      question_tree:              # 平面节点表（GRILL Q1）
        - id: <snake_case>
          label: <非空>
          parent: <节点id?>        # 引用同场景节点；禁止成环/自指
          metric: <指标名?>        # 可选引用物化指标
      metric_usages:              # 角色登记表（role 枚举 = ABS 8.2 同名）
        - metric: <指标名>         # 必须物化存在
          role: outcome | driver | guardrail
          note: <可选>
      method_refs: [<自由串>...]   # 引用不实现（如 dame.m2.driver_decomposition@1.0.0）
      evidence_requirements: <文本>
      output_spec: <文本>
      review_rules: <文本>
  ```
- **数据接入**：TemplateSchema += `scenarios: ScenarioSchema[]`（种子，默认 []）；InstanceSchema += `added_scenarios`（对称 added 段；removed/modified 后续批次）；materialize 收集 = 模板种子 ∪ 实例 added（同 id 实例覆盖模板——fork 语义最小实现）。
- **校验规则**（validateInstance 镜像 + lintTemplate 镜像）：`scenario-metric-ref`（usages 与 tree.metric 引用物化指标）、`scenario-tree-ref`（parent 存在、无环/自指、场景内节点 id 唯一）、`scenario-purpose`（decision_purpose 非空——schema 层）、`scenario-id`（场景 id 实例内唯一）。
- **模板种子（GRILL Q2）**：ecommerce（GMV 差距诊断场景）+ apparel（月度经营复盘场景）各 1 个高质量种子，内容在实现批次依据各模板北极星与树构造；其余 5 模板空场景合法。
- **diff**：输出行「scenarios: +N（added）」计数（GRILL Q4）。
- **SAP**：assembleSap 收集物化场景进 `scenarios` 段（SapPackageSchema 对应段收紧为 ScenarioSchema 数组——替换 z.array(z.unknown())）。
- **UI（GRILL Q3 冻结）**：实例页新增「场景」卡片——列表（每场景一行：title + 用途摘要 + 指标数）+ 新建/编辑表单；question_tree 与 metric_usages 用逐行文本 DSL（GRILL Q1 冻结版：`id|label|parent|metric` / `metric|role|note`，竖线分槽空槽留空），服务端解析校验、错误逐行回显；其余字段结构化输入/textarea；提交走引擎 validate 全过写回，零客户端脚本。
- **不做**：Domain Pack 格式（SDK 不存在，证据在 proposal）；removed/modified 场景段；试跑/发布/审批；方法库实现。

## Testing Decisions

- 接缝复用：schema 单测（正/负 fixtures：无用途/环/悬空引用/重复 id）、CLI e2e（validate 拒坏场景、diff 计数、export SAP 含 scenarios 段且结构过校验器）、UI e2e（真实 server+fetch：场景列表/表单写回成功/坏 DSL 422 逐行回显零写盘）。
- 两步回归纪律（先 203 基线后动手）；四门全绿；零网络。

## Out of Scope

按 proposal「显式不做」全部继承；另：场景的跨场景复用/模板市场、场景版本历史 UI。

## Further Notes

- 红队 #1 砍刀预备：拆解 > 6 切片时按序砍（UI DSL → 种子减 1 → diff 计数延后）。
- 结构冻结后随契约 v0.2 修订登记（scenarios 从预留转正式段）。

---

## GRILL 自答决议（2026-10-09；proposal 已裁决项为约束）

**Q1 DSL 语法冻结**：question_tree 逐行 `id|label|parent|metric`（4 槽竖线分隔，空槽留空，服务端解析）；metric_usages 逐行 `metric|role|note`（note 可空）。选竖线不选空格/冒号：字段含中文与空格，无转义歧义。
**Q2 场景 id 来源**：表单含 id 字段（用户填 snake_case，服务端校验唯一性）；DSL 不生成 id——树节点 id 同理由 DSL 第一槽显式给出。
**Q3 物化结构**：MaterializedInstance += `scenarios`（模板种子 ∪ added，同 id 实例覆盖）；SAP 装配读 materialized.scenarios。
**Q4 种子内容验收线**：每种子过全部校验规则 + decision_purpose ≥15 字 + 问题树 ≥3 节点（含根）+ usages ≥3 条且含 ≥1 个 outcome。
**Q5 lint 模板镜像**：模板种子同套规则（scenario-tree-ref/scenario-metric-ref/scenario-purpose/scenario-id）；7 模板 lint 零 error 保持。
**无升级项**；UI 范围已声明 → UI-GATE 必跑。
