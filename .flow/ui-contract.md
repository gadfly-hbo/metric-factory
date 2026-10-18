# M2 · 零配置体验 · UI 契约（设置页「查看+覆盖」/ 首页芯片四分支三态）

> 规格源（只读冻结）：`.flow/proposal.md` + `.flow/prd.md`（含 Diff-gate 附录 ①A②A、GRILL 附录 G1–G9 与 G4 裁决 B）。本契约从其推导，不新增 PRD 需求、不改任何已定决策；若实现发现需要新 PRD 需求，应返回 BLOCKED 而非在本文件扩权。
> 覆盖面：**仅** M2 两个用户可见表面——`/settings`（降级为「查看+覆盖」）与首页（`/`）AI 模型状态芯片行。其余表面一律不在本契约范围。
> 视觉与交互基线：`src/ui/render.ts` 顶部 CSS 既有 token/类/chip 体系 + §7.3 声明的两条最小 CSS 增量；零客户端脚本、纯服务端渲染（项目现行 plain-HTML 基线：语义 HTML、label 关联、原生可聚焦、`:focus-visible` 轮廓）。
> 数据保真：原型演示数据为虚构，但形状逐字镜像真实实现——`maskKey`（src/ui/env-file.ts）输出 `****`+末 4 位；错误文案逐字取自 `src/llm/index.ts` 工厂急错与 `src/ui/server.ts` 设置 422 文案；链序 per G4 裁决 B（minimax-cn/MiniMax-M3 主 / xiaomi-token-plan-cn/mimo-v2.6-flash 备）。

---

## 1. Surfaces（表面清单，仅此两面）

### SE-A · 设置页 `/settings` —— 「查看 + 覆盖」（D7/G5/G6/G9）

页面自上而下四个区块 + 一条注脚：

1. **状态卡「AI 模型连接」**：一个语义状态 chip（就绪/未配置/配置错误/演示模式，色映射见 §4）+ 一句上下文说明；错误态追加 `error-list`（`role="alert"`）呈现工厂报错**原文**（G7：工厂报错只含变量名不含 key 值，已逐条核实可透出）。
2. **链卡「当前生效链（查看）」**（G9a）：
   - 生效模型来源一行（G2 sources 的 `MF_LLM_MODEL` 维度：`default-chain` → 「默认链自动启用（未手动设置 MF_LLM_MODEL）」；`env-file`/`process` → 「.env.local（手动配置）」/「环境变量（手动配置）」）。
   - **全链表格**：每候选一行，列 = 角色（主/备…）｜模型（`provider/model-id`，mono）｜密钥来源 chip（四标签之一，见 §4）｜密钥（打码，`maskKey` 形状 `****`+末 4 位；缺失时 `—`）。
   - 网关行（仅 `MF_LLM_BASE_URL` 已设时）：`网关 MF_LLM_BASE_URL = <值>（<来源>）`。
   - **链外 pi CLI 凭据提示行**（G9b，仅发现结果中不属于当前链的 provider 时）：`另检测到 N 个 pi CLI 凭据：<provider 名列表>（手配对应模型即可用）`——**仅 provider 名，永不列 key**。
   - **遮蔽警告**（G5，仅 `.env.local` 有值但被 process env 覆盖的键）：`遮蔽警告 <ENV_VAR 名>：.env.local 保存的值被进程环境变量同名值覆盖（显式配置优先），需先 unset 才生效`。表格密钥列只显示**生效（process env）值**的打码；被遮蔽值即使打码也不并列显示。
3. **覆盖表单卡「模型配置（覆盖）」**（POST `/settings/save`，G6/G9c）：
   - 模型输入：`value` **永远留空**（422 重渲染亦不回填）；`placeholder` 显示当前生效模型（如 `当前生效：minimax-cn/MiniMax-M3`；未配置态为 `如 minimax-cn/MiniMax-M3`；错误态为 `当前保存：<模型>（未生效）`）。字段下注明：`模型留空保存 = 清除覆盖、回退自动发现（与下方「清除配置」等效）`。
   - API Key：`type=password`、`autocomplete="off"`、永不回显；label 含 `留空则不修改`。
   - 网关地址：可选，`value` 留空，`placeholder` 为当前保存值（有则显示，无则 `https://…`）。
   - 提交按钮 `保存配置`（primary）。
4. **清除卡「清除配置」**（POST `/settings/clear`，既有表面保留）：danger 按钮 `清除本页管理的配置`，说明文案沿用现状。
5. **注脚**：`配置写入仓库根目录 .env.local（已被 git 忽略），工作台与 CLI 共用；密钥不会出现在页面、日志或导出物中。`（②A 后「与 CLI 共用」为真）+ `自动发现的密钥仅内存使用、永不写盘。`（D11）

