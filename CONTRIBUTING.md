# 贡献指南 · 行业模板 PR

模板是 git 上的结构化资产：fork、改、提 PR，评审通过即成为生态的一部分。

## 模板 PR 流程

1. **Fork 并复制起点**：复制 `templates/` 下最接近的行业文件（不要从空白开始）
2. **改头部**：`template.id`（小写 kebab-case，全局唯一）、`industry`、`business_models`、`version: 0.1.0`、`references`（方法论出处，必填且不得抄袭付费内容）
3. **填 `matching`**：问卷匹配元数据（收入模式/用户结构/核心循环），向量与其他模板错开（见下）
4. **填业务内容**：`north_star`（候选 + 决策指引）、`trees`（分类 ∈ 规模/质量/结构/效率/旅程）、`dimensions`、`metrics`
5. **本地过门**：
   ```bash
   node dist/cli.js lint templates/<你的模板>.yaml   # 口径必填、引用完整、出处存在
   ```
6. **提 PR**，按下方清单自检并在 PR 描述勾选

## 评审清单（评审人逐项确认）

- [ ] `lint` 通过（0 error）
- [ ] 指标数 ≥40，每条含非空 definition（写清分子/分母/周期/剔除规则）、dimensions、time_grains、owner_role、provenance
- [ ] trees 与 north_star 引用的指标全部存在；所有指标至少被一棵树/公式/北极星/type_params 引用（用 `metric-factory audit` 抽查实例，孤儿告警为零）
- [ ] 口径开关（caliber_switches）覆盖本行业最常撕逼的口径决策（如电商的退款/运费、SaaS 的试用折算）
- [ ] matching 向量与既有模板错开：同一答案向量不允许两个模板并列最高分（并列时按文件名序取胜，会让另一个模板永远选不中）
- [ ] references 标注方法论出处，无付费内容搬运
- [ ] 每个比率类指标尽量补 type_params（numerator/denominator/expr 引用已定义指标）

## 口径可信性红线

- 模板指标一律 `provenance.origin: template` + `template_ref: <id>@<version>`
- 评审未通过前不得合入；合入即视为评审通过，指标随模板整体生效
