import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runBin(args: string[]): string {
  return execFileSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

test("metric-factory --help 退出码 0 且列出全部核心命令", () => {
  const out = runBin(["--help"]);
  for (const cmd of ["init", "lint", "validate", "export", "diff"]) {
    expect(out).toContain(cmd);
  }
});

test("metric-factory --version 输出版本号", () => {
  const out = runBin(["--version"]);
  expect(out.trim()).toMatch(/^\d+\.\d+\.\d+/);
});
