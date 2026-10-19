# Red-Team: A2 · UI 重构——严格复刻评审原型（demo 前端移植 + 服务端 JSON API）

> 新鲜上下文红队子代理报告（verbatim，2026-10-18）。核实基础：逐项验证提案事实声明，两处与事实不符（测试计数、规格源版本），一处提案未列的结构性风险（领域对象模型错配）。

## 一、钢铁人（最强辩护）

**这个方案最强的版本是：它是把「规格权威」从一个写得再好的 PRD 换成了一份被真实用户亲手评审、逐条走查、且用户主动用强烈措辞（「重做，严格执行」）要求对齐的、可运行的可执行规格。** demo 有 7 张评审截图（`screenshots-v0.2/`）、两份人工验证记录（Esc 焦点回归、1440/390 无横溢、依赖保护、导入缺口预览都是实测行为而非意图），方案 v0.2 还有 A01–A15 可观察验收表。大多数 UI 重构死于「规格真空下的自由裁量」；这个方案恰恰没有这个病。而且技术上它比听起来便宜：demo 是无依赖、无构建、无框架的 vanilla JS（530 行长行文件，app.js），移植无工具链成本；模型层确实是独立文件 `analysis-model.js`，其 10 个命名导出（`makeAnalysisBlueprint`、`blueprintIssues`、`designReady` 等）在 app.js 中只有约 15 个引用点（每个 1–2 次）——替换缝隙是真的窄。

**其次，风险被结构性地圈住了。** 提案第 6 节把引擎/SAP/LLM/CLI/数据格式全部钉死不动，而这些层自带真实的回归保护（`test/unit/` 约 35 个文件、`test/cli/` 约 27 个 e2e 文件，全部与 UI 无关）。也就是说，本批可能搞坏的全部爆炸半径 = 表现层 + 新 API 面，核心资产有既有测试兜底。demo 状态机里甚至已经预埋了异步生成的落点：`state.busy`、`renderGenerating`、`generateTimer`/`setTimeout` 都存在——「生成中」不是移植后要凭空发明的状态。

**第三，「合成实现 vs 交互形态」的判别标准（第 4 节）是这份提案最聪明的一段**：它给了 GRILL 一个可操作的裁决规则（看验证记录描述的是用户可感知交互还是演示数据管道），且列举的四类合成行为（预设内容/内存态/合成校验/边界标签）与 demo README 第 14 行的自我声明逐条对应，不是编造的清单。A1 的教训（把「非工程候选」误读为「交互可降级」）被显式登记而非含糊带过，这在提案写作里属于高纪律水平。

## 二、承重假设清单

**LA1 ·「仅换数据源」= demo 的领域对象模型能承载引擎数据（最重的一条）**
- 假设：demo 前端「原样移植」，只需把 `analysis-model.js` 换成真实 API。隐含前提是 demo 的内存模型（`state.systems[]`，每个 system 含 `blueprint/metrics/scenes/pending/confirmed/revision/delivered/chat/proposal/metricOnly`）与引擎模型字段可对接。
- 若假会怎样：引擎的 Instance 是 base 模板之上的 diff 覆盖层（`src/schema/instance.ts`：`base: template_id@version` + `added/removed/modified/caliber_switches/added_scenarios`），而 demo 的 system 是物化全量模型且含引擎没有的概念（`chat` 对话历史、`proposal` 战略提案、`pending.refund/pending.repeat` 明细、`metricOnly`、`revision` 自增版本号、`source` 标签）。真实落盘需要双向 DTO 翻译器（写：demo 全量 diff → overlay；读：materialize → demo 形状），且 `chat/proposal`/最近编辑要么新增服务端持久化（违反「不动引擎层/实例 YAML 格式」），要么交互降级（违反「严格复刻」）。
- Kill criterion：若为保住 demo 交互需要新增 >3 个服务端持久化概念，则「不动引擎层 + 严格复刻」两约束互斥，回 PRD 重划范围或请用户裁决。
- 最便宜的测试（1 小时）：字段对照表：demo system/metric/scene 每字段 × Instance/Blueprint/Scenario schema，数出「无服务端对应」字段并归类（可派生 / 需新增 / 只能丢弃）。这张表同时是 LA1 证据与 PRD 的 API 契约草稿。