设置页状态（one file per state，见 §7）：

| 态 | 场景 | 状态 chip | 链卡 |
|---|---|---|---|
| **S1 自动发现全链** | 零配置机器，auth.json 含两候选 key（US1/US2 happy path） | 就绪（绿） | 默认链主+备两行均 `自动发现 · pi CLI` + 打码；链外 5 家 |
| **S2 部分发现** | auth.json 仅含主候选 key（US3：发现到几家启用几家） | 就绪（绿） | 主行 `自动发现 · pi CLI`；备行 `缺失（调用时自动跳过）`、密钥 `—`；链外 5 家 |
| **S3 未配置正常态** | 无手配、无发现（auth.json 不存在或无真值表候选 key） | 未配置（灰） | 无链表格→empty 提示（默认链将自动启用的说明）+ 手配指引；无链外行 |
| **S4 遮蔽警告** | `.env.local` 保存了模型+key，process env 另有同名 key（显式赢） | 就绪（绿） | 模型来源 `.env.local`；密钥来源 `环境变量` + 打码（生效值）；遮蔽警告行（G5）；链外 6 家 |
| **S5 配置错误** | `.env.local` 保存真值表模型 + 网关 → 工厂急错（G6 语义冲突） | 配置错误（红） | `error-list` 原因摘要（工厂原文）；链卡仍画误配行（模型 `.env.local` + key 打码）+ 网关行；链外 6 家 |
| **S6 faux** | `MF_LLM_BACKEND=faux`（D10 短路在前，不触发现） | 演示模式（accent） | **不显示**链卡与任何发现结果；说明 faux 不读取本机凭据 |
| **S7 保存成功反馈** | POST 保存有效模型（+key）→ 303 `?saved=1` 重渲染 | 就绪（绿） | 顶部成功横幅卡；链卡=手动配置单行（`.env.local`+打码）；链外 6 家 |
| **S8 422（仅 slash 违例）** | POST 模型不含 `/`（或 `/` 在首/尾）→ 422 同页重渲染 | 底层态不变（示例为零配置机器→就绪） | 表单卡内 `error-list`（server 现行文案原文）；模型输入仍留空，`aria-invalid` + `aria-describedby` 关联；查看面不受扰动 |
| **S9 清除覆盖反馈** | POST `/settings/clear` 或模型留空保存（G6 等效）→ 303 `?cleared=1` | 就绪（绿，示例回退到自动发现） | 顶部「已清除覆盖 · 回退自动发现」横幅；链卡恢复默认链 |

> 反馈机制声明（零脚本约束下的保存反馈）：保存/清除成功用 303 重定向携带 `?saved=1` / `?cleared=1` 查询参数，GET `/settings` 据此渲染一次性横幅卡；422 为同页重渲染（沿用现状语义，D7「422 语义不变」）。这是 G5「保存后重渲染」与「保存成功反馈」的落地机制，不新增 PRD 需求。

### SE-B · 首页 `/` —— AI 模型状态芯片行（D8/G7 四分支三态）

首页「AI 模型」卡内一行：**芯片本体可点击（`<a href="/settings">`）** + 语义小字。四分支：

| 分支 | 芯片 | 小字/引导 |
|---|---|---|
| **H1 configured·自动发现** | 绿 `chip-ok`：`就绪 · <生效主模型>` | `来源：自动发现` |
| **H2 configured·手动配置** | 绿 `chip-ok`：`就绪 · <生效主模型>` | `来源：手动配置` |
| **H3 unconfigured** | 灰 `chip-queue`：`未配置` | 正常态引导：`本机已有 pi CLI 凭据即可零配置直接使用；或去设置手动配置（不配置也可用模板微调全流程）` |
| **H4 error** | 红 `chip-fail`：`配置错误` | 原因摘要（工厂报错原文，只含变量名）+ `去设置` |
| **H5 faux** | accent `chip-accent`：`演示模式` | `faux 确定性后端（零网络），供体验与测试；配置真实模型后自动切换` + `去设置`（第四分支，不占三态名额——D10 短路的直接推论） |

生效主模型 = 链首（自动发现/默认链时为 minimax-cn/MiniMax-M3）；configured 不分来源共用绿 chip，来源差异只进小字（G7）。

---

## 2. Click paths（入口 → 动作 → 结果态）

