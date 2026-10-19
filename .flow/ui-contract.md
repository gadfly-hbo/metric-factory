# UI 契约 · A2 UI 重构（评审原型严格复刻）

> 本契约是 A2 批次 UI-GATE 的逐面批准单元。规格优先级：`.flow/proposal.md` > `.flow/prd.md`（含 GRILL 决议 G1-G9/U1）> 本契约。本契约不发明任何规格外行为——每个条目均标注规格出处；demo 派生条目以 SHA-256 锚定的原型文件字面量为准（哈希见 `.flow/ui/manifest.md`）。
>
> **artifact 格式**：静态截图集（7 张评审 jpg 原件，位于 `.flow/ui/`）。
> **渲染工具**：评审截图原件（用户已批准的参照）+ Playwright 基线计划（实现首个切片从 demo 本体拍摄，D-甲骨文先行；oracle 是机器判据，人眼比对只是补充）。
> **数据保真声明**：所有截图与 demo 文案示例均为合成演示数据；真实实现的数据由引擎校验与 LLM 产生，数据值必然不同。对照只针对布局、组件、状态形态与文案框架，不比对数据值。
>
> **标注约定**：
> - 【复刻】demo 已有的视觉/交互/文案，逐字逐面照搬（含 DOM 结构、class 名、事件流）。
> - 【真实必要·新增】demo 因合成数据不存在的状态（加载/失败/超时/取消/job 进度/第 6 检查行/真实版本语义），视觉必须复用 demo 既有语汇（busy、toast、tag、check-row、inline-error、status-notice），不得发明新组件（PRD 复刻三规则第 3 条）。
> - 【换真话】合成声明类文案按 PRD 定稿替换（见 §4 B/C 表），其余文案一律逐字复刻（R2 文案纪律）。
> - 【U1 依赖】该路径依赖升级裁决 U1-a/U1-b（awaiting user），实现切片在裁决前不得触碰引擎。

规格源锚（2026-10-18，复检命令见 manifest）：
`index.html 83721720…` · `style.css a071e9c6…` · `app.js 681de45c…` · `analysis-model.js ea9a8706…` · `验证记录.md 6b9cdcb9…`

---

## 1. Surfaces（用户可见的每个屏/面板/弹层）

### S00 全局壳（所有视图共用）【复刻】(US14; G9)

| # | 元素 | 内容/行为 | 追溯 |
|---|---|---|---|
| S00.1 | skip-link | `.skip` href=`#main`「跳到工作区」，聚焦时 fixed 显示在左上 | US14 |
| S00.2 | 侧栏 sidebar | `aria-label="主导航"`，固定 230px；brand「Metric<span>Factory</span><p>分析体系工作台</p>」；按钮「＋ 创建分析体系」(data-action=home)；主导航两项：「▤ 我的体系」(附 `#system-count` 计数)、「▦ 模板库」(附 nav-meta「指标 · 方法」)；「最近编辑」区（`#recent`，空态「从一句业务需求开始。」，最多 5 项，每项标题+`已交付 · 版本号`/`工作草稿`）；底部 workspace-person（头像「我」·「个人工作空间/独立使用 · 设计资产」）+「? 方案与评审说明」(about) | US1、US13; G1 |
| S00.3 | 顶栏 topbar | 移动端「☰ 展开导航」按钮（≤1023px 显示）；breadcrumb `#breadcrumb` 按 route 变化：home=「工作空间 / 开始创建」、systems=「…/我的体系」、library=「…/模板库」、generating=「…/生成草稿」、work=「…/〈体系标题〉」；右侧边界标签 +「查看方案 ↗」按钮(about) | US14 |
| S00.4 | 边界标签 | demo「交互原型 · 合成示例」→【换真话】**「本地工作台 · 真实引擎」**（G9 定稿）；≤840px 隐藏行为照搬 demo | G9 |
| S00.5 | 弹层容器 | 原生 `<dialog id="modal" aria-labelledby="modal-title">` + `#modal-content`；结构 modal-head（标题+副题+「× 关闭对话框」）/modal-body（含 `#modal-error` role=alert）/modal-foot | US6、US14 |
| S00.6 | toast | `#toast` `role="status" aria-live="polite"`，4200ms 自动隐藏；窄屏 left:50% | US14 |
| S00.7 | 路由 | hash 路由 `#home / #systems / #library / #work/:id/:stage`（`:id`=URL 编码实例相对路径）【真实必要·新增，替换 demo 内存 route】；路由切换后 `#main` 聚焦 + 滚顶 | G1; US12 |

### S01 home 首页【复刻】(US1; R2)

- 眉题「从业务需求开始」；H1「你想弄清什么，或做出什么选择？」；导语「从一句业务需求开始。AI 帮你组织问题、假设、指标与证据，一起设计怎样形成可信的判断。」
- composer：label「描述你的业务与需求」+ `#need` textarea（placeholder「可以是一个经营问题、一项重大选择，或一套想建立的指标体系……」，初值=示例需求④）；`#home-error` inline-error（role=alert）；「生成体系草稿 ↗」主按钮。
- home-paths：「也可以从已有积累开始」「浏览模板库 →」「导入我的指标模板」。
- 「试试这样描述」：4 张 starter-row（`analysisExamples` 四例：把经营问题拆清楚/为重大选择建立依据/独立研究一个数据问题/建立可复用的指标体系——点击填充 `#need` 并聚焦）。**4 条示例需求保留为产品文案，内容照抄 demo**（R2）。
- home-bottom 绿字说明行。
- 截图基线：`00-自然语言起点.jpg`（1440×900）。

### S02 generating 生成中【复刻+真实必要·新增】(US2; G4)

- 结构复刻：`.busy-block`（aria-live=polite、aria-busy=true、spinner）、H1「正在整理一套可讨论的分析设计」、说明段、`detail-rule` 引用需求原文、停止按钮、滚顶行为。
- 【换真话】demo「合成交互演示」眉题与「原型根据预设案例展示交互…不会调用模型。」尾注 → 真实边界陈述（B/C 表）；「停止演示」→「停止生成」（G4 语义）。
- 【真实必要·新增】真实延迟：NL 提交 → 服务端 job → `GET /api/jobs/:id` 1.5s 轮询至完成；完成即自动落盘（目录 `system-YYYYMMDD-HHMMSS`）并进入 work/overview。生成中刷新 → 回 home 且需求文本保留（G4）。

### S03 systems 我的体系【复刻】(US13; G1)

