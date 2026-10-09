# Metric Factory v4 批次 · PRD（语义资产交换契约 v0.1 首个实现批次）

> 规格源：`.flow/proposal.md`（ASSESS 固化）+ 冻结契约 `docs/juanerai-semantic-asset-contract-v0.1.md` v0.1 + PRODUCT_PLAN v0.2 §5。红队报告：`.flow/red-team.md`（verdict: go）。无 issue tracker，按降级路径落盘 `.flow/prd.md`。
> **UI 范围声明（2026-10-08 用户裁决 B）**：本批次含用户可见 UI（工作台导出下载区新增 SAP 格式 + 阻断/错误态呈现）→ GRILL 后必跑 UI-GATE。

## Problem Statement

语义资产交换契约 v0.1 已冻结（2026-10-08，两轮 readiness review PASS），但 metric-factory 尚无任何实现：schema 只有 L0 指标字段，导不出契约规定的 SAP 0.1 包（YAML 规范序列化 + 指纹 + concept_refs + 命名空间 + 包级 review）。v4 批次要让「契约」第一次变成「能跑的东西」——CLI 与工作台 UI 两个出口都通，同时保证既有 148 测试与三导出器零回归。

## Solution

- **CLI**：执行 `export --format sap` 从任一校验通过的实例产出 `<实例名>.sap.yaml`——符合契约全部冻结不变量的语义资产包；未审核 LLM 指标在导出前被现有 fail-closed 门整批阻断；包的身份（id@version + SHA-256 指纹）可跨运行复算验证。
- **工作台 UI**：实例页导出下载区在现有 MetricFlow / Excel / Mermaid 之外新增 SAP 下载项，走同一服务端导出管线与同一 fail-closed 语义；被阻断时呈现与既有导出一致的错误面（不得静默失败或弱化提示）。

## User Stories

1. As a 数据工程师，I want to `export --format sap` 导出实例为 SAP 0.1 包，so that 我可以把语义资产交给 JuanerAI 侧导入。
2. As a 数据工程师，I want 同一实例两次导出产出字节一致的包，so that 指纹对账可用。
3. As a 审核人，I want 含未审核 LLM 指标的实例导出 SAP 被整批阻断（与现有三格式同一阻断语义），so that fail-closed 不在新格式上开口子。
4. As a 数据工程师，I want 包内含 namespace / generator / created_at / 包级 review 段，so that 审计可定位来源与门状态。
5. As a 指标体系维护者，I want 在指标上声明 `statistic_object`（引用本体概念 id@version + source + role），so that 指标契约与本体概念建立引用关系（引用不拥有）。
6. As a 指标体系维护者，I want 在实例上声明包级 `concept_refs`，so that 维度语义等独立概念引用可随包传递。
7. As a 模板作者，I want `aggregation`（可加/不可加维度、比例重算策略）成为可选字段并被 lint 校验，so that 汇总规则从自由文本升级为结构化契约。
8. As a 模板作者，I want `caliber_type` 为 8 族枚举数组并被 lint 校验取值合法且唯一，so that 口径类型机器可判。
9. As a 平台侧工程师，I want 包内重复 `id@version` 在导出时被拒绝，so that 供应侧不出非法包。
10. As a 平台侧工程师，I want SAP schema 校验器覆盖契约全部拒绝规则（结构/未知 sap 版本/非 design_only/指纹失配/重复身份），so that v6 消费侧导入器可直接复用同一校验实现。
11. As a 维护者，I want 规范化序列化有 golden vectors 与往返稳定性测试，so that 指纹语义有正/负证据支撑（红队 #1）。
12. As a 维护者，I want 7 个现有模板与 148 个测试在 v4 零改动通过，so that 批次边界干净、回归可定位。
13. As a 审核人，I want 混合口径指标（gmv/mrr 多族并存）用多值 `caliber_type` 表达而非被迫单选，so that 枚举不扭曲真实口径。
14. As a CI，I want SAP 测试全部零网络，so that 四门（lint/typecheck/test/contract-test）保持可离线执行。
15. As a 业务用户，I want 在工作台实例页的导出下载区一键下载 SAP 包，so that 不用终端也能拿到语义资产。
16. As a 业务用户，I want SAP 下载被 fail-closed 阻断时看到与既有导出一致的错误说明（哪些指标未审核、如何解除），so that UI 不弱化审核门。
17. As a 业务用户，I want 下载得到 `<实例名>.sap.yaml`，so that 文件名与实例对应、可直接交给平台侧。

## Implementation Decisions