| # | 入口 | 动作 | 结果态 |
|---|---|---|---|
| 1 | GET `/settings` | 查看 | 按合成结果（G2 `{env, sources}` + llmStatus）呈现 S1–S6 之一；含遮蔽键时叠加遮蔽警告（渲染与保存后重渲染均显示，G5） |
| 2 | GET `/` | 查看 | 按 llmStatus 四分支呈现 H1–H5 之一 |
| 3 | 首页芯片（任一分支） | 点击 | GET `/settings` → 对应 S 态（H1→S1、H2→S7 稳态、H3→S3、H4→S5、H5→S6） |
| 4 | `/settings` 覆盖表单 | 填模型+key，保存 | 303 `?saved=1` → **S7**（写 `.env.local`；显式永远赢） |
| 5 | `/settings` 覆盖表单 | 填模型、key 留空，保存 | 303 `?saved=1` → **S7**（只存模型；key 来源标示显示 来自发现或缺失，G6） |
| 6 | `/settings` 覆盖表单 | **模型留空**，保存 | 清除语义（`MF_LLM_MODEL`/`MF_LLM_BASE_URL`/前一 provider key 全置 null，忽略 api_key/base_url 输入）→ 303 `?cleared=1` → **S9**（G6） |
| 7 | `/settings` 覆盖表单 | 模型 slash 违例（无 `/` 或 `/` 在首/尾），保存 | 422 同页重渲染 → **S8**；唯一 422，slash 之外无保存时校验（G6） |
| 8 | `/settings` 清除卡 | 点击清除 | 303 `?cleared=1` → **S9** |
| 9 | 保存后仍存在遮蔽键 | 重渲染 | 成功横幅 + 遮蔽警告并存（G5「保存即覆盖」承诺在 shadow 场景不失信） |

**Loading / empty / partial / failure 状态汇总**：
- **loading**：无局部加载态——纯服务端整页渲染，保存/清除为同步 303/422（项目零脚本基线）。
- **empty**：S3（无链、无凭据、无链外行）；链外行本身随发现结果增减（无发现则不渲染）。
- **partial**：S2（1/2 家候选凭据，缺失行 `缺失（调用时自动跳过）`）；S4/S5/S7 单候选链（手动配置无 fallback 时链只有主行）。
- **explicit failure**：S5（工厂急错原文摘要）、S8（422 slash）、H4（红芯片 + 原因摘要）。

---

## 3. Affordances（输入、控件、键盘/焦点、可达性——项目现行 plain-HTML 基线）

- **输入**（均在覆盖表单卡内，`<label for>` ↔ `<input id>` 一一关联：`set-model` / `set-key` / `set-base`）：
  - 模型：`type=text`，`value` 永远空（G9c 查看/覆盖物理分离），placeholder 承载当前生效值；
  - API Key：`type=password` + `autocomplete="off"`，永不回显（任何重渲染）；
  - 网关地址：`type=text`，`value` 空，placeholder 承载当前保存值。
- **控件**：`保存配置`（`btn-primary` submit）→ POST `/settings/save`；`清除本页管理的配置`（`btn-danger` submit）→ POST `/settings/clear`；首页芯片 = `<a class="chip chip-*">` 可聚焦可回车。
- **键盘/焦点顺序**（原生 tab，无 tabindex 重排）：状态卡文本 → 链卡表格（只读）→ 表单 模型→密钥→网关→保存 → 清除按钮 → 注脚 → 首页芯片在首页卡片流内原生顺序；`:focus-visible` 轮廓沿用 CSS 既有规则。
- **可达性**：`lang="zh-CN"`；表格 `<th scope="col">` 语义表头；错误 `error-list` 加 `role="alert"`；S8 模型输入 `aria-invalid="true"` + `aria-describedby="settings-issues"`（沿用 releaseBlock 两级错误先例）；芯片锚点有可辨识文本 + `title` 提示；无 `aria-live`/无脚本（整页渲染语义）。
- **零脚本不变式**：全部文件/生产实现不含 `<script>`；交互全部为原生表单提交与链接导航。

---

## 4. Terminology（用户可见文案，钉死——不得改名或另造）

