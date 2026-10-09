# ④ 服饰模板 L1 回填试点 · 方案（proposal）

> dev-flow ASSESS 固化的规格源。上游基线：契约 v0.1+errata.1-3（Q8 方向：L1 三件套细节随 v4 批次设计冻结——已随 v4 交付并实践）、PRODUCT_PLAN v0.2 §5 v4/v5 段、红队 #3 试点建议、 caliber 普查（8 族、38 开关键、服饰 72 指标仅 3 个带结构化开关、口径大量以 free-text 存在于【业务口径】段）。

## 目标

apparel-brand-retail.yaml（72 指标，真实 944 指标字典脱敏精选）作为 L1 字段首个回填试点：**dogfood `aggregation` / `caliber_type`，验证 lint 规则在真实内容上的误报率**，产出可辩护的字段赋值与赋值依据留档。

## 范围（做什么）

1. 为服饰模板的指标回填两个可选字段：
   - `caliber_type: CaliberFamily[]`（8 族枚举，多值去重）——从指标 definition/【业务口径】段的口径语义归纳族归属
   - `aggregation`（allowed/disallowed dimensions + ratio_policy）——按 GRILL Q5 规则：两表 ⊆ 模板 dimensions、不相交；比率/占比类指标标 `disallowed_dimensions` 与 `ratio_policy: recompute_from_parts`
2. **逐指标赋值依据留档**：每个被填指标记录「字段值 ← definition 依据」一句（随 PRD/任务工件落盘，不进模板 YAML）
3. lint 全绿（7 模板）作为硬验收；若规则阻挡合法赋值，按 kill criterion 裁决（改规则 vs 改数据），不静默绕过

## 显式不做（非目标）

- **不填 `statistic_object`**：本体概念尚无 Ontology Owner 发布的快照，填假设性概念 ID 会污染 concept_refs（用户既有裁决）
- 不碰其他 6 个模板；不改 schema/engine/导出器/UI；不生成新 SAP 样例（ecommerce 样例与服饰无关，不受影响）
- 不将 free-text 口径结构化进 caliber_switches（那是另一件事，超出试点）

## 不可削弱的不变量

- 7 模板 `npm run lint` 零 error；既有测试零回归；四门全绿
- 8 族枚举取值唯一来源（普查冻结）；多值仅当口径语义真实跨族（普查：电商 gmv/SaaS mrr 式混合才多值，不为主填而凑多值）
- 回填必须可辩护：definition 中找不到口径语义依据的指标**留空**，宁缺毋滥

## 开放决策（交 GRILL 自答）

- 覆盖率口径：仅 3 个带开关指标 + 定义中显式口径决策的指标？还是全量 72 逐一判定（无依据留空）？
- 服饰模板 dimensions 清单与 allowed/disallowed 的默认策略（如 sku 级 disallow 之于金额类）
- 赋值依据留档格式与位置
