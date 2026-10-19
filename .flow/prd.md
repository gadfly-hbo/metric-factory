# PRD · A2 UI 重构：严格复刻评审原型（demo 前端移植 + 服务端 JSON API）

> 规格优先级：`.flow/proposal.md` > 本 PRD。来源：proposal + 红队报告（`.flow/red-team.md`，verdict go，5 条前置全部并入本 PRD）。
>
> **PRD diff gate（auto 自批记录）**：相对 proposal 全为增量——①oracle 先行硬门（红队前置 3）；②复刻三规则操作化；③LA1 对照表与 DTO 改名；④表单路由同批退役/资产/路由为提案 §8 开放问题的推荐答案（GRILL 终裁）；⑤测试策略细化。零改动/丢弃提案决策。

## Problem Statement

A1 交付的工作台（零客户端 JS 服务端表单、弹层改页面导航）与用户亲手评审并明确要求对齐的 UI demo 不一致。用户裁决：「重做，严格执行 UI demo 要求来做」。用户在新前端里应看到与评审原型逐面一致的视觉与交互——布局、组件、弹层、键盘/Esc、右侧助手栏、即时反馈、toast、窄屏行为——差异只允许出现在数据真实性与真实延迟带来的必要状态（加载/失败）上。

## Solution

把 demo 的 vanilla JS 前端（index.html 壳 + style.css + app.js 交互层）原样移植进 metric-factory 工作台，替换 `analysis-model.js` 合成模型层为真实服务端 JSON API：读=materialize 实例（含蓝图/场景/指标物化视图 + 引擎校验结果），写=走既有引擎写路径（校验不过零写盘），生成=走既有 LLM job 管线。引擎/SAP/LLM/CLI/实例 YAML 格式零改动。既有 12 个服务端 HTML 断言测试文件（约 98 断言）退役，替换为 JSON API 测试 + Playwright 浏览器测试（以 demo 本体基线为复刻 oracle）。

## User Stories

1. 作为使用者，我打开工作台看到 demo 首页的「创建分析体系」卡片与示例需求，这样我能一眼认出评审时确认的入口。
2. 作为使用者，我输入一句话业务需求并生成草稿，生成期间看到 demo 的生成中视图，完成后看到草稿（蓝图+指标+场景），这样我不需要学习新交互。
3. 作为使用者，我在体系总览/指标体系/分析场景/检查交付四个 stage 间切换，切换形态与 demo work 视图一致（视图内 stage，非页面跳转）。
4. 作为使用者，我点指标「删除」时若被引用，看到与 demo 一致的就地依赖保护提示（哪些对象引用了它），确认后才删除。
5. 作为使用者，我在右侧助手栏提问/下指令，看到与 demo 一致的对话气泡与「先看建议再采纳」的提案流。
6. 作为使用者，我用键盘 Esc 关闭弹层后，焦点回到打开弹层的按钮（demo 已验证行为，逐字保持）。
7. 作为使用者，我在 390px 窄窗使用时侧栏按需收起、无整页横溢（demo 已验证行为）。
8. 作为使用者，我看到设计检查项（目的/假设/证据/方法绑定/口径确认缺口）以 demo 检查视图的形态列出，全部关闭+业务复核确认后才能交付。
9. 作为使用者，我交付时得到真实版本快照（releases/ 登记），内容未变时被拒绝重复发版——真实语义，demo 形态。
10. 作为使用者，我从模板库浏览指标体系与分析方法两类模板、粘贴导入（缺口如实呈现、不覆盖）、从场景另存方法。
11. 作为使用者，我在真实 LLM 延迟下看到加载态、失败时看到错误与重试（demo 无此状态——本批新增，风格须与 demo 一致，属「真实数据必要状态」豁免）。
12. 作为使用者，我刷新页面后回到可恢复的位置（demo 刷新重置属合成行为——替换为真实实例恢复；具体策略 GRILL 定）。
13. 作为多体系使用者，我在侧栏「我的体系/最近编辑」看到工作区真实发现的实例文件并可切换。
14. 作为无障碍使用者，我可以用 skip-link、Tab 序、原生 dialog 语义操作全部功能（demo 已具备）。

## Implementation Decisions

### D-甲骨文先行（红队前置 3，硬门）

