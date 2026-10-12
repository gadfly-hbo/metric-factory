# 批次 1 · 实例发布（release）· UI 契约（UI-GATE 冻结件）

> 状态：**冻结候选**（待用户验收）。规格源仅限：`.flow/proposal.md`、`.flow/prd.md`（含 GRILL 决议 G1–G9）、`src/ui/render.ts`、`src/ui/server.ts`、`docs/工作台使用指南.md`、v5 契约先例（`.flow/archive-v5-20261012/ui-contract.md`，格式参照）。本契约在实现批次动生产代码前冻结用户可见界面与交互；与 PRD 冲突处以 GRILL 决议（2026-10-12）为最高优先。
>
> 配套可点击原型：`.flow/ui/index.html`（导航）+ 每状态一个静态 HTML（本契约 1:1 落样，零 JS）。

## 0. 范围与位置（钉死）

- 发布区块是**实例页（GET /instance）现有卡片流中的新区块**，不新增导航项、不新增独立页面（表单直接嵌在实例页内——US1「在实例页输入版本号与变更说明一键发布」）。
- 实例页区块顺序钉死（自上而下，v5 契约 §0 基础上追加第 6 块）：
  1. 实例概览卡（既有，**零改动**——含四个导出按钮；G2：导出不写登记，按钮行为与文案不变）
  2. 相对模板的变更（fork diff，既有）
  3. 指标树 · 杜邦式分解（既有）
  4. 微调实例 patch 表单（既有）
  5. 决策场景 · 分析体系（v5 冻结）
  6. **发布（新增，页面最后一块）**
- 排布理由：发布是「设计态半环 → 发布一个明确版本」的终点动作，消费指标与场景两类内容（先微调指标、再配场景、最后发布交付）；结果卡与警告条需要完整页面上下文承载，置于页尾不打断既有编辑动线——与 v5 钉死的自底向上阅读序一致。
- 无实例打开时实例页维持既有 empty 态，发布区块不渲染（行为不变）。
- **全局边界声明同步更新**（PRD Implementation Decisions #8：写白名单显式扩展）：侧栏 boundary 文案改为 `写操作仅限本地实例、映射文件与 releases/ 发布登记`（第二行 `页面无脚本 · 纯服务端表单` 不变）。该文案由 `layout()` 渲染，**全站每页生效**。使用指南 `docs/工作台使用指南.md` 边界声明同步更新属实现批次（非 UI 表面，记录在案）。
- 发布区块**不含发布历史列表**（已发布版本表/版本清单页）：规格未定义该表面，消费侧按 `releases/index.yaml` 取得属批次 2（Negative N5）。

## 0.1 路由（钉死）

| 路由 | 方法 | 作用 | 成功 | 失败 |
|---|---|---|---|---|
| `/instance` | GET | 实例页含发布区块（R1 表单默认态） | 200 | — |
| `/instance/release` | POST | 提交发布（表单字段 `version`、`note`） | **200 重渲染实例页**：R2 成功 / R3 警告（发布完成，结果卡置顶 + 表单复位） | **422 重渲染实例页**：R4 / R5 / R6 / R7（表单值保留 + 错误呈现，零写盘） |

- 成功**不走 303**：结果数据（快照路径、index 追加位置、双指纹、警告）只存在于本次提交的响应中，重定向无处携带（工作台无 flash 基础设施）；刷新导致的重复提交由「同 id@version 拒绝」不变量兜底（R6 即该兜底的用户可见形态）。此为「POST + 重定向/重渲染」中的**重渲染**分支，零脚本底线不变。
- 提交管线与 CLI `release` 完全同一（PRD #1/#8）：load → materialize → 全量校验（不跳过审核门）→ export gate → SAP 装配 → 整包校验 → 内容指纹 → 写快照 + 追加 index；任一步失败 422 零写盘。UI 不做客户端业务预校验（原生 `required`/`pattern` 仅为第一道格式约束，服务端校验为权威——R5 在绕过原生约束时仍可达）。
- 同步提交，无进度页/轮询：发布管线无慢调用环节（LLM 未审门是本地规则判断，非模型调用）——与 AI 草案的 job 轮询模式（`/drafts/jobs/:id`）不同，不引入该机制。

