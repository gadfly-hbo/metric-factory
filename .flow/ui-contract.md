# 批次 A+B · B1 实例页「采用回执」区块 · UI 契约（UI-GATE 冻结件）

> 状态：**冻结候选**（待用户验收）。规格源仅限：`.flow/proposal.md`（B1 范围）、`.flow/prd.md`（实现决策 #3–#7 + GRILL 决议 G1–G5/G10 与红队 R1–R3）、`docs/juanerai-semantic-asset-contract-v0.1.md` §6.2（adoption receipt 冻结格式，v0.3 正文——术语源）、`src/ui/render.ts`（现有视觉体系）、全局 `~/.agents/ui-design/DESIGN.md`（中文专业工作台 UI 基线）、批次 1 UI 契约先例（`.flow/archive-b1-20261012/ui-contract.md`，格式与错误呈现范式参照；其发布区块即本区块的前一个区块）。本契约在实现批次动生产代码前冻结用户可见界面与交互；与 PRD 冲突处以 GRILL 决议（2026-10-12）为最高优先。
>
> 配套可点击原型：`.flow/ui/index.html`（导航）+ 每状态一个静态 HTML（本契约 1:1 落样，零 JS）。

## 0. 范围与位置（钉死）

- 采用回执区块是**实例页（GET /instance）现有卡片流中的新区块（第 7 块，发布区块之后）**，不新增导航项、不新增独立页面（表单与列表直接嵌在实例页内——US5「粘贴 YAML 即可登记回执，不用终端也能完成登记」）。
- 实例页区块顺序钉死（自上而下，批次 1 契约 §0 基础上追加第 7 块；第 1–6 块零改动）：
  1. 实例概览卡（既有，零改动）
  2. 相对模板的变更（fork diff，既有）
  3. 指标树 · 杜邦式分解（既有）
  4. 微调实例 patch 表单（既有）
  5. 决策场景 · 分析体系（v5 冻结）
  6. 发布（批次 1 冻结，R1–R7 全部状态零改动）
  7. **采用回执（新增，页面最后一块）**
- 排布理由：发布是「供给一个明确版本」的终点，采用回执是**该版本被消费端真实使用后的反馈回流**——按「先发布、后采用」的时序置于发布区块之后，与供给→消费→反馈的半环阅读序一致。
- **区块渲染条件（PRD 决策 #7 逐字）**：区块含两部分——(a) 本包回执列表、(b) 登记回执表单；**列表部分仅在工作区存在 `releases/` 或已有回执时渲染，表单恒渲染**。无实例打开时实例页维持既有 empty 态，本区块不渲染（与发布区块同款推理）。
- 区块不含回执详情页 / issues 明细展开 / 分页筛选（Negative N13/N14）；不含消费端回执产出界面（proposal 显式不做，批次 2b）。

## 0.1 路由（钉死）

| 路由 | 方法 | 作用 | 成功 | 失败 |
|---|---|---|---|---|
| `/instance` | GET | 实例页含采用回执区块（按工作区状态落 RC0/RC1/RC2） | 200 | — |
| `/instance/receipts` | POST | 提交登记（表单字段 `receipt`＝回执 YAML 全文） | **200 重渲染实例页**：RC3 / RC3m（列表含新回执 + 表单清空） | **422 重渲染实例页**：RC4 / RC5 / RC6（textarea 值保留 + 错误呈现，零写盘） |

