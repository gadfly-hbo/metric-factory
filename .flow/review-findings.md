# 批次 1 · REVIEW#1 评审报告（2026-10-12，新鲜只读评审员）

> 评审对象：review_base da69a061cd48588c86ee0219b9bdcce12689478e 起的全部改动。规格源仅限冻结工件（proposal/prd/tasks/ui-contract + 消费指引）。原文落盘，未删改。

## 裁决：PASS

7 项发现（0 High / 2 Medium / 5 Low），无阻断项。核心不变量、契约逐字面、双指纹对账、fail-closed 纪律均经独立验证成立；两项 Medium 均为可低成本跟进的契约细节与测试缺口，不动摇批次验收。

## 验证证据（评审员重跑，非转述）

- `npm run lint && npm run typecheck && npm run test && npm run contract-test` → **exit 0**：lint 7 模板 PASS、typecheck 净、vitest 46 文件 **279/279 全绿**、contract-test 1/1、墙钟 ~22.6s。**与冻结记录证据一致，无"记录与实际不符"发现**。
- **独立双指纹对账**（esbuild 抽取 `src/sap/canonical.ts` 至 /tmp 重算，不经被测代码路径）：`releases/index.yaml` 的 content/package 指纹、快照内 `package.fingerprint` 三者全部 MATCH；快照字节级 canonical（`canonicalize(parse(file)) === file`）。
- **可复现性**：当前 HEAD 重新 `release examples/net-sales-instance.yaml 1.0.0` → 内容指纹与已入库条目逐字节相同（`sha256:f8a9d88e…`），package 指纹因时间成分不同——G10"同内容必同指纹（同一构建内）"端到端复现。
- **G1 旗标行为实测**：`release <inst> --version 1.0.0` → 打印 `0.1.0`、exit 0、零写盘（动作未执行），与 GRILL G1 记载一致。
- 原型 7 状态文件零 `<script>`；T-13/T-14 原型文案与实现逐字一致。

## Spec 轴核验通过项（抽样列举）

- **G10 五键内容指纹**：`src/sap/canonical.ts:121-128` 置空 fingerprint/created_at/exported_at/version/namespace，保留 id 与 generator；单测逐键断言（含 generator 漂移必变、id 保留）。
- **三类拒绝全部 fail-closed 且有零写盘负例**：同 id@version（`src/sap/release.ts:189-196`，错误含"已发布于…请升级版本号"）、index 损坏（`release.ts:148-170`，不重建、指引 git 恢复）、非法版本写盘前拒（`release.ts:174-180`，semver 天然排除路径分隔符）；append-only 有字节级断言（`test/cli/release.e2e.test.ts:112-114`）。
- **UI 七状态 + 术语**：T-01～T-17 在 `src/ui/render.ts:262-337` 与 `src/ui/server.ts:673-781` 逐字落位（含 T-13/T-14/T-15 服务端拼接串）；boundary T-16 双处同步（render.ts:187 + 使用指南:7）；N1–N12 未发现违反（导出按钮零改动、无历史列表、无发布人输入、成功不走 303）。
- **净销售样板**：勾稽前提写入 definition（红队 R4）、场景四角色、无 bindings（快照 `bindings: 0`）、fork 基 `ecommerce-marketplace@0.1.0`；validate/diff/SAP 导出/发布全链测试通过。
- **消费指引**：PRD #10/#11 全语义点覆盖（含 kind 三枚举、双指纹、question_tree 非执行路径、generator 漂移、勾稽前提、取得禁 latest）。
- **G2/G4/G8/G9**：export 不写登记、MCP 零改动、无发布人输入、发布产物入库且可对账。

## 发现清单（按严重度）