- 页头「我的分析体系」+「＋ 创建分析体系」；列表行：▤ 图标、标题、「N 个指标 · M 个分析场景 · 来源」、tag（`已交付 x.y.z`/`工作草稿`中性 tag）、「继续编辑 →」。
- 空态：「还没有分析体系」+「描述需求」「从模板开始」按钮。
- 【换真话】demo 页尾「此原型仅保留当前页面内的演示内容，刷新后重置。」→ 真实实例发现说明（工作区真实发现实例文件，US13）。
- 【真实必要·新增】列表加载态（busy 语汇）；实例发现失败态（inline-error/toast 语汇）。

### S04 library 模板库【复刻】(US10; G5、G6)

- 页头「模板库」+「＋ 导入模板」；两 tab（`aria-label="模板类别"`）：「指标体系」「分析方法」，`aria-current=page`。
- 工具栏：搜索框（placeholder 按类型切换「搜索指标体系或业务场景」/「搜索分析问题或方法」；⌕ 图标 sr-only label「搜索模板」）；来源过滤 chips（aria-pressed）：「全部模板」「我的模板」；计数「N 个模板」。
- 指标卡：▤ 图标、名称、描述、「N 个指标 · 含 M 个场景」meta、「草稿模板」warn tag（incomplete）、「预览与使用 →」。
- 方法卡：≋ 图标、名称、描述、语境 tags、家族行「〈family〉 · 方法可服务多个语境」、角色计数 meta、「预览与使用 →」。
- 空态两分支：「还没有自己的模板」（filter=mine）/「没有匹配的模板」+「导入模板」按钮。
- 底注两分支（指标/方法各一段）+【换真话】demo「原型中的内置内容为合成示例；生产方案继续保留现有行业模板。」→ 真实模板来源说明。
- 「我的模板」= `templates/user/` 目录（G6）；demo 独有三方法（净销售额变化拆解/客户复购表现复盘/经营周报分析）补写为 `templates/methods/*.yaml`，卡片密度对齐 oracle 04。
- 【真实必要·新增】模板列表加载/失败态。
- 截图基线：`04-方法库多语境.jpg`（1440×900）。

### S05 work 壳（体系工作视图）【复刻】(US3)

- work-header：`体系标题` + 状态 tag（`有新工作草稿`/`已交付版本`/`工作草稿`，中性）；meta 行「N 个指标 · M 个分析场景 · 〈上次交付 x.y.z · 当前可继续编辑 | 来源〉」；动作「修改名称」「保存工作草稿」。
- 「有新工作草稿」标签判据【真实必要·新增】：当前 design_fingerprint ≠ releases/index.yaml 同包最新 content_fingerprint（G3）。
- work-tabs（`aria-label="体系工作视图"`）四 stage，带步骤号 01-04，`aria-current=page`：**overview 体系总览 / metrics 指标体系 / scenes 场景与方法 / review 检查与交付**。视图内切换，非页面跳转（US3）。
- work-content 双栏：work-main（aria-label 按 stage：「分析体系总览」/「指标体系内容」/「分析场景内容」/「设计检查与交付」）+ 右侧助手栏（S10）。
- 「修改名称」只改 blueprint.title（G1，与 demo rename 同构）。

### S06 work · overview 体系总览【复刻】(US2、US3)

- understanding 卡：「我理解的业务需求」眉题 +「修正我的理解」按钮 + decision H2 + purpose + 语境 tags + intent 中性 tag + fine 注。
- scope-note「这份设计的边界」。
- 「把问题拆成可以研究的部分」：编号问题列表，每题 metricRefs 绑定 chips（点击开指标详情）或「结合研究与业务证据…」占位。
- 「需要检验的关键假设」+「查看判断边界」：H 卡（H1/H2 编号、kind warn tag、支持/反证两栏、「何时改变判断」、「完善检验条件」「查看证据能否支持判断」按钮）。
- 「要比较的候选道路」（options 非空时）。
- 「怎样展开调查」+「调整调查方式」：调查方式中性 tags + capability-strip。
- 「需要怎样的证据」：证据卡（名称+状态 tag、kind、来源/怎样核对/不足时 dl、「编辑证据要求」），缺失项显示 `.missing`「尚未说明来源」等。
- 「最终需要形成什么」：deliverable + judgmentRule 注。
- section-end：「N 个指标与问题通过引用联动。」/「当前允许先完成定性设计…」+「查看关联指标 →」/「查看场景与方法 →」。
- 截图基线：`01-经营分析总览.jpg`、`05-战略总览窄屏.jpg`（390×844）。

### S07 work · metrics 指标体系【复刻】(US2、US4)

- 零指标空态（战略）：「先明确判断依据，指标可以随后补充」+「补充量化衡量建议」「回到分析框架」。
- objective 条「这套体系要帮助你」+ goal。
- status-notice 两分支：`有 N 个关键口径待确认`+「查看并确认」/`关键业务口径已确认`（good）+「查看口径」。
- summary-line：「核心指标结构」+ 视图切换（`aria-label="指标展示方式"`，aria-pressed）：「结构」/「清单」+「＋ 添加指标」。
- 结构（tree）：tree-root（「业务用途/研究用途」+ decision + 「点击指标可看解释」tag）+ 分组 metric-groups/group-head「〈组〉N 项」+ metric-card（名称、pending-dot「口径待确认」、formula）。
- 清单（list）：table-scroll（role=region tabindex=0 aria-label="指标清单"）三列表（指标/业务解释/计算关系）。
- section-end：「指标定义只维护一份，场景通过引用使用。」+「继续设计分析场景 →」。
- 口径确认缺口判据【真实必要·新增】：DTO 派生（caliber_switches 开关键缺席或 definition=哨兵文本「（待补充统计说明）」；G2）。
- 截图基线：`03-独立数据专题.jpg`（含客户/复购指标组）。

### S08 work · scenes 场景与方法【复刻】(US3、US10; G8)

- 零场景空态：「这次要怎样研究这个问题？」+ scene-composer（「分析场景需求」textarea 预填 decision +「生成分析场景 ↗」）+「可参考的方法模板」3 条 hint（预览按钮）。
- scene-switch：场景 pills（aria-pressed）+「＋ 新增场景」。
- scene-heading：场景名 + purpose +「存为方法模板」。
- summary-line：「场景草稿」tag + 语境 tags +「〈family〉 · 设计方法」。
- 「准备怎么分析」+「修改分析步骤」：编号步骤列表。
- 「指标怎样参与」+「调整绑定」：binding-row（角色名 + 指标 chip 或「尚未绑定」warn tag）；零绑定时输出「此方法可以先比较定性证据与关键假设…」；「缺少指标？用一句话添加/补充量化衡量建议」。
- 「方法适用性与判断边界」：limit + evidence 注。
- 证据计划（同 S06）+ section-end「设计引用、实际证据和运行采用分别表达。」+「检查并准备交付 →」。
- 【真实必要·新增】步骤/家族/限制读自方法模板（引用不复制）；用户改步骤 → 提示「另存为新方法」走既有 save-as-method，method_refs 指向新方法（G8）；「新增/生成分析场景」= 方法模板选用流；角色显示方法模板中文名（G8）。

