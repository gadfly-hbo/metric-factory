# v5 批次 REVIEW findings（两轮，独立评审员，fixed point 9fc8c10）

## 第 1 轮（2026-10-09，verdict PASS 附发现）

- **F1 [Medium·Spec]（已修复）** SAP duplicate-identity 未覆盖场景重复 id@version（契约 §4/§6 明文）。→ 修复：validate.ts seenScen 检查 + 非恒真负例测试；REVIEW#2 复检确认。
- **F2 [Low]**（已回填）ui-contract §8 B1 槽形裁决未定案 → 补「树 {3,4}/usages {2,3} 严格版」定案行。
- **F3 [Low]**（第 1 次回填静默失败，REVIEW#2 抓出；已补）usages 格式错误串不在 E 表 → 补录 E-00 + 三处范围引用同步。
- **F4 [Low]**（已统一）E-05 两处措辞不一致 → 统一「循环与自指」（§4 逐字表为准）。
- **F5 [Judgement·记录不动]** 树校验逻辑三份近似拷贝（schema superRefine / lint / validate；DSL 第四份有独立行号语义）——后续可提取共享纯函数。
- **F6 [Judgement·记录不动]** 场景路由 no-instance 422 分支重复 4 次 + 复用 formErrorPage 的 history.back()（仅边缘页，N1 严格语义下不可点但可读）。
- **F7 [Info·记录]** validate 按 id / lint 按索引 / UI 方括号三种路径风格并存（各自语境自洽）；ScenarioSchema.version 宽于样例（向前兼容）；diff.scenarios.added 计覆盖种子（与 metrics added 语义对称）。
- 复核确认：ScenarioSpec 逐字段一致、种子 12/12 引用实存、SAP 跨段镜像正确、UI 契约 T/E/D1-D4 全落实、零写盘字节对比真实、diff 无越界。

## 第 2 轮（2026-10-09，verdict PASS）

- **F-A [Medium]**（已处置）F3 首次回填未落盘且 state.json 声明失实 → 本轮补 E-00+范围引用；state.json 追加更正记录。
- **F-B [Low]**（已处置）第 1 轮 findings 未落盘（开工归档误移）→ 本文件按评审报告重录留档。
- F1 修复复检全过（键/路径/规则名/契约对应/非恒真锚定/不可达论证未破坏/相邻规则零改动）；F2/F4 落实；范围仍限 5 切片；VERIFY 复跑 44 文件 256 全绿 + 1/1，21.4s。
