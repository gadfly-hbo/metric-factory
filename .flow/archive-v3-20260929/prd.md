# Metric Factory v3 · PRD（落地闭环）

> 规格源：`.flow/proposal.md` + `.flow/red-team.md`（2026-09-29，go）
> 发布：无 issue tracker，按降级路径落盘 `.flow/prd.md`。

## Problem Statement

设计与定义态之间仍有手工断层：MetricFlow 导出物是占位 semantic model，要进真实 dbt Semantic Layer 必须人工替换模型引用与字段映射；「模板指标 vs 数仓现状」的差距（哪些有数可算、哪些缺数）无工具盘点；埋点采集与指标体系脱节。同时审核流与指标树查看在终端里效率低（mermaid 只读、review 逐条 TTY），缺少一个本地可视化工作台。

## Solution

三件套：

1. **map 命令族（数仓反推与字段映射）**：`metric-factory map <instance> --manifest manifest.json [--catalog catalog.json]` → 解析 dbt artifacts → 确定性推荐「指标 → 模型.字段」（置信度分档）→ 交互确认/`--draft` 产草案 → `--apply` 写 `instance.mapping.yaml`；差距清单三分类（已映射 / 可映射待确认 / 数仓无对应物）；映射后 export 的 semantic model 引用真实模型与列名
2. **track 命令（埋点建议）**：`metric-factory track <instance>` → 从旅程类指标与维度推导事件清单（事件名/触发时机/属性 JSON Schema/关联指标），平台无关输出 + 可导入结构
3. **ui 命令（本地 Web 工作台）**：`metric-factory ui [--port 4173]` → 本地 HTTP 服务，三视图：模板浏览（六模板指标字典）、指标树与实例 patch 编辑（结构化表单写回实例）、审核流（待审 LLM 指标批准/拒绝）；所有写操作调引擎函数，与 CLI 同 fail-closed 语义

## User Stories

1. 作为数据工程师，我想把 dbt 项目的 manifest（和 docs generate 的 catalog）喂给工具，让它告诉我每个模板指标该落在哪个模型哪个字段，这样不用逐条人肉翻译。
2. 作为数据工程师，我想看到推荐置信度与理由（匹配了什么名字/同义词），低置信项明确标「待人工」，这样我知道哪些能直接信。
3. 作为数据工程师，我想在确认后得到一份映射文件（与实例同目录、git 可管），导出的 MetricFlow YAML 直接引用真实 dbt 模型与列名。
4. 作为数据团队负责人，我想看「模板指标 vs 数仓现状」差距清单（有数可算 / 可映射未映射 / 数仓无对应物），这样数据建设 gap 一目了然。
5. 作为数据工程师，当 manifest 缺列信息时我想被告知「用 catalog.json 补全」，而不是拿到一份空映射。
6. 作为埋点工程师，我想从指标体系反推事件清单与属性 schema（JSON），这样采集设计有据可依、不漏旅程指标。
7. 作为数据团队负责人，我想在浏览器里浏览六个行业模板的全部指标与口径，这样业务方评审不用读 YAML。
8. 作为数据团队负责人，我想在网页上直接查看我的实例指标树（按分类分色），编辑 patch 四段（口径开关/修改/删除/新增）并写回实例文件，这样不用手改 YAML。
9. 作为审核人，我想在网页上看待审 LLM 指标列表并逐条批准/拒绝（记录审核人），这样审核效率高于终端。
10. 作为 agent 用户，UI 不引入新的写路径——所有写操作与 CLI 等价（同一引擎、同一 fail-closed），这样自动化流程与人工流程不会分叉。
11. 作为本地工具使用者，我想 `metric-factory ui` 一条命令启动、无需 npm build 前端、无需联网，这样开箱即用。

## Implementation Decisions

