# v4 批次 UI 契约 · 实例页导出下载区新增 SAP 语义包（UI-GATE 冻结稿）

> 状态：待 Controller 验收（UI-GATE 输入）
> 日期：2026-10-08
> 起草依据（只从这些来源推导，行为零发明）：
> 1. `.flow/proposal.md`（v4 方案）
> 2. `.flow/prd.md`（US15–17、Q7/Q8 决议、Testing Decisions）
> 3. `PRODUCT_PLAN.md` v0.2（背景）
> 4. 全局设计语言 `~/.zcode/design/DESIGN.md` v4.2（2026-10-04；本批次仅作 drift 比对基准，不迁移）
> 5. 仓库现行实现：`src/ui/render.ts`、`src/ui/server.ts`、`test/ui/export-download.test.ts`、`src/schema/instance.ts`、`src/export/*`
>
> 关联工件：可点击原型 `.flow/ui/index.html`（single-page HTML，内联 CSS/JS，零外部依赖，双击可开；渲染工具 = 手工静态 HTML，tokens 逐字转录自 `render.ts` 的 CSS 块，状态切换用原生 inline JS；本契约中记为「工件 P1」）。

---

## 0. Token 基线与设计债 finding（先决声明）

**本契约与原型钉死的 token = 仓库现行实现的真实 tokens**（`render.ts:9-24` 的 `:root` 变量，2026-09-28「Case 助手增量契约」）：

| token | 值 | 用途 |
|---|---|---|
| `--bg` | `#eceae5` | 页面底 |
| `--surface` | `#ffffff` | 卡片/按钮/输入 |
| `--surface-2` | `#f4f3ef` | 侧栏底 |
| `--soft` | `#f7f6f2` | 分区底 |
| `--border` / `--border-strong` | `#e5e2dc` / `#d8d3cb` | 单级边框 |
| `--text` / `--text-2` / `--text-3` | `#1d2027` / `#6f7480` / `#8a8076` | 正文两级 + 元数据 |
| `--accent` / `--accent-strong` / `--accent-soft` / `--accent-line` | `#e8643a` / `#bf4927` / `#fff1e8` / `#e8c1b4` | 主 accent（亮橘系） |
| `--navy` | `#263442` | 品牌/系统通道 |
| `--ok` / `--warn` / `--fail` 三族 | `#176247…` / `#855211…` / `#952f2f…` | 语义色（深字 + soft 底 + line 描边，成对出现） |
| `--queue` 族 | `#6d5bd0…` | 结构类标签 |
| `--rounded-base` / `--rounded-sm` | `12px` / `8px`（卡片实渲染 14px） | 圆角阶梯 |
| `--font` | `Inter, ui-sans-serif, -apple-system, …` | 字体栈 |
| 焦点环 | `:focus-visible { outline: 3px solid rgba(232,100,58,.28); offset 2px }` | 全站统一 |
| chip 形态 | `border-radius: 999px` pill，必须带文字 | 状态徽标 |

**事实更正（对任务简报的冻结事实）**：任务简报称仓库现行 UI 为「2026-09-28 Xanthil 契约（teal accent #0f766e 系）」。经源码核实，`render.ts:7-8` 注释明确记录现行 UI 是「2026-09-28 Case 助手增量契约：**橘 accent + 藏青 + Inter**，经用户指令采用，**取代** 09-23 全局 DESIGN.md 的青色版」。即仓库现行真实 tokens 是**亮橘 #e8643a 系**，不是 teal。本契约与原型按「仓库现行实现的真实 tokens」这一指令的实质执行，钉死上表；teal 是已被仓库注释宣告取代的 09-23 旧版。

**设计债 drift（必列 finding，本批次不修）**：仓库现行 09-28 契约（`#e8643a` + Inter 优先栈 + pill chip + 卡片 14px）与全局 `DESIGN.md` v4.2（2026-10-04，`#b44626` 铁锈橘 + 系统栈优先 + badge 5px 圆角禁 pill + panel 12px）存在系统性漂移，覆盖 accent 色相、字体栈、chip 形态、圆角阶梯四个维度。修复标准：独立设计债批次按 v4.2 全局契约重写 `render.ts` token 块（accent/font/圆角/chip 四处），与 v4 功能批次解耦，迁移时全站 148 测试回归不重写断言语义。