- 成功**不走 303**（PRD 决策 #7 钉死 200 重渲染；与发布区块同款直渲染模式，零脚本底线不变）。刷新导致的重复提交由「同收编文件名拒绝」不变量兜底（RC5 即该兜底的用户可见形态）。
- 提交管线（PRD 决策 #3/#4/#5 + G2/G4）：解析 YAML → zod schema 校验（契约 §6.2 逐字段 + 未知字段忽略）→ 对账（读 `releases/index.yaml` 查 `package.id@version` 条目比对 content_fingerprint）→ 收编副本 `releases/receipts/<slug>.receipt.yaml`（规范化重排 + 追加供应侧字段 `received_at` 与 `reconciliation`）。任一步失败 422 零写盘。UI 不做客户端业务预校验（原生 `required` 仅为第一道约束，服务端校验为权威——空粘贴 / 非 YAML 文本均可达 RC4）。
- 同步提交，无进度页/轮询（登记无慢调用环节），不引入 AI 草案的 job 轮询机制。
- **对账语义（PRD 决策 #5）**：package@version 条目存在且 content_fingerprint 一致 → `对账一致`；存在但不一致，或条目不存在 → `对账不一致`——**记录入库 + 徽标，不拒绝**（失真回执也是反馈）。对账只在登记时刻计算并落盘（G2）；列表读收编副本，零 index 运行时依赖。

## 1. Surfaces（回执区块全部状态）

区块骨架（各状态共用）：view-title `采用回执` + 说明行（T-02）+ 列表部分（按 §0 渲染条件）+ 状态内容（错误卡等）+ 登记表单（恒渲染）。登记不写实例文件（写的是 `releases/receipts/`），故各 POST 状态下实例页其余区块（含发布区块）与 GET 完全一致。

### RC0 无列表态（GET /instance）

- 工作区**无 `releases/` 且无回执**（从未发布过）：列表部分**整体不渲染**——区块＝标题 + 说明行 + 表单（PRD 决策 #7 渲染条件）。
- 此态下提交登记必落 RC6（index.yaml 缺失分支：先发布指引）。

### RC1 列表空态（GET /instance）

- 工作区已有 `releases/`（本包发布过）但当前包尚无回执：列表部分渲染为空态卡（`.empty`，T-06）——说明尚无回执及登记方式（下方表单粘贴 / CLI `receipt add <file>`）。
- 表单默认（见 RC2 表单部分）。

### RC2 列表有条目态（GET /instance）

- **列表部分**：`card` 表格（`tbl`），标题 `已登记回执（«N»）`，行＝**当前实例包（package id = 实例文件名 slug）过滤后的已登记回执**，按 `received_at` 倒序（G1/G5）。列（钉死，共 6 列）：
  1. 任务（task_id）——mono
  2. 包@版本——mono `«package-id»@«version»`
  3. 对账状态——徽标：`对账一致`（`chip-ok`）/ `对账不一致`（`chip-warn`）（T-05）
  4. adopted 指标数——`«n»` 个
  5. issues 数——`«n»` 个
  6. 登记时间（received_at）——mono ISO-8601 原样
- 行内无任何操作（无编辑/删除/详情——收编副本不可变，N10/N13）。
- **表单部分（表单默认态，恒渲染）**：单个 `<form action="/instance/receipts" method="post">` + 一张 `card`，内含一个字段与提交按钮（控件清单见 §3.1）：textarea（粘贴回执 YAML，placeholder 为契约 §6.2 字段骨架 T-09）+ 常显辅助行（T-08）+ `登记回执` 提交按钮。
- 无取消按钮：区块即实例页本身，「不登记」= 不提交（与发布区块同款）。

### RC3 登记成功态（POST 200 重渲染 · 对账一致）

- **无独立结果卡**（PRD 决策 #7 成功输出面＝「列表含新回执、表单清空」，与批次 1 发布区块的「结果卡置顶」措辞刻意不同；对账结果以列表徽标呈现——G2 对账落盘在副本，列表读副本）。成功反馈＝三处可见变化：**列表置顶新增行**（received_at 最新 + `对账一致` 徽标）、**表单清空**（textarea 回空，placeholder 复现）、已登记回执计数 +1。
- 再次 GET `/instance` 与本态视觉一致（新回执已在列表中；表单保持空）——不存在 flash/会话残留（N12）。

### RC3m 登记成功态 · 对账不一致变体（POST 200 重渲染）

