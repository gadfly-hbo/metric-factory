import { mkdtempSync, copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parse as parseYaml } from "yaml";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

async function startUi(instancePath?: string) {
  const server = createUiServer({ templatesDir: "templates", instancePath });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

function tmpFixture(fixture: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mf-ui-"));
  const p = join(dir, "instance.yaml");
  copyFileSync(`test/fixtures/${fixture}`, p);
  return p;
}

test("GET /instance：树分组、指标、patch 表单（原生 action）", async () => {
  const inst = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst);
  const res = await fetch(`${base}/instance`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("规模");
  expect(html).toContain("质量");
  expect(html).toContain("成交总额");
  expect(html).toContain('action="/instance/patch"');
  expect(html).toContain('method="post"');
  server.close();
});

test("POST /instance/patch：合法口径覆盖写回实例（CLI 可见）", async () => {
  const inst = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst);
  const body = new URLSearchParams({ caliber__gmv__include_refund: "on" });
  const res = await fetch(`${base}/instance/patch`, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect([200, 302, 303]).toContain(res.status);

  const doc = parseYaml(readFileSync(inst, "utf8")) as { caliber_switches: Record<string, Record<string, boolean>> };
  expect(doc.caliber_switches.gmv?.include_refund).toBe(true);
  const diff = spawnSync(process.execPath, [bin, "diff", inst], { encoding: "utf8" });
  expect(diff.stdout).toContain("include_refund");
  server.close();
});

test("POST /instance/patch：坏 added（悬空维度）422 且零写盘", async () => {
  const inst = tmpFixture("instance-ecommerce.yaml");
  const before = readFileSync(inst, "utf8");
  const { server, base } = await startUi(inst);
  const badAdded = JSON.stringify([
    { name: "ui_bad_metric", display_name: "坏维度", type: "simple", definition: "悬空维度测试指标定义", dimensions: ["unknown_dim"], time_grains: ["day"], owner_role: "测试", provenance: { origin: "manual" } }
  ]);
  const body = new URLSearchParams({ added: badAdded });
  const res = await fetch(`${base}/instance/patch`, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("dangling-dimension");
  expect(readFileSync(inst, "utf8")).toBe(before);
  server.close();
});

test("POST /instance/patch：坏 JSON 422 可读报错", async () => {
  const inst = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst);
  const body = new URLSearchParams({ added: "{not json" });
  const res = await fetch(`${base}/instance/patch`, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect(res.status).toBe(422);
  expect(await res.text()).toContain("JSON");
  server.close();
});

test("GET /review：待审列表与批准/拒绝表单", async () => {
  const inst = tmpFixture("instance-llm-unreviewed.yaml");
  const { server, base } = await startUi(inst);
  const res = await fetch(`${base}/review`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("ai_suggested_magic_metric");
  expect(html).toContain('action="/review/ai_suggested_magic_metric"');
  expect(html).toContain("待审核");
  server.close();
});

test("POST /review/:name approve：写 reviewed_by 后导出放行（UI 路径 fail-closed 全链路）", async () => {
  const inst = tmpFixture("instance-llm-unreviewed.yaml");
  const { server, base } = await startUi(inst);
  const body = new URLSearchParams({ action: "approve", reviewer: "王五" });
  const res = await fetch(`${base}/review/ai_suggested_magic_metric`, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect([200, 302, 303]).toContain(res.status);

  const doc = parseYaml(readFileSync(inst, "utf8")) as { added: { provenance: { reviewed_by?: string } }[] };
  expect(doc.added[0]!.provenance.reviewed_by).toBe("王五");

  const dir = join(inst, "..");
  const exp = spawnSync(process.execPath, [bin, "export", inst, "--format", "metricflow", "--out", dir], { encoding: "utf8" });
  expect(exp.status, exp.stderr).toBe(0);
  server.close();
});

test("POST /review/:name reject 与非待审 422；干净实例空状态", async () => {
  const inst = tmpFixture("instance-llm-unreviewed.yaml");
  const { server, base } = await startUi(inst);
  const rej = await fetch(`${base}/review/ai_suggested_magic_metric`, {
    method: "POST",
    body: new URLSearchParams({ action: "reject" }),
    headers: { "content-type": "application/x-www-form-urlencoded" }
  });
  expect([200, 302, 303]).toContain(rej.status);
  const doc = parseYaml(readFileSync(inst, "utf8")) as { added: unknown[] };
  expect(doc.added).toHaveLength(0);

  // 非待审指标 POST → 422（同 CLI S4 语义，不改写审核记录）
  const inst3 = tmpFixture("instance-llm-reviewed.yaml");
  const { server: s3, base: b3 } = await startUi(inst3);
  const nonPending = await fetch(`${b3}/review/custom_gmv_excluding_gift`, {
    method: "POST",
    body: new URLSearchParams({ action: "approve", reviewer: "李四" }),
    headers: { "content-type": "application/x-www-form-urlencoded" }
  });
  expect(nonPending.status).toBe(422);
  expect(await nonPending.text()).toContain("不在待审列表");
  s3.close();

  // 干净实例：空状态
  const inst2 = tmpFixture("instance-ecommerce.yaml");
  const { server: s2, base: b2 } = await startUi(inst2);
  const clean = await fetch(`${b2}/review`);
  expect(clean.status).toBe(200);
  expect(await clean.text()).toContain("无待审");
  s2.close();
  server.close();
});