- **Schema 扩展（全部可选，向后兼容；7 模板不回填）**
  - Metric += `aggregation?: { allowed_dimensions: string[]; disallowed_dimensions: string[]; ratio_policy?: "recompute_from_parts" }`；lint 校验两表 ⊆ 模板 dimensions 且不相交。
  - Metric += `statistic_object?: ConceptRef`；Instance += `concept_refs?: ConceptRef[]`。ConceptRef = 契约 §3.3 形状 `{id, version, source, role?}`，source 非空不透明串。
  - Metric += `caliber_type?: CaliberFamily[]`（枚举数组、去重；见下方普查冻结的 8 族）。**基数决策：多值数组而非单值**——普查证据 3/336 指标跨族（gmv 退款+运费+渠道、mrr 试用+分摊），单值会扭曲；298/336 无结构化口径决策的指标字段缺省。
  - 枚举 8 族（2026-10-08 普查冻结）：`refund_adjustment`（退款/退货处理）、`fee_composition`（税/运费/返点/折扣/补贴等金额构成）、`scope_inclusion`（渠道/库存状态/试用/席位等业务对象范围）、`validity_threshold`（有效性阈值与活跃定义）、`attribution_window`（归因窗口）、`proration_rule`（跨期折算分摊）、`cap_anomaly_rule`（封顶与异常判定参数）、`measurement_anchor`（计量基准时点）。
- **SAP 包装配**：段组成按契约 §3；`concept_refs` = 实例级引用 ∪ 全部指标 statistic_object，按 id@version 去重；`runtime_state` 字面 `design_only`；`sap` 字面 `0.1`；`namespace: mf.<package-id>`（小写 kebab）；`generator: metric-factory@<version>+<git-sha>`（sha 由构建期 tsup define 注入，缺失时回退纯版本号）；`created_at` ISO-8601。
- **包级 review 段（形状本批次冻结）**：`{ gate: "metric-factory-export-gate", exported_at: <ISO-8601>, unreviewed: [] }`——正常路径下 gate 保证 unreviewed 恒为空数组，字段保留给手工构造包审计。
- **规范化序列化（红队 #1 对策）**：YAML 1.2 子集规范——UTF-8 无 BOM、LF、Unicode NFC、2 空格缩进、仅块式、禁止锚点/别名/tag、键递归排序、非标量统一双引号（JSON 转义）、无文档标记、行尾无空格、单一末尾换行。**指纹自引用裁决：计算时 `fingerprint` 字段置空字符串，声明值=计算值**。golden vectors ≥3（纯 ASCII / 含中文定义 / 深嵌套 caliber_switches）+ 往返稳定性（parse→canonical→rehash ×3 恒定）。
- **CLI**：既有 `export` 命令族新增 `--format sap`，产出 `<out>/<实例名>.sap.yaml`；写入前依次执行：现有 export gate（整批阻断）→ 装配 → 重复 id@version 校验（拒绝并非零退出）→ 指纹计算 → 写盘。
- **工作台 UI**：实例页导出下载区新增 SAP 项；服务端复用同一装配管线与 gate（无第二套业务规则）；阻断响应复用既有导出阻断的呈现组件与文案结构（仅格式名变化）；文件名 `<实例名>.sap.yaml`。视觉与交互完全沿用既有下载区模式，不引入新组件形态。
- **校验器双面共用**：SAP schema 校验 + 全部拒绝规则实现为纯函数模块，v4 由导出器与测试使用；v6 消费侧导入器复用（契约 §6 `validate_import` 的供应侧镜像）。
- **测试接缝（复用现有，不新开）**：接缝 1 = CLI 进程边界 e2e（prior art `test/cli/export.e2e.test.ts` 的 fail-closed 矩阵）；接缝 2 = 装配/规范化/指纹纯函数单测（prior art `test/unit/*`）；接缝 3 = schema 规则单测（正/负 fixtures）；接缝 4 = UI 真实 server + fetch e2e（prior art `test/ui/export-download.test.ts`）。

## Testing Decisions

- 好测试只测外部行为：CLI 边界看「命令→退出码→文件字节」；UI 边界看「HTTP→状态码→内容处置/错误呈现」；纯函数看「输入→输出」；不测内部中间结构。
- 负例必备：未审核 LLM 整批阻断（SAP CLI 与 UI 双路径 + 与三格式同一语义断言）、构造非法包每类拒绝规则一条、指纹失配、重复 id@version、未知 sap 版本、非 design_only。
- UI 断言：SAP 下载 200 且内容含 `sap: 0.1` / `runtime_state: design_only` / `fingerprint`；阻断实例在 UI 路径同样 4xx/错误页且文案含未审核指标名（与既有 export-download 测试的 fail-closed 断言同构）。
- 零网络；四门全绿（`npm run lint` / `typecheck` / `test` / `contract-test`）。
- 回归基线：148 测试在 schema 扩展（零模板改动）后必须先原样通过，再加新测试（红队 #3 的两步顺序）。

## Out of Scope