| 钉死文案 | 使用处 |
|---|---|
| `就绪 · <生效主模型>` | 首页 configured 芯片（H1/H2） |
| `未配置` | 设置页 S3 状态 chip；首页 H3 芯片（灰） |
| `配置错误` | 设置页 S5 状态 chip；首页 H4 芯片（红）——**由现行「配置有误」改词** |
| `演示模式` | 设置页 S6 与首页 H5 芯片（accent）——首页由「AI 演示模式」改词，设置页沿用 |
| `自动发现 · pi CLI` | 链表格密钥来源标签（发现 key） |
| `环境变量` / `.env.local` | 链表格密钥来源标签（process env / env-file） |
| `缺失（调用时自动跳过）` | 链表格密钥来源标签（候选在链、无 key） |
| `模型留空保存 = 清除覆盖、回退自动发现` | 模型字段下注记（G6 页面注明） |
| `留空则不修改` | API Key label（语义延续） |
| `遮蔽警告` + `需先 unset 才生效` | S4 警告行（G5 措辞） |
| `另检测到 N 个 pi CLI 凭据：…（手配对应模型即可用）` | 链外凭据提示行（G9b 句式，仅 provider 名） |
| `来源：自动发现` / `来源：手动配置` | 首页就绪芯片来源小字（G7 二值） |
| `去设置` | 未配置/错误/faux 引导链接 |
| 工厂报错原文（如 `缺少模型密钥：请设置环境变量 …`、`…命中内置已验证模型，MF_LLM_BASE_URL 对其不生效：请清除网关变量或改用其他模型`） | S5/H4 原因摘要——逐字引用 `src/llm/index.ts`，不改写 |
| server 422 文案原文：`模型需为 <provider>/<model-id> 形式（收到 "…"），如 openai/gpt-4o` | S8 error-list（`src/ui/server.ts` 现行文案） |

**chip 色映射**（既有类 + §7.3 一条增量）：就绪=`chip-ok`（绿）· 未配置=`chip-queue`（灰，由现行 warn 改灰——未配置是正常态）· 配置错误=`chip-fail`（红，新增类）· 演示模式=`chip-accent`。来源标签色：`自动发现 · pi CLI`=ok · `.env.local`=accent · `环境变量`=queue · `缺失（调用时自动跳过）`=warn。

---

## 5. Negative cases（禁止路径——验收时逐条反证）

1. **密钥永不显示明文**：一切 key 只经 `maskKey`（`****`+末 4 位）呈现；密码框任何重渲染不回显；链外凭据行只列 provider 名（G9b/D11/US11）。
2. **faux 永不显示为「就绪」**：H5 恒 accent「演示模式」；S6 不显示链与发现结果（D10 短路在前，US13）。
3. **未配置永不显示为错误红**：S3/H3 恒灰正常态 + 引导（US4/D12/红队 KA5）。
4. **发现层错误永不显示**：auth.json 不存在 / JSON 坏 / 条目非 object / OAuth 缺 key / 空白 key 一律静默降级为「未配置」——页面不得出现任何发现层报错或文件级诊断（D2/US12）。
5. **密钥来源细节不越界**：页面永不显示 auth.json 路径以外的密钥来源细节（keychain/1Password 等为 Out of Scope，连提都不提）；遮蔽警告只含环境变量名，不含任何 key 值，被遮蔽值即使打码也不与生效值并列显示。
6. **422 仅 slash 违例**：slash 之外的配置错误不得以 422 呈现——由状态区/芯片以错误态浮现（G6）；422 重渲染不得扰动查看面。
7. **芯片不出现第五分支**：faux 是第四分支不占三态名额；configured 不分来源共用绿 chip（G7）。
8. **表单 value 永不回填当前模型**（含 422 重渲染）——查看与覆盖物理分离（G9c）；违例值只出现在 422 错误信息的 `收到 "…"` 引用内。
9. **自动发现的 key 永不写入 `.env.local`、永不进日志/导出物**（D11）——设置页保存只写用户显式输入。
10. **「零配置」叙事限定**：首页/设置页文案恒限定「本机已有 pi CLI 凭据」，不作普遍承诺（D12/US15）。

---

## 6. Trace links（表面/状态 ↔ PRD 溯源）

| 表面/状态 | PRD 溯源 |
|---|---|
| S1 自动发现全链 | US1、US2、US7、D5、D7、D9、G3、G9(a)(b)(c)、G4 裁决 B（链序） |
| S2 部分发现 | US3、US7、D5、G9(a)、G4 |
| S3 未配置正常态 | US4、D5、D12、G8（文案口径同源）、红队 KA5 |
| S4 遮蔽警告 | US5、US7、D4（②A 优先级）、D9、G5 |
| S5 配置错误 | US7、D7、G6（slash 外错误由状态区浮现）、G7（工厂报错可透出） |
| S6 faux | US13、D10、G7（第四分支） |
| S7 保存成功 | US8、US5、D7、G6（填模型+key 留空=只存模型） |
| S8 422 | D7（422 语义不变）、G6（仅 slash 违例）、G9(c)（value 永空） |
| S9 清除覆盖 | US8、G6（空保存 ≡ clear）、D7 |
| H1/H2 就绪 | US9、US5、D8、G7、D9 |
| H3 未配置 | US4、US9、D8、G7、G8、D12 |
| H4 错误 | US9、D8、G7（原因摘要） |
| H5 演示模式 | US13、US9、D8、D10、G7 |

