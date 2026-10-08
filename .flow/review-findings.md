# v4 批次 REVIEW 第 1 轮 findings（独立评审员，fixed point a9d8112）

> Verdict: FAIL（1 blocking）。VERIFY 复跑逐段与记录证据一致（lint/typecheck/test 201/201/contract 1/1，exit 0，墙钟 20.7s）。

## Blocking

**B1 · UI 的 SAP 导出路径不捕获 SapAssemblyError，供应侧查重拒绝在 UI 退化为 500 —— CLI/UI 双出口不等价**
- 证据：`src/ui/server.ts:460-470` 导出处理器只 catch ExportBlockedError，其余 throw 落入 `server.ts:786-790` 兜底 → 500。CLI（`src/cli/index.ts:950-958`）对三族错误均干净 exit 1。
- 可达性：validateInstance 无查重规则；两条触发器 = added 指标与基模板重名 / 实例 concept_refs 自身重复键。
- 与 ui-contract §5 negative #2 冲突（必须渲染带文字的 422/404 页）。
- 归属：implementation。Recheck：dup-name 实例 GET /instance/export/sap → 422 且文案含「重名 / duplicate-identity」，非 500。

## Non-blocking（记录不动）

- **N1** `test/ui/sap-download.test.ts` 的 `/review` 断言空洞（侧栏恒存在）；实际走 validate 门 S2-2 页，S2-1 对 LLM 触发器不可达（v3 既有双门结构）；ui-contract S1-3/Q7 运行时描述与事实不符（文档级，`.flow/` 不在代码评审面）。Recheck：测试显式钉实际页；契约文档按双门顺序修正。
- **N2** generator 构建期 sha 注入未实现（tsup.config 无 define，MF_GIT_SHA 运行时读取常态化回退；注释失实）。归属 implementation。
- **N3** `validateSapPackage` 头注自称「契约 §6 供应侧镜像」过度声称（缺 LLM 规则，契约 §3.5 允许由 gate 执法，实际不可达）。归属 spec/PRD 张力。
- **N4** bindings 校验 `z.array(z.unknown())` 宽松 vs 契约 §3.4 MappingEntry 形状（不可达）。归属 implementation。
- **N5** `slugifyPackageId(basename...)` 组合在 CLI/UI 两调用点重复（判断题气味；共享函数/工厂本身已复用）。

## 特别核对点结论（评审员独立验证）

① 规范化逐条与 PRD 一致 ✓ ② 指纹自引用置空 ✓ ③ 去重键 (id,version,role) 与查重双命名空间 ✓ ④ 四格式同点 gate、门序一致；唯 B1 双出口不等价 ✗ ⑤=N1 ⑥ §4 术语逐字通过 ✓ ⑦ 切片接口全复用无分叉 ✓

---

# REVIEW 第 2 轮（独立评审员，全新上下文）

> Verdict: **PASS**。B1 recheck 兑现（独立证据：422 + duplicate-identity 文案 + 无 attachment，fixture 可达性成立）；ExportBlockedError/CLI 零变化；无新 blocking、无新发现。VERIFY 复跑 exit 0、41 文件 202 测试、1/1、21.0s，与记录一致。特别核对点 6 项全过。

- N1 半兑现（测试已钉实际页标题；ui-contract S1-3 文档描述未修——`.flow/` 不在代码评审面，维持记录）。
- N2–N5 维持原样（记录不动）。
