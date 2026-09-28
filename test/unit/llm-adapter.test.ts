import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { test, expect } from "vitest";
import { createFakeClient, estimateTokens } from "../../src/llm/index.js";
import { createPiFauxClient } from "../../src/llm/faux.js";

test("fake client 返回脚本化响应（引擎级测试注入用）", async () => {
  const client = createFakeClient('{"metrics": []}');
  const out = await client.complete({ system: "s", user: "u" });
  expect(out).toBe('{"metrics": []}');
});

test("estimateTokens 对电商模板 YAML 为正且量级合理", async () => {
  const yaml = await readFile("templates/ecommerce-marketplace.yaml", "utf8");
  const tokens = estimateTokens(yaml);
  expect(tokens).toBeGreaterThan(1000);
  expect(tokens).toBeLessThan(100_000);
  // 实测记录（2026-09-29）：53 指标模板 ≈ 1.2 万字符 → 估算 < 8k token，远低于 50k 升级阈值
});

test("pi-ai faux provider 经 pi-client 完成零网络调用并返回脚本文本", async () => {
  const faux = createPiFauxClient();
  faux.setResponses(["faux 口径响应"]);

  const out = await faux.client.complete({ system: "你是指标体系设计师", user: "描述业务" });
  expect(out).toContain("faux 口径响应");
  expect(faux.callCount()).toBe(1);
});

test("src/llm 之外的业务代码零 pi import（适配层边界钉死）", async () => {
  async function walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      })
    );
    return files.flat();
  }
  const srcFiles = (await walk("src")).filter(
    (f) => f.startsWith("src/") && !f.startsWith("src/llm/") && /\.ts$/.test(f)
  );
  expect(srcFiles.length).toBeGreaterThan(5);
  for (const f of srcFiles) {
    const content = await readFile(f, "utf8");
    expect(content, `${f} 不应直接 import pi 包`).not.toContain("@earendil-works/pi-ai");
  }
});
