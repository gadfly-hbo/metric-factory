# v2 REVIEW · 审查报告

## 第 1 轮（2026-09-29）

> 审查者：code-reviewer 子代理（全新上下文）。固定点：0ad90aa。
> **Verdict: FAIL（REQUEST_CHANGES）** — 整体实现质量高、规格兑现度高、VERIFY 复跑一致；但存在 1 个生产级阻断缺陷。

### BLOCKER
- **[src/mcp/server.ts:21] dist 布局下 MCP server 模板目录解析错误，六工具全部不可用**
  tsup 把 server 拆为 dist 根部 chunk，`here=dist` 时 `../../templates` 逃出仓库。stdio 探针实测：握手与 listTools 正常，mf_audit 对任何实例返回「找不到基模板 …/Projects/templates」。README 教用户跑的正是 `node dist/cli.js mcp`。测试盲区：test/mcp 从 src 导入（src 布局恰好命中），dist 下 mcp 无覆盖。
  复检标准：`node dist/cli.js mcp` 起 stdio server 后 mf_audit 返回 findings 而非「找不到基模板」。

### SUGGESTION
- S1 audit「四类规则逐一命中」验收未兑现：no-owner（CLI 结构性不可达，schema 先挡）与 orphan（实例层不可构造，added 豁免 + trees 来自模板）无用例 → 补用例或记录结构性结论
- S2 「全仓唯一 import pi 的文件」注释失实（index.ts/faux.ts 也 import）→ 措辞改「收敛于 src/llm 模块（3 文件）」
- S3 LLM payload 阶段拒绝无负向用例（仅测 parse 阶段）→ 补合法 JSON 坏字段用例
- S4 review --approve 对非待审指标静默成功并可覆盖已有审核记录 → approve 前校验 pending 命中
- S5 mf_export 与 CLI export 门不一致（mf_export 只走审核门不跑 validateInstance）→ 补齐或明示

### 待确认（协调方裁定）
- 手改 draft 的 provenance.origin=manual 可绕过 review 门：与手改实例 YAML 同一信任边界，**接受**（PRD 补边界声明）；组装层强制覆盖工具产物路径已实现
- apply 的 skipReviewGate 设计：**成立**（代码注释依据 + export 双执法点 + e2e 全链路）
- llm-smoke.sh 真实 provider 未执行：PRD 明示发布门槛，开发期 out of scope

### 覆盖确认
VERIFY 复跑一致；src/llm 7 文件 + engine 7 模块 + mcp + cli + 三导出器逐行；pi 边界 guard 真实；四新模板抽查 15+ 指标口径无误；16 模板测试断言真实性核实；MCP 零写盘成立；无超范围实现。

## 第 2 轮（2026-09-29，终审）

> **Verdict: PASS（APPROVE）** — 6 项增量全部如实完整修复且带真实回归测试；VERIFY 复跑与冻结证据逐字一致；BLOCKER 复检标准经审查者独立手写 JSON-RPC stdio 探针实证达成（dist 形态 mf_audit 返回 findings、六工具可用）。第 1 轮确认点抽验无破坏（pi 边界 guard、fail-closed 链、四新模板测试）。
>
> **残留（非阻塞，记录不动）**：[src/llm/types.ts:6] 注释仍写「pi-ai 只在 pi-client.ts 出现」，实际三文件 import（pi-client/index/faux）——与 S2 同主题的一行注释残留，后续顺手修正。
> **UNVERIFIED 维持**：真实 provider 冒烟为发布门槛（PRD out of scope）；新模板 163 指标口径人工盲评（第 1 轮抽查 15+ 无误）。
