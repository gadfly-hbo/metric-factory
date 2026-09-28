# Metric Factory MVP · 任务拆解（垂直切片）

> 来源：`.flow/prd.md`（含 GRILL 决议）。无 issue tracker，按降级路径落盘本文件。
> 拆解批准理由（自批准，2026-09-28）：9 个切片全部为端到端可演示的 tracer bullet，每片穿过 schema→engine→CLI→测试全层；依赖链无环；粒度以「一次 TDD 循环可完成、独立可验收」为准。

- [x] 0. CLI 骨架与测试基建（脚手架 tracer bullet）
- [x] 1. 指标元模型 schema + 模板加载与 lint
- [x] 2. 电商交易平台模板全量（≥40 指标）
- [x] 3. 问卷向导 + 实例化（fork + 口径开关）+ 非交互模式
- [x] 4. MetricFlow 导出器 + 契约测试
- [x] 5. Excel + Mermaid 导出器
- [x] 6. 实例 validate / diff / fail-closed 导出阻断
- [x] 7. SaaS 订阅模板全量 + 跨模板问卷匹配
- [x] 8. CI 脚本、GitHub Actions、README 30 分钟上手路径

---

## 0. CLI 骨架与测试基建

### What to build
TypeScript/Node 20 ESM 项目脚手架：package.json（名 `metric-factory`，bin 入口）、tsup 构建、vitest、commander CLI 骨架（`--help` 与版本输出）。跑通「构建 → 执行 bin → 冒烟测试」全链路。

### Acceptance criteria
- [ ] `npm run build` 产出可执行 bin，`metric-factory --help` 输出命令列表
- [ ] vitest 冒烟测试以子进程执行 bin 并断言退出码与输出
- [ ] package.json scripts：`build` / `test` / `typecheck` / `lint` / `contract-test` 占位就绪

### Blocked by
None - can start immediately.

---

## 1. 指标元模型 schema + 模板加载与 lint

### What to build
Zod 定义模板 schema（template 元信息含 `matching`、north_star、trees、metrics 含 caliber_switches / provenance / review）+ 模板加载器（读 YAML → 校验，错误带文件与字段定位）+ `lint` 命令：口径必填（definition 非空）、维度引用完整（metrics 引用的维度在维度清单内）、出处存在（provenance 必填且结构合法）。附带电商种子模板（约 10 指标）供贯穿验证。

### Acceptance criteria
- [ ] `metric-factory lint <模板路径>` 对合法种子模板输出 PASS
- [ ] 对构造的坏模板（缺 definition / 悬空维度引用 / 缺 provenance）分别报出可定位错误且退出码非 0
- [ ] schema 单测：双语可选字段、caliber_switches 自由键值、provenance origin 枚举

### Blocked by
- #0

---

## 2. 电商交易平台模板全量

### What to build
`templates/ecommerce-marketplace.yaml` 达到验收深度：≥40 指标（GMV 树：uv×cvr×aov 及渠道/类目/区域/用户分层维度；质量树：复购、退货、留存；结构树：品类结构、渠道结构；效率树：履约、库存周转）、north_star 候选 + decision_guide、trees 全量、口径开关（include_refund / include_shipping 等）、每指标 provenance（origin=template + 模板引用 + 方法论出处）。

### Acceptance criteria
- [ ] 模板质量测试：指标数 ≥40，每条含非空 definition / dimensions / time_grains / provenance
- [ ] `lint` 通过；trees 中引用的指标名全部存在于 metrics
- [ ] 口径开关至少覆盖退款、运费、渠道口径三类决策

### Blocked by
- #1

---

## 3. 问卷向导 + 实例化 + 非交互模式

### What to build
answers 文件 Zod schema（收入模式 / 用户结构 / 核心循环 / 口径开关取值）；匹配内核按模板 `matching` 元数据选模板；实例化 = fork + diff patch（GRILL 决议 #2 格式：base + caliber_switches 取值 + added/removed/modified）；`init` 命令双模式（交互式 @inquirer/prompts 与 `--answers` 非交互），产出实例 YAML。