---

## 1. Surfaces（变更面 + 关联面完整状态清单）

### S1 · 实例页导出下载区（**本批次唯一变更面**）

- 位置：`/instance` → 实例概览卡（`.card`）内的 `.btn-row`（现行结构见 `render.ts:250-261`）。
- 现行内容（冻结，v4 不得改动其标签/顺序/样式）：
  1. `<a class="btn" href="/review">审核中心</a>`
  2. `<a class="btn btn-primary" href="/instance/export/metricflow">导出 MetricFlow YAML</a>`
  3. `<a class="btn" href="/instance/export/excel">导出 Excel 字典</a>`
  4. `<a class="btn" href="/instance/export/mermaid">导出 Mermaid 指标树</a>`
- v4 追加（列表末尾，第 5 项）：
  5. `<a class="btn" href="/instance/export/sap" aria-describedby="sap-export-note">导出 SAP 语义包</a>`
  6. 说明行（`.btn-row` 之后、同卡内独立段落，纯文本非链接）：`<p id="sap-export-note" …>SAP 语义包：JuanerAI 语义资产包（YAML，含指纹与出处）</p>`，样式取仓库既有 muted 小字惯例（`color:var(--text-3); font-size:11.5px; margin-top:8px`）。

**S1 状态清单**：

| 状态 | 触发 | 呈现 | 出处 |
|---|---|---|---|
| S1-1 默认态（含待审核>0 变体） | GET `/instance` 200 | 按钮组 5 项；概览卡 chip 按 `findPendingReview` 显示「待审核 N」（warn）或「无待审核」（ok），chip 必带文字 | `render.ts:254`、`server.ts:383-397` |
| S1-2 下载成功态 | 点击 SAP 项 → GET `/instance/export/sap` | HTTP 200，`content-type: text/yaml; charset=utf-8`，`content-disposition: attachment; filename="<实例名>.sap.yaml"`；**页面本体不变，无 toast/无弹层/无 spinner**（与既有三格式同一交互模式：浏览器下载器承接全部反馈） | `server.ts:446-450` 管线复用；US17 |
| S1-3 阻断态 | 点击任一导出项且实例含未审核 LLM 指标 | 跳转 S2-1 页（HTTP 422） | `server.ts:452-460`；US16 |
| S1-4 空 concept_refs 常态 | 实例未声明 `concept_refs`（合法） | **与 S1-1 逐字一致**：下载区不出现任何 concept_refs 相关徽标/计数/空态提示；SAP 项照常可点、可导 | Q8 决议；PRD Schema 扩展（concept_refs 全可选） |
| S1-5 校验未通过态 | `validateInstance` 返回 issues | 422 `formErrorPage("校验失败", …)`（[rule] path: message 列表 + 「返回修改」） | `server.ts:432-438`；管线复用推论 |

S1 布局参数（像素对齐基准）：主栏 max-width 1000px 居中；`.card` 白底 1px `--border`、radius 14px、`--shadow-card`、padding 14px 16px；`.btn` 高 padding 6px 12px、radius 8px、1px `--border-strong` 边框、13px/600；`.btn-primary` 实心 `--accent` 底 `--accent-strong` 边白字；按钮组 gap 8px 可换行。

### S2 · 导出端点错误面（**关联面**，SAP 与三格式同一呈现，零弱化）

