import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parse as parseYaml } from "yaml";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

// 向导：工作区注入 tmpdir，实例写盘不落仓库
async function startUiWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "mf-wiz-"));
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local") });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}`, dir };
}

const GOOD_ANSWERS = new URLSearchParams({
  revenue_model: "交易抽佣",
  user_structure: "双边市场",
  core_loop: "交易"
});

test("GET /init：三问表单", async () => {
  const { server, base } = await startUiWorkspace();
  const res = await fetch(`${base}/init`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("收入模式");
  expect(html).toContain("双边市场");
  expect(html).toContain('action="/init/match"');
  server.close();
});

test("POST /init/match → 303 到 GET 匹配页；GET 渲染推荐模板", async () => {
  const { server, base } = await startUiWorkspace();
  const post = await fetch(`${base}/init/match`, { method: "POST", body: GOOD_ANSWERS, headers: { "content-type": "application/x-www-form-urlencoded" }, redirect: "manual" });
  expect(post.status).toBe(303);
  const loc = post.headers.get("location")!;
  expect(loc).toContain("/init/match?");

  const page = await fetch(`${base}${loc}`);
  expect(page.status).toBe(200);
  const html = await page.text();
  expect(html).toContain("推荐模板");
  expect(html).toContain("ecommerce-marketplace"); // 三问全中 → 电商最佳
  expect(html).toContain('action="/init/create"');
  server.close();
});

test("GET /init/match：缺答案 422 回第一步", async () => {
  const { server, base } = await startUiWorkspace();
  const res = await fetch(`${base}/init/match?revenue_model=订阅`);
  expect(res.status).toBe(422);
  expect(await res.text()).toContain("收入模式");
  server.close();
});

test("POST /init/create：生成实例、切换 current、CLI 可见", async () => {
  const { server, base, dir } = await startUiWorkspace();
  const form = new URLSearchParams({
    ...Object.fromEntries(GOOD_ANSWERS),
    template_id: "ecommerce-marketplace",
    name: "demo-shop"
  });
  const res = await fetch(`${base}/init/create`, { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" }, redirect: "manual" });
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/instance");

  const out = join(dir, "demo-shop", "instance.yaml");
  expect(existsSync(out)).toBe(true);
  const doc = parseYaml(readFileSync(out, "utf8")) as { base: string };
  expect(doc.base).toContain("ecommerce-marketplace@");

  // 工作台已切到新实例；CLI validate/diff 同一文件可读
  const page = await fetch(`${base}/instance`);
  const html = await page.text();
  expect(html).toContain("demo-shop/instance.yaml");
  const v = spawnSync(process.execPath, [bin, "validate", out], { encoding: "utf8" });
  expect(v.status, v.stderr).toBe(0);
  server.close();
});

test("POST /init/create：重名 422 不覆盖；非法名 422", async () => {
  const { server, base, dir } = await startUiWorkspace();
  const form = new URLSearchParams({
    ...Object.fromEntries(GOOD_ANSWERS),
    template_id: "ecommerce-marketplace",
    name: "demo-shop"
  });
  const first = await fetch(`${base}/init/create`, { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect([200, 302, 303]).toContain(first.status);

  const dup = await fetch(`${base}/init/create`, { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect(dup.status).toBe(422);
  expect(await dup.text()).toContain("已存在");

  const evil = new URLSearchParams({ ...Object.fromEntries(GOOD_ANSWERS), template_id: "ecommerce-marketplace", name: "../escape" });
  const bad = await fetch(`${base}/init/create`, { method: "POST", body: evil, headers: { "content-type": "application/x-www-form-urlencoded" } });
  expect(bad.status).toBe(422);
  expect(existsSync(join(dir, "escape"))).toBe(false);
  server.close();
});
