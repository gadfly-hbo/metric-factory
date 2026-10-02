import { mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 导出下载：三格式 attachment + fail-closed 双门（validate 全量 + ExportBlockedError）
function tmpFixture(fixture: string): { dir: string; inst: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-exp-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync(`test/fixtures/${fixture}`, inst);
  return { dir, inst };
}

async function startUi(inst: string, dir: string) {
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local"), instancePath: inst });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

test("干净实例：三格式下载 200 + attachment + 内容头", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst, dir);

  const mf = await fetch(`${base}/instance/export/metricflow`);
  expect(mf.status).toBe(200);
  expect(mf.headers.get("content-disposition")).toContain('filename="metricflow.yaml"');
  const mfText = await mf.text();
  expect(mfText).toContain("gmv");

  const md = await fetch(`${base}/instance/export/mermaid`);
  expect(md.status).toBe(200);
  expect(md.headers.get("content-disposition")).toContain('filename="metric-tree.mmd"');
  expect(await md.text()).toContain("flowchart TD");

  const xl = await fetch(`${base}/instance/export/excel`);
  expect(xl.status).toBe(200);
  expect(xl.headers.get("content-type")).toContain("spreadsheetml");
  expect(xl.headers.get("content-disposition")).toContain('filename="metric-dictionary.xlsx"');
  const buf = Buffer.from(await xl.arrayBuffer());
  expect(buf.length).toBeGreaterThan(1000); // xlsx 是 zip 二进制

  const unknown = await fetch(`${base}/instance/export/pdf`);
  expect(unknown.status).toBe(404);
  server.close();
});

test("未审核 LLM 指标：导出 422 列 blocked 名单并链接审核中心（fail-closed）", async () => {
  const { dir, inst } = tmpFixture("instance-llm-unreviewed.yaml");
  const { server, base } = await startUi(inst, dir);
  const res = await fetch(`${base}/instance/export/metricflow`);
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain("ai_suggested_magic_metric");
  expect(html).toContain("/review");
  server.close();
});

test("实例页：含导出按钮组与变更对比区块", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst, dir);
  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("/instance/export/metricflow");
  expect(html).toContain("/instance/export/excel");
  expect(html).toContain("相对模板的变更");
  server.close();
});
