# Metric Factory

指标体系的「设计态」工具：**业务目标 → 指标树 + 指标字典**，产出对齐 dbt MetricFlow 的指标定义，直接接入现有语义层生态。

- 内置行业模板（电商交易平台 53 指标 / SaaS 订阅 48 指标 / 服饰品牌零售 72 指标），每个指标含完整口径、维度、归口角色与出处
- 问卷匹配模板 → 口径开关微调 → 实例 = 模板 fork + diff，永远可以回答「我们改了什么、为什么」
- 导出：dbt MetricFlow YAML / Excel 指标字典（含出处列）/ Mermaid 指标树
- fail-closed：LLM 生成且未经人工审核的指标**无法导出**（不是提示，是阻断）

产品背景与调研依据见 [PRODUCT_PLAN.md](./PRODUCT_PLAN.md)。Apache-2.0。

## 安装

```bash
git clone <本仓库> && cd metric-factory
npm install
npm run build
# 本地执行（或 npm link 后直接用 metric-factory）
node dist/cli.js --help
```

## 30 分钟上手路径

每一步都可复制执行（在仓库根目录）：

```bash
# 1. 问卷向导：回答收入模式 / 用户结构 / 核心循环，匹配行业模板并生成实例
node dist/cli.js init --answers examples/ecommerce-answers.yaml --out my-instance

# 2.（可选）交互式向导：不传 --answers 直接进入
node dist/cli.js init

# 3. 校验实例：口径完整、维度引用、出处、fail-closed 检查
node dist/cli.js validate my-instance/instance.yaml

# 4. 查看相对模板改了什么
node dist/cli.js diff my-instance/instance.yaml

# 5. 导出（三格式任选）
node dist/cli.js export my-instance/instance.yaml --format metricflow --out out
node dist/cli.js export my-instance/instance.yaml --format excel   --out out
node dist/cli.js export my-instance/instance.yaml --format mermaid --out out

# 6. 验证导出物可被真实 dbt 解析（需本机安装 dbt >= 1.8，手动执行）
zsh scripts/dbt-parse-smoke.sh out/metricflow.yaml
```

微调实例：编辑 `instance.yaml` 的四个 patch 段——`caliber_switches`（口径开关取值）、`modified`（改字段）、`removed`（删指标）、`added`（增指标，必须带 provenance）。

## 口径可信性（fail-closed）

- 每个指标必须带 `provenance`：`template`（模板出处）/ `manual`（人工）/ `llm`（模型 + prompt 版本）
- `origin=llm` 的指标必须 `review.required: true`；补上 `provenance.reviewed_by` 才算已审核
- **未审核的 LLM 指标在导出层被硬阻断**，并有测试覆盖（`test/cli/export.e2e.test.ts`）

## 模板贡献

模板是 git 上的结构化资产，欢迎 PR 增补行业：

1. 复制 `templates/saas-subscription.yaml` 为新行业文件（id 用小写 kebab-case）
2. 填齐 `matching`（问卷匹配元数据）、`north_star`、`trees`、`dimensions`、`metrics`
3. 本地过 lint 门（口径必填、维度/树引用完整、出处存在、type_params 引用一致）：

```bash
node dist/cli.js lint templates/<你的模板>.yaml
```

4. 提 PR；CI 会跑同一 lint + 全量测试 + 契约测试

## 开发

```bash
npm run build          # 构建 CLI（tsup）
npm run test           # 构建 + 全量测试（vitest，e2e 走 CLI 进程边界）
npm run typecheck      # tsc --noEmit
npm run lint           # 模板 lint（内置两模板）
npm run contract-test  # MetricFlow 导出契约测试（JSON Schema）
```

架构：`src/schema`（Zod 元模型）· `src/engine`（loader / lint / match / instantiate / materialize / validate）· `src/export`（metricflow / excel / mermaid 三导出器 + fail-closed 门）· `src/cli`（commander 命令）· `templates/`（行业模板数据资产）。

## v2 · LLM 设计器

AI 出初稿、人当守门员（工人模式：单次结构化调用 + schema 校验 + fail-closed 门，模型不握方向盘；模型访问统一走 pi-ai 适配层，业务代码零 pi 依赖）。

### 全链路

```bash
# 1. 生成候选指标草案（模板锚定，先 init 出实例）
node dist/cli.js generate my-instance/instance.yaml --describe "我们是跨境电商，主打低价秒杀" --out draft.yaml
node dist/cli.js generate my-instance/instance.yaml --describe "..." --dry-run   # 零 key 评估 prompt 与 token

# 2. 合入草案（validate 全过才写盘；LLM 新增自动带 provenance + 待审标记）
node dist/cli.js apply my-instance/instance.yaml draft.yaml

# 3. 人工审核（批准写 reviewed_by；未审核导出被硬阻断）
node dist/cli.js review my-instance/instance.yaml                       # 列出待审
node dist/cli.js review my-instance/instance.yaml --approve seckill_gmv --reviewer 张三
node dist/cli.js review my-instance/instance.yaml --reject seckill_gmv

# 4. 微调既有实例（自然语言 → caliber/modified/removed/added 草案，同样走 apply）
node dist/cli.js refine my-instance/instance.yaml --instruction "GMV 改为含退款；删掉 NPS" --out draft.yaml

# 5. 审计存量指标字典
node dist/cli.js audit my-instance/instance.yaml        # 口径完整/虚荣指标/归口/孤儿，--json 结构化
```