- 与 RC3 完全同构，唯一差别：置顶新行的徽标为 `对账不一致`（warn 色系）。**登记照常完成、副本照常收编**——不拒绝、不弹警告条、无额外确认（PRD 决策 #5 记录不拒绝；红队 R3；区别于发布区块 R3 的警告条形态——那是批次 1 规格明定的表面，回执规格未定义警告条，徽标即状态面）。
- 触发条件二选一：content_fingerprint 与 index 条目不一致；或 package@version 条目不存在。

### RC4 回执未通过校验态（POST 422 重渲染；schema 违规 / YAML 解析失败）

- 区块内、列表之下表单之上**错误卡**：`card` + `card-h`（fail 色）`回执未通过校验（零写盘）` + `ul.error-list`（`role="alert"`，`id="receipt-issues"`）**逐行** `[receipt] «path»: «message»`——文法沿用发布区块 R4 的 `[rule] path: message` 惯例，前缀按 PRD 决策 #6 钉死为 `[receipt]`；path 为 zod 路径（如 `package.content_fingerprint`、`issues_found[0].kind`），message 体为校验器输出（实现期落定，O3）。
- YAML 整体解析失败同落本态（文法同款，message 为解析器原始错误）。
- 表单 textarea **全量保留用户粘贴原文**；textarea `aria-describedby="receipt-issues"`（§3.2）。
- 零写盘：`releases/receipts/` 无任何新文件。

### RC5 重复登记拒绝态（POST 422 重渲染；同收编文件名已存在——G4）

- **内联错误**（单条、挂 textarea 字段——修正动作在该字段）：textarea 下方 `<p id="receipt-yaml-error" role="alert">`（fail 色、0.86rem），文案 T-12 **必须含「已登记于 «received_at»」**（G4：原 task_id 与已登记时间）与原 task_id 对照；textarea `aria-invalid="true"` + `aria-describedby="receipt-yaml-error"`。
- 重复判定＝收编文件名 `slugify(task_id) + ".receipt.yaml"` 已存在（slug 冲突即拒绝；«原 task_id» 为已登记回执的 task_id，可能与本次粘贴值不同——G4 不限制字符集的必然结果）。
- 零写盘；textarea 值保留。该态同时是「刷新成功页导致重复提交」的兜底呈现（§0.1）。

### RC6 index 不可用拒绝态（POST 422 重渲染；releases/index.yaml 缺失或损坏——PRD 决策 #5）

- 区块内**错误卡**：`card-h`（fail 色）`登记被拒绝 · releases/index.yaml 不可用` + `ul.error-list`（`role="alert"`，`id="receipt-issues"`）单条（T-13）：`releases/index.yaml 缺失或损坏（«细节»），无法对账，已拒绝登记（fail-closed，零写盘）。若从未发布过版本请先发布；若文件损坏请用 git 恢复后重试；登记不会自动重建或覆盖它。`
- 不提供任何重建/覆盖入口（修复＝先发布或 git 恢复，人工动作；与发布区块 R7 同款纪律）；表单值保留。
- 列表部分照常渲染（读收编副本，零 index 依赖——G2）。

## 2. Click paths

