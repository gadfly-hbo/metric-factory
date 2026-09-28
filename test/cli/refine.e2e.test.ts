import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

const FAKE_REFINE = JSON.stringify({
  caliber: { gmv: { include_refund: true } },
  modified: [{ name: "aov", definition: "调整：成交总额（含退款）/ 支付订单数" }],
  removed: ["nps"],
  added: [
    {
      name: "member_gmv",
      display_name: "会员 GMV",
      type: "simple",
      definition: "会员用户支付成功订单金额合计",
      dimensions: ["channel"],
      time_grains: ["day"],
      owner_role: "用户运营负责人"
    }
  ]
});

function run(args: string[], env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", env });
}

test("refine → apply：微调四段草案合入且 diff 一致；added 走 llm 门", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-refine-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);

  const r = run(
    ["refine", inst, "--instruction", "会员体系上线：GMV 含退款、聚焦会员、删掉 NPS", "--out", join(dir, "draft.yaml")],
    { ...process.env, MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAKE_REFINE }
  );
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("member_gmv");

  const draft = parseYaml(readFileSync(join(dir, "draft.yaml"), "utf8")) as {
    caliber: Record<string, Record<string, boolean>>;
    modified: { name: string }[];
    removed: string[];
    added: { name: string; provenance: { origin: string }; review: { required: boolean } }[];
  };
  expect(draft.caliber.gmv?.include_refund).toBe(true);
  expect(draft.removed).toContain("nps");
  expect(draft.added[0]!.provenance.origin).toBe("llm");
  expect(draft.added[0]!.review.required).toBe(true);

  const apply = run(["apply", inst, join(dir, "draft.yaml")]);
  expect(apply.status, `stderr: ${apply.stderr}`).toBe(0);

  const d = run(["diff", inst, "--json"]);
  const parsed = JSON.parse(d.stdout) as {
    removed: string[];
    modified: { name: string }[];
    added: { name: string }[];
    caliber: { metric: string; key: string; from: boolean; to: boolean }[];
  };
  expect(parsed.removed).toContain("nps");
  expect(parsed.modified.map((m) => m.name)).toContain("aov");
  expect(parsed.added.map((a) => a.name)).toContain("member_gmv");
  expect(parsed.caliber).toContainEqual({ metric: "gmv", key: "include_refund", from: false, to: true });
});

test("refine --dry-run 零配置可用", () => {
  const r = run([
    "refine", "test/fixtures/instance-ecommerce.yaml",
    "--instruction", "把 GMV 口径改为含退款",
    "--dry-run"
  ]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("把 GMV 口径改为含退款");
  expect(r.stdout).toMatch(/token/i);
});