按 proposal「显式不做」：场景编辑器/ScenarioSpec、executable 语义与运行时绑定、跨包依赖机制、JuanerAI 侧代码与导入触发工程、source 结构性格式、7 模板 L1 回填。（~~SAP 的 Web UI 下载入口~~ 已按用户裁决 B 移入范围。）

## Further Notes

- 红队存疑项处置：#1 规范化若无法一页子集化 → 按 kill criterion 升级用户（契约冻结语义变更不在批次内自决）；#2 枚举已由普查关闭（8 族 + 多值基数）；#3 以「两步回归」测试纪律关闭；#4 接受项。
- 混合口径指标记录：电商 gmv、SaaS mrr、服饰 gmv（多族并存，多值 `caliber_type` 表达）。
- 服饰模板口径大量以 free-text 存在（38/336 结构化覆盖率）——枚举归集的是「已结构化的口径决策」，不代表全部口径语义；不阻塞 v4。
- UI-GATE 输入基线：工作台视觉对齐 Xanthil 设计 token（`~/.zcode/design/DESIGN.md`），UI 契约子代理以其 + 既有导出面板为唯一设计输入。

---

## GRILL 自答决议（2026-10-08；proposal 已裁决项为约束，本环节只答留白）

**Q1（规格冲突，最高优先）US2 字节一致 vs 契约 `created_at` 必填时间戳**
- 推荐并已采纳：修正 US2 语义为「规范化语义内容一致 + 指纹跨运行复算一致；`created_at` 为契约 §3 必填时间戳，跨运行必然不同，不计入字节一致断言」。测试落实：单测冻结时钟 → 字节级一致；e2e 两次导出 → 指纹相等（忽略 created_at）。依据规格优先级（契约 > PRD），非用户决策变更。

**Q2 concept_refs 去重键**
- 推荐并已采纳：去重键 = `(id, version, role)`；role 缺省按空串参与键。理由：role 是用法语境（statistic_object / dimension_semantics），同概念异角色是两个独立引用。

**Q3 供应侧重复身份校验的 ID 空间**
- 推荐并已采纳：查重覆盖两个命名空间——指标 `name`（同包重名即拒，既有 schema 未显式禁止，SAP 装配首次强制）与 concept_refs 的 `(id, version, role)`；scenarios v4 为空数组不参与。

**Q4 规范化字符串引号规则**
- 推荐并已采纳：标量匹配 `^[a-z0-9][a-z0-9_.\-/]*$` 且不命中 YAML 1.2 core schema 非串类型（null/true/false/整数/浮点）时输出 plain；其余字符串一律双引号 + JSON 转义；数值/布尔原生类型原样。理由：精确可实现、golden-vector 可测，不依赖序列化库默认风格。

**Q5 aggregation 与空 dimensions 边界**
- 推荐并已采纳：lint 规则——两表 ⊆ 模板 dimensions 且互不相交；指标 dimensions 为空时 aggregation 存在即 lint error（防双源不一致）。

**Q6 statistic_object / concept_refs 解析边界**
- 推荐并已采纳：v4 仅形状校验（id/version 非空、source 非空串），不做本体存在性/解析校验。理由：契约 §3.3 引用不拥有，v4 世界无本体服务。

**Q7 UI SAP 项微观呈现**
- 推荐并已采纳：下载区列表末尾追加「SAP 语义包」，说明「JuanerAI 语义资产包（YAML，含指纹与出处）」；阻断呈现零改动复用（已核实 `server.ts` 422 阻断页：列未审核指标 + 审核中心入口，SAP 走同一 `ExportBlockedError` 路径）。术语在 UI-GATE 契约中钉死。

**Q8 UI-GATE 变更面与必测状态**
- 推荐并已采纳：唯一变更面 = 实例页导出下载区。原型必覆盖：默认态（四格式列表含 SAP）、下载成功（YAML 落盘）、阻断态（422 页，不弱化）、concept_refs 为空的合法常态（SAP 照常可导）。

**无升级项**：全部问题有defensible 推荐且不冲突 proposal；零待用户输入。

---

## UI-GATE 裁决回写（2026-10-08，用户批准 D1/D2）

- **D2（规格缺口补定义）**：「实例名」:= 实例 YAML 文件名去 `.yaml` 后缀；下载产物名 `<实例名>.sap.yaml`（US17 断言依据）。已知边界接受：向导产出的固定名 `instance.yaml` 退化为 `instance.sap.yaml`，不为此新增 schema 字段。
- **D1**：UI 未知格式错误页枚举串同步加 `sap`（仅字符串，不改结构）。
- 设计债记录（不动作）：仓库现行 UI = 2026-09-28 亮橘契约（#e8643a），全局 DESIGN.md 已 v4.2 铁锈橘（#b44626）；全站迁移另立批次。
