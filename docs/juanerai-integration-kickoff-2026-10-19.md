# JuanerAI 接入启动文档 · metric-factory 产品插件接入

| 项 | 值 |
|---|---|
| 日期 | 2026-10-19 |
| 发起方 | metric-factory（插件原仓，`/Users/huangbo/Dev/Projects/metric-factory`） |
| 接收方 | JuanerAI（宿主仓，`/Users/huangbo/JuanerAI`） |
| 性质 | 产品级插件接入启动（kickoff）导引。**接入形态 = 整个产品作为固定插件随 JuanerAI 打包交付**，参照已发布的 Report Studio 链路；权威标准在 JuanerAI 仓，本文件只提供供应侧产品事实与对齐输入，不预设宿主内部装配 |
| 更正 | 本文件首版误写为「Xanthil 安装 SAP 资产包」框架（那是语义资产消费路径，属另一个 Change，输入包已另备）；本版按用户裁决更正为**产品插件接入** |

## 1. 一句话任务

把 metric-factory 整个产品（分析体系工作台：描述业务问题 → AI 起草 → 修正 → 复核 → 发布语义资产包）作为 **JuanerAI 固定插件**接入：业务实现在原仓维护、独立可运行；JuanerAI 随包携带固定物料与运行依赖，宿主拥有入口、授权与实例生命周期；集成用户安装 JuanerAI 即可用，不另装独立版。

## 2. 权威标准（先读这些，在 JuanerAI 仓）

按 `docs/engineering/plugin-integration/README.md` 入口按需读取：

1. **接入标准** `docs/engineering/plugin-integration/standard.md`——共用业务实现分别装配交付、按真实形态选择承载、§3 信息项、责任层次、**五步连续接入（盘点→对齐→接线→验证→接受与固定交付）**、原仓维护与受控升级；
2. **Report Studio 参考 Adapter** `docs/engineering/plugin-integration/report-studio-reference-adapter.md`——已发布链路的真实文件/测试/固定身份/可复用粒度（ metric-factory 的接入照此模式，但**报告专属物不照搬**）；
3. **通用验收清单** `docs/engineering/plugin-integration/acceptance-checklist.md`——C01-C12 按适用性选择，填预期/身份/证据/未执行原因。

Report Studio 已发布链路（参照骨架，非复制对象）：
宿主入口 → Application（业务协调）→ 业务 Port（Gateway/Store）→ Profile/composition root（显式 bundleRoot/identity/dataRoot，懒启动）→ **随包 Node 运行自有实例** → 插件共用业务 → 显式 deliver/已保存 export → 宿主稳定副本 + receipt 读回。进程通信/准入/权限/停止为 Adapter 层机制（child、IPC ready+HTTP 握手、owner token、loopback/origin 守卫、policy 合同）。

## 3. 供应侧产品事实（标准 §3 信息项的供应侧输入）

| 信息项 | metric-factory 现状事实 |
|---|---|
| 产品/版本 | `metric-factory@0.1.0`，bin `metric-factory` → `dist/cli.js`；Node **>= 22.19.0**；构建 tsup（ESM，`npm run build`） |
| 固定源 | 本仓 git，当前 HEAD `f9c08fd`（2026-10-19）；固定物料按标准 §6 从精确提交/快照产出（source tar + bytes/SHA + 依赖通知），**不打包活动源码目录、不追随 latest** |
| 运行依赖 | 见 `package.json`：`@earendil-works/pi-ai`、`pi-agent-runtime`、`commander`、`yaml`、`zod`、`exceljs`、`@inquirer/prompts`、`@modelcontextprotocol/sdk` |
| 主入口形态 | **同机服务**：`metric-factory ui -p <port>` 起本地 Web 工作台，**仅监听 127.0.0.1**（默认 4173）；工作区 = 启动 cwd（实例 `*.yaml` + `releases/` 落于此）；`-t <templates>` 指向只读行业模板目录。CLI 另有 validate/export/release 等非服务命令 |
| 用户任务与成果 | 业务人员完成「描述业务问题 → AI 起草分析体系（blueprint+指标）→ 修正 → 业务复核 → 发布」；正式产物 = **releases/ 下不可变 SAP 语义资产包**（`releases/<包id>/<版本>.sap.yaml` + `index.yaml` 登记，双指纹）；显式 deliver 语义已有（交付门：复核有效+快照指纹绑定+same-content 拒发） |
| 数据与历史 | 无数据库；全部状态 = 工作区内 YAML 文件（实例、releases 登记簿）。插件工作区与宿主数据归属按合同分离，dataRoot 宜在宿主用户空间（同 Report Studio Profile 模式） |
| 生命周期 | 自有 Node 进程；就绪/并发复用/停止归属等按 C03 由宿主 Adapter 定义（现状：单进程 listen 后即就绪，无就绪握手协议——接线时需补，参考 Report Studio IPC ready+HTTP 握手） |
| 权限/效果/外发 | 效果仅两类：写工作区文件、调 LLM。凭据保管见 §4 首条差异 |
| 兼容/更新/回滚 | 供应侧发版语义：SAP 包 `id@version` 不可变、same-content 拒发；插件物料升级按标准 §6 最小差异表（原仓修复位置/回归/目标包含性分别记录） |
| 验证基线 | lint 13 + tsc 0 + 73 文件 478 tests(+1 skip) + contract 1 全绿；真实 LLM 冒烟已跑（xiaomi mimo-v2.6-flash 全链路成功，minimax MiniMax-M3 失败挂账） |