| # | 路径 | 步骤 |
|---|---|---|
| P1 查看 | 实例页 → 采用回执区块 | 打开 `/instance` 滚至页尾即见列表（或空态/无列表）+ 表单；原生 Tab 依 §3.1 字段序到达 |
| P2 登记（成功 · 对账一致） | 表单粘贴回执 YAML → `登记回执` →（解析+校验+对账全过）200 重渲染 → RC3（列表置顶新行 ok 徽标 + 表单清空） | — |
| P3 登记（成功 · 对账不一致） | 同 P2 但指纹不一致或条目不存在 → 200 重渲染 → RC3m（置顶行 warn 徽标；**记录不拒绝，无额外确认步骤**） | 失真回执也是反馈（US6） |
| P4 schema 违规 | 粘贴不合法 YAML（缺 task_id / 非 semver / 指纹格式错 / kind 越枚举 / 整体非 YAML）→ 422 重渲染 RC4（逐行 `[receipt]` + 值保留）→ 按行修正 YAML → 重新提交（可再落任一状态） | 服务端校验为权威；原生 required 仅拦空粘贴 |
| P5 重复登记 | 粘贴已登记 task_id（或 slug 冲突的 task_id）→ 422 重渲染 RC5（内联错误含原 task_id 与已登记时间）→ 新任务换 task_id 重提交；重复提交（刷新重放）亦落此态 | — |
| P6 index 缺失/损坏 | 提交 → index.yaml 读取失败 → 422 重渲染 RC6（错误卡 + 先发布 / git 恢复指引）→ 终端发布或 `git` 恢复 → 重试 | UI 内无修复动作 |
| P7 跨包登记（成功但列表不可见） | 在本实例页粘贴**其他 package id** 的合法回执 → 200 收编成功（G5：登记不校验包一致）→ 本包列表**不新增行**（G5：列表按当前包过滤）；辅助文案 T-08 已预告 | 收编全局生效，切换到对应实例页可见 |
| P8 不登记 | 表单不提交，直接使用页面其余区块/离开 | 无取消按钮（区块即页面本身） |

- 全部跳转为原生 form POST + 服务端渲染；无任何客户端脚本参与业务行为（原型文件亦零 `<script>`，见 §7）。

## 3. Affordances

### 3.1 控件清单（字段序 = DOM 序 = Tab 焦点序，钉死）

| 序 | 字段 | 控件 | 必填 | 原生约束 | 备注 |
|---|---|---|---|---|---|
| 1 | 回执 YAML `receipt` | `textarea`（mono，`rows="12"`） | 是 | `required`（仅拦空粘贴） | label 以 `for="receipt-yaml"` 显式关联；placeholder＝契约 §6.2 字段骨架（T-09）；服务端校验为权威 |
| 2 | 登记回执 | `button[type=submit].btn-primary` | — | — | 表单唯一主动作（T-10） |

- 区块在页面最末（发布之后），页内 Tab 序自然位于发布表单之后；无 `tabindex` 干预。
- 无登记人人输入框、无包 id 选择/覆盖控件（回执 package 字段只来自粘贴的 YAML——G5 不校验、不改写）。

### 3.2 状态呈现与复位规则（钉死）

- 成功（RC3/RC3m）：表单清空；新回执行按 received_at 倒序出现在列表顶部（当前包）；跨包回执收编成功但本列表不新增（P7）。再次 GET `/instance` 无 flash/会话残留。
- 失败（RC4–RC6）：textarea 值全量保留；错误呈现两级——**区块级错误列表**（RC4/RC6：`ul.error-list` + `role="alert"` + `id="receipt-issues"`，textarea `aria-describedby` 指向该 id）与**字段级内联错误**（RC5：`p` + `role="alert"` + `id="receipt-yaml-error"`，textarea `aria-invalid="true"` + `aria-describedby` 指向该 id）——逐字沿用批次 1 发布区块 §3.2 的两级范式。
- 错误卡位置钉死：区块内、列表之下、表单之上（错误与修正动作同屏相邻）。

### 3.3 可访问性底线（钉死）

- 错误不依赖红色单独表意：逐行/内联条目均含完整文字（路径 + 消息 + 指引）。
- 必填以 label 文字「必填」标注（T-07），不用颜色/星号单通道；原生 `required` 同步存在。
- 徽标有完整文字（`对账一致`/`对账不一致`），色仅为辅助；既有 `:focus-visible` 焦点外廓保留。
- 长 task_id / 包@版本列 mono 且允许自然换行（`tbl td` 默认，不设 nowrap），不撑破卡片。

## 4. Terminology（用户可见串逐字钉死）

主术语（契约 §6.2 与 PRD 用词，不得改名或新造标签）：**采用回执、登记回执、对账一致、对账不一致、task_id、内容指纹**。辅助定名：**已登记回执、adopted 指标数、issues 数、登记时间（received_at）、回执 YAML**。`package_fingerprint` / `adopted_metrics` / `adopted_scenarios` / `issues_found` / `computed_at` / `received_at` / `reconciliation` 等字段名无中文定名，以字段名原样呈现（mono），不造译名（同批次 1 `package_fingerprint` 先例）。

