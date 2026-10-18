# M3 · 治理闭环 · UI 契约（设置页「调用统计」卡 / 审计降级态 / 预算超限错误页呈现）

> 规格源（只读冻结）：`.flow/proposal.md` + `.flow/prd.md`（D1–D12 + GRILL 附录 G1–G8，esp. G7/G8）。M2 术语与表面血脉：`.flow/archive-m2-20261018/ui-contract.md`——M3 表面**复用**其术语约定（chip 类、就绪/未配置/配置错误/演示模式、来源标签），不得改名或重构 M2 表面；仅允许 D7 要求的**新增卡片**与 G7 要求的**既有错误页新文案呈现**。若实现发现需要新 PRD 需求，返回 BLOCKED 而非在本文件扩权。
> 覆盖面：**仅** M3 三个用户可见表面——设置页新卡「调用统计」（含正常/预算警告/审计降级/faux/空态）、审计降级态（在该卡内呈现）、draft job 错误页的预算超限呈现（沿用现有 `jobErrorPage`，零新页面）。其余表面（首页、草案工坊、CLI/MCP stderr 警告行）一律不在本契约范围。
> 视觉与交互基线：`src/ui/render.ts` 顶部 CSS 既有 token/类/chip 体系（含 M2 §7.3 增量 `.chip-fail`/`a.chip`，已生产化于 render.ts）；**本契约零新增 CSS 类**（§7.3）；零客户端脚本、纯服务端渲染（语义 HTML、原生可聚焦、`:focus-visible` 轮廓）。
> 数据保真：原型演示数据为虚构但形状逐字镜像真实实现——taskId 前缀 `mf:generate-<seq>`/`mf:refine-<seq>`（D6）、AuditEvent 字段名（`version/taskId/runId/sequence/kind/at/provider/model`）、usage 三字段（`modelCalls/inputTokens/outputTokens`，G4）、数据目录 `~/.metric-factory/`（G3：`model-audit.jsonl`(+`.1`)/`model-budget.json`）；链序 per M2 G4 裁决 B（minimax-cn/MiniMax-M3 主 / xiaomi-token-plan-cn/mimo-v2.6-flash 备）。

---

## 1. Surfaces（表面清单，仅此三面）

### SE-A · 设置页 `/settings` 新卡「调用统计」（D7/G8）

**插入位置**：链卡「当前生效链（查看）」之后、覆盖表单卡「模型配置（覆盖）」之前（只读查看类区块连续、与写操作表单分离）。M2 既有五区块（状态卡/链卡/表单卡/清除卡/注脚）的结构、文案、语义**原样保留**；统计卡渲染独立于连接状态——M2 状态 S1–S9 任何基座上均按本契约 ST1–ST5 呈现。数据事实源 = G8 读路径：渲染时只读 `MF_DATA_DIR`（缺省 `~/.metric-factory/`）下两文件 `model-audit.jsonl` + `model-budget.json`（rename 原子、append 尾读安全，无需锁）。

卡内自上而下：

1. **卡标题**：`调用统计`（card-h）。
2. **两行汇总 chip**（G8）：
   - `今日`（chip-queue）+ `<N> 次 · <N> tokens`（`.num` 千分位；本地时区自然日，时间源 = 审计事件 `at`）；
   - `累计`（chip-queue）+ `<N> 次 · <N> tokens`（留存期内口径，见脚注 4）。
