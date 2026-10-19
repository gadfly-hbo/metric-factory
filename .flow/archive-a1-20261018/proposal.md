# A1 · 分析体系核心批次 — 提案

2026-10-18 · 依据用户已接受的《分析体系工作台产品方案 v0.2》（`/Users/huangbo/Documents/Codex/2026-10-18/task/metric-factory-product-prototype/方案.md`）落地真实产品迭代。原型为合成演示，其 JSON/脚本不充当生产 schema；本批按方案语义在仓内合同上重新设计。

## 目标（方案 §8「必须先做」闭环）

1. 自然语言需求 → pi-agent-runtime → 可维护分析设计草稿（支持「可复用指标体系」与「具体分析」两种起点；模板/导入为次要入口）。
2. 一个工作台、两个联动编辑器，四视图：体系总览／指标体系／场景与方法／检查与交付。
3. 共享指标定义（一个权威来源），问题／假设／证据计划结构化，方法适用性检查，集中业务复核，设计版本快照闭环。
4. 保留指标创建、模板导入、两类模板、独立指标交付；复用既有校验与导出。
5. 三条业务任务验收（经营诊断／零指标战略／独立数据专题）。

## 设计裁决（D 系列；持久结构与公共合同变更登记处）

- **D1 单一工作稿**：`blueprint` 作为 InstanceSchema 可选顶层段（instance.yaml）。缺省 = 仅指标体系模式，现有行为零变化；零指标 + blueprint = 定性战略设计。release 快照自动覆盖完整设计。
- **D2 内嵌子实体**：问题（questions）／假设（hypotheses）／证据计划（evidence_plan）／候选道路（options）内嵌于 blueprint，不另立文件。判断性质（事实/解释/待验证假设/建议）与证据状态（待获取/取得待核/已核验/支持不足/存在冲突）分轴表达。
- **D3 方法模板**：新增第二类模板 `MethodTemplateSchema`（id/name/version/contexts/family/purpose/roles[required]/steps/evidence/limits/provenance），存放 `templates/methods/*.yaml`；库保持「指标体系／分析方法」两类，不设第三套。
- **D4 ScenarioSpec v0.2 可选扩展**：场景新增可选 `method_bindings: [{method_ref, role, metric}]`。可选字段向后兼容 v0.1 包；SAP 合同以变更记录登记为供应侧扩展，消费侧镜像留 v6 窗口。**不改动** v0.1 已冻结字段。
- **D5 业务复核与失效**：复核确认 = `{confirmed_by, confirmed_at, design_fingerprint}`；指纹 = canonical(blueprint ＋ scenarios ＋指标身份面) 的内容哈希。任何相关写入后失配 → 确认失效（严格方向：宁可多失效）；查看/切视图不写盘不失效。
- **D6 假设升级门**：`verified=true` 需 ≥1 条证据状态为「已核验」且无「存在冲突」；judgment ∈ {事实, 解释} 而未 verified → 设计缺口，阻断交付。复核/检查不自动提升证据状态或确认假设。
- **D7 设计交付门**：blueprint 完整（目的/决策/边界/交付/语境/组织/问题结构/假设三要素/证据三要素）∧ 指标缺口零 ∧ 场景必需角色绑定齐 ∧ 方法语境适配 ∧ 复核有效 → 允许交付；草稿允许缺口。证据计划完整 ≠ 证据已取得（证据状态独立呈现于交付视图）。
- **D8 引用保护**：引擎 `findMetricReferences(materialized)` 汇总 type_params/expr、trees、north_star、questions.metric_refs、scenarios.metric_usages、method_bindings 六路引用；删除被引用指标必须先展示影响并解除引用，禁止悬空引用后假通过。
- **D9 LLM 草稿**：PROMPT_VERSION → v3.0.0；新增 blueprint 生成/修正 prompt（中文业务语言输出、硬约束 JSON 合同、负例禁令）。Draft 扩展 `blueprint?` 与 `added_scenarios?` 段；apply 沿用零写入门；provenance 强制注入（模型不可自报）。
- **D10 UI 壳**：JuanerAI 已接受视觉 token（#f6f7f4/#fcfcfa/#f0f2ed、#27664f 主绿、230px 侧栏、64px 顶栏、320px 助手栏、系统中文字体）。保持仓内「零客户端脚本、纯服务端渲染」纪律：原型弹层 → 独立页面/区块；键盘可达与 :focus-visible 保留；四视图 = 实例下四条路由。
- **D11 未修改不重复发版**：release 同内容从「警告放行」升级为「阻断 + 提示无需重复发版」（行为变更，本批 PRD 登记；CLI/UI 一致）。
- **D12 消费边界诚实标注**：blueprint 段与零指标包进入 SAP 供应侧；JuanerAI 指标资产已有真实消费者（Change006），blueprint/方法绑定/零指标包的消费侧支持**未验证**，本批不宣称消费通过，不修改 JuanerAI，不启动插件化/Semantica＋Protégé。

## 非目标（本批）

证据与假设的细粒度交叉引用、专业方法扩充（先 3 个内置）、模板差异升级、多人治理、实际证据/采用回执回流、JuanerAI 插件呈现、Excel 直读 UI（离线脚本保留）、完整本体。

## 验证门

`npm run lint && npm run typecheck && npm test && npm run contract-test` 全绿；新规则配负例测试；三条业务任务 e2e；UI 路由级测试沿用 fetch 边界。