| # | 位置 | 文案（逐字；`«…»` 为运行时值） |
|---|---|---|
| T-01 | 区块标题（view-title） | `采用回执` |
| T-02 | 区块说明行 | `消费端完成真实任务后按契约 §6.2 格式回传采用回执；登记时对照 releases/index.yaml 对账——内容指纹一致 → 对账一致，不一致或条目不存在 → 对账不一致（记录不拒绝，失真回执也是反馈）。回执收编至 releases/receipts/（与 CLI receipt add 同一登记规则），列表按登记时间倒序展示当前包（«package-id»）的已登记回执。` |
| T-03 | 列表卡标题 | `已登记回执（«N»）` |
| T-04 | 列头（6 列） | `任务（task_id）` / `包@版本` / `对账状态` / `adopted 指标数` / `issues 数` / `登记时间（received_at）` |
| T-05 | 对账状态徽标 | `对账一致`（chip-ok）/ `对账不一致`（chip-warn） |
| T-06 | 列表空态文案 | 主行：`当前包（«package-id»）尚无采用回执`；副行：`消费端完成真实任务后按契约 §6.2 格式回传 YAML，在下方登记回执；也可用 CLI receipt add <file> 登记。` |
| T-07 | 字段 label | `回执 YAML（粘贴契约 §6.2 格式的采用回执，必填）` |
| T-08 | 字段辅助行（常显） | `回执按包全局登记，此处仅展示当前包；登记时自动对照 releases/index.yaml 对账（内容指纹一致 → 对账一致），失败零写盘。`（首句逐字取自 G5 表单辅助文案要求） |
| T-09 | placeholder | 契约 §6.2 字段骨架（`task_id: 消费端任务唯一标识` / `package:` 五行 / `adopted_metrics:` / `adopted_scenarios:` / `issues_found:` 三行 / `computed_at: ISO-8601`，见原型） |
| T-10 | 提交按钮 | `登记回执` |
| T-11 | RC4 错误卡标题 / 条目文法 | 标题：`回执未通过校验（零写盘）`；条目：`[receipt] «path»: «message»`（PRD 决策 #6 钉死前缀） |
| T-12 | RC5 内联错误 | `task_id "«原 task_id»" 已登记于 «received_at»，不可重复登记（append-only）；如为新任务请更换 task_id。` |
| T-13 | RC6 错误卡标题 / 条目 | 标题：`登记被拒绝 · releases/index.yaml 不可用`；条目：`releases/index.yaml 缺失或损坏（«细节»），无法对账，已拒绝登记（fail-closed，零写盘）。若从未发布过版本请先发布；若文件损坏请用 git 恢复后重试；登记不会自动重建或覆盖它。` |

## 5. Negative cases（禁止出现的路径与状态）