3. **预算警告（条件元素）**：任一已配置预算维度用量 ≥80%（G6 固定阈值，无 env）时，在 `累计` 行尾追加 warn chip `预算已用 N%` + 上限小字注记（如 `（tokens 上限 22,000,000）`；调用次数维度为 `（调用上限 <N> 次）`）。N = floor(用量百分比)，超限后为 100；两维均配置且均 ≥80% 时各一枚 chip（tokens 在前）。**未配置上限（G6 缺省不限）→ 恒无任何警告元素**。用量口径 = 账本留存条目聚合（G1）。
4. **按模型表（累计口径）**：引导行 `按模型（累计，留存期内）：` + `.tbl` 表（`th scope="col"`）；列 = 模型（`provider/model-id`，mono）｜调用次数｜tokens（in+out）｜generate 次数｜refine 次数（用途拆分 = taskId 前缀红利，D6/D1；按模型计数取 `model.admitted`/`model.finished` 而非 `run.started`，G8）；末行 `合计` 勾稽汇总行（行内 generate+refine = 调用次数，行和 = 汇总 chip 数字）。行集 = 账本/审计中**实际出稿过**的模型——主备容灾回退后备候选照常成行（mimo 行非零即回退真值，D5 验收场景）。
5. **留存脚注**（composer-note）：`tokens 为 input+output 合计；累计 = 审计与账本留存期内（审计文件 50MB × 2 代轮转、预算账本 FIFO 剪老，仅统计留存条目）。`

设置页统计卡状态（one file per state，见 §7.2）：

| 态 | 场景 | 呈现 |
|---|---|---|
| **ST1 正常** | 真实后端、账本有条目、未配置预算上限 | 全卡（两行 chip + 按模型表 + 留存脚注）；无任何警告元素 |
| **ST2 预算警告** | `MF_LLM_BUDGET_TOKENS=22,000,000`，累计 18,354,209（83.4%） | ST1 + `累计` 行尾 `预算已用 83%` warn chip + `（tokens 上限 22,000,000）` 小字；表格照常（警告为叠加态，非残缺态） |
| **ST3 审计降级** | UI server 进程内审计写盘失败（D3 never-throw：I/O 异常吞掉 + 一次性降级标志置位） | 卡顶 `审计降级` warn chip + 一句说明（写盘失败改内存丢弃、调用不受影响）；`今日` 行 = `不可用（时间口径来自审计文件）`；`累计` 行照显（账本源）；按模型表塌缩为单行——模型列与 generate/refine 列 = `不可用`，调用次数/tokens = 账本聚合总量；追加降级脚注（含「标志仅反映当前工作台进程」披露，R2 探索即答②） |
| **ST4 faux** | `MF_LLM_BACKEND=faux`（D9 工厂短路） | **整卡替换**为说明：`演示模式` chip-accent + `faux 不记账：…`——零数字、零表格、零脚注（历史真实数据亦不显示；faux 零文件依赖，US10） |
| **ST5 空态** | 真实后端、账本零条目（刚启用/账本刚清/文件不存在） | 两行 chip 显示 `0 次 · 0 tokens`；表格位置为一句 `暂无调用记录…`；留存脚保留 |

> 边界披露：账本/审计文件不存在或不可读按 ST5 空态呈现；「append 尾读半行跳过」之外的文件损坏呈现 PRD 未定义——本契约不发明新态（如需要「账本损坏」专属 UI 态，须回 PRD，BLOCKED 边界）。

### SE-B ·（同卡）审计降级态语义（D3/G8/R2②）

降级的**唯一** M3 UI 呈现位置 = 统计卡（D7「审计降级态在此页呈现」）。语义钉死：

- **token 总量照显**（账本源）：`累计` 行次数与 tokens 来自 `model-budget.json` 聚合，与审计 sink 无关。
- **模型/时间列标 `不可用`**：模型归因、今日/累计时间窗（审计 `at`）、generate/refine 用途拆分（taskId 前缀）均源自审计事件——降级期间这些数据未落盘，**不得**以链配置推断或任何估计值充数。
- **脚注说明降级含义**：`审计降级：审计 JSONL 写盘失败，本次进程内的调用改为内存丢弃、不落盘；模型调用不受影响。模型归因与时间口径依赖审计文件，故标「不可用」。降级标志仅反映当前工作台进程（CLI/MCP 进程的降级不在此显示）；写盘恢复或重启后新调用重新落盘。`
- 标志为一次性、进程生命周期内粘滞（D3）；跨进程不可见为已披露限制（R2 探索即答②，单用户可接受）。

