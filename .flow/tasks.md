# A2 · 任务表（UI 重构：严格复刻评审原型）

> 来源：`.flow/prd.md`（含 GRILL G1-G9/U1 裁决）+ `.flow/ui-contract.md`（S00-S12/M01-M20/57 动作）。拆解自批（dev-flow 规则），理由记入 state.json：8 切片均为可独立验收的垂直tracer；红队 LA4 硬检查点（ui_gate 周期 1 三流不全绿即切片降级）作为预算保险，不预砍。

- [x] 1. Oracle 基线先行（Playwright 工具链 + demo 7 视图基线 + 行为断言 + 防漂移锚）
- [x] 2. 壳与静态视图移植（SPA 入口/style.css/路由 + home/systems/library + 模板库数据 + 读 API）
- [x] 3. NL 创建流（composer→job 轮询→自动落盘→进 work）
- [x] 4. work 四 stage 只读全景（DTO 全量 + 检查清单 + 树表切换）
- [x] 5. 写路径 I（蓝图/假设/指标依赖保护/场景另存方法/口径确认 U1-b）
- [x] 6. 写路径 II（审核行 G7/复核确认/自动版本交付 G3/published 下载）
- [x] 7. 助手栏与模板资产（chat 提案采纳流/导入浏览器解析/templates-user U1-a/另存指标模板）
- [x] 8. 验收总装（AT1-AT4 e2e + 敌意注入 + C 表全量复检 + 文档；旧表单退役按 LA4 切片纪律移交 T9）
- [ ] 9. （后续批次）旧表单形态退役：45 表单路由删除、12 个旧 UI 测试文件退役、render*/dsl 模块清理——SPA 已接管根路由与新功能，旧路径仅存量可达，无用户面

---

## 1. Oracle 基线先行

### What to build
建立复刻验收的机器判据（PRD D-甲骨文先行）：Playwright devDependency + chromium；对 demo 本体（原型目录起本地 http.server）拍 7 视图截图基线并存 `test/ui/baseline/`（与 `.flow/ui/` 评审截图同视口 1440×900/390×844）；行为断言（Esc 关弹层焦点回归、390px 无整页横溢、dialog 开关、toast）；原型 5 文件字节快照进 `test/fixtures/demo-anchor/` + `scripts/check-demo-anchor.sh` 对外目录做漂移检测（本地手动跑，CI 只对 fixture 断言）。

### Acceptance criteria
- [ ] `npm run test:oracle` 对 demo 本体跑 7 视图截图 + 行为断言全绿
- [ ] 基线截图与行为断言脚本可被移植产物测试直接复用（同函数参数化 baseURL）
- [ ] demo-anchor 快照哈希 = manifest 登记值；漂移脚本输出可读 diff 指引
- [ ] vitest 集成（oracle 套件进 `npm run test`，无 demo 目录时 skip 并显式标注）

### Blocked by
None - can start immediately

---

## 2. 壳与静态视图移植

### What to build
真实服务端长出 SPA：`src/ui/public/`（index.html 壳逐字移植 + style.css + app.js 骨架：esc/渲染循环/事件代理/hash 路由 `#home/#systems/#library/#work/:id/:stage`）；CLI `ui` 内嵌静态服务（tsup 构建进 dist，单命令体验不变）；home（4 示例卡+composer+home-paths）、systems（我的体系=工作区实例发现）、library（指标/方法两 tab+我的模板过滤 chip）三视图渲染真实数据；首批 JSON API：`GET /api/workspace`（实例发现+最近编辑映射）、`GET /api/templates`（7 行业+6 方法——补写 demo 独有三方法 net-change/repeat-review/weekly-review 为 `templates/methods/*.yaml` 纯数据新增）、`GET /api/instances/:id`（demo system 形状 DTO，G1 删除 currentInstancePath 依赖）。边界标签换真话（G9）。

