import { readFile } from "node:fs/promises";
import { test, expect } from "vitest";
import { parseDbtArtifacts } from "../../src/warehouse/parse.js";

async function writeTmp(name: string, content: string): Promise<string> {
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "mf-wh-"));
  const p = join(dir, name);
  writeFileSync(p, content, "utf8");
  return p;
}

const MANIFEST = JSON.stringify({
  metadata: { "dbt_schema_version": "https://schemas.getdbt.com/dbt/manifest/v12.json", dbt_version: "1.8.0" },
  nodes: {
    "model.demo.fct_orders": {
      resource_type: "model",
      name: "fct_orders",
      columns: {
        order_id: { name: "order_id", data_type: "text" },
        gmv: { name: "gmv", data_type: "double precision" }
      }
    },
    "model.demo.fct_traffic": {
      resource_type: "model",
      name: "fct_traffic",
      columns: { uv: { name: "uv", data_type: "bigint" } }
    },
    "model.demo.dim_user": { resource_type: "model", name: "dim_user", columns: {} },
    "model.demo.fct_payments": { resource_type: "model", name: "fct_payments", columns: {} },
    "seed.demo.raw_users": { resource_type: "seed", name: "raw_users", columns: { x: { name: "x" } } },
    "test.demo.unique_orders": { resource_type: "test", name: "unique_orders", columns: {} }
  }
});

const CATALOG = JSON.stringify({
  nodes: {
    "model.demo.fct_payments": {
      metadata: { type: "BASE TABLE" },
      columns: { pay_amount: { name: "pay_amount", type: "double precision" } }
    },
    "model.demo.fct_orders": {
      metadata: { type: "BASE TABLE" },
      columns: {
        gmv: { name: "gmv", type: "double precision" },
        order_count: { name: "order_count", type: "bigint" }
      }
    }
  }
});

test("仅 manifest：取声明列，非 model 资源被过滤", async () => {
  const m = await writeTmp("manifest.json", MANIFEST);
  const wh = await parseDbtArtifacts(m);
  const names = wh.models.map((x) => x.name).sort();
  expect(names).toEqual(["dim_user", "fct_orders", "fct_payments", "fct_traffic"]);

  const orders = wh.models.find((x) => x.name === "fct_orders")!;
  expect(orders.columns.map((c) => c.name).sort()).toEqual(["gmv", "order_id"]);
  expect(orders.missingColumns).toBe(false);
});

test("manifest 无列模型标记 missingColumns", async () => {
  const m = await writeTmp("manifest.json", MANIFEST);
  const wh = await parseDbtArtifacts(m);
  expect(wh.models.find((x) => x.name === "dim_user")!.missingColumns).toBe(true);
});

test("manifest + catalog：catalog 列并入并覆盖来源，双缺列仍标记", async () => {
  const m = await writeTmp("manifest.json", MANIFEST);
  const c = await writeTmp("catalog.json", CATALOG);
  const wh = await parseDbtArtifacts(m, c);

  const payments = wh.models.find((x) => x.name === "fct_payments")!;
  expect(payments.columns.map((x) => x.name)).toEqual(["pay_amount"]);
  expect(payments.columns[0]!.source).toBe("catalog");
  expect(payments.missingColumns).toBe(false);

  const orders = wh.models.find((x) => x.name === "fct_orders")!;
  const gmv = orders.columns.find((x) => x.name === "gmv")!;
  expect(gmv.source).toBe("catalog"); // 同名列以 catalog 为准
  expect(orders.columns.map((x) => x.name).sort()).toEqual(["gmv", "order_count", "order_id"]);

  expect(wh.models.find((x) => x.name === "dim_user")!.missingColumns).toBe(true);
});

test("坏 JSON 与缺 nodes 结构报可定位错误", async () => {
  const bad = await writeTmp("bad.json", "{not json");
  await expect(parseDbtArtifacts(bad)).rejects.toThrow(/bad\.json/);

  const noNodes = await writeTmp("nonodes.json", '{"metadata":{}}');
  await expect(parseDbtArtifacts(noNodes)).rejects.toThrow(/nodes/);
});
