# Red-Team: v4 批次开工（契约 v0.1 首个实现批次）

> 评审对象：`.flow/proposal.md`（2026-10-08）。技能：strategy-red-team。判定：**go**（无 kill 判据已满足；所有存疑项均有本批次内可执行的廉价测试）。

## Top Kill-Assumptions（按 影响 × 错误概率 × 测试便宜度 排序）

### 1. 指纹规范化序列化可能存在未裁决角落，威胁已冻结语义（最高优先）

- **Claim**：SHA-256（UTF-8 无 BOM、LF、键名排序、无空行的规范化序列化）能为包提供跨实现稳定身份，支撑契约已冻结的「指纹失配即拒绝」。
- **Fails if**：YAML 同一数据存在多种合法字节序列（标量样式 `"gmv"` vs `gmv`、锚点/别名、块折叠、非 ASCII 的 NFC/NFD、保留字），规范化算法未显式 subset 时，两个实现对同一逻辑包算出不同哈希——冻结的失配拒绝语义会把合法包拒之门外。
- **Evidence to get this week（= 本批次内）**：把规范化算法写成 ≤1 页精确规范 + 参考实现：限定 YAML子集（块式-only、禁用锚点、显式标量样式规则、Unicode NFC、键序、缩进），配 ≥3 条 golden vectors（纯 ASCII / 含中文定义 / 深嵌套 caliber_switches）。
- **Kill criterion**：若规范无法以「子集化 YAML 1.2」方式一页写死（或 `yaml` 库往返产生不稳定字节），降级路径：指纹语义降级为「供应商声明 + 消费方按接收字节重算」需**契约修订**（冻结语义变更）——立即升级用户裁决，不在批次内自决。
- **Cheapest test**：canonicalizer 原型 + round-trip 稳定性测试（parse→canonical serialize→rehash 三次，哈希恒定）。

### 2. caliber_type 枚举可能无法从现有 7 行业模板归纳出小集合

- **Claim**：`caliber_type` 可冻结为有限枚举（Q8 方向：口径类型枚举）。
- **Fails if**：336 个指标的口径差异是 per-metric 自由形态（退款/运费/税/周期…组合爆炸），枚举要么 >8 值要么被迫 per-template 自定义，冻结一个武断枚举反而妨碍 v5/v6。
- **Evidence to get this week**：30 分钟模板普查——遍历 `templates/*.yaml` 全部 `caliber_switches` 键 + 抽样 definition，聚类口径决策类型。
- **Kill criterion**：枚举 >8 值，或半数以上指标无法无歧义归类 → v0.2 只冻结字段存在性，`caliber_type` 取值保持开放字符串，随 v5 场景编辑器批次再冻结。
- **Cheapest test**：普查表（枚举候选 + 覆盖计数 + 未归类清单），一屏内可判。

### 3. L1 三件套作为可选字段接入，可能隐破既有规则面

- **Claim**：`aggregation` / `statistic_object` / `caliber_type` 以可选字段加入 MetricSchema，对 7 模板与 148 测试零回归。
- **Fails if**：lint/validate 现有规则（dangling-dimension、type-params-ref、template_ref 一致性）与新字段发生非预期交互（如 aggregation.allowed_dimensions 与 metric.dimensions 双源不一致）；或模板填充三件套时大面积触发既有 lint 误报。
- **Evidence to get this week**：schema 扩展后先**不加模板数据**跑全套测试（纯可选字段零回归），再对 1 个模板（apparel，72 指标）试点填充。
- **Kill criterion**：纯可选字段（零模板改动）即有测试变红 → 语义被破坏，停下根因；模板试点 lint 误报率 >5% → 规则接入面收窄。
- **Cheapest test**：`npm test` 两次（扩展前基线 vs 扩展后）。

### 4. 供应侧单方可交付性（无消费方实现）

- **Claim**：v4 只交付「包 + 供应侧校验」即构成完整批次价值。
- **Fails if**：包格式在 v6 消费方落地时被证伪需大改（concept_refs.source 不可解析、review 段形状不适配）——但契约已显式接受该风险并冻结 v0.1（readiness review 两轮核实），风险归属明确，非本批次可消除。
- **Cheapest test**：无（接受项）；缓解 = 契约 §7 演进路线已排 v6 修订窗口，不追加范围。

## What's Well-Reasoned

- **契约先行 + 冻结 fail-closed 不变量**：阻断半径、design_only 恒等式、引用不拥有均在编码前经两轮独立评审冻结，实现批次没有语义裁量空间——这是本批次最大的风险消解。
- **供应侧/消费侧切分**：v4 不实现 validate_import，避免半成品消费侧代码伪装成交付物。
- **复用现有 export gate**（整批阻断语义已冻结为等价），不造第二道门。
- **切片纪律前置**（范围六条 + GRILL 五个开放决策点），与本仓库 v3 已验证的「超 2 片即砍」惯例一致。

## What I Couldn't Assess

- JuanerAI A-02/N04 未来的真实消费形态（无实现可对照）——契约设计已显式接受，不阻塞。
- 命名空间前缀与未来 Workspace 作用域的碰撞面（Q4 机制部分留待 v6 窗口）——批次内只需保证前缀格式自洽。
- `review: {}` 包级段的具体形状对审计场景的充分性——形状本批次冻结时可再校验。