### SE-C · draft job 错误页 `/drafts/jobs/:id` —— 预算超限呈现（D4/G7，零新页面）

沿用现行结构（server.ts 422 + `jobErrorPage`，render-drafts.ts）：卡标题 `AI 草案生成失败`（现行原文）+ `error-list`（`job.error` **原文透传**，单 `<li>`）+ 既有两按钮（`返回重试` → `/drafts`、`检查模型设置` → `/settings`）。当错误含「预算已耗尽」时，message 即 pi-client 错误组装点（G7）拼装的**四要素文案**，契约钉死模板：

```
预算已耗尽：本次模型调用被预算上限阻断。<维度> 已用 <X> / 上限 <Y>。账本文件：<绝对路径>。两条出路：1) 调高或取消上限（环境变量 <MF_LLM_BUDGET_TOKENS | MF_LLM_BUDGET_CALLS>）；2) 删除账本文件重新计数。
```

- `<维度>` ∈ `tokens（input+output 合计）` ｜ `调用次数`；X/Y 千分位。
- 超限语义（红线）：只阻断**新的 LLM 调用发起**；已产草案的人审/导出不受影响（US2/D4——错误文案不展开此句，四要素即全部）。
- UI 对该错误**零结构改动、零新路由、零新页面**；`issues` 为空数组（预算错误无输出校验条目）；内部错误码 `BUDGET_EXHAUSTED` 不进页面文案（测试断言用，非用户词）。

---

## 2. Click paths（入口 → 动作 → 结果态）

| # | 入口 | 动作 | 结果态 |
|---|---|---|---|
| 1 | GET `/settings`（真实后端，账本有条目，未设上限） | 查看 | **ST1** |
| 2 | GET `/settings`（已设上限且用量 ≥80%） | 查看 | **ST2**（N = floor 百分比；超限后 N=100；未设上限恒不出现） |
| 3 | GET `/settings`（UI server 进程审计写盘曾失败） | 查看 | **ST3**（一次性标志，进程生命周期内粘滞） |
| 4 | GET `/settings`（`MF_LLM_BACKEND=faux`） | 查看 | **ST4**（M2 S6 基座 + faux 不记账卡） |
| 5 | GET `/settings`（真实后端，账本零条目/文件不存在） | 查看 | **ST5** |
| 6 | `/drafts` 提交生成/微调 → fire-and-forget job → `complete()` 抛 `BUDGET_EXHAUSTED` | 轮询 `/drafts/jobs/:id` 至 error | **F1** 错误页（四要素原文，G7：三入口零额外改造即「点名预算」自带解除指引） |
| 7 | F1 页 `检查模型设置` | 点击 | GET `/settings` → ST2（此时用量 ≥100% → `预算已用 100%`，同一态不新设） |
| 8 | 预算解除（调高/取消 env 上限，或删除 `model-budget.json`，US8）后重试 | 再次提交 | 恢复生成；GET `/settings` 按新账本回 ST1/ST2/ST5 |
| 9 | 统计卡内 | — | **无任何动作**（纯只读卡：无控件、无表单、无链接） |

**Loading / empty / partial / failure 状态汇总**：
- **loading**：无局部加载态——纯服务端整页渲染（零脚本基线）。
- **empty**：ST5（账本零条目）；ST4（faux——不是数据空，是不记账）。
- **partial**：ST3（降级：账本聚合可见、审计归因不可用）；ST2 为叠加警告非残缺。
- **explicit failure**：F1（预算超限四要素错误页）。ST3 是**呈现降级**不是调用失败（调用不受影响，US6）。

---

## 3. Affordances（控件、键盘/焦点、可达性——项目现行 plain-HTML 基线）

