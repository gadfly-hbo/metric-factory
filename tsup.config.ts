import { execSync } from "node:child_process";
import { defineConfig } from "tsup";

// 构建期 git sha 注入（PRD generator 决策）：GIT_SHA 环境变量优先，其次 git rev-parse；
// 非 git 环境静默回退 undefined（运行时使用纯版本号兜底）。
function buildGitSha(): string | undefined {
  if (process.env.GIT_SHA) return process.env.GIT_SHA;
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim() || undefined;
  } catch {
    return undefined;
  }
}

const gitSha = buildGitSha();

export default defineConfig({
  entry: { cli: "src/cli/index.ts" },
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
  sourcemap: true,
  define: gitSha ? { "process.env.MF_GIT_SHA_BUILD": JSON.stringify(gitSha) } : {}
});