### S09 work · review 检查与交付【复刻+真实必要·新增】(US8、US9; G3、G7、U1)

- published 块（已交付时）：✓ 图标 +「设计版本已生成」【换真话】+ 说明 + dl（设计版本/交付范围 N 指标·M 场景·K 项证据要求/实际证据「待获取，未执行分析或消费验证」）+ 主按钮「保存指标体系模板」或「保存分析方法模板」+「下载设计包」【换真话，G3 定稿：`releases/<pkg>/<ver>.sap.yaml` 直链】。
- 【真实必要·新增】published 块「更多格式」行：metricflow/excel/mermaid 导出收进此行（复用 demo 语汇，不新增顶层导航；R2）。
- check-intro：「设计检查」眉题 + H2 两分支（就绪/未就绪）+ 说明。
- checks 检查行 ×5（check-row：✓/! 图标 aria-label「已检查/待处理」+ 标题 + 明细 + 小按钮）：
  1. 问题、假设与证据计划（→「查看框架」跳 overview）
  2. 指标定义与计算关系（→「查看指标」）
  3. 需要你确认的业务口径（→「去确认/查看」resolve）
  4. 方法、指标角色与适用条件（→「查看方法」）
  5. 当前设计的业务复核（→「查看并确认/已确认」confirm-business）
- **检查行 ×6【真实必要·新增，G7 定稿文案】**：「待人工审核的 AI 指标（N 项）」，行内逐项批准/拒绝（走既有 applyApproval/applyRejection，reviewer=MF_REVIEWER/$USER），视觉复用 check-row 语汇。
- metric-only checkbox（仅零场景有指标时）：「本次先交付指标体系，分析场景以后补充」。
- evidence-boundary：「设计通过，不提升任何业务结论」+ 语境分支句。
- delivery-box：H3 两分支 + 说明 +「生成设计版本/生成下一版本」主按钮【换真话】（未就绪 disabled + aria-describedby=`delivery-reason`，reason 文案复刻）+「保存工作草稿」。
- 【真实必要·新增】交付语义（G3）：自动建议 next patch + 按钮一键确认（**无任何手填版本号输入框**）；真实 releases/ 登记；same-content 拒绝由引擎结构化错误透出为 demo 形态 toast「当前草稿与已交付版本相同，无需重复生成。」（复刻语义）。
- 【U1 依赖】「保存指标体系模板」按钮落点 = U1-a（宽松 UserTemplateSchema 或降级披露）；检查行 3 的确认写路径 = U1-b（ModifiedMetricSchema 加字段或 UI 层删重加）。
- 截图基线：`02-战略设计交付.jpg`（1440×900）、`06-窄屏检查.jpg`（390×844）。

### S10 助手栏（右侧）【复刻+真实必要·新增】(US5; LA1)

- aside `aria-label="AI 共创助手"`：「✧ 一起完善」+ meta「AI 助手」+ 按 stage 变化的 label/intro/建议 chips（3D 结构见 app.js `renderAssistant`）。
- chat 气泡：用户/助手消息（显示最近 2 条）；proposal delta 块「修改建议 · 〈标题〉」+ before/after 行 + impact +「采纳修改」「放弃」。
- compose：label「用自然语言说说你想怎么改」+ `#refine` textarea +「先看建议，再采纳到同一设计」+「发送 ↑」。
- 【换真话】尾注 demo「v0.2 交互演示使用预设内容，不调用模型。」→ 按 LLM mode 动态（G9：faux=确定性演示 / 已配置=模型生成，复用 demo tag 语汇）。
- 【真实必要·新增】真实提案流（LA1：A1 助手草案流 preview/apply/discard）；LLM 延迟加载态与失败重试（busy/toast 语汇）；chat 为会话内存态不落盘（刷新清空=严格复刻，LA1）；敌意输入经 esc() 全转义渲染（红队 #7）。

### S11 弹层组（全部 `<dialog>` 内实现，M01-M20）【复刻】(US6、US14)