---

## 7. Visual artifact（必需产出——静态 HTML 原型集）

### 7.1 格式声明

- **格式**：静态 HTML 集，一文件一表面×状态；每个文件为完整独立页面（双击可开），`<style>` 内嵌 `src/ui/render.ts` 顶部 CSS 全量副本 + §7.3 两条增量；**零 `<script>`**、零外部依赖（logo 走仓库内相对路径 `../../assets/juanerai-logo-slogan.png`）。
- **演示数据**：虚构但镜像真实形状——统一合成 auth.json 宇宙 = 7 个 provider（`minimax-cn`、`xiaomi-token-plan-cn`、`openai`、`deepseek`、`kimi-coding`、`moonshot`、`zhipu`，与本机实测 7 条目同量级；各状态间守恒）；打码 = `****`+末 4 位；错误文案逐字取自工厂与 server；链序 per G4 裁决 B。
- **原型内链接**：首页芯片/引导链接指向对应状态原型文件（可点击走查）；生产实现一律 `/settings`、`/settings/save`、`/settings/clear`（表单 action 已按生产路径书写）。`index.html` 为导航页。

### 7.2 文件清单（全部位于 `.flow/ui/`，均已落盘）

| 文件 | 状态 | 一句话说明 |
|---|---|---|
| `index.html` | 导航 | 全部状态 ↔ 文件对照表 + 原型约定 |
| `settings-autodiscovered.html` | S1 | 零配置默认链全绿：两候选 `自动发现 · pi CLI` + 打码 + 链外 5 家 |
| `settings-partial.html` | S2 | US3 部分发现：备候选 `缺失（调用时自动跳过）`、密钥 `—` |
| `settings-unconfigured.html` | S3 | 未配置正常态：灰 chip + empty 链卡 + 手配/零配置指引 |
| `settings-shadowed.html` | S4 | 遮蔽警告：key 生效来源=环境变量，`.env.local` 值被覆盖需先 unset |
| `settings-error.html` | S5 | 配置错误：工厂原文摘要（真值表模型 × 网关冲突）+ 误配链行 + 网关行 |
| `settings-faux.html` | S6 | 演示模式：不显示链与发现（D10 短路） |
| `settings-saved.html` | S7 | 保存成功横幅 + 手动配置链行（openai/gpt-4o · .env.local） |
| `settings-invalid.html` | S8 | 422 仅 slash 违例：server 原文 error-list + aria 关联 + 查看面不扰动 |
| `settings-cleared.html` | S9 | 已清除覆盖横幅 + 回退自动发现（默认链） |
| `home-chip-ready-discovery.html` | H1 | 绿 `就绪 · minimax-cn/MiniMax-M3` + `来源：自动发现` |
| `home-chip-ready-manual.html` | H2 | 绿 `就绪 · openai/gpt-4o` + `来源：手动配置` |
| `home-chip-unconfigured.html` | H3 | 灰 `未配置` + 零配置/去设置引导 |
| `home-chip-error.html` | H4 | 红 `配置错误` + 工厂原文原因摘要（缺密钥）+ 去设置 |
| `home-chip-faux.html` | H5 | accent `演示模式`（维持现有芯片） |

### 7.3 CSS 增量声明（生产实现须同步加入 render.ts；除此零新类）

```css
/* M2 UI 契约增量：红芯片补 fail 语义色（沿用既有 chip 模式与 --fail token）；芯片作链接时去下划线 */
.chip-fail { background: var(--fail-soft); color: var(--fail); border-color: var(--fail-line); }
a.chip { text-decoration: none; }
```

### 7.4 生产落点（爆炸半径声明，非本契约实现物）

`src/ui/render-settings.ts`（settingsPage 消费链/sources/链外/遮蔽/横幅）、`src/ui/render-home.ts`（llmLine 四分支）、`src/ui/render.ts`（§7.3 两行 CSS）、`src/ui/server.ts`（GET `/settings` 读取 `?saved/?cleared` 横幅；POST 路径不变）——与 PRD Further Notes 一致；数据事实源 = G2 `resolveLlmEnvAuto → {env, sources}` 单份。