## 1. Surfaces（发布区块全部状态）

区块骨架（各状态共用）：view-title `发布`（H2 级）+ 说明行（T-02）+ 状态内容（下述 R1–R7）。发布不改实例文件（写的是 `releases/`），故 R2/R3 下实例页其余区块与 R1 完全一致。

### R1 表单默认态（GET /instance）

- 单个 `<form action="/instance/release" method="post">` + 一张 `card`，内含两个字段与提交按钮（控件清单见 §3.1）：
  1. **版本号**：`input[type=text]`，`required` + `pattern="\d+\.\d+\.\d+"`（PRD #6 semver 冻结值 `^\d+\.\d+\.\d+$`）
  2. **变更说明**：`textarea`（可空），下方常显辅助行（T-05：note 落登记条目；发布人取环境约定，G8）
  3. **发布**：`button[type=submit].btn-primary`
- 无取消按钮：区块即实例页本身，「不发布」= 不提交（区别于 v5 独立表单页的取消路径）。

### R2 发布成功态（POST 200 重渲染）

- 发布区块顶部结果卡（`card` + `card-h` ok 色）`发布成功 · «package-id»@«version»`，正文四行数据（G6 冻结的输出面）：
  - **快照**：`releases/«package-id»/«version».sap.yaml`（mono）
  - **登记**：`releases/index.yaml · 追加为第 «N» 条（append-only）`——N 为追加后的 1 起算序号
  - **内容指纹**：64 位十六进制 SHA-256（mono，可换行不断流）
  - **package_fingerprint**：64 位十六进制 SHA-256（mono）
- 结果卡下方表单**复位为空**（该版本已不可变，下一次发布从新版本号开始）。
- 不展示 released_by/created_at（G6 成功输出清单未含；登记条目字段在 index 中可查）。

### R3 内容指纹警告态（发布成功 + 警告条，G5：不阻断）

- R2 结果卡上方追加**警告条**（warn 语义 tokens：`--warn-soft`/`--warn-line`/`--warn`，标题 `警告 · 内容指纹与既有发布相同`），正文含**既有条目 package@version 对照**（T-11）。
- 发布照常完成：结果卡为本次 «package-id»@«version»，快照/登记/双指纹齐全；表单复位。
- 原型演示值一致性：R3 中 1.0.1 的内容指纹与 R2 中 1.0.0 的内容指纹相同（这正是触发警告的条件），package_fingerprint 不同（含时间戳成分）。

### R4 校验失败态（422 重渲染；实例本身有校验问题）

- 发布区块顶部错误卡：`card` + `card-h`（fail 色）`发布未通过校验（零写盘）` + `ul.error-list`（`role="alert"`）**逐行** `[rule] path: message`——沿用实例页既有错误回显文法（`formErrorPage`/patch 422 的列表样式，规则名直取引擎）。
- 错误来源为发布管线全链：`validateInstance`（不跳过审核门，含 `[llm-unreviewed]`）→ export gate → SAP 装配/整包校验 issue 透传。**不用** `formErrorPage` 的 `javascript:history.back()` 返回链接（JS 依赖，v5 契约 N1 先例）：错误卡下方即保留值的表单本身。
- 表单**全部字段保留用户提交值**（版本号 + 变更说明原文）。
- 审核门的修复动线沿用页面既有入口：概览卡「审核中心」按钮（本页已在）。

### R5 版本号非法态（非 semver，422 重渲染）