写第一行移植代码之前：
1. 对 demo 本体（原型目录起 http.server）用 Playwright 拍 **7 视图截图基线**（对应 screenshots-v0.2：自然语言起点/经营分析总览/战略设计交付/独立数据专题/方法库多语境/战略总览窄屏/窄屏检查）+ 行为断言（Esc 焦点回归、390px 无横溢）。
2. 对原型目录 5 个核心文件记 SHA-256 快照哈希（目录无 git，防复刻目标被无声改动）。
3. 移植产物的验收 = 同机同视口截图对照 + 行为断言通过。**oracle 是 ui_gate 的机器判据，人眼比对只是补充。**

### D-复刻保真的三条规则（proposal §4 判别标准的操作化）

1. **交互形态（逐字复刻）**：DOM 结构、class 名、style.css、data-action 事件流、弹层/dialog、toast、键盘行为、窄屏断点、渲染函数结构。
2. **合成实现（换真实）**：analysis-model.js 全部导出（预设数据/内存 systems/合成校验/合成版本）→ 真实 API；`prototype-label` 顶栏标签 → 真实边界声明（文案 GRILL 定）。
3. **真实数据必要状态（新增，风格对齐）**：加载态、失败态、超时重试、job 进度——demo 因合成数据无此状态；新增状态的视觉必须复用 demo 既有语汇（busy 状态、toast、tag），不得发明新组件。

### D-LA1 字段对照（API 契约草稿；翻译层进任务分解）

demo system → 引擎映射（「需设计」项进 GRILL）：

| demo | 引擎 | 处置 |
|---|---|---|
| system.id/title/goal/need/source | 实例路径 / blueprint.title / purpose / provenance.describe / 实例来源标签 | 派生 |
| blueprint.preset/intent/judgmentRule/methodId | contexts+intent 派生 / 对应 / 前端常量 / 场景 method_refs | 派生或对应 |
| questions/hypotheses/evidence/options | blueprint.questions/hypotheses/evidence_plan/options（text→statement、kind→judgment、failure→insufficiency、change→change_condition 改名对齐） | DTO 改名 |
| metrics{id,name,group,description,formula,unit,dependencies,pending,note} | materialized metrics + added[]（group=模板 trees 模块；formula/unit/dependencies 引擎有；pending 口径待确认→口径确认缺口） | 映射设计 |
| scenes{name,methodId,purpose,family,contexts,limit,evidence,steps,bindings} | ScenarioSpec + 方法模板：steps/family/limit/contexts 属方法模板（引用不复制），bindings≈metric_usages+method_bindings | 映射设计 |
| pending{refund,repeat}（集中口径确认） | A1 口径确认缺口面（caliber_switches/designIssues） | 需设计（GRILL） |
| confirmed / delivered | blueprint.review / releases 登记 | 对应 |
| revision 自增号 | design_fingerprint 派生或丢弃 | 需设计（GRILL） |
| chat[] 助手对话 | A1 助手草案流（preview/apply/discard） | 会话内存态，不落盘（demo 本就内存态，刷新清空=严格复刻） |
| metricOnly | blueprint 缺席派生 | 派生 |

新增服务端持久化概念 = **0**（chat 不落盘、revision 派生或丢弃、pending 由既有口径面派生）——红队 kill criterion（>3）不触发。

### D-JSON API 面

- 读：实例物化视图（含 demo system 形状的 DTO）、设计检查项、模板库（指标+方法）、工作区实例发现、job 状态。
- 写：蓝图编辑、假设状态、指标增删改、场景编辑/另存方法、口径确认、复核确认、交付发布、导入、助手生成/采纳/放弃——全部走既有引擎写路径（writeMode 引用完整性 + 交付门全量），失败返回结构化错误（demo 形态的就地错误呈现）。
- 既有 45 个表单路由分支：**同批退役删除**（红队 LA5 推荐，GRILL 确认）；导出下载保留（a[href] 直下，不经 SPA）。

### D-资产与路由（GRILL 确认推荐项）

- 前端资产：CLI `ui` 命令内嵌服务（静态目录进 dist 构建），单命令体验不变。
- 路由：demo 无 URL 路由（内存 route）——建议 hash 路由（#home/#work/:id/:stage/#library）+ 刷新恢复真实实例；GRILL 终裁。
- 无 JS 降级：**放弃**（demo 本身需 JS；「零 JS」是被推翻的 A1 决策）。

