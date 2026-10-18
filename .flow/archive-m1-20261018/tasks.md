# M1 · 任务切片（tracer-bullet 垂直切片）

> 规格源：`.flow/prd.md`（含 diff-gate 附录 ①② 与 GRILL 附录 G1–G10）。无 tracker，落盘本文件。切片自批记录见 state.json history。

- [x] 1. 依赖与工程面落地（prefactor）
- [x] 2. runtime 通道贯通（tracer：一条 complete() 走通新引擎）
- [x] 3. 配置解析与工厂接线（四分映射 + 急切校验 + 主备链）
- [x] 4. faux 改写、全量回归与文档/冒烟同步

---

## 1. 依赖与工程面落地（prefactor）

**Blocked by**: 无 — 可立即开始
**User stories**: US8、US12

### What to build

vendored `pi-agent-runtime@0.4.3` 落地为可安装依赖（tgz 拷自 deep-research vendor，随仓提交），package-lock 同步刷新；Node 支持面抬至声明地板 `>=22.19.0`（CI node 22、tsup target node22、README 披露）；guard 边界测试的断言串扩为 `pi-agent-runtime` / `@earendil-works/pi-agent-core` / `@earendil-works/pi-ai` 三串并补一条负例测试（注入违规 import 字串可检出）。本切片结束时引擎尚未接线，但依赖可安装、guard 对新包名已有执法。

### Acceptance criteria

- [ ] `vendor/pi-agent-runtime-0.4.3.tgz` 在仓内且被 package.json `file:` 引用；`npm install` 后 `npm ci` 绿（lockfile 已提交）
- [ ] `engines.node >=22.19.0`；CI workflow node-version 22；tsup target node22；`npm run build` 绿
- [ ] guard 测试断言三串齐全；负例测试注入 `import "pi-agent-runtime"` 字串可检出（红→绿）
- [ ] `npm run typecheck` 绿（依赖类型面可解析）

## 2. runtime 通道贯通（tracer）

**Blocked by**: 1
**User stories**: US1、US6、US7、US10、US13

### What to build

`src/llm` 内建起 runtime 通道并让一个 `complete()` 端到端走通：`createRuntime` 装配（authorize 无条件放行、no-op audit sink 永不抛错、limits 五键 builder、`modelRecovery.extraAttempts=1`）、`runText` 三分映射（succeeded→文本；INVALID_OUTPUT→空串；其余全部 status→抛错）、taskId `mf:<kind>-<seq>`（进程内自增）、runtime 进程级惰性单例（缓存键=候选链+key 指纹哈希，仅内存）。测试缝：手写脚本化 `ModelTransport`（响应队列+调用计数，`stop:'length'` 触发 INVALID_OUTPUT）。本切片只要求通道能力被单测证明；工厂接线（env 解析）属切片 3。

### Acceptance criteria

- [ ] 脚本化 transport 下 `complete()` 返回脚本文本且 callCount 正确
- [ ] `stop:'length'` 路径映射为空字符串；其他失败/阻断/取消类 status 全部抛错且文案含 reason
- [ ] no-op audit sink 连续调用不抛错
- [ ] limits 五键与 modelRecovery 值符合 D6；taskId 含 kind 前缀且同进程唯一
- [ ] 单例语义：同键复用、key 指纹变更新实例（单测证明）

## 3. 配置解析与工厂接线

**Blocked by**: 2
**User stories**: US2、US3、US4、US5、US11（+G9）

### What to build

`createLlmClientFromEnv` 重写为急切校验工厂：四分映射 resolver（真值表两验证模型 → `MF_LLM_BASE_URL` 网关（protocol 缺省 openai-completions、`MF_LLM_API` 覆盖）→ catalog 回退（`openai-responses→openai-completions` 映射表；google 等未知 api 显式拒绝并给网关迁移指引）→ 显式拒绝且报错列出三条路径）；`MF_LLM_FALLBACK_MODELS` 解析（笔误急切抛错点名坏条目、缺 key 跳过、trim/空项/保序）；三个新 env 的非法值急切抛错（G6）；密钥从注入 env 实参读取并删除 process.env 桥（G3，修复设置页改 key 不生效暗坑）；faux 后端分支保持原样；`llmStatus` 呈现 `主 (+N 备)`。

### Acceptance criteria

- [ ] 四分映射每路一条单测（含 `openai/gpt-4o` 经映射表可用、`google/*` 拒绝文案含网关指引、乱配置拒绝文案列三路径）
- [ ] fallbacks：拼错条目抛错点名；无 key 跳过；全候选无 key 报错列出所需环境变量名
- [ ] `MF_LLM_API`/`MF_LLM_TIMEOUT_MS` 非法值、真值表命中+baseUrl 同设，均工厂急切抛错
- [ ] 密钥改后同进程生效（注入 env 新 key → 新 transport，单测证明）；process.env 桥已删
- [ ] UI `llmStatus` 探针：configured/error 分类正确且显示 `主 (+N 备)`；`npm run build` 后设置页 UX 语义不变

## 4. faux 改写、全量回归与文档/冒烟同步

**Blocked by**: 3
**User stories**: US6、US7（回归面）、US12（验证面）

### What to build

`src/llm/faux.ts` 弃用 pi-ai compat `registerFauxProvider`，改以切片 2 的脚本化 transport 驱动新引擎（测试外部行为不变）；既有 llm-adapter 测试适配新结构；`scripts/llm-smoke.sh` 扩展——key 环境变量缺失时从 `~/.pi/agent/auth.json` 抽取注入（不覆盖已设值）、循环两真值表候选各跑一次留档、头注释声明 smoke 专用 dev 便利（G7）；README provider 配置表补三个新 env + 真值表两模型 + catalog 最佳-effort 披露 + google 网关迁移指引 + 修正已失效的 `claude-sonnet-4` 示例 id（G10/R1 查证）；设置页 placeholder 与 README 示例对齐真值表候选。

### Acceptance criteria

- [ ] faux.ts 无 `@earendil-works/pi-ai/compat` import；引擎级 faux 测试断言行不变地通过
- [ ] `npm run lint && npm run typecheck && npm run test && npm run contract-test` 全绿
- [ ] smoke 脚本一条命令可对两真值表候选留档输出（本机 auth.json 两候选 key 均存在）
- [ ] README/设置页/脚本注释三处配置示例一致；`MF_LLM_FALLBACK_MODELS`/`MF_LLM_API`/`MF_LLM_TIMEOUT_MS` 在 provider 表可查

---

**VERIFY 备忘**：验证门 `npm run lint && npm run typecheck && npm run test && npm run contract-test`；真实依赖用例=扩展后 smoke 脚本两候选实跑（G7）；node 地板实测=fnm v22.23.3 全量门（D10）。

---

## REVIEW cycle 1 工作项（2026-10-18，源自 .flow/review-findings.md）

- [x] R1（F1 blocking）：e2e 5000ms 默认超时过紧——新增 vitest.config.ts 显式 testTimeout=15000（进程边界 e2e 合理阈值，不削弱行为断言）；node 22.23.3 全量门连跑 3 次 exit=0 + node 24 全量门 exit=0
- [x] R2（F2 blocking）：smoke 循环逐候选容错——`run_smoke_for_model` 失败记入该候选目录 smoke-failure.txt 并继续下一候选；结尾逐候选汇总；任一候选失败脚本 exit=1 但双候选留档齐全；重跑产出真实双候选留档