| # | 弹层（标题） | 关键内容 | 动作脚 | 追溯 |
|---|---|---|---|---|
| M01 | 修正我对需求的理解 | purpose/decision textarea（required）、语境 checkbox 三项（经营改善/战略选择/独立数据专题）、boundary、deliverable | 取消 / 更新分析框架 | US2 |
| M02 | 完善假设的检验条件 | 待验证判断（required）/支持/反对/改变判断 4 textarea | 取消 / 保存检验条件 | US2 |
| M03 | 编辑证据要求 | 来源/核验/不足处置 3 textarea，副题带「当前状态：待获取」 | 取消 / 保存证据要求 | US8 |
| M04 | 区分事实、解释、假设与建议 | 4 词 dl 释义 + warn rule | 理解了 | US2 |
| M05 | 暂不能确认这个判断 | 证据清单 + warn rule | 返回完善证据计划 | US8 |
| M06 | 调整调查怎样展开 | 调查方式 checkbox（假设先行/深度研究/自主探索） | 取消 / 保存调查方式 | US2 |
| M07 | 指标详情（标题=指标名） | detail-grid（分组/衡量什么/怎么算/单位/观察范围）、note rule、pending warn rule+「去确认」、名称+说明编辑（引用场景清单）、details「来源与专业详情」【换真话】 | 移除指标 / 取消 / 保存修改 | US4 |
| M08 | 这个指标仍被使用 | 引用清单 item-list（指标：/场景：/问题：前缀） | 保留并返回 | US4（六路引用保护） |
| M09 | 移除这个指标？ | 「它会从当前工作草稿移除。已交付旧版本仍然保留。」 | 取消 / 从草稿移除 | US4 |
| M10 | 确认关键业务口径 | 退款归属 select（按订单支付期间/按退款完成期间归属）、复购窗口 select（90/30/180 天）、缺说明指标 textarea 补充 | 稍后再说 / 确认这些口径 | US8; G2【U1-b】 |
| M11 | 场景与指标绑定 | 角色 label + select（尚未绑定/各指标）+「＋ 缺少指标，新增并绑定」 | 取消 / 保存绑定 | US3 |
| M12 | 用一句话添加指标 | 需求 textarea（required）+ 候选 rule 块【真实必要·新增：LLM 生成候选替代预设】 | 取消 / 加入指标体系（或 加入体系并绑定） | US2、US5 |
| M13 | 新增分析场景 | 场景需求 textarea（预填 decision） | 取消 / 生成场景草稿 | US3; G8 |
| M14 | 修改分析场景 | 名称/问题/步骤（每行一个） | 取消 / 保存场景 | US3; G8 |
| M15 | 模板预览（标题=模板名） | 指标类：包含的指标 item-list+note；方法类：detail-grid（适合回答/适用语境/专业方法/分析步骤→/指标角色/证据要求/适用限制）+ 当前体系匹配 rule（无体系时 warn「先创建或打开一套分析体系…」） | 返回 / 基于模板创建体系 或 用于当前分析体系（无体系 disabled） | US10; G6 |
| M16 | 保存为模板（指标/方法两形态） | 模板名称/适用业务 +「包含已设计的分析场景与方法引用」checkbox（有场景时） | 取消 / 保存到我的模板 | US10; G6【U1-a】 |
| M17 | 导入自己的指标模板 | dropzone（file input accept=`.csv,.json` sr-only label）+「暂时没有文件？使用一份演示指标表」+ `#import-preview`（文件名、「已识别 N 个指标」、缺口 status-notice、两列表预览、保存名称 input）；确认按钮初始 disabled | 取消 / 确认导入模板 | US10; G5 |
| M18 | 修改体系名称 | 体系名称 input | 取消 / 保存名称 | G1 |
| M19 | 复核这套业务设计 | detail-grid（目的/判断/语境/内容计数/证据计划）+ note | 回去修改 / 确认当前业务设计 | US8 |
| M20 | 方案与评审说明（about） | 【换真话】内容换真实说明（边界+文档指引），形态保留 | 开始体验 | G9、R2 |

### S12 状态反馈组件【复刻语汇】

- toast（S00.6）；inline-error（home/modal，role=alert，aria-invalid 联动）；status-notice（good/warn）；check-row 图标语汇；pending-dot；`.missing` 缺口占位；tag（warn/neutral）。全部真实失败/加载状态必须复用此组件集，不得新增组件类型。

---

## 2. Click paths（入口 → 动作 → 结果状态）

标注图例：【复刻】demo 已有｜【新增】真实必要·新增｜【换真话】文案替换｜路径格式：主成功 / 次要 / 显式失败。

### 2.1 全局导航

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| N1 | 侧栏「＋ 创建分析体系」/systems 空态「描述需求」 | home | 主：home 视图【复刻】；次要：hash=`#home`【新增 G1】 | US1 |
| N2 | 侧栏「我的体系」 | systems | 主：体系列表【复刻】；次要：空态【复刻】；加载/发现失败【新增】 | US13 |
| N3 | 侧栏「模板库」/home「浏览模板库」 | library | 主：模板网格【复刻】；tab/过滤/搜索即时刷新（input 事件重绘网格+计数）【复刻】；空态两分支【复刻】；加载/失败【新增】 | US10 |
| N4 | 最近编辑项/体系行「继续编辑」 | open-system | 主：work/overview【复刻】；hash=`#work/:id/overview`【新增 G1】；实例不存在（文件被删）→ toast 错误【新增】 | US13 |
| N5 | 顶栏 ☰ | menu/close-menu | 主：侧栏 overlay+backdrop（aria-label「关闭导航」）【复刻 ≤1023px】；Esc 关闭【复刻】 | US7 |
| N6 | 顶栏「查看方案 ↗」/侧栏「方案与评审说明」 | about | 主：M20 弹层【复刻形态，换真话】 | G9 |
| N7 | work-tabs 四 tab | stage | 主：视图内切换 stage（不整页跳转、滚顶）【复刻】 | US3 |

### 2.2 home → 生成

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| H1 | 示例卡 starter-row | example | 主：填充 `#need` 并聚焦【复刻】 | US1; R2 |
| H2 | 「生成体系草稿 ↗」/ Ctrl(⌘)+Enter | generate | 主：空文本→`#home-error`「先写一点业务需求，几个字也可以。」聚焦 textarea【复刻】；非空→S02 generating【复刻】+真实 job 创建与 1.5s 轮询【新增 G4】；完成→自动落盘 `system-YYYYMMDD-HHMMSS`→work/overview【新增 G1】；job 失败→错误+重试（toast/inline-error 语汇）【新增】 | US2 |
| H3 | generating「停止生成」 | stop-generation | 主：回 home、需求保留、toast【换真话】（demo「演示生成已停止，原需求仍保留。」去演示字样）；真实语义=客户端离开轮询+标记弃置（服务端跑完落盘不丢）【新增 G4】 | US2 |
| H4 | 生成中刷新 | — | 主：回 home 且需求文本保留【新增 G4】 | US12 |
| H5 | 「导入我的指标模板」 | import | 主：M17【复刻】 | US10 |

### 2.3 work · overview

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| O1 | 「修正我的理解」 | edit-understanding → save-understanding | 主：M01→保存后重绘、复核失效【复刻】；失败：必填空/零语境→modalError「请说明目的、要支持的判断，并至少保留一个适用语境。」+aria-invalid【复刻】；写路径校验失败→modalError 引擎结构化错误【新增】 | US2 |
| O2 | 「完善检验条件」 | edit-hypothesis → save-hypothesis | 主：M02 保存【复刻】；失败：判断空→「请写下要检验的判断。」【复刻】；引擎错误【新增】 | US2 |
| O3 | 「编辑证据要求」 | edit-evidence → save-evidence | 主：M03 保存（状态回「待获取」）【复刻】；缺口保留→检查行 1 显红（验证记录「证据缺口」）【复刻】 | US8 |
| O4 | 「查看判断边界」 | claim-boundaries | 主：M04 只读【复刻】 | US2 |
| O5 | 「查看证据能否支持判断」 | verify-claim | 主：M05 只读（不升级假设状态）【复刻】 | US8 |
| O6 | 「调整调查方式」 | edit-organization → save-organization | 主：M06 保存【复刻】；失败：零选→「请至少保留一种调查方式。」【复刻】 | US2 |
| O7 | 指标绑定 chip | metric | 主：M07 指标详情【复刻】 | US2 |
| O8 | section-end CTA | stage | 跳 metrics/scenes【复刻】 | US3 |