- **内联错误**（区别于 R4 的列表形态）：版本号字段下方 `<p role="alert">`（fail 色、0.86rem），文案 T-13；输入框 `aria-invalid="true"` + `aria-describedby` 指向该错误。
- 写盘前拒绝（PRD #6）；表单值保留。

### R6 重复版本拒绝态（同 id@version 已发布，422 重渲染）

- 内联错误挂在版本号字段（修正动作在该字段）：文案 T-14，**必须含「已发布于 «created_at»，请升级版本号」**（PRD #5 逐字指引）与既有条目 `«package-id»@«version»` 对照；created_at 为 index 条目 ISO 时间戳。
- 零写盘；表单值保留。该态同时是「刷新成功页导致重复提交」的兜底呈现（§0.1）。

### R7 index.yaml 损坏拒绝态（422 重渲染，G3 fail-closed）

- 发布区块顶部错误卡：`card-h`（fail 色）`发布被拒绝 · releases/index.yaml 不可用` + `ul.error-list`（`role="alert"`）单条：`releases/index.yaml 解析失败或形状非法（«解析细节»），已拒绝发布（fail-closed，零写盘）。请用 git 恢复该文件后重试；发布不会自动重建或覆盖它。`
- 不提供任何重建/覆盖入口（G3：修复靠 git 恢复，人工动作）；表单值保留。

## 2. Click paths

| # | 路径 | 步骤 |
|---|---|---|
| P1 进入 | 实例页 → 发布区块 | 打开 `/instance` 滚至页尾即见 R1；原生 Tab 依 §3.1 字段序到达 |
| P2 发布成功 | R1 填版本号（+可选变更说明）→ `发布` →（管线全过）200 重渲染 → R2（结果卡 + 表单复位） | — |
| P3 同内容警告 | R1 发布一个内容指纹与既有条目相同的版本 → 200 重渲染 → R3（警告条 + 结果卡） | 不阻断、无额外确认步骤 |
| P4 实例校验失败 | R1 `发布` → 管线任一校验环节失败 → 422 重渲染 R4（逐行错误 + 值保留）→ 修正实例（微调表单/审核中心，本页既有入口）→ 重新发布 | — |
| P5 版本号非法 | R1 填非 semver（绕过原生约束提交）→ 422 重渲染 R5（内联错误 + 值保留）→ 改正重提交 | 原生 `pattern` 通常在提交前拦截，此态为服务端权威兜底 |
| P6 重复版本 | R1 填已发布的 id@version → 422 重渲染 R6（内联错误含已发布时间）→ 升级版本号重提交 | 刷新成功页重提交亦落此态 |
| P7 index 损坏 | R1 `发布` → index.yaml 解析/形状非法 → 422 重渲染 R7（错误卡 + git 恢复指引）→ 终端 `git` 恢复 → 重试 | UI 内无修复动作 |
| P8 不发布 | R1 不点 `发布`，直接使用页面其余区块/离开 | 无取消按钮（区块即页面本身） |

- 全部跳转为原生 form POST + 服务端渲染；无任何客户端脚本参与业务行为（原型文件亦零 `<script>`，见 §7）。

## 3. Affordances

### 3.1 控件清单（字段序 = DOM 序 = Tab 焦点序，钉死）

| 序 | 字段 | 控件 | 必填 | 原生约束 | 备注 |
|---|---|---|---|---|---|
| 1 | 版本号 version | `input[type=text]` | 是 | `required` + `pattern="\d+\.\d+\.\d+"` + `title`（原生提示语） | semver 三段（PRD #6）；服务端复验为权威（R5） |
| 2 | 变更说明 note | `textarea` | 否 | — | 可空；随登记条目保存（T-05 辅助行常显） |
| 3 | 发布 | `button[type=submit].btn-primary` | — | — | 表单唯一主动作 |

- label 与控件以 `for`/`id` 显式关联（`rel-version` / `rel-note`，v5 契约同款可访问性增量）。
- 发布区块在页面最末，页内 Tab 序自然位于微调表单与场景区块之后；无 `tabindex` 干预。
- 无发布人输入（G8）、无版本号自动递增/建议控件（Negative N11）。

