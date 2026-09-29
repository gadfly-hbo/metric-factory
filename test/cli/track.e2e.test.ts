import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { Ajv } from "ajv";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

test("track：旅程指标全覆盖，动词命中与 fallback 两类事件，schema 可校验", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-track-"));
  const inst = join(dir, "instance.yaml");

  const r = run(["track", "test/fixtures/instance-ecommerce.yaml", "--out", dir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);

  const planPath = join(dir, "tracking-plan.yaml");
  const schemaPath = join(dir, "tracking-plan.schema.json");
  expect(existsSync(planPath)).toBe(true);
  expect(existsSync(schemaPath)).toBe(true);

  const plan = parseYaml(readFileSync(planPath, "utf8")) as {
    events: { name: string; trigger: string; properties: string[]; metrics: string[] }[];
  };
  // 数量断言：旅程树全部子指标 + 北极星候选（去重、剔除 removed）逐一有事件
  const tpl = parseYaml(readFileSync("templates/ecommerce-marketplace.yaml", "utf8")) as {
    trees: { category?: string; children: string[] }[];
    north_star: { candidates: { metric: string }[] };
  };
  const expected = new Set<string>();
  for (const t of tpl.trees) if (t.category === "旅程") for (const c of t.children) expected.add(c);
  for (const c of tpl.north_star.candidates) expected.add(c.metric);
  expected.delete("nps"); // 该实例 removed
  const linked = new Set(plan.events.flatMap((e) => e.metrics));
  expect(plan.events.length).toBe(expected.size);
  for (const m of expected) expect(linked.has(m), `${m} 未覆盖`).toBe(true);

  // 旅程树指标全覆盖（作为关联指标出现）
  const linkedMetrics = new Set(plan.events.flatMap((e) => e.metrics));
  for (const m of ["search_uv", "detail_to_cart_rate", "first_order_within_7d_rate", "session_avg_duration", "comeback_rate"]) {
    expect(linkedMetrics.has(m), `旅程指标 ${m} 未被任何事件覆盖`).toBe(true);
  }

  // 动词命中类（search_uv → search 域事件）与 fallback 类（track_<metric>）并存
  const names = plan.events.map((e) => e.name);
  expect(names.some((n) => n.startsWith("search"))).toBe(true);
  expect(names.some((n) => n.startsWith("track_"))).toBe(true);

  // 公共属性 + 维度属性
  for (const e of plan.events) {
    for (const p of ["event_name", "event_time", "user_id", "device_id"]) {
      expect(e.properties, `${e.name} 缺公共属性 ${p}`).toContain(p);
    }
  }

  // schema.json：每事件一份合法 JSON Schema，ajv 校验样例通过
  const schemas = JSON.parse(readFileSync(schemaPath, "utf8")) as unknown[];
  expect(schemas.length).toBe(plan.events.length);
  const ajv = new Ajv({ strict: false });
  const first = plan.events[0]!;
  const validate = ajv.compile(schemas[0]!);
  const sample: Record<string, unknown> = {
    event_name: first.name,
    event_time: "2026-09-29T00:00:00Z",
    user_id: "u1",
    device_id: "d1"
  };
  for (const prop of first.properties) {
    if (!["event_name", "event_time", "user_id", "device_id"].includes(prop)) sample[prop] = "demo";
  }
  expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
});