## Testing Decisions

- **复刻 oracle（新增 seam）**：Playwright 对 demo 本体与移植产物跑同一套视图截图对照 + 行为断言；截图基线与哈希进 `.flow/ui/`（durable artifact）。
- **JSON API 测试**：vitest + 真实 server（沿用 test/ui 的 fetch 模式），断言 DTO 形状与引擎语义（fail-closed、双门、six 路引用保护、same-content）。
- **三条验收流 e2e（新形态重过）**：AT1 经营诊断（模板起点→蓝图→交付）、AT2 零指标战略（NL→复核→发布）、AT3 独立数据专题（NL 修正→放弃零改动）——faux 后端确定性注入沿用。
- **回归不动**：test/unit、test/cli 全绿是硬门；既有 12 个 UI 测试文件随表单路由同批删除（断言语义迁入 API/浏览器测试）。
- 敌意 fixture：LLM 输出含 `<img onerror>`/引号注入走一遍渲染（红队 #7）。

## Out of Scope

- 引擎/SAP/LLM/CLI/MCP 层任何语义变更；实例 YAML 格式变更。
- demo 的合成行为持久化（预设内容库、内存 systems 跨会话）。
- 多人协同、云端、鉴权。
- 方案 §8「随后增强」全部条目。
- 真实 LLM 出稿质量评估（沿用 A1 披露：冒烟未跑）。

## Further Notes

- 权威规格源版本已钉死（proposal §2 勘误后）：`验证记录.md`（v0.2）+ `方案.md` §9 + `screenshots-v0.2/`。
- 预算硬检查点（红队 LA4）：第一个 ui_gate 周期结束时三条验收流未全绿 → 立即切片（形态+静态基线先行，API 按流补），禁止周期 2 双线作战。
- 原型目录只读；任何「demo 改起来更方便」的念头都是范围违规。

---

# GRILL 决议（追加节）

## R1（author-blind 新鲜子代理 9 包，主代理逐包核验后采纳）

