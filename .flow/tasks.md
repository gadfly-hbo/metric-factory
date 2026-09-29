# Metric Factory v3 · 任务拆解（垂直切片）

> 来源：`.flow/prd.md`（含 GRILL 决议）。
> 拆解批准理由（自批准，2026-09-29）：9 切片全部端到端可验收；映射链（解析→推荐→命令→导出）与 UI 链（基建→实例→审核）各自递进、track 独立；UI 范围纪律内置（每视图一片、超 2 片不验收即砍）。

- [x] 0. dbt artifacts 解析层（manifest/catalog 双输入合并）
- [x] 1. 映射推荐引擎（归一化 + 同义词 + 信号打分 + 阈值）
- [x] 2. map 命令族（draft/交互/apply + 差距清单 + mapping schema）
- [x] 3. export 映射升级 + 契约测试升级
- [x] 4. track 命令（事件推导 + tracking-plan）
- [x] 5. UI 基建与设计规范落地（http 外壳 + 模板浏览）
- [x] 6. UI 实例视图（指标树 + patch 表单写回）
- [x] 7. UI 审核流视图
- [x] 8. README v3 + CI 扩展 + 收尾

---

## 0. dbt artifacts 解析层

### What to build
`src/warehouse/parse.ts`：读 manifest.json（nodes 过滤 resource_type=model，取 name/columns/描述）与可选 catalog.json（nodes 同结构，全量列+类型）；合并（catalog 列覆盖 manifest 声明列）；产出 `WarehouseModel[] {name, columns: {name, type?}[], source}`；缺列模型标记；两者皆不可读时给出可定位错误。

### Acceptance criteria
- [ ] 四形态 fixture 单测：仅 manifest（有列）/仅 manifest（无列）/manifest+catalog 合并/双缺列
- [ ] catalog 列覆盖优先级正确；source 字段记录每列来源（manifest|catalog）
- [ ] 解析错误（坏 JSON、缺 nodes）报可定位错误

### Blocked by
None

---

## 1. 映射推荐引擎

### What to build
`src/warehouse/recommend.ts`：候选生成（指标 × 模型列）+ 信号打分（列名精确=1.0 / 指标名包含列名或列名包含指标名=0.8 / 中英同义词表命中=0.7 / definition 关键词命中列名=0.5，取最高信号）+ 输出 `Recommendation[] {metric, model, column, score, signals[]}`，≥0.6 为可推荐；内置中英同义词表（成交额→gmv/amount/revenue、用户→user/customer、订单→order…≥20 组）。

### Acceptance criteria
- [ ] fixture manifest 上：可映射指标自动推荐命中率 ≥50%（独立字面量断言每个期望命中）
- [ ] 干扰项不产生 ≥0.6 的假阳性推荐（构造近似但不义的列名）
- [ ] 信号明细可解释（每条推荐列出来源信号）

### Blocked by
- #0

---

## 2. map 命令族

### What to build
`src/schema/mapping.ts`（MappingSchema：base/mappings[{metric, model, column, agg?, confidence, signals, confirmed_by?, confirmed_at?}]）；`metric-factory map <instance> --manifest <m> [--catalog <c>]`：解析→推荐→差距清单三分类输出（+--json）；`--draft` 产 map-draft.yaml；TTY 交互逐条确认直接写 `<实例主名>.mapping.yaml`；`--apply <draft> [--reviewer]` 非交互确认。

### Acceptance criteria
- [ ] e2e：fixture manifest 对 ecommerce 实例产差距清单（三类计数 + 明细）；--draft 落盘
- [ ] e2e：--apply 后映射文件含 confirmed_by；重复 --apply 幂等（合并不重复）
- [ ] 差距清单 --json 可解析；无 manifest 时明确报错

### Blocked by
- #1

---

## 3. export 映射升级 + 契约测试升级

### What to build
metricflow exporter：存在映射文件且指标已映射 → semantic model `model.ref` = 映射模型名、measure `expr` = 映射列名、`agg` 用映射覆盖；未映射指标维持占位并在导出头部注释标注未映射清单。export CLI `--mapping` 显式指定 + 同目录自动发现。