| 状态 | HTTP | 页面标题（layout title） | 副题（layout desc） | 内容体 | 出处 |
|---|---|---|---|---|---|
| S2-1 阻断态（ExportBlockedError） | 422 | `导出被阻断（fail-closed）` | `以下 LLM 生成指标未经人工审核，完成审核后才能导出。` | `.card`：`.card-h`（`color:var(--fail)`）`待审核指标` + `.error-list`（每条 `<li><span class="mono">{指标名}</span></li>`）+ `.btn.btn-primary` `前往审核中心` → `/review` | `server.ts:452-459` |
| S2-2 导出前校验未通过 | 422 | `导出前校验未通过` | `实例存在未解决问题，修正后才能导出。` | `formErrorPage("校验失败", …)` | `server.ts:433-437` |
| S2-3 无实例 | 422 | `无实例` | `未指定实例。` | `formErrorPage("无实例", …)` | `server.ts:416-420` |
| S2-4 未知格式 | 404 | `未找到格式` | `不支持的导出格式 {format}。` | `.empty`：`可选：metricflow / excel / mermaid / sap` + 「返回实例」 | `server.ts:409-413`（格式列举串为 v4 随第 4 导出器加入的**连带同步串**，见 §6-F2） |

**S2-1 同构性钉死**：现行阻断页文案不含格式名，因此 SAP 的阻断页与三格式**逐字同构（vacuously，无格式名可变化）**——同一 layout 调用、同一 card 结构、同一文案常量。禁止为 SAP 增加任何格式专属文案、弱化语（如「仅 SAP」「可跳过」）或减少所列指标。

---

## 2. Click paths（入口 / 动作 / 结果态）

1. **默认路径（S1-1 → S1-2）**：`/instance` 页面加载 → Tab 键序：审核中心 → MetricFlow → Excel → Mermaid → **SAP（第 5，末位）** → Enter/点击 → 浏览器下载 `<实例名>.sap.yaml` → 页面无变化。
2. **阻断路径（S1-1 → S2-1）**：含未审核 LLM 指标时点击**任一**导出项（含 SAP）→ 422 阻断页 → 列出全部未审核指标名（mono）→ 「前往审核中心」→ `/review` 审核完成后回到 `/instance` 重试导出。
3. **空 concept_refs 路径（S1-4 → S1-2）**：实例无 `concept_refs` → 下载区与默认态完全一致 → SAP 点击直接成功下载，包内 `concept_refs` 段合法为空（`[]`）。
4. **成功下载的文件契约（展示给用户的落盘物）**：文件名 `<实例名>.sap.yaml`（实例名定义见 §7 BLOCKED-1）；YAML 1.2 内容含 `sap: 0.1`、`runtime_state: design_only`、`fingerprint`、`namespace`、`generator`、`created_at`（PRD Testing Decisions 断言面）。

---

## 3. Affordances（控件 / 焦点 / 可访问性）

- **控件**：SAP 项 = 原生 `<a class="btn">`（真实链接语义，URL 可预判、可中键新标签打开、右键存链），与既有三项同构；说明行 = 纯文本 `<p>`，非控件、不可聚焦、不携带链接。
- **焦点顺序**：DOM 序 = Tab 序，SAP 恒为下载区末位焦点项；新增项不得改变既有四项的相对顺序与焦点位置。
- **焦点可见性**：复用仓库统一 `:focus-visible` 3px accent 环（offset 2px），SAP 项不另设焦点样式。
- **双通道状态**：所有状态必须色 + 文字双通道——阻断 = `--fail` 色 + 标题/副题/指标名文字 + 「待审核指标」卡头；chip 一律带文字（「待审核 N」/「无待审核」）；**禁止颜色作为唯一信号**（与仓库现行规范及全局 DESIGN.md「状态绝不只用颜色表达」一致）。
- **描述关联**：SAP 锚点 `aria-describedby="sap-export-note"` 指向说明行，读屏可获完整文案「SAP 语义包：JuanerAI 语义资产包（YAML，含指纹与出处）」。
- **无脚本基线**：产品页面本身零 JS（仓库 boundary 声明「页面无脚本 · 纯服务端表单」）；SAP 项不得引入任何客户端行为。

---

## 4. Terminology（用户可见字符串钉死表，逐字常量）