### 2.4 work · metrics

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| M-1 | 结构/清单切换 | metric-view | 即时切换 tree/list【复刻】 | US2 |
| M-2 | metric-card/清单指标链接 | metric | M07【复刻】 | US2 |
| M-3 | M07「保存修改」 | save-metric | 主：toast「指标已修改，相关业务复核需要重新确认。」【复刻】；失败：名称/说明空→「名称和业务解释需要填写完整；你的输入已保留。」；同名→「已有同名指标，请先区分业务含义。」【复刻】；引擎校验失败【新增 modalError】 | US4 |
| M-4 | M07「移除指标」 | delete-metric | 被引用（六路：依赖指标/场景绑定/问题引用）→M08 就地依赖保护（列引用者、不删除）【复刻】；无引用→M09 二次确认→commit-delete→toast「已从工作草稿移除。」【复刻】；引擎 writeMode 引用完整性拒绝→M08 形态透出【新增】 | US4 |
| M-5 | status-notice「查看并确认/查看口径」 | resolve → save-resolve | 主：M10 集中确认→toast「关键口径已记录，业务复核仍需查看当前草稿。」【复刻】；真实写路径=改写 caliber_switches 键值/definition【新增 G2】【U1-b】 | US8 |
| M-6 | 「＋ 添加指标」 | add-metric → create-metric | 主：M12（LLM 候选【新增】）→toast「指标已加入当前体系。」/绑定版「指标已加入体系并关联到当前场景。」【复刻】；失败：需求空→「先描述希望增加的指标。」；依赖缺失→「此候选缺少依赖指标，请先补齐定义。」【复刻语汇，依赖集来自真实引擎】 | US2、US5 |
| M-7 | 「保存工作草稿」 | save-draft | 主：toast【换真话】（demo「工作草稿已保留在当前演示中，刷新后会重置。」→真实落盘语义「工作草稿已保存。」）；失败：落盘失败 toast【新增】 | US12 |
| M-8 | 「修改名称」 | rename → save-name | 主：M18→名称生效（只改 blueprint.title）【复刻+G1】；失败：空→「请填写体系名称。」【复刻】 | G1 |

### 2.5 work · scenes

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| C1 | 空态「生成分析场景 ↗」 | generate-scene | 主：按方法模板选用流建场景、toast「分析场景草稿已生成，可以调整步骤与指标绑定。」【复刻，数据真实化 G8】；失败：需求空→toast「先描述这个场景要回答的问题。」【复刻】 | US3; G8 |
| C2 | 空态方法 hint「预览」 | preview-template | M15 方法形态【复刻】 | US10 |
| C3 | 场景 pill | select-scene | 切换当前场景【复刻】 | US3 |
| C4 | 「＋ 新增场景」 | new-scene → generate-scene | M13→场景草稿【复刻+G8】 | US3 |
| C5 | 「修改分析步骤」 | edit-scene → save-scene | 主：M14 保存【复刻】；用户改动与模板步骤不一致→提示「另存为新方法」走 save-as-method、method_refs 指向新方法【新增 G8】；失败：字段空→「请填写场景名称、业务问题和至少一个分析步骤。」【复刻】 | US3、US10 |
| C6 | 「调整绑定」 | bindings → save-bindings | 主：M11 保存，toast 两分支（有未绑定「场景草稿已保存，未绑定项会在检查时提示。」/全绑定「场景绑定已保存，引用当前体系的指标定义。」）【复刻】 | US3 |
| C7 | 「存为方法模板」 | save-method-template → commit-template | 主：M16（方法形态）→落 `templates/user/`→跳 library/mine+toast「已加入我的模板，原有同名内容不会覆盖。」【复刻+G6】；失败：名称/适用问题空→「请填写模板名称和适用问题。」【复刻】 | US10 |
| C8 | 「检查并准备交付 →」 | stage | 跳 review【复刻】 | US8 |

### 2.6 work · review

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| R-1 | 检查行 1/2/4「查看…」 | stage | 跳对应 stage【复刻】 | US8 |
| R-2 | 检查行 3「去确认/查看」 | resolve | M10【复刻】 | US8 |
| R-3 | 检查行 6【新增】 | 行内批准/拒绝 | applyApproval/applyRejection（reviewer=MF_REVIEWER/$USER），check-row 语汇【新增 G7】 | US8、US11 |
| R-4 | 检查行 5「查看并确认」 | confirm-business → commit-confirm | 主：M19→confirmed、toast「当前业务设计已复核。」【复刻】；已确认再点→toast「当前草稿已复核；相关修改后会重新提示确认。」【复刻】 | US8 |
| R-5 | metric-only checkbox | change | 勾选→仅指标交付路径、复核失效【复刻】 | US9 |
| R-6 | 「生成设计版本/生成下一版本」 | deliver | 未就绪→按钮 disabled+delivery-reason【复刻】；就绪→自动建议 next patch+一键确认【新增 G3】→published 块+toast【换真话】（demo「演示设计版本已固定，实际证据仍待获取。」→真实发布语义）；same-content→引擎结构化错误透出 toast「当前草稿与已交付版本相同，无需重复生成。」【复刻语义 G3】；发布失败→错误呈现【新增】 | US9 |
| R-7 | published「下载设计包」 | download | 主：`releases/<pkg>/<ver>.sap.yaml` a[href] 直链下载（不经 SPA）【新增 G3，按钮文案 G3 定稿】；demo 合成 JSON 下载（prototype:true）不保留【换真话】 | US9 |
| R-8 | published「更多格式」行【新增】 | 导出 | metricflow/excel/mermaid 直链【新增 R2】 | US9 |
| R-9 | published「保存指标体系模板」 | save-metric-template → commit-template | 未交付先点→toast「先完成设计检查并生成交付版本。」【复刻】；已交付→M16（指标形态，含场景 checkbox）→`templates/user/`【复刻+G6】【U1-a：blank-base 撞 min(1) 门槛，两选项待裁决】 | US10 |
| R-10 | 修改任何设计内容 | markDesignChanged 语义 | 复核失效、`有新工作草稿`标签、检查行回红【复刻；标签判据真实化 G3】 | US8、US9 |

