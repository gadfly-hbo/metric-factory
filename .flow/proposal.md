# Metric Factory · v3 方案（落地闭环）

> 本 flow 的规格源。上游根规格：仓库根 PRODUCT_PLAN.md（v0.1）第 4.2 节 P3 段与第 5 节 v3 段。
> MVP（commit 0ad90aa）与 v2 LLM 设计器（commit 1e6eda3）已交付，其决策继续有效。

## 目标

把 PRODUCT_PLAN v3 段（落地闭环）落地，三件套：

1. **数仓反推与字段映射（map 命令族）**：读取 dbt manifest.json（优先；information schema 后置）→ 发现已有模型与字段 → 推荐「指标 → 模型字段」映射（AI 推荐 + 人工 Review 门，与 v2 审核流同构）→ 产出映射文件与「模板指标 vs 企业现状」差距清单（已映射 / 可映射未映射 / 数仓无对应物三类）。映射落定后，**MetricFlow 导出从占位 semantic model 升级为真实模型引用**——补上「设计态 → 定义态」的最后一公里。
2. **埋点建议与事件 schema 生成（track 命令）**：从实例的旅程类指标 + 维度推导埋点/事件清单与事件 schema（JSON），输出「指标 → 事件 → 字段」的采集建议，与字段映射形成「有数可算」的闭环。
3. **Web UI（ui 命令，本地优先）**：模板浏览 / 指标树可视化编辑（写回实例 patch）/ 审核流（LLM 待审指标批准拒绝）。定位是「壳不是核」（proposal 3.3）：所有写操作走既有引擎（与 CLI 同一 fail-closed 语义），Web UI 不引入新的业务规则。

## 验收（可执行部分）

- `metric-factory map <instance> --manifest <dbt manifest.json>`：产出映射草案（每指标含推荐模型.字段 + 置信度 + 理由），`--apply` 经确认写映射文件；差距清单三类齐备
- 映射完成后 `export --format metricflow` 的 semantic model 引用真实 dbt 模型与列名（契约测试升级：导出物 `model.ref` ∈ manifest 模型名集合、measure.expr ∈ 模型列名集合）
- `metric-factory track <instance>`：产出事件清单（名称/触发时机/属性 schema JSON/对应指标），旅程类指标全覆盖
- `metric-factory ui`：本地起服务，浏览器可浏览六模板、可视化查看指标树、对待审 LLM 指标执行批准/拒绝（写回实例文件）；树编辑器可增删改实例 patch 并写回
- 全部写路径复用引擎（validate 门、fail-closed、provenance），Web UI 无旁路
- 真实 dbt manifest 为夹具驱动（fixture manifest 结构对齐 dbt 1.8+ artifacts schema）；真实数仓连接不在本期

**运行时指标（开发期不可验证）**：映射采纳率、UI 周活、埋点建议直接采用率。

## 约束与既有决策（继续有效）

- 技术栈：TypeScript / Node ≥20 ESM；测试 vitest；零网络进测试（映射推荐用确定性规则引擎 + 可选 LLM 增强，测试走规则路径）
- fail-closed 永不放松；provenance 链完整；映射推荐同样走「AI/规则出草案 → 人确认」
- LLM 访问沿用 v2 的 pi-ai 适配层（src/llm/，业务代码零 pi import）
- **Web UI 视觉规范**：遵循全局设计规范 `~/.zcode/design/DESIGN.md`（JuanerAI Xanthil 暖灰青工作台设计语言）——动手做 UI 视觉决策前必读；本项目无自己的 DESIGN.md，全局规范为默认基线
- Web UI 技术形态后置到 GRILL 决议（倾向：无构建步骤的本地服务端渲染 + 渐进增强，服务 node dist/cli.js ui 一条命令启动；不引入重型前端框架）
- 双机同步：origin = github.com/gadfly-hbo/metric-factory.git；sync.targets = macbook:/Users/huangbo/Dev/Projects/metric-factory

## 非目标（本 flow 不做）

- information schema 直连数仓 / 反向 ETL（PRODUCT_PLAN P3 只说 dbt manifest 优先，直连后置）
- 多用户 / 权限 / 云端部署（本地单用户工具）
- 移动端适配