- **dbt artifacts 双输入（红队 #1 决议）**：manifest.json 提供模型清单/血缘/已声明列；catalog.json（dbt docs generate 产物）提供全量列与类型。列信息合并优先级：catalog > manifest 声明列。两者皆缺列时该模型标记「列信息缺失」并提示跑 `dbt docs generate`。解析层独立模块（src/warehouse/），fixture 锁定 dbt 1.8+ artifacts 结构。
- **映射推荐引擎（确定性优先）**：归一化（snake_case 化、去停用词）+ 信号加权（指标名=列名精确命中 > 指标名 ⊂ 列名/模型名 > 同义词表命中（中文 display_name ↔ 英文列名词根，内置常用对照如 成交额→gmv/amount/revenue）> definition 关键词）。综合分 ≥0.6 推荐（附信号明细），<0.6 待人工。LLM 增强本期不进验收（规则路径先证明价值；v2 适配层已就绪可后续接入）。
- **映射文件 `instance.mapping.yaml`**：`{base, mappings: [{metric, model, column, confidence, signals, confirmed_by, confirmed_at}]}`，Zod schema；`map --apply` 只写入 confirmed 条目；export 优先读映射文件（无映射文件或指标未映射 → 维持占位并在导出摘要标注）。
- **差距清单**：`map` 默认输出三分类统计 + 明细（--json 支持机器消费）。
- **track 事件推导**：旅程分类树（trees.category=旅程）的指标 + 北极星 → 事件；事件名 = 指标名动词化规范（view/click/submit…按指标类型映射表）；属性 = 指标 dimensions + 公共维度（timestamp/user_id）；输出 `tracking-plan.yaml`（人读）与 `tracking-plan.schema.json`（机器校验用 JSON Schema 集）。
- **UI 技术形态（GRILL 预决）**：node 内置 `http` 服务（零新依赖）+ 服务端渲染 HTML（模板字符串）+ 原生 JS 渐进增强（fetch + 表单），无前端构建链。视觉遵循全局设计规范 `~/.zcode/design/DESIGN.md`（JuanerAI Xanthil 暖灰青），实现前必读并取其 token 为默认值。
- **UI 路由**：`GET /`（工作台首页：实例选择与概览）、`GET /templates`、`GET /templates/:id`、`GET /instance`（树视图 + patch 编辑表单）、`POST /instance/patch`（写回，走引擎 validate）、`GET /review`、`POST /review/:name`（approve/reject，走 review 引擎）。端口默认 4173，仅监听 127.0.0.1。
- **UI 写路径无旁路**：POST 端点直接调 src/engine 函数（validateInstance/applyApproval 等），错误以同一套 rule/message 返回；UI 不做客户端校验豁免。
- **导出升级**：metricflow exporter 读映射文件：`model.ref` = 映射模型名；measure `expr` = 映射列名（agg 按 type 映射：simple 计数类 → count_distinct？不——agg 保持 sum 占位默认，映射条目可带 `agg` 覆盖）。契约测试新增断言：映射实例导出物 ref ∈ fixture manifest 模型集、expr ∈ 列集。

## Testing Decisions

- 主接缝扩展：CLI 进程边界（map/track/ui 的 ui 走真实本地 HTTP 端口 fetch 断言 HTML 与 JSON 端点）。
- 纯函数低层：manifest/catalog 解析合并（四形态 fixture）、推荐引擎打分（独立字面量期望 + 命中率断言 ≥ 规则阈值）、事件推导、映射合并。
- fixture：`test/fixtures/dbt-manifest.json` + `dbt-catalog.json`（3–4 个模型、含同名命中/同义命中/干扰项/缺列模型）。
- 契约测试升级：映射导出物 ref/expr 合法性。
- UI：起真实 server（随机端口）fetch 断言三视图渲染与写端点行为（含 fail-closed 路径：未审核指标导出阻断在 UI 上同样成立——UI 审核端点写 reviewed_by）。

## Out of Scope

- information schema / 直连数仓 / 反向 ETL
- 多用户、鉴权、云端部署、HTTPS
- 拖拽画布式树编辑器（结构化表单即可）
- LLM 增强映射推荐（规则路径先行，LLM 后续迭代）
- 移动端适配
- 真实 dbt 项目端到端 parse（沿用手动冒烟脚本惯例，映射导出物留档供跑）

## Further Notes

- 红队最优先工程决策（catalog 双输入）已内化；UI 范围纪律：任一 UI 切片超 2 个实现切片仍不能验收 → 当轮砍掉退回 CLI（记录不阻塞其余交付）。
- 映射推荐命中率是产品叙事关键：fixture 阈值（≥50% 可映射指标自动推荐）作为验收断言；真实环境采纳率为发布后运行时指标。