### Acceptance criteria
- [ ] e2e：映射实例导出物 model.ref ∈ fixture manifest 模型集、已映射 measure.expr ∈ 对应模型列集
- [ ] 未映射指标仍可导出（占位 + 头部标注「N 个指标未映射，使用占位模型」）
- [ ] 契约测试升级后 schema 校验仍 100% 通过

### Blocked by
- #2

---

## 4. track 命令

### What to build
`src/engine/tracking.ts`：旅程树（category=旅程）+ 北极星指标 → 事件推导（GRILL #5 动词映射表）；输出 `tracking-plan.yaml`（事件/触发时机/属性/关联指标）与 `tracking-plan.schema.json`。

### Acceptance criteria
- [ ] e2e：ecommerce 实例产出的计划覆盖全部旅程树指标（数量断言）
- [ ] 每事件属性含公共属性 + 指标 dimensions；schema.json 每事件一份合法 JSON Schema（ ajv 自校验）
- [ ] 动词映射命中与 fallback（track_<metric>）两类都有输出

### Blocked by
None（引擎纯函数）

---

## 5. UI 基建与设计规范落地

### What to build
`src/ui/`：node:http server（零新依赖）+ Xanthil 设计规范落地（CSS 变量 token 全量、三栏外壳 sidebar 248/主区 860/inspector 300、状态 chip 色字双通道、边界声明常驻）；路由：`GET /`（工作台首页：实例概览与入口）、`GET /templates`、`GET /templates/:id`（六模板指标字典表格）；`metric-factory ui [--port]` 命令。

### Acceptance criteria
- [ ] e2e（真实 server + fetch）：三路由 200 且含关键内容（模板名/指标数/口径列）
- [ ] HTML 含设计 token（accent #0f766e、bg #f7f6f3 等在 CSS 变量中）与边界声明文案
- [ ] 未知模板 404；仅监听 127.0.0.1；--port 0 随机端口可用于测试

### Blocked by
None

---

## 6. UI 实例视图（树 + patch 表单）

### What to build
`GET /instance`（实例指标树按分类分色 + 指标详情 inspector）与 patch 编辑表单（caliber 开关勾选、modified 字段、removed 勾选、added JSON 文本域）；`POST /instance/patch` 调引擎（应用→validate→全过写回，错误返回 rule/message 列表）；原生 form 提交 + fetch 增强。

### Acceptance criteria
- [ ] e2e：GET 含实例指标与树分组；合法 patch POST 写回后 CLI diff 可见变更
- [ ] 非法 patch（悬空维度）POST 返回 422 + dangling-dimension 错误信息，实例文件零变化
- [ ] 禁用 JS 语义：form 原生 action 提交可达同一端点（HTML action 属性正确）

### Blocked by
- #5

---

## 7. UI 审核流视图

### What to build
`GET /review`（待审 LLM 指标列表：口径/出处/置信信息）+ `POST /review/:name`（action=approve|reject，reviewer 参数，走 review 引擎写 reviewed_by/移除）。

### Acceptance criteria
- [ ] e2e：含待审指标的实例在 UI 批准后导出放行（fail-closed 全链路在 UI 路径成立）
- [ ] reject 后指标从实例消失；非待审指标 POST 返回 422（同 CLI S4 语义）
- [ ] 无待审时页面显示空状态（虚线框 + 下一步指引，符合规范）

### Blocked by
- #5（可与 #6 并行）

---

## 8. README v3 + CI 扩展 + 收尾

### What to build
README v3 章节（map/track/ui 用法、catalog.json 说明、设计规范声明）；CI 无需改结构（lint/typecheck/test/contract 自动纳入）；examples 增映射与 tracking-plan 示例产物说明。

### Acceptance criteria
- [ ] 四门命令全绿（含全部新测试）
- [ ] README 命令可复制执行（fixture manifest 路径给出）
- [ ] examples 目录含 fixture 演示路径说明

### Blocked by
- #0–#7 全部