- **统计卡纯只读**：卡内无 `<input>`/`<button>`/`<a>`/tabindex——不进键盘焦点序列；阅读流 = 文档顺序（标题 → 汇总行 → 表格 → 脚注）。数字单元格用 `.num`（tabular-nums），模型名用 `.mono`。
- **表格语义**：`<th scope="col">` 语义表头（M2 链卡先例）；表格外包 `overflow-x:auto` 防窄屏裁切（现行惯用法）。
- **chip 语义**（`<span>`，非链接、不可聚焦）：`今日`/`累计` = `chip-queue`（中性标签，非状态）；`预算已用 N%` = `chip-warn`；`审计降级` = `chip-warn`；`演示模式`（faux 卡内，沿用 M2 词）= `chip-accent`。统计卡内无 chip-ok/chip-fail 用例。
- **焦点顺序**（设置页整页，原生 tab 无重排）：状态卡文本 → 链卡表格（只读）→ **统计卡（只读，零焦点目标）** → 表单 模型→密钥→网关→保存 → 清除按钮 → 注脚；`:focus-visible` 轮廓沿用 CSS 既有规则。
- **错误页沿用既有 affordance**：`error-list`（现行结构，无 role 属性——与 render-drafts.ts 逐字一致）+ 两链接按钮（原生可聚焦）。
- **可达性**：`lang="zh-CN"`；无 `aria-live`/无脚本（整页渲染语义）。
- **零脚本不变式**：全部原型文件/生产实现不含 `<script>`；交互全部为原生表单提交与链接导航。

---

## 4. Terminology（用户可见文案，钉死——不得改名或另造）

| 钉死文案 | 使用处 |
|---|---|
| `调用统计` | 卡标题（ST1–ST5 通用） |
| `今日` / `累计` | 汇总行 chip（今日 = 本地时区自然日；累计 = 留存期内） |
| `<N> 次 · <N> tokens` | 汇总行数字体（千分位，`.num`） |
| `预算已用 N%` | warn chip（仅已配置上限且 ≥80%；N = floor，超限 = 100） |
| `（tokens 上限 <N>）` / `（调用上限 <N> 次）` | warn chip 后小字注记 |
| `审计降级` | ST3 卡顶 warn chip |
| `不可用` | ST3 模型/时间/用途单元格与今日行 |
| `faux 不记账：当前确定性 faux 后端零网络、零文件，调用不写审计与预算账本，无统计数据；配置真实模型后，统计自真实调用开始累计。` | ST4 整卡说明（`演示模式` chip-accent 开头） |
| `累计 = 审计与账本留存期内` | 留存脚注核心句（后接 `（审计文件 50MB × 2 代轮转、预算账本 FIFO 剪老，仅统计留存条目）`） |
| `按模型（累计，留存期内）：` | 表格引导行 |
| `模型` / `调用次数` / `tokens（in+out）` / `generate 次数` / `refine 次数` / `合计` | 表列头与末行 |
| `暂无调用记录——第一次真实调用（生成/微调草案、CLI、MCP）后，此处开始按模型累计。` | ST5 空态说明 |
| `预算已耗尽` / `已用 <X> / 上限 <Y>` / `账本文件：<绝对路径>` / `两条出路` | F1 四要素（模板见 §1 SE-C） |
| `AI 草案生成失败` / `返回重试` / `检查模型设置` | F1 沿用 `jobErrorPage` 现行原文，不改 |
| M2 全部钉死文案（`就绪`/`未配置`/`配置错误`/`演示模式`/来源标签/遮蔽警告句式等） | 设置页既有卡原样沿用（M2 契约 §4 对既有表面继续有效） |

**数字格式**：次数与 tokens 千分位分组（如 `18,354,209`）；百分比整数无小数；tokens 恒为 input+output 合计口径。**不发明新词**：不出现「用量看板」「成本」「余额」「配额」等 PRD 外词汇；无金额/货币折算（PRD Out of Scope）。

---

## 5. Negative cases（禁止路径——验收时逐条反证）

