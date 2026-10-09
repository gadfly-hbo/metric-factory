# ④ 服饰模板 L1 回填试点 · PRD

> 规格源：`.flow/proposal.md` + 红队 `.flow/red-team.md`（go）。无 issue tracker，落盘 `.flow/prd.md`。

## Problem Statement

L1 三件套已在 v4 交付（schema/lint/导出全通），但 7 个模板全是空字段——新规则从未在真实内容上跑过：误报率未知（红队 #3 的未决问题）、字段语义在真实字典级口径（服饰 72 指标源自 944 指标真实字典脱敏）上是否可辩护未知。没有回填试点，v5 场景编辑器设计就建立在未经实测的假设上。

## Solution

服饰模板（apparel-brand-retail.yaml，72 指标）全量逐一判定，回填 `caliber_type`（8 族）与最小可辩护集的 `aggregation`；逐指标依据留档；lint 四门全绿为硬验收；规则阻挡 >5% 即触发 kill criterion（规则收窄重议）。

## User Stories

1. As a 模板维护者，I want 服饰指标带 caliber_type 族归属，so that 口径类型机器可判、SAP 包语义更完整。
2. As a 模板维护者，I want 每个赋值都有 definition 依据留档，so that 语义归纳可审计、错填可定位。
3. As a 引擎维护者，I want lint 规则在 72 个真实指标上零误报零阻挡，so that 红队 #3 关闭、v5 设计有据。
4. As a 审核人，I want 无依据的指标字段留空而非硬填，so that 试点不制造伪精确。
5. As a CI，I want 回填后四门全绿，so that 数据变更不破坏既有契约。

## Implementation Decisions

- **仅数据变更**：templates/apparel-brand-retail.yaml 增加可选字段；零代码变更预期（若 lint 需微调，走 kill criterion 裁决流程，属例外而非常态）。
- **coverage（GRILL Q1 已决）**：全量 72 指标逐一判定；无 definition 依据 → 字段留空。覆盖率与误报率同时是试点产出。
- **caliber_type 判定规则**：从指标 definition/【业务口径】段归纳；8 族语义按普查冻结；单值优先，仅真实跨族才多值；开关键已知映射（deduct_refund→refund_adjustment；include_franchise/in_transit_inventory→scope_inclusion；include_view_as_sale/o2o/live_stream→scope_inclusion）。
- **aggregation 最小可辩护集（GRILL Q2 已决）**：仅两类填——① `type: ratio` 或定义含「占比/率」且口径指明分子分母的指标：`ratio_policy: "recompute_from_parts"`；② definition 显式排除某维度的指标：`disallowed_dimensions` 列出。其余留空。`allowed_dimensions` 仅在显式枚举可加维度时填（避免与 metric.dimensions 冗余复制）。
- **留档格式（GRILL Q3 已决）**：`.flow/l1-backfill-rationale.md`——表格：指标名 | caliber_type | aggregation | 依据（definition 摘句）。随 flow 工件提交。

## Testing Decisions

- 两步回归纪律：先跑全量基线（当前 203/203），再回填，任何既有测试变红 → 停下根因。
- 验收：`npm run lint`（服饰 72 指标零 error）+ 四门全绿 + rationale 覆盖率统计（填/空各多少，空的理由类别）。
- 无新自动化测试预期；若 lint 规则因回填修订，其规则测试同步更新。

## Out of Scope

statistic_object、其余 6 模板、free-text 口径结构化、SAP 样例再生成、UI/CLI 任何变更。

## Further Notes

- 混合指标预期：服饰 gmv（退款+渠道）可能多值 caliber_type——与普查记录一致，允许。
- 产物价值：rationale 表是后续 6 模板回填的 SOP 输入（v5+ 另行立项）。
