# ④ 服饰模板 L1 回填试点 · 任务拆解

> 单切片流（数据 + 校验 + 留档一体）。自批准（dev-flow 规则），理由记入 state.json。

- [x] 0. 服饰模板 L1 回填（caliber_type + 最小 aggregation + 依据留档 + lint 全绿）

---

## 0. 服饰模板 L1 回填

### What to build

templates/apparel-brand-retail.yaml 的 72 个指标逐一判定：按 PRD 规则回填 `caliber_type`（8 族）与最小可辩护集 `aggregation`；每个赋值在 `.flow/l1-backfill-rationale.md` 留「字段值 ← definition 摘句」依据；无依据留空。端到端：数据变更 → lint（误报率=试点核心产出）→ 四门全绿。

### Acceptance criteria

- [x] 两步回归：先全量基线（203/203）原样绿，再回填
- [x] `npm run lint` 7 模板零 error（服饰 72 指标为焦点）
- [x] rationale 表覆盖全部判定（填/空各有依据摘句或留空理由类别），覆盖率统计入报告
- [x] 规则阻挡个案分析（0 例）：任何被 lint 阻挡的合法赋值记录并计数；>5% 触发 kill criterion（停下报告，不绕过）
- [x] 全量四门（lint/typecheck/test/contract-test）绿
- [x] 模板文件注释/结构无损（【业务口径】等行零改动）

### Blocked by

None - can start immediately
