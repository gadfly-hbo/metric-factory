import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

test.each([
  ["examples/ecommerce-instance.yaml"],
  ["examples/saas-instance.yaml"],
  ["examples/net-sales-instance.yaml"]
])("示例实例通过 validate：%s", (instancePath) => {
  const r = spawnSync(process.execPath, [bin, "validate", instancePath], { encoding: "utf8" });
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("PASS");
});

// 净销售样板（v1.1.x 修正版，定格态 = v1.1.1 完成归属）：依赖环已移除、队列退款率显式分子/分母
test("净销售样板：SAP 导出含修正后闭包（无 gmv 恒等式、显式分子分母）与 net_sales_review@0.2.0", () => {
  const out = mkdtempSync(join(tmpdir(), "mf-net-sales-"));
  const r = spawnSync(process.execPath, [bin, "export", "examples/net-sales-instance.yaml", "--format", "sap", "--out", out], { encoding: "utf8" });
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);

  const doc = parseYaml(readFileSync(join(out, "net-sales-instance.sap.yaml"), "utf8"));
  const refundAmount = doc.metrics.find((m: any) => m.name === "refund_amount");
  expect(refundAmount.caliber_switches.refund_to_payment_period).toBe(false);
  expect(refundAmount.caliber_switches.include_pending_refund).toBe(false);
  const netSales = doc.metrics.find((m: any) => m.name === "net_sales");
  expect(netSales.type_params.expr).toBe("gmv - refund_amount");
  expect(netSales.definition).toContain("gmv.include_refund");
  const gmv = doc.metrics.find((m: any) => m.name === "gmv");
  expect(gmv.type).toBe("simple");
  expect(gmv.type_params).toBeUndefined();
  expect(gmv.caliber_switches.include_refund).toBe(true);
  const orderCount = doc.metrics.find((m: any) => m.name === "order_count");
  expect(orderCount.caliber_switches.include_refund).toBe(true);
  const refundRate = doc.metrics.find((m: any) => m.name === "refund_rate");
  expect(refundRate.type_params).toEqual({ numerator: "refunded_order_count", denominator: "order_count" });
  expect(doc.metrics.some((m: any) => m.name === "refunded_order_count")).toBe(true);
  const scn = doc.scenarios.find((s: any) => s.id === "net_sales_review");
  expect(scn.version).toBe("0.2.0");
  expect(scn.decision_purpose.length).toBeGreaterThan(0);
  expect(scn.question_tree.length).toBe(4);
  const roles = Object.fromEntries(scn.metric_usages.map((u: any) => [u.metric, u.role]));
  expect(roles).toMatchObject({ net_sales: "outcome", gmv: "driver", refund_amount: "driver", refund_rate: "guardrail", refunded_order_count: "guardrail", order_count: "guardrail" });
});

// 样板可发布（CLI release 全链对样板实例；定格态=v1.1.1 完成归属，内容指纹含归属期间口径）
test("净销售样板：release 成功，登记含完成归属 refund_to_payment_period 的内容指纹", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-net-sales-rel-")), "releases");
  const r = spawnSync(
    process.execPath,
    [bin, "release", "examples/net-sales-instance.yaml", "1.0.0", "--out", rel, "--note", "净销售样板发布（tmp 注册表）"],
    { encoding: "utf8", env: { ...process.env, MF_REVIEWER: "样板验收" } }
  );
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  const snapshot = join(rel, "net-sales-instance", "1.0.0.sap.yaml");
  expect(existsSync(snapshot)).toBe(true);
  const index = parseYaml(readFileSync(join(rel, "index.yaml"), "utf8"));
  expect(index.releases.length).toBe(1);
  expect(index.releases[0].package).toBe("net-sales-instance");
  expect(index.releases[0].version).toBe("1.0.0");
  expect(index.releases[0].released_by).toBe("样板验收");
  const doc = parseYaml(readFileSync(snapshot, "utf8"));
  const refundAmount = doc.metrics.find((m: any) => m.name === "refund_amount");
  expect(refundAmount.caliber_switches.refund_to_payment_period).toBe(false);
});