### 3.2 状态呈现与复位规则（钉死）

- 成功（R2/R3）：表单复位为空；结果卡（及警告条）只在本次响应中出现——再次 GET `/instance` 回到 R1（无 flash/会话残留）。
- 失败（R4–R7）：表单值全量保留；错误呈现两级——**字段级内联错误**（R5/R6，挂版本号字段，`aria-invalid` + `aria-describedby`）与**区块级错误列表**（R4/R7，`ul.error-list` + `role="alert"`，版本号输入框 `aria-describedby` 指向错误列表 id）。

### 3.3 可访问性底线（钉死）

- 错误不依赖红色单独表意：内联错误与列表条目均含完整文字（规则名 + 位置 + 指引）。
- 必填以 label 文字「必填」标注（T-03），不用颜色/星号单通道；原生 `required` 同步存在。
- 既有 `:focus-visible` 焦点外廓保留；成功/警告/失败均有文字标题（`发布成功`/`警告 · …`/`发布未通过校验`…），色仅为辅助。
- 长十六进制指纹 `overflow-wrap:anywhere`（沿用 `t-id` 同款处理），不撑破卡片。

## 4. Terminology（用户可见串逐字钉死）

主术语（PRD 直取，不得改名或新造标签）：**发布、版本号、变更说明、内容指纹、快照、已发布于**。`package_fingerprint` 无 PRD 中文定名，以登记字段名原样呈现（mono），不造译名。

| # | 位置 | 文案（逐字；`«…»` 为运行时值） |
|---|---|---|
| T-01 | 区块标题（view-title） | `发布` |
| T-02 | 区块说明行 | `把当前实例发布为不可变快照（releases/<package-id>/<version>.sap.yaml）并追加登记 releases/index.yaml，供 JuanerAI 按精确 id@version 取得。与 CLI release 同一管线（全量校验 → export gate → SAP 装配 → 整包校验 → 内容指纹），失败零写盘。同一 id@version 不可重复发布；内容指纹与既有发布相同时发布成功并显示警告。` |
| T-03 | 字段 1 label | `版本号（semver 三段 X.Y.Z，必填，如 1.2.0）` |
| T-04 | 字段 2 label | `变更说明（可空）` |
| T-05 | 字段 2 辅助行（常显） | `随发布登记保存（releases/index.yaml 条目的 note 字段）；发布人取环境约定（MF_REVIEWER / $USER），无需填写。` |
| T-06 | 提交按钮 | `发布` |
| T-07 | placeholder | 版本号：`1.0.0`；变更说明：`本次发布包含的口径或场景变化` |
| T-08 | R2/R3 结果卡标题 | `发布成功 · «package-id»@«version»` |
| T-09 | 结果卡行名 | `快照` / `登记` / `内容指纹` / `package_fingerprint` |
| T-10 | 登记行 | `releases/index.yaml · 追加为第 «N» 条（append-only）` |
| T-11 | R3 警告条标题 / 正文 | 标题：`警告 · 内容指纹与既有发布相同`；正文：`本次发布的内容指纹与既有发布 «package-id»@«version» 相同（无业务变化的版本递增）；发布已生效。` |
| T-12 | R4 错误卡标题 | `发布未通过校验（零写盘）`；条目文法：`[«rule»] «path»: «message»`（规则名/消息直取引擎与包校验器，不新造） |
| T-13 | R5 内联错误 | `版本号 "«value»" 不是合法 semver（须为三段数字 X.Y.Z，如 1.2.0），已拒绝发布（零写盘）` |
| T-14 | R6 内联错误 | `«package-id»@«version» 已发布于 «created_at»，请升级版本号（已发布版本不可变）` |
| T-15 | R7 错误卡标题 / 条目 | 标题：`发布被拒绝 · releases/index.yaml 不可用`；条目：`releases/index.yaml 解析失败或形状非法（«解析细节»），已拒绝发布（fail-closed，零写盘）。请用 git 恢复该文件后重试；发布不会自动重建或覆盖它。` |
| T-16 | 侧栏 boundary（全站） | 第一行：`写操作仅限本地实例、映射文件与 releases/ 发布登记`；第二行不变：`页面无脚本 · 纯服务端表单` |
| T-17 | 原生 title（版本号） | `版本号须为 semver（三段数字 X.Y.Z，如 1.2.0）` |

