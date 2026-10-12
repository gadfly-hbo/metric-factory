# 批次 A+B · REVIEW 报告存档

## REVIEW#1（agent-6，2026-10-12，裁决 FAIL）

验证门自跑 exit 0（50 文件 301/301 + contract 1/1，墙钟 ~26s），与 VERIFY#2 记录一致。四项功能主干（F3 序号、F6 共享核、B1 回执全链、B2 两版产物）均落地且多数不变量有实证；但 2 项 Medium 规格违约：

1. **Medium** `src/ui/server.ts:710`：发布 POST 重渲染未传 receipts 状态 → 回执区块落默认态（showList:false + T-02 插值空串「当前包（）」），违反 ui-contract §0 渲染条件；release.test.ts 无回执断言故不可见。复检：发布 200 后断言页面含 `当前包（<package-id>）`。
2. **Medium** `src/sap/release.ts:112-121`：F6 后 release 坏模板输出未逐字保持基线（`[template]` 首错 vs 基线 `[schema]` 首个坏文件全量错误）；且 tasks.md 切片 2 验收「release 错误行为有既有 e2e 背书」勾选无证据（grep 零命中）。复检：构造坏模板目录跑 release 与 `git show f525be6` 输出逐字比对。

Low：#3 cli 多坏文件行为实变（基线首坏即退→现全量打印；与 GRILL 目标一致但与「逐字不变」表述冲突，特征测试单坏文件无法区分）；#4 共享核 result 风格 vs PRD「抛错变体」字面（行为等价）；#5 placeholder `detail: 问题描述` vs 原型「一句话问题描述」；#6 倒序无排序断言（CLI/UI）；Info：#7 UI adopted 列求和口径 vs 列头「指标数」；#8 CLI list 列序；#9 上游 contentFingerprint 含 generator 跨构建不可复现（批次 1 既有设计）；#10 receipt 数组 default([]) 宽松于契约字面；#11 T-06 副行字号微差。

已核实符合：F3 ✓、F6 主干 ✓（共享核收集全部错误不短路、cli 映射三态逐字、server.ts 拷贝未动）、B1 ✓（schema 逐字段/对账双态不拒绝/收编副本供应侧字段/重复 slug 拒绝/index 缺失损坏拒绝/CLI 与 UI 同 registerReceipt）、UI ✓（第 7 块/T 术语/两级错误与 aria/G5/O1 不改/零 JS/七态 e2e）、B2 ✓（两版产物/指纹不同/1.0.0 字节不变/复跑指纹一致/实例翻转态/指引补句）。结论：修复 #1/#2 可复评通过。

## REVIEW#2（agent-7，2026-10-12，裁决 PASS）

验证门重跑 exit 0（50 文件 304/304 + contract 1/1 + lint/typecheck），与冻结证据一致。7 项收敛修复声称全部经代码+测试+独立实验证实（含基线 f525be6 输出格式逐字比对、shape 违规模板 6 条 zod 错误全量输出实验、多坏文件分野实验：m-bad 报/n-bad2 不报）；diff 范围无意外；releases/ 产物收敛期间零变化（mtime 时间线佐证，e2e 全在临时目录隔离）。

Low 发现 4 项（交上游处置）：
- **F-1**：坏文件排序位于目标模板之后时，装载策略较基线收紧（基线发布成功 EXIT=0 → 现行拒绝 EXIT=1；整目录健康门，无正确性风险），但 `release.ts:105` 注释「行为与重构前一致」失实、prd 勘误③未钉装载策略。复检：bad-file-after-target 场景两端终态。
- **F-2**：release 坏模板 e2e 仅 contains broken.yaml + [schema]，未钉 template-invalid rule 名与「多 zod 错误全量」维度（评审员已实验补证 6 条全量正确）。复检：shape 违规坏模板多行全量断言。
- **F-3**：`render.ts:343` 注释「adopted 指标数 + 场景数」与实现（server.ts:298 仅指标数）、列头、T-04 矛盾。
- **F-4**：loading-behavior 头注释「逐字等价」与 GRILL 终态矛盾；tasks.md What-to-build「抛错变体」措辞滞后（prd 勘误已覆盖偏差）。

信息级：发布 POST 重渲染以空 values 重建回执区块（未提交草稿丢失，两独立表单整页重渲染固有行为，与 patch 表单同构）；CLI list 列序 received_at 在前（G1 未钉列序）；上游批次 1 contentFingerprint 含 generator 跨构建不可复现（既有设计，对账按字符串比对不受影响）；receipt 数组字段 default([]) 宽松于契约 §6.2 字面（向前兼容取向）。

**处置记录（SHIP 前）**：F-1/F-3/F-4 为零行为注释与措辞修正，已就地修复（SHIP 门复跑全量验证覆盖）；F-2 记录不动（行为已经评审员实验补证，避免 PASS 后测试搅动）。
