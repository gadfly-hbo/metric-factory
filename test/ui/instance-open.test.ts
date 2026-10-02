import { mkdtempSync, copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 实例打开/切换：白名单 = 启动实例 + 工作区扫描（一层目录）；其余路径拒绝
function workspaceWithInstances(): string {
  const dir = mkdtempSync(join(tmpdir(), "mf-open-"));
  for (const name of ["shop-a", "shop-b"]) {
    mkdirSync(join(dir, name));
    copyFileSync("test/fixtures/instance-ecommerce.yaml", join(dir, name, "instance.yaml"));
  }
  return dir;
}

async function startUi(dir: string) {
  const server = createUiServer({
    templatesDir: "templates",
    workspaceDir: dir,
    envFilePath: join(dir, ".env.local"),
    instancePath: join(dir, "shop-a", "instance.yaml")
  });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}`, dir };
}

test("POST /instance/open：切到工作区扫描到的实例", async () => {
  const dir = workspaceWithInstances();
  const { server, base } = await startUi(dir);
  const target = join(dir, "shop-b", "instance.yaml");
  const res = await fetch(`${base}/instance/open`, {
    method: "POST",
    body: new URLSearchParams({ path: target }),
    headers: { "content-type": "application/x-www-form-urlencoded" }
  });
  expect([200, 302, 303]).toContain(res.status);
  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("shop-b/instance.yaml");
  server.close();
});

test("POST /instance/open：白名单外路径 422", async () => {
  const dir = workspaceWithInstances();
  const { server, base } = await startUi(dir);
  for (const evil of ["/etc/passwd", join(dir, "..", "instance.yaml")]) {
    const res = await fetch(`${base}/instance/open`, {
      method: "POST",
      body: new URLSearchParams({ path: evil }),
      headers: { "content-type": "application/x-www-form-urlencoded" }
    });
    expect(res.status).toBe(422);
    expect(await res.text()).toContain("白名单");
  }
  // 当前实例仍是 shop-a（未被切走）
  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("shop-a/instance.yaml");
  server.close();
});
