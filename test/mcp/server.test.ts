import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { test, expect } from "vitest";
import { buildMcpServer, type McpServerOptions } from "../../src/mcp/server.js";

// 测试密闭（D3/G1）：默认注入不存在的 auth.json 路径——有真实 ~/.pi/agent/auth.json 的开发机上
// 断言不因默认链自动启用而翻转（验证门不做环境抽签）
const NO_AUTH = join(tmpdir(), "mf-test-no-auth.json");

async function connect(opts: McpServerOptions = {}) {
  const server = buildMcpServer({ authJsonPath: NO_AUTH, ...opts });
  const client = new Client({ name: "mf-test", version: "0.0.1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

test("MCP 握手并列出六工具", async () => {
  const client = await connect();
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  expect(names).toEqual(["mf_audit", "mf_diff", "mf_export", "mf_generate", "mf_refine", "mf_validate"]);
});

test("mf_audit 返回与 CLI 等价的发现", async () => {
  const client = await connect();
  const result = await client.callTool({ name: "mf_audit", arguments: { instancePath: "test/fixtures/instance-audit-bad.yaml" } });
  const text = (result.content as { type: string; text: string }[]).map((c) => c.text).join("");
  const parsed = JSON.parse(text) as { findings: { rule: string; severity: string }[] };
  expect(parsed.findings.length).toBeGreaterThanOrEqual(3);
  expect(parsed.findings.some((f) => f.rule === "vanity")).toBe(true);
});

test("mf_validate 合法实例通过、坏实例报错", async () => {
  const client = await connect();
  const ok = await client.callTool({ name: "mf_validate", arguments: { instancePath: "examples/ecommerce-instance.yaml" } });
  const okText = (ok.content as { text: string }[]).map((c) => c.text).join("");
  expect(JSON.parse(okText).ok).toBe(true);

  const bad = await client.callTool({ name: "mf_validate", arguments: { instancePath: "test/fixtures/instance-bad-dangling-dim.yaml" } });
  const badText = (bad.content as { text: string }[]).map((c) => c.text).join("");
  const parsedBad = JSON.parse(badText) as { ok: boolean; issues: { rule: string }[] };
  expect(parsedBad.ok).toBe(false);
  expect(parsedBad.issues.some((i) => i.rule === "dangling-dimension")).toBe(true);
});

test("mf_generate 无模型配置时返回 isError 结果与零配置时代指引（G8）", async () => {
  const client = await connect();
  const result = (await client.callTool({
    name: "mf_generate",
    arguments: { instancePath: "examples/ecommerce-instance.yaml", describe: "跨境电商" }
  })) as { isError?: boolean; content: { text: string }[] };
  expect(result.isError).toBe(true);
  const textOut = result.content.map((c) => c.text).join("");
  expect(textOut).toMatch(/自动发现/);
  expect(textOut).toMatch(/MF_LLM_MODEL|faux/);
});

test("mf_generate 经 opts.envFilePath 合成生效（faux 写 .env.local，证明 ②A 接线）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-mcp-env-"));
  const envFile = join(dir, ".env.local");
  writeFileSync(envFile, "MF_LLM_BACKEND=faux\nMF_FAUX_RESPONSE=[{\"name\":\"x_gmv\",\"display_name\":\"X GMV\",\"type\":\"simple\",\"definition\":\"X 订单金额\",\"dimensions\":[\"channel\"],\"time_grains\":[\"day\"],\"owner_role\":\"电商负责人\"}]\n", "utf8");
  const client = await connect({ envFilePath: envFile });
  const result = (await client.callTool({
    name: "mf_generate",
    arguments: { instancePath: "examples/ecommerce-instance.yaml", describe: "跨境电商" }
  })) as { isError?: boolean; content: { text: string }[] };
  expect(result.isError).toBeFalsy();
  const textOut = result.content.map((c) => c.text).join("");
  const parsed = JSON.parse(textOut) as { draft: { added: { name: string }[] } };
  expect(parsed.draft.added[0]!.name).toBe("x_gmv");
});

test("mf_diff 返回结构化差异；mf_export 返回内容不写盘", async () => {
  const client = await connect();
  const d = await client.callTool({ name: "mf_diff", arguments: { instancePath: "test/fixtures/instance-ecommerce.yaml" } });
  const dText = (d.content as { text: string }[]).map((c) => c.text).join("");
  const parsed = JSON.parse(dText) as { removed: string[] };
  expect(parsed.removed).toContain("nps");

  const e = await client.callTool({
    name: "mf_export",
    arguments: { instancePath: "examples/saas-instance.yaml", format: "metricflow" }
  });
  const eText = (e.content as { text: string }[]).map((c) => c.text).join("");
  expect(eText).toContain("semantic_models");
  expect(eText).toContain("净收入留存");
});

test("S5：mf_export 与 CLI export 同门（坏实例被拒）", async () => {
  const client = await connect();
  const result = (await client.callTool({
    name: "mf_export",
    arguments: { instancePath: "test/fixtures/instance-bad-dangling-dim.yaml", format: "metricflow" }
  })) as { isError?: boolean; content: { text: string }[] };
  expect(result.isError).toBe(true);
  expect(result.content.map((c) => c.text).join("")).toContain("dangling-dimension");
});
