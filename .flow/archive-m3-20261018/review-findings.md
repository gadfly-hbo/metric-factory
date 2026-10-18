# M3 治理闭环 · Code Review Findings — RE-REVIEW cycle 3（review_base = 902574c + 未跟踪 flow 产物）

## Verdict: **PASS**

Cycle 2 全部 4 项修复（RB5–RB8，对应 B1′ 重复「今日/累计」标签 / B2′ ST3 卡顶一句说明 / B3′ ST3 今日行 chip / B4′ F1 按维度择一 env 名）经实际渲染（dist server chunk + 真实 HTTP fetch /settings）与代码路径双重复核为真；验证门复跑 exit=0 且与冻结记录逐项一致（无证据失实、无假 [x]）；本轮零新增 blocking 项。残留 5 条 non-blocking 观察（1 条测试钉死缺口 + 4 条呈现/口径微偏），均不构成返工理由。

## 验证执行记录（评审员复跑，只读）

- 验证门复跑：exit=0；lint 7 模板 PASS、tsc 绿、59 files / 395 tests、contract 1/1——与冻结记录一致，无失实。
- 密闭性复检：全门前后 git status 逐行相同；~/.metric-factory 全程未创建；仓内无审计/账本运行时产物。
- 实际渲染：定位 dist/server-GVVONOMG.js，MF_DATA_DIR 指向 /tmp fixture，4 次 /settings 真实 HTTP 渲染 + 2 次 dist 工厂 complete() 实弹触发预算阻断（伪 key 证明 claim 先于网络，G1）。

## 四项修复逐一实测（摘要）

- **B1′（RB5）**：ST1/ST2/ST5 汇总行 chip 唯一标签 + .num 千分位（dist 实证）；ST3/ST4 无纯文本前缀；负断言三态覆盖（settings.test.ts:298-299,340,379-380）。
- **B2′（RB6）**：卡顶一句说明与原型 degraded:212 逐字；chip-warn 形断言在场。
- **B3′（RB6）**：今日行 = `<span class="chip chip-queue">今日</span> 不可用（时间口径来自审计文件）`，与原型逐字。
- **B4′（RB7）**：双维实弹——tokens 维文案与原型 job-error-budget.html:199 逐字一致（千分位/止于重新计数。/无 taskId/仅 TOKENS env 名）；calls 维仅 CALLS；pi-client.ts:57-77 三分支。
- **RB8**：千分位 ≥10⁴ 断言（2,047,513/1,000,000 预置账本）+ env 择一负断言 + chip 形断言。
- 其余契约面抽查无回归（ST1 表勾稽/ST2 83%/ST4 零数字/ST5 脚注/负例抽检/五调用点 caller/README 四处）。

## Non-blocking findings（新记录）

1. [测试钉死缺口] F1 预算文案无「无 taskId / 止于重新计数。」负断言（行为已实弹确证正确，回归不会红）。复检：budget 测试补 not.toContain("taskId") 或 toMatch(/重新计数。$/)。
2. [呈现微偏] 合计行 <strong> 加粗 vs 原型纯 <td>（契约只钉文案与零新类，不违约）。可不改。
3. [契约内部不一致落地痕迹] F1 tokens 维无空格（随原型）/calls 维有空格（随契约模板）——上游两冻结源本就差一空格，实现按原型优先消解。
4. [未枚举中间态] 审计缺失未降级且账本有条目：今日 chip 不可用 + 表引导行缀不可用——诚实不给假数，符合 SE-B 语义；如需专属态回 PRD。
5. [G7 措辞边缘] 双维均 ≥80% 时 stderr 输出两行 vs「一行」可读性歧义；如需严格一行取首行或合并。

## 轴向小结

Spec 轴：B1′–B4′ 全部实修实测为真，tasks.md 四个 [x] 无虚报；最重 = 观察 1（测试钉死缺口，行为已确证正确）。Standards 轴：无成文标准适用，不变式全数保持，修复净改善。