### MCP server（agent 一等公民）

```bash
node dist/cli.js mcp    # stdio 协议；工具：mf_generate / mf_refine / mf_audit / mf_validate / mf_diff / mf_export
```

工具一律返回草案/结果 JSON **不写盘**——agent 把草案呈现给用户，落盘仍走 CLI apply/review（人审门不可绕过）。

### Provider 配置

| 环境变量 | 作用 |
|---|---|
| `MF_LLM_MODEL` | `<provider>/<model-id>`，如 `openai/gpt-4o`、`anthropic/claude-sonnet-4` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` 等 | pi-ai 供应商目录对应凭证 |
| `MF_LLM_BASE_URL` | OpenAI 兼容内部网关覆盖 |
| `MF_LLM_BACKEND=faux` + `MF_FAUX_RESPONSE` | 确定性脚本（测试/演示，零网络） |
| `MF_REVIEWER` | review 默认审核人 |

真实链路发布前冒烟：`zsh scripts/llm-smoke.sh`（留档模型输出供人工评估口径质量）。

### 行业模板（7 个）

电商交易平台（53）· SaaS 订阅（48）· 内容社区 App（43）· 数字营销（40）· 供应链物流（40）· 云成本 FinOps（40）· 服饰品牌零售（72，口径精选改写自某服饰品牌企业 944 指标真实字典，已脱敏）。贡献新模板见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## v3 · 落地闭环

### 数仓映射（dbt manifest 反推）

```bash
# 1. 反推：manifest（必须）+ catalog（强烈建议，dbt docs generate 产物，提供全量列）
node dist/cli.js map my-instance/instance.yaml \
  --manifest path/to/manifest.json --catalog path/to/catalog.json --draft map-draft.yaml

# 零数仓试跑（仓库自带演示 fixture）：
node dist/cli.js map examples/ecommerce-instance.yaml \
  --manifest test/fixtures/dbt-manifest.json --catalog test/fixtures/dbt-catalog.json --draft map-draft.yaml

# 2. 确认草案（全部条目标 confirmed 写入 instance.mapping.yaml，幂等）
node dist/cli.js map my-instance/instance.yaml --apply map-draft.yaml --reviewer 张三

# 3. 导出自动读取映射：model.ref 与 measure.expr 变成真实 dbt 模型与列名
node dist/cli.js export my-instance/instance.yaml --format metricflow --out out
```

差距清单三分类（已映射 / 可映射待确认 / 待人工）随 map 输出；推荐带置信度与信号明细（精确命中 / 包含 / 中英同义词 / 口径关键词）；比率/占比类指标（`*_share`/`*_rate`）的包含命中自动降档，防映射到绝对值列。红队提示：dbt manifest 的列信息常为空，**务必同时提供 catalog.json**。examples/ 目录含各行业问卷答案与实例样例；map 演示用 `test/fixtures/dbt-*.json`（见上方命令）。

### 埋点建议

```bash
node dist/cli.js track my-instance/instance.yaml --out out
# 产出 out/tracking-plan.yaml（事件/触发时机/属性/关联指标）+ out/tracking-plan.schema.json（每事件一份 JSON Schema）
```

### Web 工作台

```bash
node dist/cli.js ui --instance my-instance/instance.yaml --port 4173
# 或双击仓库根目录「启动工作台.command」/ zsh scripts/start-ui.sh（自动装依赖、构建、开浏览器）
```

打开 http://127.0.0.1:4173 —— **业务人员全程浏览器闭环，无需终端**：

1. **创建实例**：首页「创建实例」问卷向导（三问 → 匹配行业模板 → 命名生成），或打开工作区已有实例
2. **微调**：实例页改口径开关 / 增删改指标（写回前全量校验，失败零写盘），内嵌「相对模板的变更」fork diff 对比
3. **AI 草案**（可选）：设置页配置模型（存仓库根 `.env.local`，已 gitignore，页面打码不回显）；草案工坊填业务描述或自然语言微调指令 → 进度页自动刷新 → 待采纳草案卡预览 → 采纳合入（引擎校验）/ 丢弃
4. **审核与导出**：审核中心批准 LLM 指标（fail-closed：未批准导出被硬阻断）；实例页一键下载 MetricFlow YAML / Excel 字典 / Mermaid 指标树（与 CLI export 同语义：mapping 自动发现 + 导出前全量校验）

本地单用户：仅监听 127.0.0.1；写操作仅限工作区实例、`draft.pending.yaml` 草案与 `.env.local`（均过引擎校验）；实例打开限工作区扫描白名单。界面对齐 JuanerAI 最新 UI 标准（2026-09-28 Case 助手增量契约：品牌栏 + 待采纳草案卡 + 橘 accent 视觉），零客户端脚本、纯服务端表单。
