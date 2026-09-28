# Metric Factory v2 · 任务拆解（垂直切片）

> 来源：`.flow/prd.md`（含 GRILL 决议）。
> 拆解批准理由（自批准，2026-09-29）：11 个切片全部端到端可演示；LLM 管线按「适配层 → 审核流 → 草案 → 真路径 → 微调」递进，每步可用 faux/fake 验证；模板四片独立可裁剪（下限 3）；依赖链无环。

- [x] 0. pi-ai 适配层（LlmClient 边界 + faux 接线测试 + token 估算）
- [x] 1. review 命令（交互 + --approve/--reject 非交互 + 审核人记录）
- [x] 2. draft schema + prompt 构造 + generate --dry-run
- [x] 3. generate 真路径 + apply 命令（fail-closed 全链路）
- [x] 4. refine 命令（微调草案）
- [x] 5. audit 命令（四规则 + 分级 + --json）
- [x] 6. MCP server（六工具 + stdio + in-process client 测试）
- [x] 7. 模板：内容社区 App（≥40 指标）
- [x] 8. 模板：数字营销（≥40 指标）
- [x] 9. 模板：供应链物流（≥40 指标）
- [x] 10. 模板：云成本（≥40 指标）
- [x] 11. CONTRIBUTING + llm-smoke.sh + README v2 + CI 扩展收尾

---

## 0. pi-ai 适配层

### What to build
`src/llm/` 模块：自定义 `LlmClient` 接口（complete({system,user}) → text）；`pi-client.ts` 是全仓唯一 import `@earendil-works/pi-ai` 的文件（compat 层 complete()，env 解析 MF_LLM_MODEL / provider keys）；`index.ts` 工厂（`MF_LLM_BACKEND=faux` 可切确定性 fake）；`estimateTokens()` 估算工具（红队 #2 token 实测）。

### Acceptance criteria
- [ ] 适配器测试：pi faux provider 注册后经 pi-client 完成一次零网络调用，返回脚本文本
- [ ] 引擎级测试注入自定 fake client 完成 generate 管线（本切片以最小冒烟形式出现）
- [ ] estimateTokens 对电商模板 YAML 估值为正且量级合理（输出实测数字记入测试注释）
- [ ] 业务代码（src/llm 之外）零 pi import（grep 断言）

### Blocked by
None - can start immediately.

---

## 1. review 命令

### What to build
`metric-factory review <instance>`：列出实例中 origin=llm 且未审核指标（名称/口径/出处）；交互逐条 approve/reject（@inquirer）；`--approve <name>` / `--reject <name>` 非交互；`--reviewer`（默认 MF_REVIEWER 或系统用户名）写 `provenance.reviewed_by`；reject 从 added 移除。

### Acceptance criteria
- [ ] e2e：llm 未审核实例 --approve 后导出放行（fail-closed 全链路闭环）
- [ ] e2e：--reject 后指标从实例消失
- [ ] 无待审指标时输出「无待审项」退出 0
- [ ] --reviewer 值出现在落盘实例的 provenance.reviewed_by

### Blocked by
None（不依赖 LLM 管线，可先行）

---

## 2. draft schema + prompt 构造 + generate --dry-run

### What to build
`src/schema/draft.ts`（DraftSchema：generator 元信息 + added/modified/removed/caliber）；`src/llm/prompt.ts`（系统角色 + 基模板全量注入 + 已审核 added 段 + 业务描述 + 输出 JSON 契约，PROMPT_VERSION 常量）；`metric-factory generate <instance> --describe "..." --dry-run` 打印完整 prompt 与 token 估算，不调模型。

### Acceptance criteria
- [ ] dry-run 输出包含基模板全部指标名、业务描述、输出 JSON 契约与 PROMPT_VERSION
- [ ] DraftSchema 单测：合法草案通过；缺 generator 元信息 / added 缺 provenance 被拒
- [ ] prompt 构造纯函数单测（注入内容逐项断言）

### Blocked by
- #0（token 估算）

---

## 3. generate 真路径 + apply 命令

### What to build
`generate --out draft.yaml`：LlmClient 调用 → 输出 Zod 校验（不合格整批拒绝报原文）→ 组装 Draft（added 强制 origin=llm + model + prompt_version + review.required=true）→ 落盘；`metric-factory apply <instance> <draft>`：合并（added/modified/removed/caliber，同名冲突报错）→ validateInstance 全过才写盘。

### Acceptance criteria
- [ ] faux/fake 注入 e2e：generate → apply → export 被阻断（未审）→ review --approve → export 放行，全链路一条测试走通
- [ ] LLM 输出缺 provenance 字段：generate 在组装层补齐（origin=llm 强制），schema 校验失败时整批拒绝并输出 provider 原文
- [ ] apply 对坏草案（同名冲突 / 修改目标不存在）零写盘退出非 0
- [ ] apply 后 diff 输出反映草案全部四段

### Blocked by
- #2

---

## 4. refine 命令

