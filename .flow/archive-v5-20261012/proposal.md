# v5 分析体系编辑器 · 方案（proposal）

> dev-flow ASSESS 固化的规格源。上游基线：PRODUCT_PLAN v0.2 §5 v5 批段；契约 v0.1 §7（「v5：场景编辑器落地，scenarios 结构冻结；模板升级为 Domain Pack 候选格式（对齐 packages/domain-pack-sdk，**若其已可用**）」）；JA-ABS-PRD-001 F03/§6.2/§7（场景对象模型）。

## 目标

落地「分析体系设计」的编辑闭环：用户能创建/编辑/校验**决策场景**（场景卡：决策用途、问题树、指标角色、方法引用、证据要求、输出与复盘规则），场景随实例数据化（L2 模板种子 + L3 实例 fork+diff），**冻结 `scenarios` 结构**（契约 Q7 时点到期），随 SAP 包导出。

## 范围（做什么）

1. **ScenarioSpec v0.1 结构冻结**（最小集，基于 JA-ABS-PRD-001 F03 大幅裁剪）：
   - `id`（snake_case）、`version`、`title`
   - `decision_purpose`（必填非空——PRD-ABS AT02 的门：无决策用途不可发布）
   - `question_tree`：节点列表（id/label/parent?/metric?），平面列表 + parent 引用（不做嵌套 YAML）
   - `metric_usages[]`：{metric, role: outcome|driver|guardrail, note?}——场景角色，不是新指标定义
   - `method_refs[]`：自由串引用（如 "dame.m2.driver_decomposition"）——引用不实现
   - `evidence_requirements`、`output_spec`、`review_rules`：文本段
2. **模板/实例双向**：模板可带场景种子（seed scenarios）；实例 `scenarios` = fork+diff 语义中与 metrics 对称的 added 段（v5 最小：实例 added_scenarios，removed/modified 随后批次）
3. **校验规则**：scenario 引用完整性（metric_usages/question_tree.metric 引用物化存在的指标；parent 引用存在且无环）；decision_purpose 非空
4. **SAP 装配**：scenarios 段从物化实例收集进包（结构 = ScenarioSpec v0.1）
5. **UI**：实例页新增「场景」区块——场景列表 + 结构化表单（复用既有 patch 表单模式、零客户端脚本底线、写回走引擎 validate）

## 显式不做（非目标，带依据）

- **Domain Pack 候选格式**：契约条件条款未满足——`packages/domain-pack-sdk` 在 JuanerAI main 不存在（2026-10-09 核实，工作树空目录 + main 树无文件）。**移出 v5**，待 SDK 可用后独立批次
- 试跑（trial_scenario）、设计型/运行型发布平台、审批流（JA-ABS-ABS F07/F08 完整版）
- 方法库本体（method_refs 只引用不实现）、OSM 对接、executable 语义
- 场景的 removed/modified patch 段（v5 只做 added + 模板种子透传）

## 不可削弱的不变量

- fail-closed 门不动；scenarios 无 provenance 要求（场景是配置非指标，但其来源实例的 provenance 链不变）
- 既有测试零回归；四门全绿；测试零网络
- UI 不引入客户端脚本依赖（与既有工作台一致）；写回前全量校验失败零写盘
- ScenarioSpec 冻结前过一次 schema 评审（结构进契约 v0.2 修订的预留已声明）

## 开放决策（交 GRILL 自答）

- 问题树节点结构细节（metric 挂节点还是独立 metric_usages 才挂——倾向后者，节点 metric 可选引用）
- 模板种子场景：7 模板是否各带 ≥1 个种子场景（v5 只做 ecommerce+apparel 两个试点模板？）
- UI 表单深度：全部字段结构化表单 vs 部分文本域（question_tree 怎么编辑——倾向紧凑文本 DSL「label < parent」逐行 + 校验）
- diff 命令是否展示场景段（倾向：diff 输出 scenarios added 计数）