1. **统计永不显示密钥/prompt 明文**：卡内只有 digest 类聚合数据（次数、tokens、provider/model-id）；连 AuditEvent 的 `digest` 字段也不展示（页面无此粒度）。（US11/D11/proposal 红线）
2. **faux 恒「不记账」**：ST4 无数字、无表格、无脚注；即使账本有历史真实数据也不显示（G8 整卡替换）；不得显示任何假造统计数。（D9/US10）
3. **降级不给假模型列**：ST3 模型/时间/用途单元格恒 `不可用`，仅账本聚合（累计次数/tokens）照显；不得以链配置推断模型归因充数。（G8）
4. **预算警告只在配置了上限时出现**：缺省不限（G6）→ 恒无 warn chip；阈值固定 80%，无 env、不可配置、不可关闭。
5. **统计卡不得改变 M2 既有卡片结构与语义**：只插入新卡；状态卡/链卡/表单卡/清除卡/注脚及全部 M2 钉死文案原样。（D7）
6. **不做提交前预算拦截弹窗**：无预检 confirm/modal/拦截页；超限唯一 UI 呈现 = 调用后 F1 错误页（G7 双真相源：真值在账本 settle，提交时预读会造假象）。
7. **统计卡只读**：无「清账本」「调上限」按钮或链接；解除 = env/文件操作（US8）。增设任何写操作 = 新 PRD 需求 → BLOCKED。
8. **F1 不新增页面、不改结构**：`jobErrorPage` 原结构原文；不挂「模型原始输出」类误导标题（UI 恒不显示模型原始输出；该 G7 项属 CLI stage:call）；内部错误码 `BUDGET_EXHAUSTED` 不进页面。
9. **预算 UI 元素不出现在首页/草案工坊**：仅统计卡 warn chip + F1 错误页（G7 警告呈现清单 exhaustive）；drafts 页 llm 卡不变。
10. **无金额计价**：不折算货币、不显示单价/费用/余额。（PRD Out of Scope）

---

## 6. Trace links（表面/状态 ↔ PRD 溯源）

| 表面/状态 | PRD 溯源 |
|---|---|
| ST1 正常 | US5、US9、D1、D6、D7、G8（两行 chip + 按模型表口径） |
| ST2 预算警告 | US3、G6（双维度/缺省不限/80% 固定）、G7（UI warn chip）、G1（留存条目口径） |
| ST3 审计降级 | US6、D3（never-throw + 一次性降级标志）、G8（token 照显/模型时间不可用）、R2 探索即答②（进程态可见性脚注） |
| ST4 faux | US10、D9、G8（整卡换说明）、proposal 红线（faux 零网络/零文件） |
| ST5 空态 | US5、G8（读路径只读两文件） |
| F1 超限错误页 | US2、US8、D4（`BUDGET_EXHAUSTED` → pi-client 点名预算）、G7（四要素 + 不做预检 + 三入口零改造）、G1；既有结构 = render-drafts.ts `jobErrorPage` + server.ts `/drafts/jobs/:id` |
| 负 1 密钥/明文 | US11、D11、proposal 红线 |
| 负 6 无预检弹窗 | G7 |
| 负 7 只读无解除按钮 | US8（解除 = env/文件操作） |
| 负 9 元素位置约束 | G7、D7 |

---

## 7. Visual artifact（必需产出——静态 HTML 原型集）

### 7.1 格式声明 + 数据保真

