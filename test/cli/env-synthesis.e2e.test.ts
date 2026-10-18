import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

// M2 ②A/G8：CLI 走共享 env 合成——cwd/.env.local 生效、无任何配置时报零配置时代文案。
// 密闭性（D3/G1）：MF_LLM_AUTH_JSON_PATH 指向不存在文件，有真实 ~/.pi/agent/auth.json 的
// 开发机上断言不因默认链自动启用而翻转。
const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const instance = fileURLToPath(new URL("../../examples/ecommerce-instance.yaml", import.meta.url));

function cleanedEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const k of [
    "MF_LLM_MODEL",
    "MF_LLM_FALLBACK_MODELS",
    "MF_LLM_BASE_URL",
    "MF_LLM_BACKEND",
    "MF_FAUX_RESPONSE",
    "MINIMAX_CN_API_KEY",
    "XIAOMI_TOKEN_PLAN_CN_API_KEY"
  ]) {
    delete env[k];
  }
  env.MF_LLM_AUTH_JSON_PATH = join(tmpdir(), "mf-e2e-no-auth.json");
  return env;
}

const FAUX = JSON.stringify([
  {
    name: "seckill_gmv",
    display_name: "秒杀 GMV",
    type: "simple",
    definition: "秒杀活动频道支付成功订单金额合计（含秒杀退款）",
    dimensions: ["channel"],
    time_grains: ["day"],
    owner_role: "电商业务负责人"
  }
]);

test("CLI 读 cwd/.env.local（②A）：faux 写文件即生效，无需环境变量", { timeout: 20_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-cli-env-"));
  writeFileSync(join(dir, ".env.local"), `MF_LLM_BACKEND=faux\nMF_FAUX_RESPONSE=${FAUX}\n`, "utf8");
  const out = join(dir, "draft.yaml");
  const r = spawnSync(
    process.execPath,
    [bin, "generate", instance, "--describe", "跨境电商秒杀", "--out", out],
    { encoding: "utf8", env: cleanedEnv(), cwd: dir }
  );
  expect(r.status).toBe(0);
  expect(r.stdout).toContain("草案已写入");
});

test("CLI 零配置报错走 G8 文案（自动发现指引），且密闭于真实 auth.json", { timeout: 20_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-cli-bare-"));
  const out = join(dir, "draft.yaml");
  const r = spawnSync(
    process.execPath,
    [bin, "generate", instance, "--describe", "跨境电商秒杀", "--out", out],
    { encoding: "utf8", env: cleanedEnv(), cwd: dir }
  );
  expect(r.status).toBe(1);
  expect(r.stderr).toMatch(/自动发现/);
  expect(r.stderr).toMatch(/MF_LLM_MODEL/);
});
