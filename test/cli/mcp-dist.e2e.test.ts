// BLOCKER 回归：dist 下 mcp 的模板目录解析（tsup 把 server chunk 拆到 dist 根部）
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

test("dist 形态：node dist/cli.js mcp 的 mf_audit 可用（模板目录命中）", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [bin, "mcp"]
  });
  const client = new Client({ name: "mf-dist-test", version: "0.0.1" });
  await client.connect(transport);

  const result = (await client.callTool({
    name: "mf_audit",
    arguments: { instancePath: "examples/ecommerce-instance.yaml" }
  })) as { isError?: boolean; content: { text: string }[] };
  expect(result.isError).toBeFalsy();
  const text = result.content.map((c) => c.text).join("");
  expect(JSON.parse(text).findings).toEqual([]);

  await client.close();
}, 30000);