---

## GRILL 自拷问决议（2026-09-29，按推荐自答）

> 约束：proposal.md（含设计规范约束）不重开；以下仅覆盖其留白处。

1. **UI token 落地（已实读 ~/.zcode/design/DESIGN.md）**
   CSS 变量直取 token：bg #f7f6f3 / surface #fff / surface-2 #f0efec / border #e2e0db / text 三级 / accent #0f766e 系 / ok-warn-fail-queue 语义色成对（深字+soft 底+line 描边）。外壳：sidebar 248px（导航：工作台首页/模板库/我的实例/审核中心）+ 主区限宽 860 + inspector 300px（选中指标的口径/出处详情页签）。状态 chip 一律色+文字双通道：已审核=ok、待审核=warn、可映射待确认=queue、数仓无对应物=warn、已映射=ok。表格 .tbl 表头 surface-2；空状态虚线框；焦点环 2px accent。边界声明常驻侧栏底部与状态条：「本机运行 · 不联网 · 写操作仅限本地实例文件」。

2. **map 双模式（与 review 同构）**
   TTY 交互：逐条展示推荐（置信度+信号明细）确认/跳过，会话结束写映射文件；非交互：`--draft` 产 map-draft.yaml，`map --apply <draft> [--reviewer <name>]` 将草案全部标 confirmed 写入（信任草案是人的决定，同 review --approve 语义）。

3. **映射文件命名与发现**
   `<实例主名>.mapping.yaml`（instance.yaml → instance.mapping.yaml），与实例同目录、git 可管；export 自动发现默认名，`--mapping <path>` 显式覆盖。

4. **agg 覆盖**
   mapping 条目可选 `agg`（sum | count_distinct | avg | min | max），默认 sum；工具不猜聚合语义，推荐时可按指标名提示（如含 count → count_distinct）但不自动改。

5. **track 事件动词映射表**
   关键词→动词：login/register/view/search/click/cart/submit/pay/refund/share/publish/interact/return；指标名命中关键词取对应动词（如 first_order_within_7d 含 order→pay 域 → submit_order 事件风格）；无命中 → `track_<metric>`。公共属性：event_name、event_time、user_id、device_id + 指标 dimensions；输出 `tracking-plan.yaml`（人读）+ `tracking-plan.schema.json`（每事件一个 JSON Schema）。

6. **UI 端口与测试**
   `--port` 默认 4173，传 0 = 随机端口（测试用）；仅监听 127.0.0.1；测试以真实 server + fetch 断言。

7. **UI 写安全边界**
   本地单用户工具：POST 不做 CSRF（接受，写操作仅限本地实例/映射文件）；UI 不发起任何外部网络请求；无凭据处理。

8. **UI 渐进增强原则**
   服务端渲染完整可用（原生 form POST），JS 仅增强体验（fetch 提交 + toast 反馈 + inspector 切换）；禁用 JS 时三视图仍可完成全部操作。

## v3 REVIEW 第 1 轮决议（2026-09-29）

- 已修复（阻断）：map TTY 交互确认（与 review 同构）、track 纳入北极星候选、README fixture 演示路径、同义词测试真实化（0.7 档覆盖 + 并列取序断言）、UI 非待审 422 测试。
- 已修复（建议）：measureRefs 死变量、显式 --mapping 坏文件 fail-closed 报错、chip 双通道真断言、track 全覆盖数量断言、UI 插值统一 escapeHtml、writeInstanceFile 提取共享（engine/io.ts）、坏 manifest ERROR 包装、比率类包含命中降档（*_share/_rate → 0.5 待人工）。
- **降级记录（S7）**：inspector 页签与 fetch/toast 渐进增强未实现——当前为零 JS 的纯服务端表单（禁用 JS 全功能可用，符合规范底线）；增强层后续迭代，GRILL #1 的 inspector 布局简化为树卡片内嵌详情。
- **信任边界裁定**：caliber 开关 key 未转义进 radio name（模板/实例为本地自写文件，同 draft 文件信任域）；表单 added 段为合并语义（移除走审核中心/YAML），已在表单 label 声明。