## 4. 需要对齐的已知差异（对齐步骤的直接输入）

1. **LLM 凭据发现冲突（首要）**：标准 §2/C05 要求 LLM 经共享 pi-agent-runtime、**不从文件夹发现凭据**；metric-factory 现状含 `~/.pi/agent/auth.json` 自动发现回退（`src/llm/key-discovery.ts`）。供应侧已支持显式注入（`MF_LLM_*` env / 配置），自动发现仅为零配置回退。**对齐建议**：集成形态禁用文件夹发现，由宿主按合同显式注入（参考 Report Studio supplier 接点注入式 `createPiTransport`）；供应侧可加「禁用自动发现」开关，属中立修复回原仓。
2. **就绪/停止协议缺失**：现状 listen 即就绪、无 IPC/握手/owner token；接入时按 Report Studio `process.ts/gateway.ts/local-access.ts/policy.ts` 模式由宿主 Adapter 补齐，供应侧配合暴露最小钩子（如 `/api/health` 就绪端点，若需要）。
3. **成果回程**：现状 releases/ 落在工作区文件系统即完成；宿主「稳定副本 + receipt 读回」语义需映射（交付=显式 deliver 已有；receipt/副本归属由宿主 Store 层定义）。
4. **第二插件触发项**：标准 §7 言明第二插件/公共抽包不在已沉淀交付内。metric-factory 作为第二真实消费者接入时，只在**第二个已获准调用点显示共同需要**的范围内决定必要提取（标准 §README），不把方向写成既有能力。
5. **MCP/桌面形态**：metric-factory 另有 MCP server 能力（`@modelcontextprotocol/sdk` 依赖）——本次接入**不含** MCP 形态，仅同机服务形态（如需另立 Change）。

## 5. 验收（从 C01-C12 选择 + 业务场景，供 JuanerAI 验证步骤填写）

建议适用项：C01 固定身份/兼容、C02 双交付/资源、C03 生命周期、C05 秘密/数据归属（含 §4.1 凭据负例）、C07 状态/取消、C08 产物与来源（SAP 包稳定副本+指纹读回）、C09 持久/恢复（工作区重开）、C10 LLM/执行（**启用 LLM 才适用**：实际固定 SDK 编解码合成用例 + 业务场景，参考 `tools/report-studio/supplier-tool-admission.test.mjs` 模式）、C12 更新/回滚；C04 视是否有宿主材料输入、C06/C11 按业务场景选定。

业务正例建议（metric-factory 自有）：合成接缝下完成「创建→复核→交付」得到精确 `id@version` 包 + 双指纹可读回；重复 deliver 幂等/same-content 拒绝；指纹篡改包在消费侧拒绝。负例：未审 LLM 指标交付被 fail-closed 门拦截（供应侧引擎已内置，可直接用作反例）。

## 6. 边界（不做什么）

- 业务实现与中立修复回原仓（metric-factory）；宿主入口、权限、任务/成果映射与装配留 JuanerAI；不分叉底座、不新建通用插件平台/市场；
- 不预设宿主内部架构（Port/Adapter/Profile/进程机制由 JuanerAI 按标准与参考模式裁决）；涉及用户可见 UI 先过 UI 门；
- 构建、封装、安装、运行采用、用户接受**分别证明**；源码有脚本 ≠ 每种分发已通过；未授权/未执行项如实保留，不标 N/A 或 PASS；
- **本次接入 ≠ SAP 资产消费**：Xanthil 安装消费 SAP 包是另一个 Change（输入包已备：`docs/juanerai-change-input-xanthil-sap-install-v0.2.md`，含契约 v0.4/消费指引/六个样板包版本）；插件接入使其产出面可用，资产消费语义不变、互不替代；
- executable 状态、企业隔离、动态装载/热换、统一 Session/数据库均不在本 Change（标准 §7）。

## 7. 供应侧事实源（本仓，macini 可同机读取）

- 产品事实：`package.json`、`src/ui/server.ts`（入口/监听）、`src/llm/`（LLM 机制与凭据发现）、`src/sap/`（发布/校验/指纹）
- 资产与语义：`releases/`（六个样板包版本 + index.yaml）、`docs/sap-consumption-guide.md`、`docs/juanerai-semantic-asset-contract-v0.1.md`（v0.4）
- 交接与验证状态：`.flow/handoff.md`（A1/A2/接入准备批记录）
- 语义疑问回来对这些事实源，不要猜。