### Acceptance criteria
- [ ] `metric-factory init --answers examples/ecommerce-answers.yaml --out <dir>` 产出可被加载校验的实例文件
- [ ] 口径开关取值反映到实例（diff 可见 include_refund: true 的变更）
- [ ] 交互模式与非交互模式产出结构一致的实例（同一 answers 下）
- [ ] 匹配内核单测：给定答案向量，选模板结果确定且可解释（附匹配理由）

### Blocked by
- #1（种子模板即可驱动）

---

## 4. MetricFlow 导出器 + 契约测试

### What to build
`export --format metricflow`：实例 → 双段 YAML（占位 semantic_models：ref_model 占位名 + measures 由指标机械生成标注待映射；metrics：type_params 按 simple/ratio/derived 映射）。契约测试：编码 MetricFlow schema 的 JSON Schema 校验导出物 100% 通过 + 两段引用一致性断言 + fail-closed 预埋（origin=llm 未审核 → 抛错，本期带测试，见 #6 完整化）。

### Acceptance criteria
- [ ] 导出 YAML 通过 JSON Schema 契约校验（测试断言 100%）
- [ ] 每个 metric 引用的 measure 在 semantic_models 中存在
- [ ] 构造 origin=llm 未审核实例 → 导出被阻断并给出明确报错
- [ ] 本地 dbt parse 冒烟脚本落盘（scripts/，手动验证用，不进 CI）

### Blocked by
- #3

---

## 5. Excel + Mermaid 导出器

### What to build
`export --format excel`：多 sheet（指标字典含出处列 / 口径开关取值 / 北极星候选与指引 / 实例 vs 模板变更清单）。`export --format mermaid`：flowchart TD，节点中文 display_name + 公式标签，按 category 分组着色。

### Acceptance criteria
- [ ] Excel 四个 sheet 齐全，指标字典行数 = 实例指标数，出处列非空
- [ ] Mermaid 输出可被 mermaid 语法校验（或最小结构断言：节点/边与 trees 一致）
- [ ] 导出器插件契约统一：三格式同一 `export(instance)` 接口

### Blocked by
- #3

---

## 6. 实例 validate / diff / fail-closed 完整化

### What to build
`validate` 命令：实例加载 + 对基模板 rebase 后的全量校验（含修改字段的口径完整性）；`diff` 命令：实例 vs 模板结构化差异输出（人可读 + `--json`）；fail-closed 全链路测试矩阵（origin 枚举 × review 状态 × 导出格式）。

### Acceptance criteria
- [ ] 构造 5 类坏实例（悬空维度、缺口径、坏出处、llm 未审核、修改后字段缺失）→ validate 逐一报错
- [ ] diff 输出 added/removed/modified 三段且与构造一致
- [ ] fail-closed 测试矩阵全部断言阻断行为与放行行为（origin=template 放行、人工已审放行）

### Blocked by
- #3、#4（阻断行为挂在导出器上）

---

## 7. SaaS 订阅模板全量 + 跨模板问卷匹配

### What to build
`templates/saas-subscription.yaml` ≥40 指标（北极星：活跃订阅/净收入留存 NRR 树：期初 MRR + 新增 + 扩张 − 收缩 − 流失；激活与激活率、_trial 转化、churn 树、LTV/CAC 效率树、NPS 质量）；问卷匹配验证：订阅类答案 → 选择 saas 模板而非电商。

### Acceptance criteria
- [ ] 模板质量测试同 #2 标准（≥40、口径完整、出处齐全）
- [ ] 匹配内核测试：订阅答案向量 → saas-subscription，交易答案向量 → ecommerce-marketplace
- [ ] saas 实例走通 export 三格式（端到端测试复用 #4/#5 契约）

### Blocked by
- #3（模板内容依赖 #1 schema；跨模板匹配依赖 #3 内核）

---

## 8. CI 脚本、GitHub Actions、README 上手路径

### What to build
scripts 事实源齐备（lint=模板 lint 全量、test、typecheck、contract-test）；`.github/workflows/ci.yml` 落盘（无 remote，不在线验证）；README：安装、30 分钟上手路径（init → 校验 → 导出 → 验证）、模板贡献指南（lint 门槛）；examples 目录（两行业 answers + 实例样例）。

### Acceptance criteria
- [ ] `npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿
- [ ] README 30 分钟路径每一步命令可复制执行
- [ ] examples 两行业齐全且通过 validate

### Blocked by
- #2、#4、#5、#6、#7
