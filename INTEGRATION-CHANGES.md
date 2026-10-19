# JuanerAI integration modifications

2026-10-19. Supplier base: 169faa8d45e1c5616c004f8fb844a7ca68add156.

The supplier package.json declares Apache-2.0. LICENSE is the unmodified text
retrieved from https://www.apache.org/licenses/LICENSE-2.0.txt (11,358 bytes,
SHA-256 cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30).
The base did not contain LICENSE or NOTICE. This supplies the already declared
license text; it does not assert a new copyright owner or invent upstream notices.
Dependency license and notice files are retained in the fixed distribution.

Integration modifications are maintained in this supplier work branch:
- src/ui/server.ts and src/ui/integration*.ts: explicit host authority, dedicated
  data roots, exact publication delivery and truthful cancellation.
- src/ui/public/app.js and api.js: integration wiring and the two approved
  configuration/stop feedback corrections. index.html and style.css are unchanged.
- src/integration/: owned process entry and publication byte checks.
- src/llm/integrated-client.ts and budget-store.ts: explicit model injection,
  durable task admission, accounting and unknown effects.
- src/sap/release.ts: optional integrated package identity and immutable release
  protection while preserving standalone identity and receipt files.
- package.json, package-lock.json and tsup.config.ts: fixed dependencies and the
  additional integration entry. test/integration/ and the isolated env-auto test
  cover these boundaries without reading real credentials.

The complete exact changed file bytes and provenance are identified by the
source-identity.json shipped alongside the bundle. A local candidate is not
proof of upstream Git adoption, public release, installation or user acceptance.

- src/llm/index.ts and configured-models.ts: replace direct Pi catalog imports
  with fixed neutral configuration, preserving all 1,495 prior lookup results.
  Provenance and original metadata license are in configured-models.md and
  MODEL-CATALOG-NOTICE.txt. The existing SDK and execution behavior are unchanged.
- test/unit/llm-adapter.test.ts additionally forbids direct Pi imports throughout
  supplier production code, retaining the prior business-layer guard.

- src/llm/prompt.ts: blueprint prompt v1.0.1 explicitly describes existing
  question_tree label and textual evidence/output/review fields after a bounded
  live trial failed schema validation. No validator or business rule is weakened;
  test/unit/blueprint-generate.test.ts retains both invalid-output negatives.

SPA apply-refine now uses the existing applyDraft core, preserving unchanged metrics/scenarios and its duplicate rejection rules; test/ui/spa-assist.test.ts adds referenced-metric preservation and collision no-write coverage. No UI or schema change.

F-MF-06: integrated task and budget histories must remain paired and object-shaped. Only explicit first use initializes empty histories; the host declares whether prior admission exists. Missing strict budgets fail closed, including after construction. Existing standalone non-strict behavior remains unchanged; no historical trial data is migrated or reset.

F-MF-07：当前SPA绑定弹窗发送方法角色显示名，旧保存接口仅接受三种指标用途，原样保存即422。中立修复按当前实例方法引用/角色精确解析显示名，写回实例引用而不修改方法定义；歧义、未知、重复方法角色和不存在指标拒绝且零写盘。未选择项沿现有完整绑定提交语义移出引用；不重画UI、不增加模型调用。

F-MF-08/09/10：集成审计文件与两个账本作为完整历史，仅首次初始化；已存在历史中缺审计时拒绝，不以append重建。方法角色由所选精确方法定义提供，解除后保留尚未绑定行并支持原路径重绑；DTO/现有app提交增加不可见角色身份，不靠同名标签猜测。engineReady改用真实方法库，与复核/发布一致；HTML/CSS/api.js未改，app.js仅透传身份。原真实经营稿质量仍未接受，无额外Provider。