### 2.7 library 与导入

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| L1 | tab「指标体系/分析方法」 | library-tab | 切换+重置搜索过滤【复刻】 | US10 |
| L2 | 过滤 chips | library-filter | 全部/我的模板【复刻；我的=templates/user/ G6】 | US10 |
| L3 | 搜索框 | input | 即时过滤+计数【复刻】 | US10 |
| L4 | 卡片「预览与使用 →」 | preview-template | M15【复刻】 | US10 |
| L5 | M15「基于模板创建体系」 | use-template(metric) | 主：fork 副本（带 base，AT1 同构）→work/metrics+toast「已创建自己的体系副本，原模板保持不变。」【复刻+G6】 | US10 |
| L6 | M15「用于当前分析体系」 | use-template(method) | 主：语境匹配→建场景→work/scenes+toast「方法已形成当前体系中的场景，请查看匹配与绑定。」【复刻】；失败：语境不符→modalError「此方法的适用语境与当前体系不符。请先回体系总览核对用途，或选择其他方法；没有自动修改体系。」【复刻】；无体系→按钮 disabled【复刻】 | US10 |
| L7 | 「＋ 导入模板」 | import | M17【复刻】 | US10 |
| L8 | 选择文件 | change | 主：浏览器解析 CSV/JSON（解析器+行级错误文案+1MB 限制+accept 白名单逐字照搬【复刻 G5】）→预览（文件名/N 个指标/缺口 notice/两列表/保存名）；失败：>1MB→「仅支持预览 1MB 以内的 CSV／JSON…」【换真话去演示字样】、引号未闭合/无指标行/缺名称列/重名→demo 行级文案【复刻 G5】 | US10 |
| L9 | 「使用一份演示指标表」 | demo-import | 演示 CSV 预览【复刻保留（faux 演示模式入口）】 | US10 |
| L10 | 「确认导入模板」 | commit-import | 主：POST 归一化指标行【新增 G5】→`templates/user/` 草稿模板（incomplete 缺口如实）→library/mine+toast「已导入为个人草稿模板，缺失口径没有被自动补造。」【复刻】；失败：名称空→「请给模板起一个名称。」【复刻】；A1 粘贴 YAML 导入路由不保留（随表单路由退役 G5/G9） | US10 |

### 2.8 助手栏

| # | 入口 | 动作 | 结果状态 | 追溯 |
|---|---|---|---|---|
| A1 | 建议 chip | suggest | 生成提案（faux=确定性；真实=LLM）【新增 LA1，faux 分支保留 demo 行为】 | US5 |
| A2 | 「发送 ↑」/ Ctrl(⌘)+Enter | refine | 空文本→toast「先说说希望怎样修改。」【复刻】；主：用户气泡+提案 delta（preview 流）【复刻形态+真实 LLM】；LLM 延迟→busy【新增】；失败→重试【新增】 | US5、US11 |
| A3 | 「采纳修改」 | apply-proposal | 主：修改入草稿、复核失效、chat 记录、toast「修改建议已采纳到工作草稿。」【复刻】；引擎拒绝→就地错误【新增】 | US5 |
| A4 | 「放弃」 | discard-proposal | 主：提案消失、chat「已放弃这项修改建议，工作草稿没有变化。」【复刻】；AT3 放弃=零改动【复刻语义】 | US5 |

---

## 3. Affordances（输入/控件/键盘/无障碍——逐项照搬）【复刻】(US14)

1. **skip-link**：`.skip` → `#main`「跳到工作区」；`:focus` 时 fixed 左上显示；`#main` `tabindex="-1"`，路由/stage 切换后 `focus({preventScroll:true})`。
2. **原生 dialog 语义**：`showModal()` 焦点陷阱；`cancel` 事件 preventDefault→closeModal（Esc 路径）；backdrop 点击关闭（click target==dialog 且指针在矩形外）。
3. **焦点回归**（US6，验证记录已验证）：打开弹层记录 `document.activeElement`；关闭（×/取消/Esc/backdrop/保存后 closeModal）→ 回归该元素；元素已失联→回 `#main`。
4. **键盘**：Tab 序=DOM 序；Esc 全局关菜单；Ctrl/Cmd+Enter 在 `#need`→generate、`#refine`→refine。
5. **focus-visible**：3px outline、3px offset，覆盖 button/a/input/textarea/select/summary/[tabindex]。
6. **toast**：`role=status` `aria-live=polite`；4200ms 自动隐藏。
7. **错误关联**：`#home-error`/`#modal-error` `role=alert`；modalError 时空必填 `aria-invalid=true`+`aria-describedby`，fieldset 一并关联。
8. **aria-label 清单**（照搬）：sidebar「主导航」、`#recent`「最近编辑的体系」、work-tabs「体系工作视图」、library-tabs「模板类别」、filter-chips「模板来源」、view-switch「指标展示方式」、两个 table-scroll「指标清单」/「导入指标预览」（role=region tabindex=0）、assistant「AI 共创助手」、mobile-menu「展开导航」、backdrop「关闭导航」、modal 关闭钮「关闭对话框」、check-icon「已检查/待处理」、pending-dot「口径待确认」。
9. **状态语义**：stage/library tab `aria-current="page"`；scene-pill/过滤 chips/视图切换 `aria-pressed`；generating `aria-live=polite`+`aria-busy=true`；disabled 交付按钮 `aria-describedby="delivery-reason"`。
10. **sr-only 标签**：退款归属/复购窗口 select、缺说明指标 textarea、导入 file input、搜索框 ⌕。
11. **表单关联**：全部 input/textarea/select 有 for/id label（`need/refine/scene-need/scene-new-need/analysis-*/hypothesis-*/evidence-*/metric-*/binding-*/template-*/import-*/system-name/scene-*`）；checkbox 组用 fieldset/legend（语境、调查方式）。
12. **motion/触控**：`prefers-reduced-motion` 全动画禁用；`touch-action:manipulation`；disabled 按钮 opacity .55+not-allowed。
13. **details/summary**：M07「来源与专业详情」可折叠。
14. **响应断点**（style.css 原样）：1600（加宽）/1250（双列指标）/1023（**侧栏隐藏+☰ 显示**+backdrop overlay）/840（助手栏下移单栏、**顶栏边界标签隐藏**）/650/600（390 适配）。**390px 文档宽 390、无整页横溢**（US7 行为断言）；1440×900 文档宽 1440（验证记录）。
15. **XSS 防线**：esc() 全量转义复刻；敌意 fixture（`<img onerror>`/引号注入）必须经渲染测试（PRD Testing）。

---

## 4. Terminology（用户可见中文串）

### 4.A 逐字复刻（钉死；本表未列出的串一律以 SHA 锚定的 demo 文件字面量为准）