| # | 场景 | 契约行为 |
|---|---|---|
| N1 | 禁用 JavaScript | 全部状态可达可用：原生 form POST + 服务端渲染；生产代码与原型均零 `<script>`；无 `history.back()` 依赖（值保留重渲染） |
| N2 | 失败却写盘 | 任何 422（RC4–RC6）零写盘：`releases/receipts/` 与实例文件均不变；错误标题/文案明示零写盘 |
| N3 | 成功却未收编 | 禁止——200 重渲染仅在收编副本落盘后发生；不存在「半登记」状态（列表行读副本，未收编则不可能出现） |
| N4 | JS 依赖交互 | 禁止：无确认弹窗、无客户端 YAML 预校验/预览、无 toast/自动消失通知（关键状态以重渲染页面承载） |
| N5 | 非本包回执混入列表 | 列表恒按当前实例包 id 过滤（G5）——跨包回执登记成功后本列表不新增行；不得出现「全局回执混排」 |
| N6 | 登记校验包一致性 | 禁止添加：G5 明确登记**不**校验回执 package 与当前实例一致（回执按全局收编）——无「包不匹配」拒绝、警告或改写 |
| N7 | 对账不一致被拒绝 | 禁止：不一致 → 记录 + warn 徽标（200，PRD 决策 #5/红队 R3）；不得弹确认、不得标红为失败 |
| N8 | 重复登记写第二个副本 | 禁止：收编文件名（slug）冲突即拒绝（append-only；G4）；不得自动改名追加 `-2` 之类 |
| N9 | index 损坏时自动重建 | 禁止：RC6 仅指引先发布 / git 恢复；不提供重建/覆盖/编辑 index 的 UI |
| N10 | 回执编辑/删除入口 | 无：收编副本不可变（append-only 纪律）；列表行无任何操作按钮 |
| N11 | 列表运行时读 index 对账 | 禁止：列表读收编副本（G2：对账结果登记时落盘 `reconciliation`，零 index 运行时依赖）；index 损坏不影响列表渲染（RC6 下列表照常） |
| N12 | 成功后残留状态 | 再次 GET `/instance` 回 RC2/RC1 形态；无 flash/会话残留 |
| N13 | 回执明细/详情表面 | issues_found / adopted 明细、逐条展开、抽屉、详情页均不做——G1/PRD #7 钉死列表为 6 列计数面（明细在收编副本 YAML 中可查；是否扩表面属规格扩展，见 O2） |
| N14 | 列表分页/筛选/搜索控件 | 不做（规格未定义；`--package` 过滤是 CLI `receipt list` 的参数，UI 以「当前包」为固定过滤） |

## 6. Trace links（状态 ↔ 规格映射）

| 状态/决策 | PRD 用户故事 | PRD 决议 / GRILL | proposal / 契约 |
|---|---|---|---|
| RC0 无列表态（渲染条件） | US5 | #7（区块渲染条件逐字） | B1「查看」切片 |
| RC1 列表空态（尚无回执 + 登记方式） | US4、US5 | #7（列表部分） | B1 |
| RC2 列表有条目态（6 列 / 倒序 / 双徽标） | US4（哪些任务采用了哪个版本、对账是否一致） | #7(a)；G1（列与倒序）；G5（按当前包过滤） | B1「查看」；契约 §6.2（徽标语义源） |
| RC3 成功态（列表含新回执 + 表单清空，无结果卡） | US3、US5 | #7（成功输出面逐字） | B1 |
| RC3m 对账不一致仍成功（记录不拒绝） | US6 | #5（对账规则）；红队 R3；G2（对账落盘副本） | B1「对账：记录不拒绝」 |
| RC4 schema 违规（逐行 [receipt]，值保留） | US5 | #4（schema 逐字段）；#7（失败 422 保留值逐行报错）；#6（`[receipt]` 文法） | 契约 §6.2（字段源） |
| RC5 重复登记拒绝（含原 task_id 与已登记时间） | US3（登记通道的完整性） | G4（slug 冲突拒绝 + 文案要素）；append-only 纪律 | B1「同 task_id 重复登记拒绝」 |
| RC6 index 不可用拒绝（先发布 / git 恢复） | US4（对账可信的前提） | #5（缺失/损坏 → 登记拒绝）；#7（index 缺失/损坏各自明确文案） | B1 |
| P7 跨包登记（成功但列表不可见） | US3 | G5（登记不校验包一致 + 列表过滤 + 辅助文案） | — |
| 零 JS / 零写盘失败纪律 | US5 | #7（「零 JS、零写盘失败纪律与发布区块同款」） | — |
| 无回执详情/分页（N13/N14） | — | G1/#7（列集钉死） | proposal 显式不做清单同款推理 |

## 7. 工件声明（Visual artifact 清单）

