# Handoff · M2 完成后（2026-10-18，commit 902574c）

## 已交付

零配置体验：auth.json 密钥自动发现（全容错静默）+ 三层合成（process env > .env.local > 发现，四入口统一）+ 默认链自动启用（G4-B：MiniMax-M3 主 / mimo 备）+ 设置页「查看+覆盖」降级 + 首页芯片四分支三态 + 注入缝密闭（双环境 364/364）。零配置真实用例实证（无配置 CLI generate 经默认链 exit=0，provenance=minimax-cn/MiniMax-M3）。

## 开放依赖与下一批前置（M3：审计落盘与 provenance 闭环）

- **挂点已备**：`createPiClient` 的 `opts.auditSink`（缺省 no-op，单点替换即 JSONL 落盘）；taskId 已带 `mf:<kind>-<seq>`；`createLlmClientFromEnv(env, caller?)` 支持可选 caller——**调用点（cli/mcp/ui）尚未传 generate/refine 标签**，M3 provenance 时接上。
- **modelLabel 现状**：CLI/MCP/UI draft job 均读合成后 env 的 `MF_LLM_MODEL`（链首语义）；M3 的「记录实际出稿 provider/model」需从 runtime 结果/审计事件取真值。
- **M3 范围提醒**：审计 JSONL 落盘+轮转、预算账本、provenance 实际出稿、设置页调用统计——评审确认本批零越界。

## 延期项（按优先级）

1. **refine prompt 加固**（M1 延期项 1，产品决策未入批）：双真值表候选 refine 输出仍被 schema 拒（模型自创 `sum`/`measure` 枚举）。留档 `/tmp/mf-llm-smoke-20261018-143600/`。零配置用户体验面：generate 已通，refine 第二步仍会撞红（fail-closed 兜住零写盘）。
2. **MiniMax-M3 generate 稳定性**：M1 smoke 1/1 + M2 零配置用例 1/3（try1/2 畸形、try3 成功，留档 `/tmp/mf-zeroconfig-20261018-171506/`）——累计 ~2/5。README 已注记已知风险；默认链主候选继续 MiniMax 需在 M3 观察或用户再裁决 mimo 升主。
3. **M2 复审 non-blocking 收口包**（一次小 PR 可清）：N1（S2 场景状态卡「(+1 备)」按链定义计数与链表格「缺失」行口径相搏——改按 enabled 子集计数）；N2（faux 态吞掉遮蔽警告）；N3（S5 状态卡补一句过渡说明）；F7（H3 小字补「去设置」锚点）；F8（API Key label 无 key 分支补「留空则不修改」）；F9（fallbacks-only 报错归因改点名「主模型未设」）。
4. **代码卫生包**：F11 死代码（`resolveLlmEnv`、`SettingsValues`/`opts.values`、`SOURCE_LABEL/SOURCE_CHIP` 的 default-chain 不可达行）；F12（`nonEmpty`/`nonEmptyEnv` 合一、`nonEmpty(...) !== undefined` 绕弯布尔、`modelSource0` 别名、无 slash spec 的 slice 口径）；F13（src/llm→src/ui 反向依赖——`readEnvFile` 下沉叶子模块或注释豁免）。
5. **契约/文档字面**：F5（`llm-env-auto.test.ts` 空串语义/env 超集两测试补注入不存在 authJsonPath，D3 字面全密闭）；F6（ui-contract §7.3 补录 `.banner`/`.banner-ok`）；F10（README 注明 `MF_LLM_AUTH_JSON_PATH` 亦可在 .env.local 设置）。
6. **M1 遗留未动**：smoke `tee` 未并 stderr（refine-summary.txt 空）；pi-client 抛错文案重读全局 taskSeq（并发下 taskId 可错位——改局部变量）。
7. **工作区残留**：`my-instance/`（M1 评审探针产物，可删）、`.codebase-memory/`（索引产物，决定提交或 gitignore）。

## 未验证项披露

- 无。验证门双轨（node24 本机 + 双环境密闭）全绿含评审员两轮独立复跑；真实依赖用例 = 零配置 generate（默认链）实证留档。refine 红态为已知披露项（①A 裁决），非未验证。
