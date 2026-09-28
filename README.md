# Metric Factory

指标体系的「设计态」工具：**业务目标 → 指标树 + 指标字典**，产出对齐 dbt MetricFlow 的指标定义，直接接入现有语义层生态。

- 内置行业模板（电商交易平台 53 指标 / SaaS 订阅 48 指标），每个指标含完整口径、维度、归口角色与出处
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