| 字符串 | 逐字值 | 来源 |
|---|---|---|
| SAP 项按钮标签 | `导出 SAP 语义包`（= 既有动作前缀「导出 」+ Q7 格式名「SAP 语义包」） | PRD Q7 |
| SAP 项说明文案 | `SAP 语义包：JuanerAI 语义资产包（YAML，含指纹与出处）` | PRD Q7（全角括号逐字） |
| 既有三项标签 | `导出 MetricFlow YAML` / `导出 Excel 字典` / `导出 Mermaid 指标树`（**冻结不改**） | `render.ts:257-259` |
| 审核入口 | `审核中心` / `前往审核中心` | `render.ts:256`、`server.ts:457` |
| 阻断页 | `导出被阻断（fail-closed）` / `以下 LLM 生成指标未经人工审核，完成审核后才能导出。` / `待审核指标` | `server.ts:453-455` |
| 下载文件名 | `<实例名>.sap.yaml` | PRD US17 |
| 404 格式列举 | `可选：metricflow / excel / mermaid / sap` | §6-F2 连带串 |

**禁止**：不引入任何 PRD/proposal 之外的新标签、新格式名、新按钮文案；既有三项按钮文案不得为「对齐」而改名。

---

## 5. Negative cases（禁止路径）

1. 阻断态（S2-1）下**不得出现**任何下载成功迹象：无 attachment 响应、无文件落盘、无成功提示；整批阻断，fail-closed 不在 SAP 开口子（proposal 不变量；US3 同语义）。
2. **禁止静默失败**：任何阻断/校验失败必须渲染带文字的 422/404 错误页；SAP 不得有任何「无响应」「空白页」可接受路径。
3. SAP **不得绕过 gate 独立导出**：无独立端点、无 query 参数豁免、无「强制导出」控件；服务端复用同一装配管线与 `ExportBlockedError` 路径（PRD Solution「无第二套业务规则」）。
4. **禁止新组件形态**：不加 toast/modal/spinner/进度条/角标；说明行不得做成按钮、链接或 badge。
5. SAP 项位置**恒为列表末尾**，不得插入既有三项之间；既有三项的顺序、样式、primary 归属（MetricFlow）冻结不动。
6. 空 concept_refs 时**禁止**在下载区显示告警、空态占位或禁用 SAP 项（Q8：合法常态）。
7. 阻断页所列指标名必须完整（全部 blocked 指标），不得截断、不得折叠、不得省略号。
8. SAP 说明文案不得替代或遮蔽格式名/文件名中的 `sap` 标识（落盘物永远是 `.sap.yaml` 后缀）。

---

## 6. Findings（severity-ranked）

- **F1 · HIGH · 设计债漂移（本批次不修，独立批次偿还）**：仓库现行 09-28 亮橘契约 vs 全局 DESIGN.md v4.2 铁锈橘契约，四维度漂移（accent `#e8643a`→`#b44626`；Inter 优先栈→系统栈；pill chip→5px badge；卡片 14px→panel 12px）。依据：`render.ts:9-24` vs `~/.zcode/design/DESIGN.md colors/typography/rounded/components`。修复标准：独立设计债批次按 v4.2 重写 render token 块并全站回归；v4 功能批次沿用现行 tokens 保证「唯一变更面」干净。附：任务简报「teal」表述与源码不符，已按源码事实更正（§0）。
- **F2 · MEDIUM · 连带串漂移**：`server.ts:411` 未知格式 404 页枚举「可选：metricflow / excel / mermaid」在第 4 导出器加入后失实。修复标准：同串追加 ` / sap`，仅同步列举，不改页面结构（已冻结于 §S2-4）。若 Controller 判定该串不属于本批次面，可回退为「不改动」并在 404 页保留旧串——但将与「如实枚举」原则冲突，默认建议同步。
- **F3 · MEDIUM · BLOCKED-1（见 §7）**：PRD 未定义「实例名」操作口径，实现批次开工前必须裁决。
- **F4 · LOW · 原型占位声明**：单文件零依赖约束下，原型 topbar 品牌 logo 以占位框代替真实 PNG（资产 871KB 不入内联）；不影响下载区契约面像素比对。修复标准：实现验收以真实 `/assets/juanerai-logo-slogan.png` 为准，原型无需返工。