### Acceptance criteria
- [ ] `node dist/cli.js ui` 打开即 demo 壳：侧栏/顶栏/breadcrumb/toast/dialog 与 S00 契约一致（截图对照）
- [ ] home/systems/library 三视图对真实数据渲染，oracle 00/04 视图对照通过（数据值不比对，布局/组件/状态形态比对）
- [ ] hash 路由刷新恢复；`#main` 聚焦与滚顶行为照搬
- [ ] 6 方法模板入 `templates/methods/` 过 lint；`/api/templates` 返回两类
- [ ] API vitest（真实 server fetch）：DTO 形状 + 实例发现白名单语义

### Blocked by
1（基线与断言复用）

---

## 3. NL 创建流

### What to build
一句需求→体系：composer 提交 `POST /api/instances/create-job`（走既有 LLM job 管线，faux 注入沿用）→ generating 视图（demo 形态+轮询 `GET /api/jobs/:id` 1.5s+「停止生成」=客户端放弃+标记弃置）→ 完成即自动落盘 `system-YYYYMMDD-HHMMSS`（G1，蓝图 title 可后改名）→ 进 work overview。刷新生成中→home 保留需求文本，job 服务端跑完不丢（G4）。4 示例点击填充照搬。

### Acceptance criteria
- [ ] faux 下「生成体系草稿」→generating→自动落盘→work 全链 e2e 绿
- [ ] 停止生成：离开轮询后 job 服务端照常完成并落盘（G1+G4：产物不丢，出现在「我的体系」；需求文本保留在 home）
- [ ] 生成中刷新回 home，需求文本保留；job 完成后「我的体系」出现新实例
- [ ] 生成失败态（faux 错误注入）：inline-error + 重试入口，复用 demo 语汇
- [ ] e2e：AT4 前半（metrics preset faux→落盘→进 work）

### Blocked by
2

---

## 4. work 四 stage 只读全景

### What to build
work 视图四 stage（stage 名与切换形态照搬 demo）：体系总览（蓝图卡/问题/假设/证据计划/候选道路/右侧助手栏静态壳）、指标体系（树/表切换、指标卡、pending 派生标注）、场景与方法（场景列表+方法绑定展示+方法卡）、检查与交付（检查行全集+复核状态+交付状态）。`GET /api/instances/:id` DTO 扩全量：blueprint/scenarios(物化+方法模板联查)/metrics(物化)/designIssues/pending 派生（G2 判据）/审核待办计数（G7 数据面）/复核状态/发布状态与新草稿标签派生（G3）。假设判断性质×核验状态分轴呈现照搬。

### Acceptance criteria
- [ ] 四 stage 对 fixture 实例渲染，oracle 01/02/03/06 视图对照通过
- [ ] 检查清单=引擎 designIssues+审核行+复核/口径缺口全集，逐行带缺口位置
- [ ] 「有新工作草稿」标签派生正确（指纹 vs releases 最新）
- [ ] API vitest：DTO 全字段形状 + pending/审核/复核派生正负例
- [ ] 390px 四 stage 无横溢（行为断言复用）

### Blocked by
3（需要 NL 创建的实例走全链）

---

## 5. 写路径 I：设计编辑

### What to build
弹层写路径全接引擎（writeMode 引用完整性+失败就地呈现零写盘语义→toast/inline-error 照搬 demo 语汇）：蓝图编辑（表单→`PATCH /api/instances/:id/blueprint`）、假设判断状态（judgment/verified 分轴）、指标新增/编辑/删除（删除=依赖保护弹层：六路引用就地展示，确认才删）、场景编辑（G8：步骤读方法模板，改步骤→提示另存新方法走既有 save-as-method 落 `templates/methods/`）、口径确认弹层（三问：退款归属/复购窗口/统计说明——U1-b：ModifiedMetricSchema 加可选 caliber_switches+apply 支持，added 指标自带键）。

### Acceptance criteria
- [ ] 引擎加法：ModifiedMetricSchema.caliber_switches（U1-b）单测正负例；既有引擎测试全绿（零语义变更）
- [ ] 蓝图/假设/场景/指标全部写路径 fail-closed：错误结构化透出就地呈现，实例零变化
- [ ] 删除被引用指标：依赖保护弹层列出全部引用方（问题/场景树/角色/绑定/树/公式），阻断直至确认
- [ ] 改场景步骤→另存方法流走通（templates/methods/ 新文件+lint 过）
- [ ] 口径确认三问改写 added 指标 caliber_switches/definition，pending 派生归零
- [ ] Playwright：编辑流弹层 Esc/焦点回归 + 保存后 toast