**LA2 · 真实延迟/错误下交互序列可保持（时序假设）**
- 假设：demo 的已验证交互（即时反馈、toast、就地重渲染、弹层流）在真实 LLM 延迟（秒到分钟级，A1 靠 `/drafts/jobs/:id` 轮询页扛）和真实失败路径下不变。
- 若假会怎样：加载态、失败态、超时重试在 demo 里不存在（数据同步即时合成），既非「交互形态」也非「合成实现」——判别标准在此失效。被迫发明的错误交互若与 demo 风格冲突即「不严格复刻」；同步校验函数变服务端往返后每次渲染的校验时机要重新设计。
- Kill criterion：spike 中任一验证记录 v0.2 表格交互序列无法保持、或需改 render 函数结构（而非调用点插 await/状态位），「严格复刻 + 原样移植」框架死，改「demo 形态重写」重计工作量。
- 最便宜的测试（半天）：不移植，先在 demo 目录把 `makeAnalysisBlueprint` 的 2 个调用点改成 fetch 3 秒延迟 mock，走「自然语言→草稿→采纳」一条流，观察哪些 render/事件处理需重构。

**LA3 · 复刻保真度可客观验收（oracle 假设）**
- 假设：「严格复刻」有可判定验收标准。
- 若假会怎样：demo 无自动化测试（仅 `node --check`），app.js 有 427 处模板插值、138 处 `esc()`、7 处 `innerHTML`、16+ render 函数。验收无 oracle 退化为 人眼比对，ui_gate_cycles 上限 2，两轮耗尽即流程性失败。
- Kill criterion：开工前无法建立「7 视图截图对照 + Playwright 行为断言（Esc 焦点回归、390px 无横溢）」机器基线，「严格复刻」必然降级「尽量像」，需用户重新确认。
- 最便宜的测试（半天）：Playwright 对 demo 本体（http.server 起原型目录）截 7 视图基线图，与 screenshots-v0.2/ 对比跑通管道。先对 demo 拍基线，再对移植产物拍同一组——oracle 在写第一行移植代码之前就存在。

**LA4 · 一个批次装得下（预算假设）**
- 假设：前端移植 + 全新 JSON API（现状：server.ts 约 45 路由分支、0 个 application/json 响应、111 处 text/html）+ job 轮询 JSON 化 + 浏览器测试工具链从零搭建（package.json 无 playwright，仅 vitest + node≥22）+ 12 个 UI 测试文件重写 + 两份文档重写，在 60 turns / 12h / ui_gate≤2 内完成。
- 若假会怎样：中途砍范围，「严格复刻」下被砍的只能是保真度或回归深度——A1 同款死法。
- Kill criterion：第一个 ui_gate 周期结束时三条验收流未全绿 → 立即切片（先立形态与静态基线，API 按流补齐），不在周期 2 双线作战。
- 最便宜的测试（1 天）：timebox 三件事——playwright 起通、一条验收流 e2e 绿、一个 JSON endpoint 走通——实测速率对照剩余预算。

**LA5 · 既有表单路由可以同批退役**
- 假设：JSON API 上线与表单路由删除同批完成。
- 若假会怎样：GRILL 若决定保留表单路由「过渡」，12 文件 98 断言旧测试持续保绿 + SPA 测试从零写——双倍维护，自造第二个 A1 遗留。
- Kill criterion：无（决策非事实假设），但保留双形态必击穿 LA4——两条联动。
- 最便宜的测试（0 成本）：GRILL 一次性裁决「同批删除」：A1 形态已被用户显式否定，旧测试反正要重写。

## 三、失败模式 Top 7

