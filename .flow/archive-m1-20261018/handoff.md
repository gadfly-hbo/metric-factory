# Handoff · M1 完成后（2026-10-18，commit 655b84d）

## 已交付

LLM 引擎 pi-ai compat → vendored pi-agent-runtime 0.4.3：runText 通道（三分映射 + limits 五键 + modelRecovery）、四分映射模型解析（真值表/网关/目录回退/显式拒绝）、MF_LLM_FALLBACK_MODELS 主备链、密钥注入 env 直读（设置页改 key 同进程生效）、guard 三串、engines>=22.19 + CI node22、smoke 双候选循环留档。红线全保（工人模式/fail-closed/faux/LlmClient 接口/业务零改动）。

## 开放依赖与下一批前置

- **M2（零配置体验）前置已备**：本机 `~/.pi/agent/auth.json` 含 minimax-cn / xiaomi-token-plan-cn 等 7 provider；真值表两候选已是默认推荐路径；设置页降级设计见 2026-10-18 会话迭代方案 M2 节。
- **M3（审计/provenance）挂点已埋**：`createPiClient` 的 `opts.auditSink`（缺省 NOOP_AUDIT，单点替换即 JSONL 落盘）；taskId 已带 `mf:<kind>-<seq>`，`createLlmClientFromEnv(env, caller?)` 支持可选 caller——**调用点（cli/mcp/ui 四处）尚未传 generate/refine 标签**，M3 provenance 时接上。
- **ci 提醒**：CI 首次跑需确认 GitHub Actions node22 上 npm ci 与 vendor tgz 无坑（本地 npm ci 已双轨验证）。

## 延期项（本批明确不做，按优先级）

1. **smoke 发布门 WARN 态待人工评估**：双候选 refine 输出均被 schema 拒（MiniMax `type:"sum"`、mimo `type:"measure"`+缺 owner_role——模型自创枚举，fail-closed 兜住）；generate 双候选真实成功。属 refine prompt 与模型口径契合度问题（prompt/schema 本批未动）。留档 `/tmp/mf-llm-smoke-20261018-143600/`。处置选项：refine prompt 枚举加固 / DR 式 parseJsonLoose 松解析（产品决策）。
2. **MiniMax-M3 generate JSON 畸形**（`"name":` 值系统性缺引号）——真值表主候选的输出稳定性观察记录；mimo 同 prompt 全合格。M2 默认链排序时可参考。
3. **F3**：`envKeyFor`（src/llm/index.ts）与 `apiKeyEnvName`（src/ui/env-file.ts）两处实现，新增含 `.` 的 provider 时公式结果会漂移——建议合一。
4. **F4**：`stop:'length'` 用例缺 callCount 区分度（extraAttempts=0 也会过）；buildLimits 五键无行为断言。
5. **F5**：`MF_LLM_TIMEOUT_MS` 超长数字串经 Number() 得 Infinity 静默放行（加 Number.isFinite 校验）。
6. **review cycle2 Low**：smoke `| tee` 未并 stderr（refine-summary.txt 空、smoke-failure.txt 指引失实）；pi-client.ts:98 抛错文案重读全局 taskSeq（并发下 taskId 可错位，改局部变量）；pi-client.ts 注释残留 DR 术语「transportFor」。
7. **工作区残留**：`my-instance/`（评审子代理 init 探针产物，可直接删）；`.codebase-memory/`（codebase-memory 索引产物，决定提交或 gitignore）。

## 未验证项披露

- 无。验证门 node24 + node22 双轨全绿（含评审员独立复跑）；真实依赖用例两候选端到端实证（见延期项 1/2 的质量注记）。
