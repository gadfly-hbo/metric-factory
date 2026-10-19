# Handoff · A2 批次（2026-10-19，commit 43c1a7e）· UI 重构：评审原型严格复刻

> dev-flow 全程走完（红队 GO → PRD/GRILL G1-G9+U1 → UI-GATE 批准 → 8 切片 → 3 轮评审收敛 → SHIP 两拍复跑后提交推送）。前序 A1 交接见 `.flow/archive-a1-20261018/handoff.md`。

## 已交付（T1-T8）

- **复刻 oracle（T1）**：`test/ui/oracle/`（flows.mjs 可导入核心 + capture.mjs CLI）——demo 7 视图骨架（组件级折叠：19 类重复列表+context-row/recent 只比首子形态）+ 几何锚（内容高度锚只比宽）+ 行为断言（dialog 原生/Esc 焦点回归/390px 无横溢/skip-link）；防漂移锚 = `test/fixtures/demo-anchor/`（5 文件字节快照 + hashes.txt）+ `scripts/check-demo-anchor.sh`（--refresh 重锚后必须重拍基线+重过 UI-GATE）。
- **SPA 壳与读面（T2）**：`src/ui/public/`（index.html/style.css 逐字节==demo/app.js/api.js）；hash 路由；`/api/workspace|templates|instances/:id|llm-status`；tsup publicDir（静态进 dist 根，server 端目录回退解析）；方法库扩 6（demo 独有三方法 net-change/repeat-review/weekly-review）。
- **NL 创建（T3）**：`POST /api/instances/create-job` → 轮询 `GET /api/jobs/:id` → 自动落盘 `system-<ts>[-N]`（同秒唯一化）进 work；失败/停止诚实态；生成中刷新回 home+需求 sessionStorage 保留（G4）。
- **work 四 stage（T4）**：DTO 全量（LA1 映射表落实现）；镜像 fixture（operating/strategy 与 demo 预设逐区块同构）支撑 v01-06 对照。
- **写路径 I（T5）**：`src/ui/api-write.ts` 统一 `writeWithGate`（writeMode 门，失败零写盘结构化透出）——蓝图/假设（判断分轴）/证据/指标 CRUD（六路引用依赖保护）/场景（改步骤→另存新方法 G8：methodYamlFromScene+冲突409+失败回滚）/绑定（中文角色↔engine role）/口径确认（U1-b）。
- **写路径 II（T6）**：G7 第 6 检查行（待审 AI 指标行内批准/拒绝）；复核确认（designIssues 零门+design_fingerprint）；交付=自动 next patch+same-content 422 复刻串+releases 落盘；published 块+SAP 直链+多格式导出直链（全量门）。
- **助手与模板资产（T7）**：refine job→提案卡先看建议再采纳/放弃（AT3 字节级零改动）；`POST /scenes`（方法→场景）；U1-a `templates/user/`（宽松装载/不进 lint 门/「我的模板」过滤/另存/导入浏览器解析）；`/api/templates/use` fork。
- **验收总装（T8）**：AT1-AT4 全绿；敌意注入 DOM 断言；C 表 24 条 grep 复检（运行时下发文本）；README/使用指南重写。

## 版本身份

| 身份 | 版本 | 位置 |
|---|---|---|
| UI 规格 | 评审原型 v0.2 严格复刻（SHA 锚定） | `test/fixtures/demo-anchor/` |
| AnalysisBlueprint / ScenarioSpec | v0.1 / v0.2（不变） | 引擎 |
| UI 契约 | `.flow/ui-contract.md`（S00-S12+M01-M20+57 动作+C 表） | 已入库 |
| 提交 | **`43c1a7e`**（81 文件 +9850/−283，已推送 origin/main 9b8b163..43c1a7e 含 A1 `56ce721`） | |

## 架构要点（后续批次既有事实）

- **oracle 纪律**：改 demo 复刻面（public/ 三件）必须先过 `node test/ui/oracle/capture.mjs --base <demo> --mode compare`；demo 目录若被更新 → `check-demo-anchor.sh --refresh` + 重拍基线 + 重过 UI-GATE。
- **子路由正则陷阱**：`/api/instances/:id/(seg)/...` 的 writeMatch 中组已消费 seg——子匹配用 `rest.match(/^\/...$/)` 不带 seg 前缀（评审 F1 根因之一）。
- **GET 实例路由单段化**：`([^/]+)$`——否则吞 `/export/:format` 子路径。
- **写门唯一真相**：所有实例 mutation 走 `writeWithGate`（构造型路由 from-template/user-preview 也过 writeMode——评审 F5）。
- **测试形态**：Playwright 进程内（vitest 里 dynamic import chromium；playwright 库无 expect——用 waitFor+textContent）；faux 注入 writeManagedEnv；spa-at 的 AT 流有顺序依赖（AT1 交付供 F1 断言 delivered）。
- **mf-need 生命周期**：生成时写 → 进 work 清理（刷新保留仅限生成中，G4）。
- **同秒目录唯一化**：create-job/from-template 的 system-<ts> 冲突追加 -N。

## T9（后续批次，用户已追认延期）

- 45 旧表单路由删除（server.ts 中 `/init/*`、`/import*`、`/instance/*`、`/blueprint/*`、`/drafts/*`；**保留** `/settings`（LLM 配置工具页）与导出直链依赖）
- 12 个旧 UI 测试文件退役（server/scenario/release/receipts/export-download/sap-download/blueprint(A1)——断言语义已由 spa-* 系列承接；settings 测试保留）
- `render.ts`/`render-blueprint.ts`/`render-home.ts`/`render-wizard.ts`/`render-drafts.ts`/dsl.ts 收缩（layout/settings 相关保留）
- 退役判据：`npm run test` 全绿 + `grep -c '页面无脚本' src/`=0（已达成）+ 路由计数归零

## 未验证项披露

- 真实 LLM 冒烟未跑（refine/create 提示词出稿仅 faux 背书；质量评估待真实模型）。
- JuanerAI 消费 blueprint/零指标包未验证（A1 起持续披露；本批无消费面变更）。
- oracle 截图基线未做像素 diff（PNG 仅人工复核用；机器判据=骨架+几何+行为）。

## 评审记录

3 轮新鲜评审员（verdict FAIL→FAIL→FAIL-with-预declared-PASS-条件）：
- cycle1：F1 systems 崩/F2 C 表 4 残留/F3 G4 未实现/F4 路由未退役+F5/S1-S7
- cycle2：C11 残留（漏「事实」二字）+banlist 虚报；其余确认
- cycle3：仅 spa-deliver 2 行诊断 console.log；评审员预declared「清掉即 PASS」→ 已修+复跑绿（预算 3 轮用尽，以预declared 判据+证据闭合，特此披露）
- F4 延期经用户追认（2026-10-19，「追认延期+提交推送」）

## 工作区残留

- `.codebase-memory/`、`my-instance/`、`.flow/archive-m3-20261018/state.json`（baseline_dirty，不入库，待用户决定）
