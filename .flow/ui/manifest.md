# UI 视觉工件清单（.flow/ui/）

A2 批次 UI-GATE 契约（`.flow/ui-contract.md`）的配套工件。本清单登记两件事：

1. **复刻目标防漂移锚**：原型 5 个核心文件的 SHA-256 快照哈希（原型目录无 git，PRD「D-甲骨文先行」第 2 条要求）。
2. **评审截图原件**：`screenshots-v0.2/` 7 张 jpg 的逐张映射（surface ↔ PRD 追溯 ↔ 实现对照方式）。

## 一、工件格式声明

- **格式**：静态截图集（jpg 原件，评审时产物，不再重渲染）+ SHA-256 文本清单。
- **渲染工具**：评审截图原件（本目录）+ **Playwright 基线计划**——按 PRD「D-甲骨文先行」，实现第一个切片动工前须对 demo 本体（原型目录起 http.server）用 Playwright 以同视口拍摄 7 视图基线并落盘本目录（`baseline/` 子目录），作为移植产物的机器对照 oracle；人眼比对只是补充。
- **数据保真声明**：本目录截图为**合成演示数据**（demo 原型内存态），仅作视觉/交互规格证据；真实实现的数据由引擎校验与 LLM 产生，内容必然不同，对照仅针对布局、组件、文案框架与状态形态，不比对数据值。

## 二、复刻目标 SHA-256 快照（2026-10-18 计算）

| 文件 | SHA-256 |
|---|---|
| `index.html` | `83721720a64c3824fe105add1be8b9d60ae35cc8902d9f882321ffbd9c2f3ece` |
| `style.css` | `a071e9c6d099a6fb50db54a5b69ee37b5d252eaf87eda9e4786857ffa4a13133` |
| `app.js` | `681de45c7d401e24ddcc8aa294fa1718930857114e6807cebfd704db9c8fba75` |
| `analysis-model.js` | `ea9a870679d1513ccea3f43fae80789b2474ef92aa020423352f55e3e8eecc85` |
| `验证记录.md` | `6b9cdcb96e22fbb586524440c6e29772d0dca4bb7613e1198d4f19feb0f60a45` |

复检命令（任一哈希变化 = 复刻目标已漂移，契约须重审）：

```sh
cd /Users/huangbo/Documents/Codex/2026-10-18/task/metric-factory-product-prototype && shasum -a 256 index.html style.css app.js analysis-model.js 验证记录.md
```

注意：`analysis-model.js` 是**替换对象**（合成模型层 → 真实 API），其哈希仅用于检测 demo 侧被改动；移植产物不包含该文件的合成行为。

## 三、评审截图逐张映射

| 截图（本目录） | 对应 surface（契约编号） | 对应视图/状态 | PRD 追溯 | 拍摄视口（基线计划） |
|---|---|---|---|---|
| `00-自然语言起点.jpg` | S01 home | 首页：composer + 4 示例需求卡 + 模板库/导入入口 | US1、US12；R2（示例需求保留为产品文案） | 1440×900 |
| `01-经营分析总览.jpg` | S05 work / stage=overview | 经营改善体系总览：理解卡、问题拆解、关键假设、证据计划 + 右侧助手栏 | US2、US3、US5 | 1440×900 |
| `02-战略设计交付.jpg` | S05 work / stage=review（已交付） | 战略体系检查与交付：published 块 + 5 检查行 + 交付盒 | US3、US8、US9；G3 | 1440×900 |
| `03-独立数据专题.jpg` | S05 work（data 预设） | 独立数据专题体系（客户/复购指标 + 效果判断场景） | US2、US10 | 1440×900 |
| `04-方法库多语境.jpg` | S04 library / 分析方法 tab | 模板库方法页：语境 tag、家族、角色计数、我的模板过滤 | US10；G6（demo 独有三方法补写） | 1440×900 |
| `05-战略总览窄屏.jpg` | S05 work / overview @ 窄屏 | 390px 窄屏：侧栏收起（☰）、无整页横溢 | US7 | 390×844 |
| `06-窄屏检查.jpg` | S05 work / review @ 窄屏 | 390px 窄屏检查视图（检查行/交付盒换行布局） | US7、US8 | 390×844 |

## 四、demo ↔ 实现基线对照方式

- **方法**：Playwright 同视口截图对照（D-甲骨文先行第 3 条：同机、同视口、同一导航路径拍摄 demo 本体与移植产物，逐像素/布局对照 + 行为断言）。
- **基线来源**：实现首个切片从 **demo 本体**拍摄（原型目录起 http.server，PRD 钉死）；本目录 7 张评审 jpg 是规格锚（用户逐面批准的参照），Playwright 基线是机器判据。
- **必拍行为断言**（随基线一并落盘脚本）：Esc 关弹层焦点回归（US6）、390px 文档宽 390 无横溢（US7）、1440px 文档宽 1440（验证记录 §响应布局）。
- **差异豁免**：仅限「真实数据必要状态」（加载/失败/超时/取消/job 进度/第 6 检查行/真实版本号与真实数据值），且必须复用 demo 既有语汇（busy、toast、tag、check-row、inline-error）——契约 §2 标注【真实必要·新增】的条目。