- 视图标题/导航：S01-S09 全部标题、眉题、tab 名（体系总览/指标体系/场景与方法/检查与交付）、breadcrumb 集、按钮标签（含「↗」「→」「＋」装饰符与 aria-hidden 标注）。
- 空态/占位：「从一句业务需求开始。」「还没有分析体系」「还没有自己的模板」「没有匹配的模板」「尚未绑定」「尚未说明来源/尚未定义核验办法/尚未定义不足处置」「统计说明待补充」「待补充口径」。
- 检查行 5 行标题与就绪/未就绪明细模板（app.js renderReview 字面量）；delivery-reason「先处理上方设计缺口、必要绑定与口径，再完成业务复核。」
- 校验错误文案全集（§2 各「失败」分支所引 demo 串，逐字）。
- 弹层标题/副题/字段 label/动作脚（M01-M20，app.js showModal 字面量）。
- toast 复刻集：「指标已修改，相关业务复核需要重新确认。」「已从工作草稿移除。」「关键口径已记录，业务复核仍需查看当前草稿。」「修改建议已采纳到工作草稿。」「指标已加入当前体系。」／「指标已加入体系并关联到当前场景。」「分析场景草稿已生成，可以调整步骤与指标绑定。」「场景草稿已保存，未绑定项会在检查时提示。」／「场景绑定已保存，引用当前体系的指标定义。」「已创建自己的体系副本，原模板保持不变。」「方法已形成当前体系中的场景，请查看匹配与绑定。」「先完成设计检查并生成交付版本。」「已加入我的模板，原有同名内容不会覆盖。」「已导入为个人草稿模板，缺失口径没有被自动补造。」「当前草稿已复核；相关修改后会重新提示确认。」「当前业务设计已复核。」「还有待处理内容，请先完成设计检查。」「当前草稿与已交付版本相同，无需重复生成。」「先写一点业务需求，几个字也可以。」「先说说希望怎样修改。」「先描述这个场景要回答的问题。」
- 助手栏结构文案：四 stage 的 label/intro/建议 chips（app.js renderAssistant 字面量；faux 模式逐字保留）。
- 4 条示例需求与 starter 卡名称/提示（R2：保留为产品文案）。

### 4.B 换真话三处（G9 定稿）

| # | 位置 | demo 原文 | 定稿/规则 | 依据 |
|---|---|---|---|---|
| B1 | 顶栏边界标签 | 「交互原型 · 合成示例」 | **「本地工作台 · 真实引擎」**（≤840px 隐藏行为不变） | G9 |
| B2 | 助手栏尾注 | 「v0.2 交互演示使用预设内容，不调用模型。」 | 按 LLM mode 动态：faux=确定性演示声明 / 已配置=模型生成声明；复用 demo tag/fine 语汇 | G9 |
| B3 | about 弹层（M20） | 方案 v0.2 说明+「阅读完整产品方案与验收范围 ↗」链接 | 形态保留（标题+副题+四步 flow+链接+note+「开始体验」），内容换真实说明：真实边界（引擎校验/LLM 配置/落盘目录）+ 本仓文档指引（替换 方案.html 外链） | G9、R2 |

### 4.C 合成声明字样替换表（完备枚举；规则依据 proposal §4「合成实现换真实」+ PRD 复刻规则 2 + R2 文案纪律——凡向用户声明「本物为演示/合成/不调用模型/刷新重置」的串，真实实现中为虚假陈述，不得保留）

| # | demo 原文（app.js 行号） | 替换目标语义 |
|---|---|---|
| C1 | home composer 注「…示例生成与后续检查均为合成演示。」(78) | 保留前半「先用自己的话说，不必先选择分析类别。」；后半换 B2 同款模式声明 |
| C2 | generating 眉题「合成交互演示」(89) | 真实生成声明（如「正在生成」语境，复用 eyebrow 语汇） |
| C3 | generating 注「原型根据预设案例展示交互；未知内容不视为已确认事实，不会调用模型。」(89) | 真实边界：「未知内容不视为已确认事实」保留；「不会调用模型」按 B2 模式动态 |
| C4 | 「停止演示」按钮 (89) | 「停止生成」（G4 称谓） |
| C5 | systems 尾注「此原型仅保留当前页面内的演示内容，刷新后重置。」(91) | 工作区实例发现说明（真实文件、自动列出） |
| C6 | published H2「演示设计版本已生成」(144) | 「设计版本已生成」 |
| C7 | 「下载演示设计包」按钮 (144) | **「下载设计包」**（G3 定稿） |
| C8 | 检查行 2 明细「N 个合成指标，预设依赖闭合…」(146) | 「N 个指标，依赖闭合；真实口径与数据资格另行核验。」（依赖检查来自引擎） |
| C9 | delivery-box 说明「…演示快照。真实运行能力…」(150) | 真实 releases 快照说明 |
| C10 | 「生成演示设计版本」/「生成下一演示版本」(150) | 「生成设计版本」/「生成下一版本」（按钮或确认环节展示自动建议的 next patch，G3） |
| C11 | M04「当前原型没有真实业务事实核验」(183) | 保留语义去除「原型」自称（真实边界：当前无真实业务事实核验） |
| C12 | M07 details「…本原型是合成设计，不代表真实业务确认或运行验证…」(215) | 真实来源与 provenance 说明（LA1：source=实例来源标签派生） |
| C13 | 体系 source 默认「AI 草稿 · 合成演示」(51) | 真实来源标签（LA1：provenance/实例来源派生；faux 模式=「AI 草稿 · 确定性演示」类） |
| C14 | M10 空态「此体系没有演示口径待确认项。」(224) | 「此体系没有待确认口径。」 |
| C15 | M12「演示候选：」与注「此原型只演示上面这项预设候选；修改文字不会调用模型。」(234) | LLM 生成候选（真实模式）；faux 模式保留候选语汇+模式声明 |
| C16 | 导入 dropzone 注「…Excel 直接导入见完整方案，本原型展示表格识别流程。」(262) | 「文件仅在当前浏览器预览，不会上传。」保留（仍为真）；后半换真实说明（Excel 导入指引入文档） |
| C17 | 1MB 错误「原型仅预览 1MB 以内的合成 CSV／JSON…」(522) | 「仅支持预览 1MB 以内的 CSV／JSON，请换一份小文件。」 |
| C18 | library 尾注「原型中的内置内容为合成示例；生产方案继续保留现有行业模板。」(161) | 真实模板来源说明（内置方法模板+我的模板目录） |
| C19 | toast「演示生成已停止…」(388) | 「生成已停止，原需求仍保留。」（G4：服务端任务不中断的边界在 B2/B3 说明） |
| C20 | toast「工作草稿已保留在当前演示中，刷新后会重置。」(389) | 「工作草稿已保存。」（真实落盘） |
| C21 | toast「演示设计版本已固定，实际证据仍待获取。」(505) | 「设计版本已发布，实际证据仍待获取。」 |
| C22 | 下载 toast「已触发演示设计包下载；未执行真实资产发布。」(508) | 真实下载 toast（G3 直链） |
| C23 | 兜底 toast「原型操作遇到问题，当前内容仍在页面中。」(513) | 【新增】真实失败兜底，同语汇（当前内容仍在页面中） |
| C24 | 下载 JSON 内 `prototype:true` 标记 (508) | 真实 SAP 包（releases/<pkg>/<ver>.sap.yaml），无合成标记 |
| — | 助手对话 faux 响应串 (315/321/326) | faux 模式逐字保留（演示模式合法）；真实模式由 LLM 产生（LA1） |
| — | 数据内容串（如「30天是此合成设计的明确建议…」(192)） | 属生成数据非 UI 框架文案，随真实 LLM 输出产生 |

