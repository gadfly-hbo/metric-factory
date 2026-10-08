# Red-Team: Metric Factory v3 · 落地闭环

> 评审对象：`.flow/proposal.md`（v3 flow，2026-09-29）
> 结论：**go**（无 kill 判据已满足；一个重大工程风险已识别并有标准解法，必须进 PRD）

## Top Kill-Assumptions（按 影响 × 错误概率 × 测试便宜度 排序）

### 1. dbt manifest 里真的有列信息可用（最大的工程陷阱）

- **Claim**：读 dbt manifest.json 即可发现「已有模型与字段」。
- **Steelman**：manifest 是 dbt 官方 artifact，结构稳定、机器可读。
- **Attack**：manifest 的 `nodes[].columns` **只包含模型 YAML 里显式声明的列**——大量团队的 manifest 里 columns 是空的（裸 SQL 模型不写 schema.yml）。只接 manifest 的「数仓反推」在真实环境大概率空手而归，产品承诺当场落空。
- **Evidence to get this week**：无需调查——这是 dbt 文档明确的机制。解法也是标准的：**双输入**——manifest.json（结构/血缘/模型名）+ `catalog.json`（`dbt docs generate` 产物，含全量列与类型，来自数据库内省）。catalog 缺失时降级为「模型级映射 + 列信息缺失提示」。
- **Kill criterion**：不适用（工程对策直接化解）；但 PRD 必须把 catalog.json 列为一级输入，测试必须覆盖「manifest 有列 / catalog 有列 / 双输入合并 / 两者都缺列」四形态。
- **Cheapest test**：fixture 四形态单测。

### 2. 确定性映射推荐的质量（采纳率的根基）

- **Claim**：名称/语义相似度规则能把「指标 → 模型.字段」推荐做到可用（AI 增强可选）。
- **Steelman**：企业 dbt 模型命名与指标语义通常同源（fct_orders/gmv 常见同域词根）；六模板指标带 definition/中文名，匹配信号充足。
- **Fails if**：命名风格迥异（拼音、缩写、无文档），规则推荐命中率低到不如纯手配，「AI 推荐」变负资产。
- **Evidence to get this week**：构造真实风格 fixture manifest（含同义、缩写、干扰项），测推荐命中率与置信度分布；规则命中阈值（如 similarity ≥0.6 才推荐，低于则标「待人工」）。
- **Kill criterion**：fixture 上可映射指标的自动推荐命中率 <50%（剩余必须全部标待人工且 UI/CLI 手配路径可用，产品退化为「结构化手配工具」仍可用但叙事降级）。
- **Cheapest test**：fixture 单测（TDD 天然覆盖）。

### 3. Web UI 的范围纪律（「壳不是核」的自我背叛风险）

- **Claim**：三视图（模板浏览/树编辑/审核流）本地 UI 是助推器不是第二产品。
- **Steelman**：审核与树编辑在终端确实低效（mermaid 只读、review 逐条 TTY）；UI 直接提升 v2 审核流的可用性与产品演示价值。
- **Fails if**：范围失控——树编辑做成拖拽画布、加多用户/云端/权限，维护成本拖垮 CLI 核心；或无构建轻栈撑不住交互被迫重写。
- **Evidence to get this week**：PRD 把三视图拆成独立切片、每片独立可验收；树编辑明确为**结构化表单**（patch 四段的表单化），不做画布。
- **Kill criterion**：任一 UI 切片超过 2 个实现切片仍不能端到端验收 → 当轮砍掉，退回 CLI。
- **Cheapest test**：拆解纪律 + 验收边界（先于编码）。

### 4. 映射升级后导出物的真实性

- **Claim**：映射落定后 MetricFlow 导出引用真实模型与列名，「最后一公里」打通。
- **Steelman**：model.ref/measure.expr 直来自 manifest 与映射表，机械替换占位符。
- **Fails if**：映射错误（指标挂错模型）把「听起来对」的导出物送进语义层——口径错误传播。对策：映射确认走人工门 + 导出前校验（ref ∈ manifest 模型集、expr ∈ 列集，进契约测试）。
- **Cheapest test**：契约测试升级（纯本地）。

### 5. 埋点建议的实用性

- **Claim**：从旅程指标 + 维度机械推导事件 schema 有用。
- **Fails if**：与神策/GA/自建平台的 schema 习惯差异大，建议不可直接导入。
- **对策**：输出平台无关 JSON Schema + 事件命名规范说明，明确「建议」而非「成品」。
- **Cheapest test**：结构断言（覆盖全部旅程指标）。

## What's Well-Reasoned

- 三件套顺序正确：映射（打通定义态）→ 埋点（打通采集）→ UI（提升可用性），前两个是价值主体，UI 是放大器。
- 所有写路径复用引擎、UI 无旁路——把 v2 的 fail-closed 资产直接延伸，不另起炉灶。
- 真实数仓连接后置、fixture 驱动 manifest——避免本期引入不可测的运行时依赖。

## What I Couldn't Assess

- 真实企业 manifest/catalog 的质量分布（列声明率、命名风格离散度）——发布后靠映射采纳率度量。
- UI 无构建栈的可维护性上限（三视图内可控，超出即砍）。

---
*判定：go。最优先工程决策 = catalog.json 双输入（#1）进 PRD；最大范围风险 = UI 三视图切片化（#3）。*