- **格式**：静态 HTML 集，一文件一状态；每个文件为完整独立页面（双击可开），`<style>` 内嵌 `src/ui/render.ts` 顶部 CSS **全量逐字副本**（含 M2 §7.3 增量——已在生产 render.ts 内）；**零 `<script>`**、零外部依赖（logo 走仓库内相对路径 `../../assets/juanerai-logo-slogan.png`）。
- **演示数据**（虚构但守恒，形状逐字镜像真实实现）：
  - 基座 = M2 S1 设置页（自动发现全链：主 minimax-cn/MiniMax-M3 + 备 xiaomi-token-plan-cn/mimo-v2.6-flash，`自动发现 · pi CLI` + 打码 `****e2f9`/`****7c0a`，链外 5 家）；ST4 基座 = M2 S6（演示模式、无链卡）。
  - 今日 12 次 = MiniMax-M3 9（generate 6 / refine 3）+ mimo 3（generate 2 / refine 1）；今日 tokens 2,152,486 = 1,744,262 + 408,224。
  - 累计 87 次 = MiniMax-M3 68（generate 43 / refine 25）+ mimo 19（generate 12 / refine 7）；累计 tokens 18,354,209 = 15,236,918 + 3,117,291。**mimo 行非零 = 主备容灾回退真值**（D5/proposal 验收场景）。
  - ST2：`MF_LLM_BUDGET_TOKENS=22,000,000` → 18,354,209 / 22,000,000 = 83.4% → floor = 83。
  - F1：同账本后续调用至 22,047,513 ≥ 22,000,000 触发阻断；账本路径 = `/Users/demo/.metric-factory/model-budget.json`（G3 缺省 `~/.metric-factory/` 的虚构用户展开）。
  - 字段名保真：taskId = `mf:generate-<seq>` / `mf:refine-<seq>`（D6）；AuditEvent = `version/taskId/runId/sequence/kind(run.started|model.admitted|model.finished|run.finished)/at/provider/model`（按模型计数取 `model.admitted`/`model.finished`，G8）；usage = `modelCalls/inputTokens/outputTokens`（G4）；文件 = `model-audit.jsonl`(+`.1`) / `model-budget.json`（G3，50MB × 2 代轮转）。
- **原型内链接**：`index.html` 导航至各状态文件；设置页表单 action 沿用生产路径（`/settings/save`、`/settings/clear`）；错误页两按钮按生产路径 `/drafts`、`/settings` 书写（M2 同惯例：既有表面不因原型改路径）。

### 7.2 文件清单（全部位于 `.flow/ui/`，均已落盘）

| 文件 | 状态 | 一句话说明 |
|---|---|---|
| `index.html` | 导航 | ST1–ST5 + F1 ↔ 文件对照表 + 原型约定 |
| `settings-stats-normal.html` | ST1 | S1 基座 + 全卡：两行汇总 chip + 按模型表（含 mimo 回退行 + 合计勾稽）+ 留存脚注；无警告元素 |
| `settings-stats-warn80.html` | ST2 | 同 ST1 + `累计` 行尾 `预算已用 83%` warn chip + `（tokens 上限 22,000,000）` |
| `settings-stats-degraded.html` | ST3 | `审计降级` warn chip；今日 = `不可用`；累计照显（账本源）；表塌缩单行（模型/用途 = `不可用`）；降级脚注（进程态披露） |
| `settings-stats-faux.html` | ST4 | S6 基座（演示模式、无链卡）+ `faux 不记账` 整卡替换 |
| `settings-stats-empty.html` | ST5 | `0 次 · 0 tokens` 两行 + `暂无调用记录…` + 留存脚注 |
| `job-error-budget.html` | F1 | drafts 错误页现行结构 + 四要素原文（tokens 维度样例，83% 快照之后越过上限） |

### 7.3 CSS 增量声明（对照 M2 §7.3 惯例）

**零新增类。** 全部复用 `src/ui/render.ts` 既有类：`card`/`card-h`/`tbl`（+ `th scope`）/`chip`/`chip-queue`/`chip-warn`/`chip-accent`/`num`/`mono`/`composer-note`/`error-list`/`btn`/`btn-row`。M3 无任何新视觉语言；生产实现无需向 render.ts 增加一行 CSS。

### 7.4 生产落点（爆炸半径声明，非本契约实现物）

`src/ui/render-settings.ts`（新增 statsCard 渲染分支，组装位 = 链卡后表单前）、`src/ui/server.ts`（GET `/settings` 读 `MF_DATA_DIR` 两文件 + 审计降级 getter（进程态）+ 预算上限 env；无新路由）、`src/llm`（pi-client 四要素错误模板 / 审计 sink / 预算 store——后端落点，非 UI 契约实现物）。**F1 零 UI 代码改动**（`job.error` 原文透传即可）。与 PRD Further Notes（src/ui = 设置页统计卡片 + 降级态）一致。