**兜底规则**：C 表未枚举、但含「演示/合成/原型/不会调用模型/刷新后重置/只在内存」自指的串，一律同规则换真话并复用 demo 语汇；实现切片须对本表做全量 grep 复检（关键词：`演示|合成|原型|刷新后|不会调用`）。

### 4.D 新增状态文案（【真实必要·新增】，G 定稿优先）

- G7 第 6 检查行（定稿）：「待人工审核的 AI 指标（N 项）」+ 行内批准/拒绝动作词。
- G3：「下载设计包」（定稿）；same-content 拒绝透出复刻串（§4.A）。
- 其余加载/失败/重试文案：无 GRILL 逐字定稿——实现须复用 demo 既有语汇（busy-block/spinner、inline-error、toast 句式「…已…，…仍…」），随首个实现切片一并提交对照验收；不得发明新组件或新句式家族。

---

## 5. Negative cases（禁止路径/隐藏路由/不得出现的状态）

1. **无 JS 可用面**：noscript 提示、零 JS 服务端表单、「页面无脚本」类声明——禁止（G9：放弃降级）。
2. **页面跳转式导航/整页刷新导航**：弹层改独立页面（A1 形态）、表单 POST+redirect、breadcrumb 服务端路由——禁止；弹层一律 `<dialog>`，导航一律 hash 路由（G1/G9）。
3. **demo 不存在的顶层导航项**：多格式导出、设置、帮助等不得进侧栏/顶栏（R2：导出只进 published「更多格式」行）。
4. **手填版本号输入框**：交付/发布流程任何环节禁止版本输入（G3：自动建议+一键确认）。
5. **合成声明残留**：B/C 表之外的「交互原型/合成示例/演示版本/不会调用模型/刷新后重置」字样——禁止（§4.D 兜底规则复检）。
6. **A1 的 45 个表单路由分支**：同批退役删除（G9）；唯一例外=导出直链 GET（a[href] 直下，不经 SPA）。
7. **demo 配套文件混入**：`方案.html` 外链、`examples/`、`verify-model.cjs`、`README.md`、v0.1 截图——不进移植产物（about 换 B3 真实指引）。
8. **chat/助手对话落盘**：禁止（LA1：会话内存态，刷新清空=严格复刻）。
9. **新增服务端持久化概念**：总数必须=0（LA1 红线：>3 触发 kill）。
10. **修改原型目录**：任何「demo 改起来更方便」的改动都是范围违规（PRD Further Notes）。
11. **假延迟**：750ms setTimeout 假生成、瞬时合成校验——禁止；一律真实 job/引擎路径（G4）。「停止生成」不得谎称已取消服务端任务（G4：仅弃置标记）。
12. **破坏 demo 断点**：为真实标签/新状态改变 1023/840/600 断点行为（含 ≤840 顶栏标签隐藏）——禁止。
13. **浏览器原生弹窗**：alert/confirm/prompt——禁止，一律 dialog/toast/inline-error（demo 语汇）。
14. **History API 深链**：禁止（G1 已定 hash）。
15. **Out of Scope 面**：多人协同/云端/鉴权/方案 §8「随后增强」/LLM 出稿质量评估 UI——禁止出现。

---

## 6. Trace 矩阵（surface ↔ US ↔ GRILL）

| Surface/路径 | US | GRILL/U1 |
|---|---|---|
| S01 home（示例卡/composer） | US1、US12 | R2 |
| S02 generating + H2/H3/H4 | US2、US11 | G4、G1 |
| S03 systems + N2/N4 | US13 | G1 |
| S04 library + L1-L6 | US10 | G6、G5 |
| M17 导入 + L7-L10 | US10 | G5 |
| S05 work 壳 + N7 | US3 | G1 |
| S06 overview + O1-O8 | US2、US3 | — |
| S07 metrics + M-1~M-8 | US2、US4、US12 | G2【U1-b】、G1 |
| S08 scenes + C1-C8 | US3、US10 | G8 |
| S09 review + R-1~R-10 | US8、US9 | G3、G7【U1-a】 |
| S10 助手 + A1-A4 | US5、US11 | LA1、G9(B2) |
| M08/M09 依赖保护 | US4 | — |
| M10 口径确认 | US8 | G2【U1-b】 |
| M19 复核确认 | US8 | — |
| S00.4 边界标签/M20 about | — | G9 |
| S00.1/S00.5/S12 + §3 全部 | US14 | — |
| 窄屏（05/06 基线+断言） | US7 | G9（Playwright） |
| Esc 焦点回归（§3.3） | US6 | — |
| 刷新恢复（S00.7/H4/M-7） | US12 | G1、G4 |

**U1 依赖冻结点**：M10 写路径（U1-b）与 R-9 保存指标模板（U1-a）在用户裁决前，实现切片不得触碰引擎层；契约按 demo 形态钉死 UI 面，裁决只影响后端落点。

---

## 7. Artifacts

- `.flow/ui/`：7 张评审截图（本契约 S01/S04/S05-S09 的视觉锚）+ `manifest.md`（逐张 surface/US 映射、5 文件 SHA-256、Playwright 基线拍摄计划与对照方式）。
- 验收判据（D-甲骨文先行）：移植产物与 demo 本体 Playwright 同视口截图对照 + 行为断言（Esc 焦点回归、390 无横溢、1440 无横溢）全绿；本契约 §1 surfaces 与 §2 状态 1:1 映射到工件与测试。
