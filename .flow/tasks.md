# v4 批次 · 任务拆解（tracer-bullet 垂直切片）

> 来源：`.flow/prd.md`（含 GRILL 决议与 UI-GATE 裁决回写）。拆解经自批准（dev-flow 规则： breakdown self-approved，理由记入 state.json history）。切片 0 与 1 可并行，2 依赖 0，3 依赖 1+2，4 依赖 2。

- [x] 0. Schema 扩展 + lint 规则（L1 三件套 + concept_refs）
- [x] 1. 规范化序列化 + 指纹引擎
- [x] 2. SAP 装配器 + 双面校验器
- [x] 3. SAP CLI 导出（--format sap + D1）
- [x] 4. 工作台 UI SAP 下载（含 D2 文件名断言）

---

## 0. Schema 扩展 + lint 规则

### What to build

指标与实例 schema 增加可选的 L1 契约字段（aggregation / statistic_object / caliber_type 八族枚举数组）与实例级 concept_refs，全部向后兼容（7 模板零改动）；lint 增加配套校验规则（两表 ⊆ dimensions 且不相交、空 dimensions 边界、枚举取值合法且去重、ConceptRef 形状）；materialize 透传新字段使既有三格式导出无感知携带。端到端：模板作者手写新字段 → lint 过/拒 → 物化与导出照常。

### Acceptance criteria

- [ ] Metric 增加可选 `aggregation{allowed_dimensions,disallowed_dimensions,ratio_policy?}`、`statistic_object{id,version,source,role?}`、`caliber_type: CaliberFamily[]`；Instance 增加可选 `concept_refs: ConceptRef[]`（8 族枚举常量定义）
- [ ] lint 正/负例：aggregation 两表 ⊆ dimensions 且不相交；dimensions 为空时 aggregation 存在即错；caliber_type 命中 8 枚举且去重；ConceptRef id/version/source 非空
- [ ] 回归纪律：先跑既有 148 测试零改动通过（红队 #3 两步顺序），再提交新测试
- [ ] 7 模板 `npm run lint` 零改动通过

### Blocked by

None - can start immediately

---

## 1. 规范化序列化 + 指纹引擎

### What to build

YAML 1.2 子集规范化序列化器（UTF-8 无 BOM/LF/NFC/2 空格缩进/块式 only/禁锚点/键递归排序/plain-safe 保守规则/双引号 JSON 转义/无文档标记/行尾无空格/单一末尾换行）+ 指纹（计算时 fingerprint 字段置空）。端到端：任意包对象 → 规范字节 → SHA-256 → 往返三次哈希恒定。

### Acceptance criteria

- [ ] golden vectors ≥3（纯 ASCII / 含中文 definition / 深嵌套 caliber_switches）字面量断言
- [ ] round-trip 稳定：parse→canonical→rehash ×3 哈希恒定；与解析库往返语义等价
- [ ] 引号规则：保守 plain-safe 模式（^[a-z0-9][a-z0-9_.\-/]*$ 且非 core-schema 非串类型）外一律双引号
- [ ] 指纹自引用：置空字段后计算；声明值=计算值

### Blocked by

None - can start immediately（与 0 并行）

---

## 2. SAP 装配器 + 双面校验器

### What to build

物化实例 + 模板 → SAP 0.1 包对象（契约 §3 全部段）：concept_refs = 实例级 ∪ 各指标 statistic_object 按 (id,version,role) 去重；review 段 {gate, exported_at, unreviewed:[]}；namespace mf.<package-id>；generator metric-factory@<version>+<git-sha>（构建期注入，缺失回退）；runtime_state/sap 字面量。供应侧校验：重复指标 name、(id,version,role) 拒绝；schema 校验器覆盖契约全部拒绝规则（结构/未知 sap/非 design_only/指纹失配/重复身份）。

### Acceptance criteria

- [ ] 装配正例：fixtures 产出契约 §3 形状全段；去重键 (id,version,role) 有断言
- [ ] 供应侧负例：重复 name、重复 concept key → 拒绝
- [ ] 校验器负例：构造非法包每类拒绝规则一条（未知 sap 版本/非 design_only/指纹失配/重复 id@version/结构不合法）
- [ ] created_at 可注入（测试冻结时钟）

### Blocked by

- #0（依赖新 schema 字段）

---

## 3. SAP CLI 导出（--format sap + D1）

### What to build

既有 export 命令族新增 `--format sap`：管线 = 现有 export gate（整批阻断）→ 装配 → 查重 → 指纹 → 写盘 `<实例名>.sap.yaml`；UI 无关。同步 D1：未知格式错误页/帮助枚举串加 sap。端到端 e2e：成功/阻断/查重拒绝/指纹跨运行一致。

### Acceptance criteria

- [ ] e2e 正例：fixture 实例导出文件含 sap: 0.1 / runtime_state: design_only / fingerprint / namespace mf. / generator
- [ ] e2e 负例：含未审核 LLM 指标 → 整批阻断（与三格式同一语义断言，ExportBlockedError 路径）
- [ ] 两次导出指纹一致（忽略 created_at）；冻结时钟下单测字节级一致（GRILL Q1）
- [ ] D1：未知格式错误串枚举含 sap

### Blocked by

- #1、#2

---

## 4. 工作台 UI SAP 下载（含 D2 文件名断言）

### What to build

实例页导出下载区按 `.flow/ui-contract.md` 新增「SAP 语义包」项（恒居末位，术语逐字）；服务端复用同一装配管线与 gate；阻断走同一 ExportBlockedError → 422 页零弱化；下载文件名 `<实例名>.sap.yaml`（D2：文件名去后缀）。端到端 UI e2e（真实 server + fetch）。

### Acceptance criteria

- [ ] UI e2e：SAP 下载 200，内容含 sap: 0.1/design_only/fingerprint；Content-Disposition filename=<实例名>.sap.yaml
- [ ] UI e2e：阻断实例 → 422 页含未审核指标名 + /review 入口（与既有 export-download fail-closed 断言同构）
- [ ] 下载区 HTML 含 SAP 项且居末位；术语与 ui-contract §4 逐字一致
- [ ] 既有 test/ui 全部零改动通过

### Blocked by

- #2（#3 完成后接续，UI 端点独立于 CLI 但共享装配）
