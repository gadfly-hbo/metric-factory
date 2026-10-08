# v4 批次开工 · 方案（proposal）

> dev-flow ASSESS 固化的规格源。上游冻结契约：`docs/juanerai-semantic-asset-contract-v0.1.md` v0.1（2026-10-08 用户批准冻结，readiness review 两轮 PASS）——本批次的**主规格**；PRODUCT_PLAN.md v0.2 §5「v4 批次」段与 §8-Q8 方向裁决为配套基线。契约未写的，以本文为准；本文与契约冲突时契约优先（升级用户，不静默覆盖）。

## 目标

metric-factory v4 批次 = 语义资产交换契约 v0.1 的**首个实现批次**（契约条款：首个实现批次另行批准——用户以 `/dev-flow v4 批次开工` 批准）。产出：metric-factory 能导出符合 SAP 0.1 的语义资产包，且现有功能零回归。

## 范围（做什么）

1. **指标契约 L1 三件套进入 schema**（Q8 方向裁决：aggregation / statistic_object / caliber_type 进 v0.2 冻结范围）：
   - `aggregation`：可加/不可加维度、比例重算规则
   - `statistic_object`：concept_ref 引用（平面 id/version/source/role，引用不拥有）
   - `caliber_type`：口径类型枚举
   - 字段细节在本批次设计冻结（Q8 原话：细节随 v4 批次设计冻结）
2. **concept_refs 进入实例数据**：实例可携带本体概念引用数组（v0.1 已定义形状，见契约 §3.3）。
3. **命名空间前缀**（Q4 方向裁决：前缀约定，包级 `namespace` 字段）：具体前缀格式随本批次设计冻结；零中心化服务依赖。
4. **SAP 0.1 导出器**：YAML 1.2 规范序列化；fingerprint（SHA-256 规范化算法，**必须显式裁决 fingerprint 字段自身是否计入哈希——建议排除/置空**，契约 §4 自引用决策项）；`generator: metric-factory@<git-sha>`；包级 review 段（形状本批次冻结）。
5. **导出门语义**：SAP 导出**复用**现有 fail-closed export gate（未审核 LLM 指标整批阻断，契约 §3.5）；供应侧导出校验：重复 `id@version` 拒绝产出（契约 §4）。
6. **零网络测试**：包格式正/负证据——schema 校验、指纹对账、fail-closed 负例（含未审核 LLM 整批阻断、非 design_only 构造包检测的供应侧等价校验）、`design_only` 恒等式、重复身份拒绝、未知 `sap` 版本拒绝（供应侧导出校验视角）。

## 不可削弱的不变量

- 现有 fail-closed export gate 语义不动（整批阻断）；provenance 链完整
- YAML 1.2 为唯一规范序列化；精确版本引用、禁止 latest
- 测试零网络；四门全绿（lint / typecheck / test / contract-test）
- 现有导出（MetricFlow / Excel / Mermaid）与全部既有测试零回归
- `validate_import` 是消费侧职责：v4 只交付「包 + 供应侧导出校验」，不实现消费侧导入器

## 显式不做（非目标）

- 场景编辑器 / ScenarioSpec 结构冻结（v5 批次）
- `executable` 状态语义、运行时 Binding Manifest（消费侧，v6 窗口）
- 跨包依赖声明机制（契约 §4 注记：v0.1 不含）
- JuanerAI 侧任何代码、导入触发工程（Q5：手动文件导入是唯一方式，工程化留 v6 窗口）
- `concept_refs.source` 结构性格式（Q6：平面定位符方向，细节 v6 窗口）
- SAP 的 Web UI 下载入口（本批次 CLI 优先；UI 暴露如属平凡增量可在 GRILL 决定）

## 开放决策（交 GRILL 自答，记录决议）

- fingerprint 规范化算法细节与自引用裁决（倾向：字段置空后计算）
- `namespace` 前缀具体格式（倾向：`mf.<实例或模板ID>` 包级单字段）
- `caliber_type` 枚举取值（倾向：从七行业模板已有口径差异归纳最小集）
- L1 三件套在 lint / validate / materialize 中的规则接入面（最小接入：lint 校验结构、validate 透传、materialize 携带）
- concept_refs 的编辑面（v4 仅 YAML 手写 + schema 校验，不加 CLI 向导）

## 已完成的前置（本流程不复审）

- 契约 v0.1 冻结 + Q4–Q8 方向裁决（2026-10-08，commit `a9d8112`）
- PRODUCT_PLAN v0.2（commit `1204831`）