| # | 失败模式 | 核实证据 | 最便宜验证 |
|---|---|---|---|
| 1 | demo 对象模型与引擎 overlay 模型错配需翻译层+新增持久化——「原样移植」实为「带双向适配层的移植」，工作量基准失效 | `app.js:30` state 结构 vs `src/schema/instance.ts:18-30`；`chat/proposal/pending.refund/revision` 引擎无对应 | LA1 字段对照表 |
| 2 | 真实 LLM 延迟/失败迫使改变 demo 即时交互——加载/失败态 demo 不存在，判别标准覆盖不到 | app.js 0 处 fetch、模型函数全同步；真实生成靠 HTML 轮询页（server.ts:373-541） | LA2 mock 延迟 spike |
| 3 | 复刻验收无机器 oracle，两轮 ui_gate 耗尽于人眼争议 | demo 无测试仅 node --check；ui_gate_cycles max 2 | LA3 先对 demo 拍基线 |
| 4 | 规格源引用错版本——复刻 v0.1 验证记录而用户评审的是 v0.2 | **已命中**：提案引 `验证记录-v0.1.md`，权威是 `验证记录.md`（v0.2，17:00 最后写入）；内容实质不同（v0.1：10 指标草稿流；v0.2：6 利润指标/战略交付/独立专题/方法库多语境）；交互层行为两版一致故非 kill | 已完成（diff 两份记录）；前置条件钉死权威版本 |
| 5 | 预算被低估的回归面击穿——提案称「19 个测试」，实际 12 文件/约 98 断言，低估约 5 倍 | **已命中**：grep -c 实测 15+8+3+2+7+8+7+5+9+7+22+5=98 | 已完成；GRILL 前修正基线数 |
| 6 | 灰色项（加载态、刷新/URL 语义——demo 无路由 0 处 hash/pushState、「刷新重置」、导入解析浏览器 vs 服务端、依赖保护就地阻断 vs 确认页时序）数量大到 2×9 GRILL 装不下 | app.js 0 处 location.hash/history.pushState/localStorage；提案 §8 未列「刷新后回哪/URL 是什么」这类必然新发明 | 枚举 app.js 全部 data-action（30+ 种）+ state 字段逐个三分类，数灰色项占比 |
| 7 | 转义缺口把 LLM/YAML/CSV 非受控内容注入 DOM——demo esc() 按「合成受控数据」设计 | 427 处 `${}` 插值 vs 138 处 esc()、7 处 innerHTML 汇点；真实数据含 LLM 输出与用户 CSV；本工具仅 127.0.0.1 单用户，影响中低 | 移植后 grep 全部插值点审计 + 敌意 fixture（`<img onerror>` LLM 输出）走渲染 |

## 四、站得住的部分

- 引擎/CLI 层不动 + 既有 unit/cli 测试全绿要求：真实安全网，爆炸半径=表现层+新 API 面。
- 模型层缝隙是真的：analysis-model.js 10 个命名导出、app.js 约 15 个引用点。
- 异步落点已存在：state.busy/renderGenerating/generateTimer。
- 判别标准（§4）是好规则，只是对「demo 中不存在的行为」（加载/失败/刷新）失效——规则边界问题非规则错误。
- 能力面缺口比想象小：依赖保护、口径确认、复核、发布、回执、模板导入、工作区多实例发现 A1 服务端都已存在——缺对象映射与 JSON 面，非引擎能力。

## 五、无法评估的部分

- screenshots-v0.2/ 与当前 app.js 逐像素一致性（截图摄于 17:00 前，代码最后修改 17:00:41，原型目录无 git——无法证明评审后代码未再改动）。
- vendor/pi-agent-runtime 真实 LLM 生成延迟分布（只能实测）。
- 「三条验收流」精确定义在 A1 归档 PRD 仅见映射（R6 节），本批提案未内联重述——PRD 前需钉死。

## Verdict: **go**

无任何 kill-assumption 的 kill criterion 命中到「计划死亡」：两处事实问题（#4 规格源版本、#5 测试计数）是前置修正项不动摇骨架；LA1 严重但有 1 小时廉价测试，最可能结局（翻译层+少量服务端状态）是范围修正非方案否决。

## 开工前置条件（≤5）

1. **钉死规格源版本**：以 `验证记录.md`（v0.2）+ `方案.md` §9（A01–A15）+ `screenshots-v0.2/` 为唯一交互权威，`验证记录-v0.1.md` 降级历史参考；修正提案 §4「10 指标草稿」等 v0.1 残留。
2. **完成 LA1 字段对照表**（demo system/metric/scene × Instance/Blueprint/Scenario schema），「无对应字段清单」进 GRILL 裁决「新增持久化 vs 交互让步」，翻译层显式列入任务分解。
3. **建立复刻 oracle 后再动工**：对 demo 本体（原目录起 http.server）Playwright 拍 7 视图截图基线 + Esc/焦点/390px 行为断言；原型目录 5 个核心文件记快照哈希（无 git，防复刻目标被无声改动）。
4. **GRILL 一次性裁决**：表单路由同批删除（推荐）、路由形态（demo 无路由，建议 hash 或无深链+刷新回首页显式决策）、资产服务方式（建议 CLI 内嵌静态，`metric-factory ui` 单命令体验不变）。
5. **预算校准**：以 12 文件/98 断言（非 19）为测试重写基线；第一个 ui_gate 周期设硬检查点——三条验收流不绿即切片，禁止周期 2 双线作战。
