# Red-Team: ④ 服饰模板 L1 回填试点

> 评审对象 .flow/proposal.md。判定：**go**（无 kill 判据已满足；最高优先项即试点本身要测量的东西）。

## Top Kill-Assumptions

### 1. lint 规则在真实内容上产生不可接受的误报/阻挡（试点存在的理由）
- **Claim**：GRILL Q5 规则（⊆ dimensions、不相交、空边界）在 72 个真实指标上可通过人工赋值满足。
- **Fails if**：合法赋值被规则阻挡的比例 >5%（红队 #3 阈值）——说明规则设计对真实口径内容过拟合。
- **Evidence**：回填后 `npm run lint` + 每例阻挡个案分析。
- **Kill criterion**：>5% 被阻挡 → 停下，回到规则收窄 + 重新提案，不绕过。
- **Cheapest test**：本批次内即可测。

### 2. caliber_type 语义归纳的主观性无法机器校验
- **Claim**：从 definition/【业务口径】归纳 8 族归属可辩护。
- **Fails if**：无法机器校验 = 错填静默存在；但这是试点显性接受的边界（试点测的是 lint 校准，不是语义真值）。
- **缓解**：逐指标依据留档 + 抽样人工复核；宁缺毋滥（无依据留空）。

### 3. 范围蔓延
- 触发器：顺手填 statistic_object / 其他模板 / 把 free-text 结构化。已由 proposal「显式不做」封死；REVIEW 对照检查。

### 4. 回填破坏既有测试
- 纯可选字段数据变更；两步回归纪律（先跑基线再回填）+ 四门全绿兜底。

## What's Well-Reasoned
- 单模板试点、双字段（statistic_object 排除理由充分）、可辩护性优先于覆盖率。
## What I Couldn't Assess
- 服饰【业务口径】free-text 中口径决策的密度分布（需读模板实测定，影响覆盖率预估，不影响 go）。