- **G1 路由/实例标识/创建流**：hash 路由（`#home/#systems/#library/#work/:id/:stage`），`:id` = URL 编码的实例相对路径；NL 生成完成**即自动落盘**（目录 `system-YYYYMMDD-HHMMSS`，「修改名称」只改 blueprint.title——与 demo rename 同构）；API 全实例作用域化 `/api/instances/:id/...`，删除服务端 `currentInstancePath` 全局态。核验：`server.ts:207-227` discoverInstances 白名单可直接做 id 源；`server.ts:367` 单全局态确证。✅
- **G2 口径确认映射**（承重）：pending 三问落 added 指标**自带** `caliber_switches` 布尔键（releases/index.yaml 已有 `refund_to_payment_period` 双版本实践）；pending 判据 = DTO 派生（开关键缺席或 definition=哨兵文本「（待补充统计说明）」）；确认动作=改写键值/definition。核验：`MetricSchema.caliber_switches` record 字段存在（template.ts:71）——**但** `generate.ts:343` 强制 `caliber_switches:{}` 且 `ModifiedMetricSchema` 无该字段，写路径缺失 → 触发升级裁决 U1-b（见下）。
- **G3 revision/交付**：revision 整数丢弃（派生）；「有新工作草稿」标签 = 当前 design_fingerprint ≠ releases/index.yaml 同包最新 content_fingerprint；交付 = 自动建议 next patch + 一键确认（无输入框，demo 形态；same-content 拒绝文案由引擎结构化错误透出）；published 块「下载设计包」= `releases/<pkg>/<ver>.sap.yaml` 直链。✅
- **G4 job 轮询**：`GET /api/jobs/:id` JSON，前端 1.5s 轮询；「停止生成」= 客户端离开轮询+标记弃置（服务端跑完落盘不丢，引擎无取消 API——Out of Scope）；生成中刷新回 home 保留需求文本。✅
- **G5 导入**：浏览器解析照搬 demo（CSV/JSON 解析器+行级错误文案+1MB/accept 白名单——属交互形态），确认时 POST 归一化指标行；产物 = 用户草稿模板（`incomplete` 缺口如实，A11）；A1 粘贴 YAML 导入路由随表单路由退役。✅
- **G6 模板库**：补写 demo 独有三方法（net-change/repeat-review/weekly-review）为 `templates/methods/*.yaml`（纯数据新增，oracle 04 卡片密度对齐）；「我的模板」= `templates/user/` 目录约定；use-template 指标类 = fork 语义（带 base，AT1 同构）；「保存指标体系模板」撞 `TemplateSchema` min(1) 硬门槛（blank-base 无 dimensions/trees/north_star/matching）→ 触发升级裁决 U1-a（见下）。
- **G7 LLM 审核门落点**（子代理 hunting 到的最大隐性缺口）：检查视图加第 6 行「待人工审核的 AI 指标（N 项）」，行内逐项批准/拒绝（走既有 applyApproval/applyRejection，reviewer=MF_REVIEWER/$USER 约定）——属「真实数据必要状态」豁免，视觉复用 check-row 语汇。否则 AT1/AT2 永红（faux 指标同样带待审标记）。✅
- **G8 场景步骤**：步骤/家族/限制读自方法模板（引用不复制）；用户改步骤 → 提示「另存为新方法」走既有 save-as-method（`server.ts:1096-1197` 沉淀链），场景 method_refs 指向新方法；「新增/生成分析场景」= 方法模板选用流（demo 合成生成本就同构）；角色显示方法模板中文名。✅
- **G9 验收面**：新增 **AT4 指标体系建设流**（faux metrics preset → 指标 → 口径确认 → metricOnly 交付 → 另存指标模板——A11/A12 与 oracle 00 起点的唯一 e2e 载体）；模板库 04 加浏览+预览断言；窄屏 05/06 仅截图对照（390px 无横溢已含行为断言）；确认项批准：资产=CLI ui 内嵌静态（tsup 构建）、45 表单路由同批删除（导出直链 GET 保留）、无 JS 降级放弃、浏览器测试=Playwright；边界文案：顶栏「本地工作台 · 真实引擎」、助手注释按 LLM mode 动态（faux=确定性演示/已配置=模型生成，复用 demo tag 语汇）。✅

## R2（主代理自答，零新阻塞分岔）

- 文案纪律：demo 用户可见文案逐字复刻（含 toast/空态/弹层文案），仅合成声明类（顶栏标签/助手注释/about）按 G9 换真话。
- 首页 4 条示例需求：保留为产品文案（点击填充，内容照抄 demo——引导文案非数据）。
- about「方案与评审说明」弹层：保留形态，内容换真实说明（边界+文档指引）。
- 指标树/表切换：树=模板 trees（blank-base 时按 group 聚类的降级树）；表=物化平表——实现细节，不阻塞。
- 多格式导出（metricflow/excel/mermaid）：A1 既有能力不砍，入口收进 published 块「更多格式」行（复用 demo 语汇），不新增顶层导航。
- 旧 12 个 UI 测试文件：随表单路由删除同批退役（一个切片内），断言语义迁入 API/Playwright 测试。
- Playwright：devDependency + chromium，e2e 起真实 server（faux 注入沿用 writeManagedEnv 模式）。

## 升级裁决 U1（唯一合并升级——引擎触碰红线，awaiting user）

proposal §6「引擎层保留不动」与两处 demo/方案必要落地点冲突，均为**加法式扩展、零既有语义变更**，但按规则 5 不自批：

- **U1-a 保存指标体系模板**（demo 交付后主按钮；方案 A12）：blank-base 体系拼不出合法 TemplateSchema（dimensions/trees/north_star/matching 全 min(1)）。选项：(a) 新增 `templates/user/` 宽松装载分支（UserTemplateSchema=指标+元数据，不进 lint 门不进匹配池，仅「我的模板」+复制源）；(b) 本批降级该按钮（A12 部分不达成，披露）。
- **U1-b 口径确认写路径**（demo 集中确认弹层）：added 指标的 caliber_switches 生成时强制空、修改路径无此字段（「校验过物化丢」陷阱的孪生）。选项：(a) ModifiedMetricSchema 加可选 caliber_switches + apply 支持（加法式，约 20 行）；(b) UI 层删了重加（脏 hack，零引擎改动）。