### Blocked by
4

---

## 6. 写路径 II：复核与交付

### What to build
检查与交付 stage 的真实门：检查视图第 6 行「待人工审核的 AI 指标（N 项）」行内批准/拒绝（走 applyApproval/applyRejection，reviewer=MF_REVIEWER/$USER；G7）；业务复核确认（designIssues 零才可确认，绑定设计快照；失效→重新确认文案照 demo 语义）；交付=自动建议 next patch+一键确认弹层（无输入框，same-content 拒绝结构化透出；G3）；published 块：版本卡+「下载设计包」SAP 直链+「更多格式」行（metricflow/excel/mermaid 直链 GET 保留）。

### Acceptance criteria
- [ ] 审核行批准/拒绝写 reviewed_by/移除，导出阻断解除/收紧实时反映
- [ ] 复核确认门：有缺口时确认按钮禁用+原因；确认后修改设计→失效态呈现
- [ ] 交付流 e2e（faux）：自动版本建议→确认→releases/ 登记+published 块+SAP 直链可下载
- [ ] same-content：无修改再交付→结构化拒绝+demo 语汇 toast
- [ ] AT2 零指标战略全流程（NL→复核→发布）在新形态 e2e 绿

### Blocked by
5

---

## 7. 助手栏与模板资产

### What to build
右侧助手栏（chat 内存态，刷新清空=严格复刻）：提问/指令→蓝图 refine job（轮询）→提案卡「先看建议再采纳」（采纳=preview→apply 引擎门；放弃零改动）；「补充战略视角」等快捷指令照搬。导入：浏览器解析照搬 demo（CSV/JSON+行级错误+1MB/accept）→确认 POST 归一化行落用户草稿模板（incomplete 缺口如实）；「保存指标体系模板」：U1-a 新增 `templates/user/` 宽松装载分支（UserTemplateSchema=指标+元数据，不进 lint 门不进匹配池），library「我的模板」过滤=目录约定；use-template 指标类=fork（带 base）。

### Acceptance criteria
- [ ] 引擎加法：templates/user/ 装载分支单测（装载/过滤/不进 lint 与匹配池）；既有模板链零影响
- [ ] 助手提案采纳/放弃 e2e（faux）：采纳走引擎门（校验失败就地错误）；放弃工作稿零变化
- [ ] AT3 独立数据专题（NL 修正→放弃零改动）新形态 e2e 绿
- [ ] 导入：缺口模板预览→保存→library 我的模板出现→use-template fork 创建
- [ ] 另存指标模板：blank-base 体系（无 dimensions/trees）保存成功并出现在我的模板
- [ ] oracle 04 方法库多语境过滤+浏览断言

### Blocked by
6（助手 refine 依赖写路径；导入依赖 library）

---

## 8. 旧形态退役 + 验收总装

### What to build
删除 45 个表单路由与 12 个旧 UI 测试文件（断言语义已由 T2-T7 新测试承接）；render.ts/render-blueprint.ts/render-home.ts 退役（导出直链 GET 迁移保留）；边界文案全局终检（C 表 24 条 grep 复检无残留）；AT1-AT4 四条验收流 Playwright e2e 全绿；敌意注入 fixture（LLM 输出含 `<img onerror>`/引号）渲染断言；文档：README UI 节+`docs/工作台使用指南.md` 按新交互重写+验收 A14 字面达成登记。

### Acceptance criteria
- [ ] `grep -r "页面无脚本\|纯服务端表单" src/` 零命中；C 表复检脚本零残留
- [ ] 旧测试文件删除后 `npm run lint && typecheck && test && contract-test` 全绿（新测试数 ≥ 迁出断言数）
- [ ] AT1（模板起点→蓝图→交付）/AT2/AT3/AT4 全绿
- [ ] 敌意 fixture：注入内容在指标名/描述/助手回复位置均被转义（DOM 断言无注入元素）
- [ ] README/使用指南/handoff 重写完成
- [ ] verify_command 全量绿 + 证据记录

### Blocked by
7
