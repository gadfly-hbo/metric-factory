import { mkdtempSync, copyFileSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 实例发布 UI e2e（真实 server + fetch；.flow/ui-contract.md R1–R7 + T 术语表 + Negative N2/N3）
// 期望值按 UI 契约逐字推导，不来自实现输出

function tmpFixture(fixture: string, name: string): { dir: string; inst: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-rel-ui-"));
  const inst = join(dir, name);
  copyFileSync(`test/fixtures/${fixture}`, inst);
  return { dir, inst };
}

async function startUi(inst: string, dir: string) {
  const server = createUiServer({ authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"), templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local"), instancePath: inst  });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

function post(base: string, version: string, note = "") {
  return fetch(`${base}/instance/release`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ version, note }).toString()
  });
}

test("R1（A1 迁移）：发布区块居「04 检查与交付」视图（表单字段序/原生约束/T 术语逐字），boundary 全站更新（T-16）", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const home = await (await fetch(`${base}/`)).text();
  // A2：根路由=SPA 壳（边界声明换「本地工作台 · 真实引擎」；写范围说明进 about 弹层）
  expect(home).toContain("本地工作台 · 真实引擎");

  const html = await (await fetch(`${base}/instance/delivery`)).text();
  expect(html).toContain("发布");
  expect(html).toContain('action="/instance/release"');
  expect(html).toContain('pattern="\\d+\\.\\d+\\.\\d+"');
  expect(html).toContain("版本号（semver 三段 X.Y.Z，必填，如 1.2.0）");
  expect(html).toContain("变更说明（可空）");
  expect(html).toContain("随发布登记保存（releases/index.yaml 条目的 note 字段）；发布人取环境约定（MF_REVIEWER / $USER），无需填写。");
  expect(html).toContain("把当前实例发布为不可变快照");
  // A1：发布不再居实例页；四视图导航在交付页呈现且当前项高亮
  expect(html).toContain('href="/instance/delivery" class="active"');
  const instHtml = await (await fetch(`${base}/instance`)).text();
  expect(instHtml).not.toContain('action="/instance/release"');
  server.close();
});

test("R2：发布成功 200 重渲染（结果卡四行 + 表单复位），快照与 index 真实落盘", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const res = await post(base, "1.0.0", "首个发布");
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("发布成功 · ecommerce-instance@1.0.0");
  expect(html).toContain("releases/ecommerce-instance/1.0.0.sap.yaml");
  expect(html).toContain("releases/index.yaml · 追加为第 1 条（append-only）");
  expect(html).toContain("内容指纹");
  expect(html).toContain("package_fingerprint");
  // 表单复位（R2）：无残留提交值
  expect(html).not.toContain('value="1.0.0"');

  const snapshotPath = join(dir, "releases", "ecommerce-instance", "1.0.0.sap.yaml");
  expect(existsSync(snapshotPath)).toBe(true);
  const doc = parseYaml(readFileSync(snapshotPath, "utf8"));
  expect(doc.package.version).toBe("1.0.0");
  const index = parseYaml(readFileSync(join(dir, "releases", "index.yaml"), "utf8"));
  expect(index.releases.length).toBe(1);
  expect(index.releases[0].note).toBe("首个发布");
  server.close();
});

test("R3（A1 D11 修订）：同内容新版本 → 422 阻断（未修改不重复发版），表单值保留，零写盘", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);
  expect((await post(base, "1.0.0")).status).toBe(200);
  const indexBefore = readFileSync(join(dir, "releases", "index.yaml"), "utf8");

  const res = await post(base, "1.0.1");
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("内容与 ecommerce-instance@1.0.0 完全一致，未修改不重复发版");
  expect(html).toContain('value="1.0.1"');

  expect(readFileSync(join(dir, "releases", "index.yaml"), "utf8")).toBe(indexBefore);
  const index = parseYaml(readFileSync(join(dir, "releases", "index.yaml"), "utf8"));
  expect(index.releases.length).toBe(1);
  server.close();
});

test("R6：重复版本 422（T-14 逐字含已发布于时间），表单值保留，零写盘", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);
  expect((await post(base, "1.0.0")).status).toBe(200);
  const indexBefore = readFileSync(join(dir, "releases", "index.yaml"), "utf8");

  const res = await post(base, "1.0.0", "重复提交");
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("已发布于");
  expect(html).toContain("请升级版本号（已发布版本不可变）");
  expect(html).toContain("ecommerce-instance@1.0.0");
  expect(html).toContain('value="1.0.0"');
  expect(readFileSync(join(dir, "releases", "index.yaml"), "utf8")).toBe(indexBefore);
  server.close();
});

test("R5：非 semver 版本 422 内联错误（T-13 逐字），零写盘", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const res = await post(base, "abc");
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain('版本号 &quot;abc&quot; 不是合法 semver（须为三段数字 X.Y.Z，如 1.2.0），已拒绝发布（零写盘）');
  expect(html).toContain('value="abc"');
  expect(existsSync(join(dir, "releases"))).toBe(false);
  server.close();
});

test("R4：实例校验失败 422（逐行 [rule] 错误 + 值保留 + 零写盘）", async () => {
  const { dir, inst } = tmpFixture("instance-llm-unreviewed.yaml", "blocked-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const res = await post(base, "2.0.0", "带待审指标");
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("发布未通过校验（零写盘）");
  expect(html).toContain('id="release-issues"');
  expect(html).toContain('aria-describedby="release-issues"');
  expect(html).toContain("[llm-unreviewed]");
  expect(html).toContain("ai_suggested_magic_metric");
  expect(html).toContain('value="2.0.0"');
  expect(html).toContain("带待审指标");
  expect(existsSync(join(dir, "releases"))).toBe(false);
  server.close();
});

test("R7：index.yaml 损坏 422（T-15 逐字 + git 恢复指引），零写盘无重建入口", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);
  const relDir = join(dir, "releases");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(relDir, { recursive: true });
  writeFileSync(join(relDir, "index.yaml"), "releases: [ { broken", "utf8");

  const res = await post(base, "1.0.0");
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("发布被拒绝 · releases/index.yaml 不可用");
  expect(html).toContain("已拒绝发布（fail-closed，零写盘）。请用 git 恢复该文件后重试；发布不会自动重建或覆盖它。");
  expect(existsSync(join(relDir, "ecommerce-instance"))).toBe(false);
  server.close();
});
