import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// 设置页：模型配置写入 .env.local（保留未知行），key 不回显明文
async function startUi() {
  const dir = mkdtempSync(join(tmpdir(), "mf-set-"));
  const envFile = join(dir, ".env.local");
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: envFile });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}`, dir, envFile };
}

const post = (base: string, path: string, params: Record<string, string>) =>
  fetch(`${base}${path}`, { method: "POST", body: new URLSearchParams(params), headers: { "content-type": "application/x-www-form-urlencoded" } });

test("GET /settings：未配置状态与表单", async () => {
  const { server, base } = await startUi();
  const res = await fetch(`${base}/settings`);
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("未配置");
  expect(html).toContain('action="/settings/save"');
  server.close();
});

test("POST /settings/save：写 .env.local（含 provider key 映射），页面打码不回显明文", async () => {
  const { server, base, envFile } = await startUi();
  const res = await post(base, "/settings/save", { model: "openai/gpt-4o", api_key: "sk-secret-abcd1234", base_url: "" });
  expect([200, 302, 303]).toContain(res.status);
  const text = readFileSync(envFile, "utf8");
  expect(text).toContain("MF_LLM_MODEL=openai/gpt-4o");
  expect(text).toContain("OPENAI_API_KEY=sk-secret-abcd1234");
  expect(text).not.toContain("MF_LLM_BASE_URL=");

  const html = await (await fetch(`${base}/settings`)).text();
  expect(html).toContain("openai/gpt-4o");
  expect(html).toContain("****1234");
  expect(html).not.toContain("sk-secret-abcd1234"); // 明文永不回显
  server.close();
});

test("POST /settings/save：坏 model 422 且零写盘", async () => {
  const { server, base, envFile } = await startUi();
  const res = await post(base, "/settings/save", { model: "gpt-4o", api_key: "" });
  expect(res.status).toBe(422);
  expect(await res.text()).toContain("provider/model-id");
  expect(existsSync(envFile)).toBe(false);
  server.close();
});

test("POST /settings/save：保留 .env.local 中用户手写的其他行；clear 只删管理键", async () => {
  const { server, base, envFile } = await startUi();
  writeFileSync(envFile, "MY_CUSTOM_LINE=keep\n", "utf8");
  await post(base, "/settings/save", { model: "anthropic/claude-sonnet-4", api_key: "sk-ant-xyz-9999" });
  let text = readFileSync(envFile, "utf8");
  expect(text).toContain("MY_CUSTOM_LINE=keep");
  expect(text).toContain("ANTHROPIC_API_KEY=sk-ant-xyz-9999");

  const res = await post(base, "/settings/clear", {});
  expect([200, 302, 303]).toContain(res.status);
  text = readFileSync(envFile, "utf8");
  expect(text).toContain("MY_CUSTOM_LINE=keep");
  expect(text).not.toContain("MF_LLM_MODEL");
  expect(text).not.toContain("ANTHROPIC_API_KEY");
  server.close();
});