## 5. Negative cases（禁止出现的路径与状态）

| # | 场景 | 契约行为 |
|---|---|---|
| N1 | 禁用 JavaScript | 全部状态可达可用：原生 form POST + 服务端渲染；生产代码与原型均零 `<script>`；错误页不依赖 `history.back()`（值保留重渲染） |
| N2 | 发布成功但未写 index | **禁止**——R2/R3 结果卡只在快照与登记都完成后渲染；不存在「半登记」状态（G2：发布=登记） |
| N3 | 失败却写盘 | 任何 422（R4–R7）零写盘：`releases/` 与实例文件均不变；错误标题/文案明示零写盘 |
| N4 | JS 依赖交互 | 禁止：无确认弹窗、无客户端业务校验、无 toast/自动消失通知（关键状态以重渲染页面承载） |
| N5 | 发布历史列表/版本清单页 | 实例页不得出现已发布版本表格或独立清单页（规格未定义；消费侧查询属批次 2） |
| N6 | 发布人输入框 | 表单仅版本号 + 变更说明两字段（G8）；不出现审核人/发布人第三输入框 |
| N7 | 审批流 UI | 无审批/会签按钮或流程（proposal 显式不做；LLM 未审阻断门是质量门，走 R4 错误回显而非审批向导） |
| N8 | 导出按钮写登记 | 「导出 SAP 语义包」等四个导出按钮行为与文案**零改动**——导出恒为临时导出，不写 `releases/`（G2、PRD #7） |
| N9 | 覆盖/改写/删除既有发布 | 无任何入口（不可变）；重复发布只能落 R6 拒绝 |
| N10 | 版本号自动递增/建议 | 无：版本号仅用户输入（规格只定义输入框） |
| N11 | index 损坏时自动重建 | 禁止（G3）：R7 仅指引 git 恢复；不提供重建/覆盖/编辑 index 的 UI |
| N12 | 成功后残留状态 | 再次 GET `/instance` 回 R1；无 flash/会话残留（R2/R3 仅存在于 POST 响应中） |

## 6. Trace links（状态 ↔ 规格映射）

| 状态/决策 | PRD 用户故事 | PRD 决议 / GRILL | proposal |
|---|---|---|---|
| R1 表单默认态（版本号+变更说明+发布） | US1 | Implementation Decisions #8（表单字段）、#6（semver）；G8（无发布人输入） | 切片 1「UI 实例页发布入口」 |
| R2 成功态（快照路径、index 追加位置、双指纹） | US1、US5（指纹可对账） | #2（releases 布局）、#3（index 形状）、#4（双指纹）；G6（成功输出面） | 切片 1 产出与登记条目字段 |
| R3 警告态（含既有 package@version 对照，不阻断） | US2 | #5（同内容指纹允许但警告）；G5（UI 结果页警告条） | 切片 1 不变量第 2 条 |
| R4 校验失败态（逐行错误、零写盘、值保留） | US1（一键发布的失败面） | #1（同一管线）、#8（失败零写盘逐行回显）；#5 质量门（LLM 未审阻断保留） | 切片 1「不开第二套规则」+ 不变量 |
| R5 版本号非法（内联错误） | US1 | #6（非法输入写盘前拒绝） | 切片 1 |
| R6 重复版本拒绝（「已发布于 …，请升级版本号」） | US4 | #5（同 id@version 拒绝 + 错误信息指引）；红队 R2 | 切片 1 不变量第 1 条 |
| R7 index 损坏拒绝（git 恢复指引） | US12（登记可信的前提） | G3（fail-closed，不重建不覆盖） | 切片 1（releases/ 机制） |
| 侧栏 boundary 文案更新（全站） | — | #8（写白名单显式扩展 + 边界声明同步） | 切片 1 末段 |
| 成功不走 303（重渲染） | — | #8（复用纯服务端表单模式）+ G6（结果数据呈现） | — |
| 无发布历史列表（N5） | US7（按 index 取得属消费侧） | #3（index 是消费接口）；批次 2 范围 | 显式不做（版本登记不做服务化/注册表） |
| 无审批流（N7） | — | #5（发布动作不加审批） | 显式不做 |

