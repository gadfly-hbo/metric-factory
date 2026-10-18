# Handoff · M3 完成后（2026-10-18，commit 2a0bef2）· 三迭代闭环

## 已交付（M1→M2→M3 全部完成）

- **M1**（`655b84d`）：引擎升级 pi-agent-runtime runText 通道（主备容灾/超时/恢复 + 四分映射）。
- **M2**（`902574c`）：零配置体验（auth.json 密钥自动发现 + 默认链自动启用 + 设置页「查看+覆盖」+ 首页芯片三态）。
- **M3**（`2a0bef2`）：治理闭环——审计 JSONL 落盘+轮转（never-throw 降级）、预算账本（原生 budgets 缝 + per-op 锁 + 四要素阻断 + 80% 警告）、provenance 真值（complete() 交还实际出稿 provider/model，主备回退显示备候选）、设置页调用统计卡（ST1-ST5）。

## 架构要点（后续批次的既有事实）

- **真值管道**：`complete() → {text, usage(三字段), provider, model, taskId}`；onEvent per-taskId 捕获；taskId = `mf:<kind>-<seq>-<进程尾缀4>`（尾缀修跨进程账本覆写，kind 前缀解析不受影响）。
- **数据目录**：`MF_DATA_DIR`（缺省 `~/.metric-factory/`）：`model-audit.jsonl`(+.1)/`model-budget.json`/`.model-budget-lock`；vitest 守卫（未注入即 throw）+ `test/setup-data-dir.ts` 全局注入。
- **预算语义**：`MF_LLM_BUDGET_TOKENS`（in+out）/`MF_LLM_BUDGET_CALLS`（attempt 计），缺省不限；窗口=账本文件生命周期（删文件即重置）；claimUncapped 聚合拒绝（只阻断新调用）；在飞越限/FIFO 剪老/崩溃 reserved 计入三口径已披露。
- **fallback 触发语义**（实现实证）：仅 `ProviderFailure`（quota/rate-limit/unavailable/network）触发主备回退；普通 `Error` 穿透；`modelRecovery` 预算跨候选共享（主候选失败一次即回退）。scripted-transport 提供 `providerFailure` 脚本形态。

## 延期项（按优先级，三批全部 non-blocking）

1. ~~refine prompt 加固~~ **已解决（2026-10-18 后续小批，用户裁决 A+轻量直改）**：根因 = refine prompt 的 added 字段规格未枚举硬约束（generate 有枚举故同词汇模型全合格）。修复 = added 规格对齐 generate 硬约束（type/time_grains 枚举 + 负例禁令 + snake_case + owner_role 必填），PROMPT_VERSION → v2.1.0。双候选真实 refine exit=0（留档 /tmp/mf-refine-fix/：member_gmv type=simple、provenance 真值与 pv=v2.1.0）。
2. **MiniMax-M3 generate 稳定性**：累计 ~2/5 成功率（畸形 JSON fail-closed 拒、重试可恢复）；README 已注记；默认链主候选继续 MiniMax 需观察（用户裁决 B 维持）。
3. **M3 复审遗留**（cycle1 N1-N7 + cycle3 观察 1-5）：N1 死三元（server.ts 预算注记两分支恒等）；F1 文案无 taskId 负断言（钉死缺口）；「已用 X/上限 Y」拼装散布三处（server/llm index/pi-client——值得合一）；taskId 尾缀未回写 PRD/契约文档；审计缺失未降级的中间态无契约背书（诚实呈现，如需专属态回 PRD）；预算 store 任务级死 owner 接管缺失（taskId 尾缀下不可达）；锁判死仅 mtime 无 pid 判活；CLI 预算错误标题无仓内 e2e；stderr 双维警告两行 vs「一行」措辞。
4. **M2 遗留收口包**（handoff 延期项 3/4/5）：N1-N3 边角 + F11-F13 代码卫生（死代码/映射方向/env-file 下沉）。
5. **M1 遗留**：smoke `tee` 未并 stderr；通用错误 taskId 并发文案错位（预算错误已修）。

## 未验证项披露

- 无。验证门 59 文件 395 tests + contract 1 双轮评审员独立复跑一致；真实依赖用例三件套留档 `/tmp/mf-m3-real/`（审计事件链/provenance 真值/跨进程账本勾稽 10,713 tokens/预算阻断四要素）。注：该目录 run4.txt 为 cycle2 修复前格式（无千分位）——修复后行为由仓内测试（budget-store.test 千分位断言）与 cycle3 评审员实弹复核背书。

## 工作区残留

- `my-instance/`（M1 评审探针产物，可删）；`.codebase-memory/`（索引产物，决定提交或 gitignore）。