### What to build
`metric-factory refine <instance> --instruction "..."`：同一 LLM 管线，prompt 面向「对存量指标的微调」（caliber/modified/removed/added），产 draft.yaml；apply 复用 #3。

### Acceptance criteria
- [ ] fake 注入 e2e：refine 产出的 caliber/modified 草案 apply 后 diff 一致
- [ ] refine 草案中 added 同样强制 llm provenance + review 门
- [ ] dry-run 同样可用

### Blocked by
- #3

---

## 5. audit 命令

### What to build
`metric-factory audit <instance>`：四规则（口径缺失 ERROR / 无归口 ERROR / 虚荣指标 WARN：黑名单+无对照比率 / 孤儿指标 WARN：不在树、非北极星、非 type_params 引用）+ `--json` + 退出码（有 ERROR 非 0）。

### Acceptance criteria
- [ ] 构造坏实例四类问题逐一命中且分级正确
- [ ] MVP 两个 examples 实例 audit 零 ERROR、零 WARN（无误报回归基线）
- [ ] --json 输出结构化结果（rule/severity/metric/message）

### Blocked by
None（引擎纯函数，可先行）

---

## 6. MCP server

### What to build
`metric-factory mcp`（stdio）：@modelcontextprotocol/sdk；六工具 mf_generate / mf_audit / mf_refine / mf_validate / mf_diff / mf_export，进程内调引擎函数；工具一律返回草案/结果 JSON 不写盘。

### Acceptance criteria
- [ ] in-process client（SDK Client + InMemoryTransport 或 stdio 子进程）握手成功并列出六工具
- [ ] mf_audit / mf_validate / mf_diff 调用返回与 CLI 等价结果
- [ ] mf_generate 在无 key 环境返回可读错误（含 --dry-run 指引）
- [ ] 全部工具调用零文件写盘（返回 JSON）

### Blocked by
- #3、#4、#5

---

## 7. 模板：内容社区 App（≥40 指标）

### What to build
`templates/content-community.yaml`：北极星（DAU / 使用时长）、规模（DAU/WAU/MAU、发布数、互动量）、质量（留存、创作者活跃、内容完播）、结构（内容品类结构、创作者分层）、效率（单内容成本、推荐效率）、旅程（消费→互动→创作转化链）；matching 按内容消费/创作循环。

### Acceptance criteria
- [ ] 模板质量测试同 MVP 标准（≥40、口径完整、出处、引用一致、type_params 引用合法）
- [ ] lint PASS；问卷匹配测试：内容社区答案向量选中该模板
- [ ] 实例走通 export 三格式 + 契约测试

### Blocked by
None（依赖既有 schema/lint 基础设施）

---

## 8. 模板：数字营销（≥40 指标）
同 #7 标准。北极星（ROAS / 有效线索成本）、漏斗（曝光→点击→线索→转化）、质量（线索合格率、作弊流量）、结构（渠道结构）、效率（CAC、LTV）。
### Blocked by
- None（同上）

---

## 9. 模板：供应链物流（≥40 指标）
同 #7 标准。北极星（OTIF 准时足量交付率）、履约（时效、准确率）、库存（周转、缺货）、成本（单均履约成本）、结构（仓网结构）。
### Blocked by
- None

---

## 10. 模板：云成本（≥40 指标）
同 #7 标准。北极星（单位业务成本 / 成本效率比）、成本结构（计算/存储/网络）、效率（利用率、预留覆盖）、异常（预算偏差、闲置率）、FinOps 旅程。
### Blocked by
- None

---

## 11. CONTRIBUTING + 冒烟脚本 + README + CI 收尾

### What to build
CONTRIBUTING.md（模板 PR 评审清单 + lint 门）；scripts/llm-smoke.sh（真实 provider 跑 generate/refine 各一次，输出与耗时留档，发布门槛不进 CI）；README 增 v2 章节（generate/refine/review/audit/mcp 用法、provider 配置表、参考方案对齐说明）；CI：新模板全量 lint、全部测试入链。

### Acceptance criteria
- [ ] `npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿（含全部新模板与新测试）
- [ ] README v2 章节每条命令可复制执行（dry-run 路径零 key 可跑）
- [ ] CONTRIBUTING 清单覆盖模板 PR 全流程（fork → 编辑 → lint → PR → 评审项）
- [ ] llm-smoke.sh 语法检查通过并在脚本头声明前置条件

### Blocked by
- #1–#10 全部

> **S1 结构性结论（REVIEW 第 1 轮）**：audit 的 no-owner 与 orphan 两规则在实例层结构性不可构造——no-owner 被 InstanceSchema 的 owner_role min(1) 先挡（load 即拒），orphan 对实例 added 指标天然豁免且 trees 无 patch 段无法摘除模板引用。两规则保留为引擎防御（单元级）与模板层基线（六模板 audit 零告警已由测试锁定），「四类规则逐一命中」按三类可构造（incomplete-caliber/vanity + 模板基线）验收。