## 7. 工件声明（Visual artifact 清单）

产物格式：**静态 HTML，零 `<script>`、零外部依赖**（logo 走仓库内相对路径 `../../assets/juanerai-logo-slogan.png`）；CSS 集中为 `render.css`，**逐字取自 `src/ui/render.ts` 顶部 CSS 块（2026-10-12 当前版，绿色 tokens）**，零新增类——警告条与内联错误用既有语义 tokens 的行内样式（`--warn-*`/`--fail-*`，与 render.ts 行内样式惯例一致），不引入新视觉语言。原型内不含任何演示切换脚本（区别于 v5 原型的演示切换器；本批以「一状态一文件」满足零 JS）。

| 工件 | 路径 | 对应状态 |
|---|---|---|
| UI 契约 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui-contract.md` | 本文件 |
| 原型导航页 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/index.html` | 状态清单 + 原型约定 |
| 共享样式 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/render.css` | 全部状态（render.ts CSS 逐字摘取） |
| R1 表单默认态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-form.html` | R1 |
| R2 发布成功态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-success.html` | R2 |
| R3 内容指纹警告态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-warn.html` | R3 |
| R4 校验失败态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-invalid.html` | R4（页面上下文含 2 个问题新增指标，与其余状态不同，以使概览 chip/fork diff/未入树指标与错误列表自洽） |
| R5 版本号非法态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-semver.html` | R5 |
| R6 重复版本拒绝态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-duplicate.html` | R6 |
| R7 index 损坏拒绝态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/release-index-broken.html` | R7 |

演示数据声明：虚构净销售实例（`examples/net-sales-instance.yaml` 情景演绎，基模板 `ecommerce-marketplace@0.1.0`）；指标名取自 `templates/ecommerce-marketplace.yaml` 真实字典 + 切片 2 样板字段（refund_amount/net_sales/net_sales_review）；R4 的 `vip_gmv_share`/`seasonal_gmv_share` 为虚构问题指标（演示 `[dangling-dimension]`/`[llm-unreviewed]` 两条错误文法，消息体逐字取自 `src/engine/validate.ts`）；指纹、时间戳、追加序号均为虚构示例值（R2/R3 间保持「1.0.1 内容指纹 = 1.0.0 内容指纹」的触发条件一致性）。

## 8. 开放项（不扩范围，交实现批次裁决）

| # | 事项 | 状态 |
|---|---|---|
| B1 | R4 错误列表条数上限/截断：引擎 issue 全量透传，无规格定义截断 | 无需裁决（记录在案） |
| B2 | `«解析细节»`（R7）与 `«created_at»`（R6）的运行时格式：分别取 YAML 解析器原始错误与 index 条目 ISO 时间戳 | 随实现落定，契约只钉外框文案 |
| B3 | 发布按钮防连点（双击双提交）：无 JS 约束可用；重复提交由同 id@version 拒绝兜底（R6），不引入 token/禁用态 | 关闭（不变量即防线） |

—— 契约正文完 ——
