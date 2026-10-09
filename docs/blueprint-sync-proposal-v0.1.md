# JuanerAI 蓝图同步素材包 v0.1（草案）

| 项目 | 内容 |
| --- | --- |
| 版本 | `sync-proposal.1` / 2026-10-08；**已搁置（2026-10-09 用户裁决）**——理由：①产品处边做边改阶段；②metric-factory 为独立能力提供方、非隶属于 JuanerAI，蓝图正文隶属式写入不符该定位。搁置期间双方关系由语义资产契约 v0.1 单独管辖；未来重启时优先评估「能力提供方登记」形态，本文留档备查 |
| 性质 | **外部输入素材**：供 JuanerAI 侧 planning 流程评审与采纳决策；**不构成对 JuanerAI 蓝图/仓库的任何修改授权**；采纳与否、如何采纳由 JuanerAI Controller（用户）决定 |
| 供应方 | metric-factory（独立开源，Apache-2.0）；本素材包随供应方仓库版本化 |
| 目标基线 | JuanerAI Blueprint **v4.2（已生效，批准记录为状态权威）** + 白皮书 v4.0 |
| 引用身份链 | 见 §5（SHA-256 固定） |

## 1. 同步要解决的问题

Blueprint v4.2 的能力地图与架构视图中，「分析配置/指标契约的设计态供给」没有归属者：A-02（Context 与 Binding）与 N04（业务语义可复用）的消费者侧已有规划，但设计态资产的**创作、评审、版本化供给**在蓝图中缺位；C4-07（Domain Pack）缺内容供给管线的描述。metric-factory 已完成契约化定位与首个实现批次，可作为这一缺位的**已验证候选**写入蓝图。

## 2. 建议写入位置（锚点，不改正文）

以下为 v4.2 中的**建议挂点**，每条附建议文本方向；实际文本由 JuanerAI 侧冻结：

1. **§4.2 能力表 · A-02 行「既有成果及后续归属」**：补「设计态 Binding 配置由外部工作台（metric-factory，分析体系工作台）以语义资产包供给；运行时解析仍归 Semantic Context Runtime」。
2. **§4.2 能力表 · C4-07 行**：补「Pack 指标/语义内容的候选供给管线：metric-factory 模板库（7 行业 336 指标）经评审发布为 Pack 候选版本」。
3. **§9.1 产品架构「专业维护面」**：补「分析体系工作台（metric-factory）为设计态入口之一：场景/问题树/指标契约/绑定配置的创作与评审；本体权威维护不在其内」。
4. **§8.1 N04 / N03 行**：补「必要语义/绑定子集可经语义资产包（SAP 0.1）由外部工作台供给，消费侧按 validate_import 语义校验」。
5. **新增一条边界声明（建议放 §9.4 或术语表）**：metric-factory 为独立开源插件，经 SAP 0.1 单向只读快照接入；引用不拥有本体；fail-closed 不变量过界保持。

## 3. 不变量（建议文本中必须保留的边界）

- 不新增能力、不增删 N 编号、不改 S 顺序、不新设 Gate；40 项能力总图不变
- metric-factory 不获得 Ontology/Data 权威；发布门唯一权威仍在 JuanerAI
- 运行时消费（A-02 解析、Binding 冻结）仍归 Semantic Context Runtime；SAP 交换为 `design_only` 快照，executable 语义 v6 窗口另议
- 在研 Change005 与 N01–N20 默认顺序不受影响

## 4. 术语与命名（防歧义）

- 供应方产品名 **metric-factory（分析体系工作台）**；交换格式 **SAP = Semantic Asset Package（语义资产包），与 SAP SE 无关**——JuanerAI 文档建议用全名「语义资产包」引用
- 本体工具 **Protégé**（专家建模）、工程组件候选 **Semantica**：三方关系按供应方契约 §2.2（共享概念 ID@version，不默认 OWL 互通）

## 5. 身份链（SHA-256 固定）

| 工件 | 路径（供应方仓库） | SHA-256 |
| --- | --- | --- |
| 语义资产交换契约 v0.1 + errata.1/2 | `docs/juanerai-semantic-asset-contract-v0.1.md` | `48b19e4b0121517c1410092e569dcb4f0aaee064ff99955179f5cc2210fc6e1a` |
| 产品方案 v0.2 | `PRODUCT_PLAN.md` | `6baa979617c1da99dcf8abe6f6b0f975b427bb408fe5b3d88903546e265f75d8` |
| 样例语义资产包（golden artifact，53 指标） | `examples/ecommerce-instance.sap.yaml` | `7c33422277d9987a97a9357a86a1cf4a05ee7f4178dedbd1dc3429ca9dcf0244` |

供应方实现状态（v4 已交付，202-203 测试全绿）：CLI `--format sap` 与工作台 UI 双导出、规范化指纹、双面校验器。

## 6. readiness 自检预填（供 JuanerAI Gate 使用）

1. **What I Would Build**：在 v4.2 蓝图的五处锚点补记「设计态供给归 metric-factory、经 SAP 0.1 接入」的事实与边界，不改能力图与阶段顺序。
2. **Required Guessing**：采纳形式（v4.3 修订 vs 独立批准补充件）；建议文本的最终措辞；挂点是否增删。
3. **External Study Required**：无（本包自包含；蓝图 v4.2 正文与批准记录为唯一外部依据）。
4. **Untestable Requirements**：采纳决策本身；运行时可消费性取决于消费侧 A-02/N04 实现（v6 窗口）。
5. **Correctly Deferred**：executable 语义、导入触发工程、场景资产（v5 批次）、本体对接（Protégé 发布后）。
6. **Required Plan Additions**：JuanerAI 侧决定采纳形式后，由 Controller 指定落点与措辞冻结方式。
7. **Verdict**：提交评审，不自我裁决。

## 7. 供应方边界声明

本素材包由 metric-factory 侧起草，**未对 `~/JuanerAI` 做任何写入**；采纳与实施属 JuanerAI 侧 authority，供应方不代拟蓝图正文修订。