---

## 7. BLOCKED 项（spec 缺口，不自行扩范围）

- **BLOCKED-1 · 「实例名」操作定义缺失**（阻塞实现批次与 UI 断言，不阻塞原型）
  - 缺口：PRD US17/CLI 文案仅写 `<实例名>.sap.yaml`；`src/schema/instance.ts:14-25` 的 Instance 无 `name` 字段（仅 `instance.created_at`、`instance.company?`）。
  - 契约推荐（供 Controller 裁决）：`实例名 := 实例 YAML 文件名去 .yaml 后缀`。证据：仓库样例即按此命名（`examples/ecommerce-instance.yaml` → `ecommerce-instance.sap.yaml`）。
  - 已知边界：向导创建的实例固定名为 `instance.yaml`（`server.ts:304`），按推荐口径落盘名将退化为 `instance.sap.yaml`；备选口径「父目录名」对 examples 不适用。两口径互斥，须 Controller 一次裁决；UI 测试断言依赖该定义（US17）。

---

## 8. Trace links（surface/state → PRD）

| 契约面/状态 | PRD 需求 | 说明 |
|---|---|---|
| S1-1 默认态四格式列表 | US15；Q7；Q8 | 一键下载入口；SAP 末尾追加 |
| S1-2 下载成功 | US15；US17；Q8 | 200 + attachment + `<实例名>.sap.yaml`；Q8 必测状态 |
| S1-4 空 concept_refs | Q8；PRD Schema 扩展段 | 合法常态，UI 无差异 |
| S2-1 阻断 422 页 | US16；Q7（零改动复用）；proposal 范围项 5；US3 同语义 | 逐字同构、不得弱化 |
| S2-2/S2-3/S2-4 | PRD Solution「同一服务端导出管线」 | 管线复用的连带状态 |
| §5 全部 negative | proposal「不可削弱的不变量」；US16；Testing Decisions 负例 | fail-closed 不开口子 |
| 术语表 §4 | PRD Q7「术语在 UI-GATE 契约中钉死」 | — |
| 原型四状态 ↔ 契约 1:1 | PRD Q8「原型必覆盖」 | 默认/成功/阻断/空 concept_refs |

## 9. 工件声明（Artifact declaration）

| 工件 | 路径 | 格式 | 渲染工具 | 验证方式 |
|---|---|---|---|---|
| 本契约 | `.flow/ui-contract.md` | Markdown | — | 人工评审 + §8 映射核对 |
| 原型 P1 | `.flow/ui/index.html` | 单页 HTML（内联 CSS/JS，零外部依赖，双击可开） | 手工静态 HTML；CSS tokens 逐字转录 `render.ts:9-151`；四状态切换用原生 inline JS（状态切换轨为原型专用件，明确标注「非产品 UI」） | 双击打开 → 状态轨切四态 → 与 §1 状态清单逐格比对；默认态点击 SAP 触发真实 Blob 下载 `ecommerce-instance.sap.yaml`（演示 US17 落盘） |

原型四状态 ↔ 契约 1:1：默认态=S1-1；下载成功=S1-2（页面不变 + 真实文件落盘）；阻断 422=S2-1 整页复刻（指标名取仓库 fixture `ai_suggested_magic_metric`）；空 concept_refs=S1-4（下载区与默认态逐字一致，包演示数据 `concept_refs: []`）。

## 10. Recheck 标准（一句话）

实现批次交付后，逐条核对：实例页按钮组为 5 项且 SAP 恒居末位、标签/说明文案与 §4 逐字一致、阻断时四格式返回同一 422 页（测试断言含未审核指标名 + `/review` 链接）、SAP 成功响应 200 + `attachment; filename="<实例名>.sap.yaml"`、下载区全程零 JS 且既有 148 测试零回归。
