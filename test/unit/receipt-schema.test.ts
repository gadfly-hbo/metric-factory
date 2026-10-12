import { test, expect } from "vitest";
import { parseReceipt } from "../../src/sap/receipt.js";

// receipt schema 单测（契约 v0.3 §6.2 逐字段；PRD 实现决策 #4）
// 期望值按契约字段表推导，不来自实现输出

const VALID = `task_id: task-2026-001
package:
  id: net-sales-instance
  version: 1.0.0
  content_fingerprint: sha256:f8a9d88e7c854b4b5d1ff1f7eda2fa9270e03f4e8207ba5e62225b040e0860f4
  package_fingerprint: sha256:6330f6b0a0a4823d6d3ebc9bb046bad651ddf1f2cf0d99cac7fb7e02e890f284
adopted_metrics:
  - name: net_sales
adopted_scenarios:
  - id: net_sales_review
issues_found:
  - kind: missing_data
    metric: refund_amount
    detail: 退款记录缺退款完成时间字段
computed_at: "2026-10-12T08:00:00.000Z"
`;

test("合法回执：全字段解析通过，issues 字段保留", () => {
  const r = parseReceipt(VALID);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.receipt.task_id).toBe("task-2026-001");
    expect(r.receipt.package.id).toBe("net-sales-instance");
    expect(r.receipt.adopted_metrics).toEqual([{ name: "net_sales" }]);
    expect(r.receipt.issues_found[0]).toMatchObject({ kind: "missing_data", metric: "refund_amount" });
  }
});

test("空数组合法：adopted_metrics/adopted_scenarios/issues_found 均可缺省为空", () => {
  const r = parseReceipt(`task_id: t1
package:
  id: p
  version: 1.0.0
  content_fingerprint: sha256:${"a".repeat(64)}
  package_fingerprint: sha256:${"b".repeat(64)}
computed_at: "2026-10-12T08:00:00.000Z"
`);
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.receipt.adopted_metrics).toEqual([]);
    expect(r.receipt.adopted_scenarios).toEqual([]);
    expect(r.receipt.issues_found).toEqual([]);
  }
});

test("未知字段忽略（向前兼容）：顶层与嵌套多余键不报错", () => {
  const r = parseReceipt(`task_id: task-2026-001
package:
  id: net-sales-instance
  version: 1.0.0
  content_fingerprint: sha256:f8a9d88e7c854b4b5d1ff1f7eda2fa9270e03f4e8207ba5e62225b040e0860f4
  package_fingerprint: sha256:6330f6b0a0a4823d6d3ebc9bb046bad651ddf1f2cf0d99cac7fb7e02e890f284
  extra_nested: 1
adopted_metrics: []
adopted_scenarios: []
issues_found: []
computed_at: "2026-10-12T08:00:00.000Z"
extra_top: whatever
`);
  expect(r.ok).toBe(true);
});

test("kind 枚举拒绝：未知 kind 逐行报错", () => {
  const r = parseReceipt(VALID.replace("kind: missing_data", "kind: whatever"));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.issues.some((i) => i.path.includes("issues_found"))).toBe(true);
});

test("缺 task_id 与坏指纹：issue path 定位到字段", () => {
  const bad = parseReceipt(`package:
  id: p
  version: 1.0
  content_fingerprint: sha256:abc123
  package_fingerprint: nope
computed_at: ""
`);
  expect(bad.ok).toBe(false);
  if (!bad.ok) {
    const paths = bad.issues.map((i) => i.path);
    expect(paths.some((p) => p.includes("task_id"))).toBe(true);
    expect(paths.some((p) => p.includes("version"))).toBe(true);
    expect(paths.some((p) => p.includes("content_fingerprint"))).toBe(true);
    expect(paths.some((p) => p.includes("package_fingerprint"))).toBe(true);
    expect(paths.some((p) => p.includes("computed_at"))).toBe(true);
  }
});
