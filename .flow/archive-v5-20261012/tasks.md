# v5 分析体系编辑器 · 任务拆解（tracer-bullet 垂直切片）

> 来源：`.flow/prd.md`（含 GRILL 决议 + UI-GATE D1–D4）。自批准（dev-flow 规则），理由记入 state.json。红队砍线：>6 切片即砍（未触发：5 切片）。

- [x] 0. ScenarioSpec schema + 校验规则（lint/validate 镜像）
- [x] 1. 数据接入：模板种子（ecommerce+apparel）+ added_scenarios + materialize 收集 + diff 计数
- [x] 2. SAP scenarios 段：schema 收紧 + 装配 + 校验镜像
- [x] 3. CLI e2e：坏场景拒绝 / diff 计数 / SAP 导出含场景
- [x] 4. UI 场景区块：路由 + 卡片 + DSL 解析 + 422 同页重渲染 + e2e

---

## 0. ScenarioSpec schema + 校验规则

### What to build

`src/schema/scenario.ts`：ScenarioSchema（PRD 冻结结构：id/version/title/decision_purpose/question_tree/metric_usages/method_refs/evidence_requirements/output_spec/review_rules；role 枚举 outcome|driver|guardrail）。TemplateSchema += `scenarios`（默认 []）；InstanceSchema += `added_scenarios`（默认 []）。lint 模板镜像规则（scenario-purpose/tree-ref/metric-ref/id）与 validateInstance 实例镜像规则（同套 + added 与模板种子联合唯一）。端到端：YAML 手写场景 → schema/lint/validate 过或拒。

### Acceptance criteria

- [ ] unit 正/负 fixtures：无 decision_purpose、parent 悬空/成环/自指、metric 引用不存在（模板指标/物化指标两语境）、场景 id 重复、role 非法——每类一条
- [ ] 两步回归：先 203 基线原样绿再动手
- [ ] 7 模板 lint 零 error（模板无种子时默认空合法）

### Blocked by

None

---

## 1. 数据接入 + 种子 + diff

### What to build

模板种子：ecommerce-marketplace（GMV 差距诊断）与 apparel-brand-retail（月度经营复盘）各 1 个场景（GRILL Q4 验收线：用途 ≥15 字、树 ≥3 节点、usages ≥3 且含 outcome；引用各自模板真实指标）。materialize 收集（模板种子 ∪ added，同 id 实例覆盖）→ MaterializedInstance.scenarios。diff 输出「scenarios: +N（added）」计数行。

### Acceptance criteria

- [ ] 种子过全部校验规则；两模板 lint 保持零 error
- [ ] materialize 覆盖语义有单测（同 id 实例 added 覆盖模板种子）
- [ ] diff --json 含 scenarios 计数字段；文本输出含计数行

### Blocked by

- #0

---

## 2. SAP scenarios 段

### What to build

SapPackageSchema.scenarios 从 `z.array(z.unknown())` 收紧为 ScenarioSchema 数组；assembleSap 从 materialized.scenarios 收集进包；validateSapPackage 对应规则随收紧自然生效（结构/引用一致性）。契约预留条款兑现：scenarios 转正式段。

### Acceptance criteria

- [ ] unit：含场景实例 → 包内 scenarios 结构断言；坏场景包 → structure 拒绝
- [ ] 指纹/去重等既有断言零回归

### Blocked by

- #1

---

## 3. CLI e2e

### What to build

test/cli 新 e2e：构造带 added_scenarios 的实例——validate 通过并 diff 显示计数；坏场景（悬空指标引用）validate 非零拒绝；export --format sap 产物含 scenarios 段且过校验器。

### Acceptance criteria

- [ ] 三条 e2e（正/负/SAP 含场景）全绿
- [ ] 既有 CLI e2e 零改动

### Blocked by

- #2

---

## 4. UI 场景区块

### What to build

按 `.flow/ui-contract.md`（冻结契约）：实例页场景卡片（列表+来源 chip 三态）、新建/编辑表单（id 创建可填编辑只读 = D1；DSL `id|label|parent|metric` / `metric|role|note` 服务端解析）、POST 走引擎 validate 全过写回（同页重渲染+值保留 = D4，错误逐条 `[rule] path: message` 含 DSL 行号）；无删除入口（D3）；种子编辑保存为实例覆盖（D2）。零客户端脚本。

### Acceptance criteria

- [ ] UI e2e（真实 server+fetch）：列表渲染含来源 chip；合法表单写回后实例文件含场景且 CLI validate 可见；坏 DSL → 422 同页回显行号 + 实例文件零变化
- [ ] 术语与 ui-contract §4 逐字一致；既有 test/ui 零回归
- [ ] 禁 JS 语义：表单原生 action 提交可达

### Blocked by

- #1（物化收集；与 #2/#3 顺序执行）
