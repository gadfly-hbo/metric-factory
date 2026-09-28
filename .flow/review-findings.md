# REVIEW · 独立代码审查报告

## 第 2 轮（2026-09-28，最终轮）

> 审查者：code-reviewer 子代理（全新上下文）。固定点：5d67334。
> **Verdict: PASS（APPROVE_WITH_COMMENTS）** — 第 1 轮 BLOCKER（交互向导口径语义反转）已正确修复并经 PTY 实跑实证；12 项建议中 9 项完整修复、2 项部分修复、1 项按「记录不动」决议以 PRD 附录验收；VERIFY 链重跑与声明证据完全一致（lint PASS 53+48 / typecheck 干净 / test 49 passed / contract-test 1 passed，退出码 0）。

### 第 1 轮发现复核结论
1. 交互向导口径语义反转（BLOCKER）→ 已修复（src/cli/index.ts:91-95；PTY 全默认实跑：12 项 caliber 与模板默认逐项相等，diff 四段全空，validate PASS）
2. export 不校验 → 已修复（src/cli/index.ts:337-344 + review-fixes.e2e.test.ts:15-22）
3. init 坏 caliber 实例 → 已修复（src/cli/index.ts:157-165；原复现场景实测 exit 1 无落盘）
4. mermaid 重复 subgraph → 已修复（src/export/mermaid.ts:41-63；两模板 5 类各 1 个 subgraph、37 节点零重复）
5. type_params lint → 已修复（src/engine/lint.ts:48-73 + bad-type-params-ref fixture）
6. 恒真断言 → 已修复（已删除）
7. diff 口径噪声 → 已修复（materialize.ts:70-71 仅留 from !== to；Excel 来源标记语义自洽实证）
8. cumulative 零覆盖 → 已修复（instance-cumulative.yaml + 导出 type 断言；形状残留见 S2）
9. 冒烟脚本 → 已修复（前置含 dbt-duckdb、死代码已删）
10. lint 依赖 dist → 已修复（prelint 钩子）
11. 死字段/过时注释 → 部分修复（死字段已删；export.e2e.test.ts:47 计数注释仍失实 → S4）
12. 契约 schema → 部分修复（metrics/window/grain_to_date 已编码、derived 带 metrics 清单；cumulative 导出不带 window/grain_to_date → S2）
13. type_params 数据完备性 → 按 PRD 附录决议验收通过（43/101 降级与实测一致）

### 建议改进（SUGGESTION）
- **S1 [src/engine/validate.ts + src/export/metricflow.ts:73] 物化后的 type_params 引用无人校验**：实例 `removed` 删除派生指标输入后，validate/export 均 exit 0，导出器 `filter(knownMetricNames.has)` 静默丢弃悬空引用；`removed:[uv,cvr,aov]` 产出 `metrics:[]` 违反契约 schema minItems:1（export 不跑契约 schema 照样落盘）。建议 validateInstance 增加物化后 type-params-ref 镜像检查。
- **S2 [src/export/metricflow.ts:46-48 + src/schema/template.ts] cumulative 导出缺 window/grain_to_date 字段**：真实 dbt 要求二者其一；TypeParamsSchema 无对应字段，模板作者无法补。
- **S3 [package.json:19] contract-test 单独执行仍依赖 dist**：无 precontract-test 钩子。
- **S4 [test/cli/export.e2e.test.ts:47] 计数注释失实**：应为「53 模板 − 1 removed(nps) + 1 added = 53」。

### 待确认（UNVERIFIED）
- mermaid 真实渲染器表现（结构性验证已实证）；真实 dbt parse 执行留档（无环境）；交互向导同 key 跨指标不同默认值的未来冲突（当前两模板无冲突）。

### 覆盖确认
VERIFY 链重跑一致；16 src + 14 test + 2 模板 + 15 fixtures + 配置脚本文档逐行读；动态复现 8 项（含 PTY 交互、删除派生输入两变体、Excel 两实例语义、mermaid 唯一性、metricflow 四类型形状、无 dist contract-test、43/101 计数）。

---

## 第 1 轮（2026-09-28，已归档于本节下方历史）

> Verdict: FAIL。1 BLOCKER + 12 建议。原文见 git 历史或下方节选。

（第 1 轮完整原文已在修复循环中逐条对照执行，复核结论见上节。）

## 第 3 轮（2026-09-28，终审）

> **Verdict: PASS（APPROVE_WITH_COMMENTS）** — S1–S4 全部完整落地且实证有效；VERIFY 链四项独立重跑与声明证据完全一致（lint PASS 53+48 / typecheck 干净 / test 51 passed / contract 1 passed）；既有修复零回归。
>
> S1 type-params-ref 镜像：完整（validate.ts:78-104 与 lint 语义一致；双路径 exit≠0 实证；全部合法实例无误伤）
> S2 window/grain_to_date：完整（schema+导出透传+契约编码+fixture 断言）
> S3 precontract-test：完整（钩子独立重跑生效）
> S4 注释：完整属实（53 − 1 + 1 = 53 实数核对）
>
> **残留（非阻塞，记录不动）**：[test/cli/review-fixes.e2e.test.ts:44-47] `arr` 断言为死代码——ecommerce 实例导出无 arr，`if (arr && ...)` 永假；「数字字面量不进 derived metrics 清单」行为零覆盖。后续以 saas 实例补一行断言即可。
> **UNVERIFIED（与前轮口径一致）**：真实 dbt parse、mermaid 渲染器执行（无环境，冒烟脚本已备待手动留档）。