| # | 严重度 | 位置 | 描述 | 归属上游 | 复检标准 |
|---|---|---|---|---|---|
| 1 | **Medium** | `src/ui/render.ts:300`、`src/ui/render.ts:306` | R4/R7 错误列表 `<ul class="error-list" role="alert">` 无 `id="release-issues"`，而 `render.ts:316` 给版本输入框挂 `aria-describedby="release-issues"` → 悬空 ARIA 引用。UI 契约 §3.2 钉死"版本号输入框 aria-describedby 指向错误列表 id"；同仓先例场景表单（`render.ts:505-510` 的 `id="scn-errors"`）做法正确 | spec（ui-contract §3.2） | 渲染 R4 页面，`getElementById("release-issues")` 命中即通过 |
| 2 | **Medium** | `test/cli/release.e2e.test.ts`（缺失） | 任务 1 验收第一条"`release … --version` 无效语法被 commander 拒绝"无测试覆盖。行为本身正确（本人实测：打印 0.1.0、exit 0、`/tmp` 目标目录未创建），属缺失负例非行为缺陷 | task（切片 1 验收） | 补一条 spawnSync 断言 stdout 含 `0.1.0` 且 releases 目录不存在 |
| 3 | Low | `src/cli/index.ts:996` | CLI 成功输出仅打印 index 路径，未含追加序号 N；G6 冻结"index 追加位置"，UI 侧已展示"追加为第 N 条"，`result.indexEntryNumber` 在 CLI 路径未使用 | spec（PRD G6） | 运行 release 查看输出是否含条目序号，或确认"路径即位置"为已裁决读法 |
| 4 | Low | `src/ui/server.ts:758-768` | `ExportBlockedError` 捕获分支不可达：`releaseInstance` 内 `validateInstance`（不跳审核门，`src/engine/validate.ts:43`）与 `assertExportable`（`src/export/gate.ts:16`）条件完全同集，前者必先抛 `ReleaseError`；且该分支自组文案"…完成审核后才能发布"非引擎原文，与 T-12"消息直取引擎不新造"不符（实际可达路径用的是引擎原文，无用户可见影响） | implementation | 删除该分支后全量测试仍绿即证实不可达 |
| 5 | Low | `.flow/tasks.md:11`、`.flow/prd.md:51` | 两处规格文本仍写内容指纹"置空**三键**"，与 PRD 决策 #4（G10 用户批准的五键）自相矛盾；实现/测试/指引均为五键（正确侧）。冻结工件内部不一致，易误导后续维护者"改回"三键 | spec / task | 两行改为五键表述后与 PRD #4 一致 |
| 6 | Low | `src/sap/release.ts:106-146` | `findBaseTemplate`/`loadMappingForRelease` 重实现了 `src/cli/index.ts:44-70,97-121` 的 `discoverTemplates`/`loadMapping`/`defaultMappingPath`（抛错变体）。当前语义逐条等价（含"自动发现损坏静默忽略"），"零第二套规则"在规则函数层成立（同一套 loadInstance/materialize/validateInstance/assertExportable/assembleSap/validateSapPackage），仅编排层重复，存在未来漂移风险——Fowler Duplicated Code，判断性意见 | implementation（Standards） | 抽出共享的抛错变体供两处调用 |
| 7 | Low | `test/cli/examples.e2e.test.ts:45-49` | 测试函数内用 `require()` 重复引入并遮蔽文件顶部已有的同名 ESM 导入（`mkdtempSync`/`readFileSync`/`existsSync`/`tmpdir`/`join`/`parseYaml`）；vitest 转换下可跑，纯 ESM 执行会破，且属无意义重复 | implementation（Standards） | 删 require 行后测试仍绿 |

**信息级**（不计入发现）：`.flow/tasks.md` 各切片验收复选框均未勾选（`- [ ]`）而切片级已 `[x]`，流程簿记未同步；`.flow/archive-v5-20261012/` 为上一批工件的忠实归档迁移（含根目录删除的 `review-findings.md`），未见异常。

## 结论

批次 1 五条验收标准（proposal §验收）全部经独立证据成立：双发布登记可对账（含重算 + 复现）、同内容指纹稳定且版本递增触发警告、口径翻转指纹必变且旧快照字节不变、同 id@version 拒绝有测试、样板全链通过、全量回归零破坏。建议实现方在 SHIP 前顺手处理发现 #1（补 `id="release-issues"`）与 #2（补 G1 负例测试），其余可随后续批次消化。未实施任何修复。


---

# REVIEW#2 报告（2026-10-12，裁决 FAIL——当时漏存，现补记原文摘要）

裁决 FAIL：F1/F2/F4 证实、F3/F6 确认未动（符合声称），但 F5 与 F7 的修复声称不实——两处替换在工作区未发生（tasks.md:15 与 prd.md:51 仍为三键；examples 测试 45-49 行 require 残留）。属"声称完成实际未做"的流程失真，非行为缺陷。门重跑 exit 0（280/280），无行为回归，登记产物未污染。复检标准：grep 三键活文本零命中 + require 零命中。详见对话冻结记录与 REVIEW#3 报告的交叉引用。

---

# REVIEW#3 报告（2026-10-12，裁决 PASS）

五点复检全部核验通过：门重跑 exit 0（280/280，= REVIEW#1 279 + G1 负例）；F5 落地（tasks.md 三键零命中、prd.md:51 五键；prd.md:38 的"三键下"为 G10 修订依据句，主张成立）；F7 落地（require 零命中，行为面断言未掏空）；diff 无扩散（mtime 分层佐证）。

发现 1 项（Medium，范围外）：.flow/proposal.md:24 规格正文仍写三键且无 G10 标注——控制器已在该文件就地追加 G10 修订标注（保留原文），规格链活文本清零。信息级：red-team.md 三键为红队历史攻击记录，不改；REVIEW#2 时点无落盘报告的流程缺口已以本文件补记修正。