产物格式：**静态 HTML，零 `<script>`、零外部依赖**（logo 走仓库内相对路径 `../../assets/juanerai-logo-slogan.png`）；CSS 集中为 `render.css`，**逐字取自 `src/ui/render.ts` 顶部 CSS 块（2026-10-12 当前版，绿色 tokens；与批次 1 存档版逐字节一致）**，零新增类——错误卡 / 内联错误 / 徽标均用既有类与语义 tokens（`--fail-*` / `chip-ok` / `chip-warn`，与 render.ts 行内样式惯例一致），不引入新视觉语言。一状态一文件（无演示切换器，零 JS 满足方式同批次 1）。每个状态文件为**完整实例页快照**：第 1–6 块逐字复用批次 1 原型演示页（发布区块以批次 1 冻结的 R1 默认态原样复现，仅注释标注「第 6 块」），第 7 块为本契约对应状态。

| 工件 | 路径 | 对应状态 |
|---|---|---|
| UI 契约 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui-contract.md` | 本文件 |
| 原型导航页 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/index.html` | 状态清单 + 原型约定 |
| 共享样式 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/render.css` | 全部状态（render.ts CSS 逐字摘取） |
| RC0 无列表态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-no-releases.html` | RC0 |
| RC1 列表空态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-empty.html` | RC1 |
| RC2 列表有条目态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-list.html` | RC2 |
| RC3 登记成功态（对账一致） | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-success.html` | RC3 |
| RC3m 登记成功态（对账不一致） | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-success-mismatch.html` | RC3m |
| RC4 回执未通过校验态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-invalid.html` | RC4 |
| RC5 重复登记拒绝态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-duplicate.html` | RC5 |
| RC6 index 不可用拒绝态 | `/Users/huangbo/Dev/Projects/metric-factory/.flow/ui/receipts-index-broken.html` | RC6 |

演示数据声明：虚构净销售实例（`examples/net-sales-instance.yaml` 情景演绎，package id = `net-sales-instance`）；`net-sales-instance@1.0.0` 的 `content_fingerprint` / `package_fingerprint` 取自仓库 `releases/index.yaml` **真实条目**（对账一致演示与 RC5/RC6 保留值的锚点）；task_id、received_at、issues 明细、RC4 错误 message 体、RC6 解析细节均为虚构示例值（zod/解析器输出随实现落定，契约只钉文法——同批次 1 B2 先例）。演示列表内自洽性：RC3/RC3m 的新行 `refund-attribute-check`（received_at `2026-10-12T09:05:33.117Z`）晚于 RC2 既有两行（倒序置顶成立）；RC5 保留值的 task_id 与 RC2/RC3 列表首行同 id（触发 slug 冲突）；RC6 保留值与 RC3 新行同回执（schema 合法，仅 index 不可读）。

## 8. 开放项（不扩范围，交用户/实现批次裁决）

| # | 事项 | 状态 |
|---|---|---|
| O1 | 侧栏 boundary 文案是否补充回执收编：现文案`写操作仅限本地实例、映射文件与 releases/ 发布登记`（批次 1 冻结）——`releases/receipts/` 在 `releases/` 内，目录级语义仍真；本批规格未裁决该文案 | 本契约不改；随实现批次或用户裁决 |
| O2 | US4「提出了什么问题」在冻结列集中以 issues 计数呈现，明细在收编副本 YAML 可查；是否需要 UI 明细查看面（展开/抽屉/详情页）属规格扩展 | 交用户裁决（N13 维持否定的前提下） |
| O3 | RC4 的 `«message»`（zod 输出）与 RC6 的 `«细节»`（解析器/读取错误）运行时格式 | 随实现落定，契约只钉文法（同批次 1 B2） |
| O4 | received_at 列显示格式：原型取 ISO-8601 原样（mono）；若需本地化/省略毫秒随实现裁决，非语义面 | 随实现落定 |
| O5 | 登记按钮防连点（双击双提交）：无 JS 约束可用；重复提交由收编文件名冲突拒绝兜底（RC5），不引入 token/禁用态 | 关闭（不变量即防线，同批次 1 B3） |

—— 契约正文完 ——
