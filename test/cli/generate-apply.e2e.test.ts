import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

const FAKE_RESPONSE = JSON.stringify([
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

function fakeEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MF_LLM_BACKEND: "faux",
    MF_FAUX_RESPONSE: FAKE_RESPONSE,
    MF_REVIEWER: "王五",
    ...extra
  };
}

function run(args: string[], env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", env });
}

test("generate → apply → 阻断 → review → 放行 全链路", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-gen-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);

  // 1. generate 产草案
  const gen = run(["generate", inst, "--describe", "跨境电商，主打低价秒杀", "--out", join(dir, "draft.yaml")], fakeEnv());
  expect(gen.status, `stderr: ${gen.stderr}`).toBe(0);
  expect(gen.stdout).toContain("seckill_gmv");

  const draft = parseYaml(readFileSync(join(dir, "draft.yaml"), "utf8")) as {
    generator: { model: string; prompt_version: string };
    added: { name: string; provenance: { origin: string; model: string; prompt_version: string }; review: { required: boolean } }[];
  };
  expect(draft.added[0]!.name).toBe("seckill_gmv");
  expect(draft.added[0]!.provenance.origin).toBe("llm");
  expect(draft.added[0]!.provenance.model).toBe("fake");
  expect(draft.added[0]!.provenance.prompt_version).toBe("v2.0.0");
  expect(draft.added[0]!.review.required).toBe(true);

  // 2. apply 合入
  const apply = run(["apply", inst, join(dir, "draft.yaml")]);
  expect(apply.status, `stderr: ${apply.stderr}`).toBe(0);
  const applied = parseYaml(readFileSync(inst, "utf8")) as { added: { name: string }[] };
  expect(applied.added.map((a) => a.name)).toContain("seckill_gmv");

  // 3. 未审核导出被阻断
  const blocked = run(["export", inst, "--format", "metricflow", "--out", dir]);
  expect(blocked.status).not.toBe(0);

  // 4. review 批准后放行
  const rev = run(["review", inst, "--approve", "seckill_gmv"], fakeEnv());
  expect(rev.status).toBe(0);
  const ok = run(["export", inst, "--format", "metricflow", "--out", dir]);
  expect(ok.status, `stderr: ${ok.stderr}`).toBe(0);
});

test("generate：模型输出非合法 JSON 时整批拒绝并展示原文", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-genbad-"));
  const r = run(
    ["generate", "test/fixtures/instance-ecommerce.yaml", "--describe", "x", "--out", join(dir, "d.yaml")],
    fakeEnv({ MF_FAUX_RESPONSE: "这不是 JSON" })
  );
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("这不是 JSON");
  expect(existsSync(join(dir, "d.yaml"))).toBe(false);
});

test("apply：同名冲突与悬空修改目标零写盘", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-apply-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);
  const before = readFileSync(inst, "utf8");

  const badDraft = {
    generator: { model: "fake", prompt_version: "v2.0.0", describe: "x", created_at: "2026-09-29T00:00:00Z" },
    added: [
      {
        name: "gmv",
        display_name: "冲突指标",
        type: "simple",
        definition: "与模板指标同名",
        dimensions: ["channel"],
        time_grains: ["day"],
        owner_role: "测试",
        caliber_switches: {},
        provenance: { origin: "llm", model: "fake", prompt_version: "v2.0.0" },
        review: { required: true }
      }
    ],
    modified: [{ name: "no_such_metric", definition: "悬空修改" }],
    removed: [],
    caliber: {}
  };
  const draftPath = join(dir, "draft.yaml");
  writeFileSync(draftPath, JSON.stringify(badDraft), "utf8");

  const r = run(["apply", inst, draftPath]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("gmv");
  expect(out).toContain("no_such_metric");
  expect(readFileSync(inst, "utf8")).toBe(before); // 零写盘
});

test("apply：四段草案（含 modified/removed/caliber）合入后 diff 一致", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-apply4-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-saas.yaml", inst);

  const draft = {
    generator: { model: "fake", prompt_version: "v2.0.0", describe: "微调", created_at: "2026-09-29T00:00:00Z" },
    added: [],
    modified: [{ name: "nrr", definition: "调整后的净收入留存口径（含试用折算）" }],
    removed: ["nps"],
    caliber: { mrr: { annual_proration: false } }
  };
  const draftPath = join(dir, "draft.yaml");
  writeFileSync(draftPath, JSON.stringify(draft), "utf8");

  const r = run(["apply", inst, draftPath]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);

  const d = run(["diff", inst, "--json"]);
  expect(d.status).toBe(0);
  const parsed = JSON.parse(d.stdout) as {
    removed: string[];
    modified: { name: string }[];
    caliber: { metric: string; key: string; from: boolean; to: boolean }[];
  };
  expect(parsed.removed).toContain("nps");
  expect(parsed.modified.map((m) => m.name)).toContain("nrr");
  expect(parsed.caliber).toContainEqual({ metric: "mrr", key: "annual_proration", from: true, to: false });
});

test("S3：合法 JSON 但字段不合规 → payload 阶段整批拒绝并展示 issues 与原文", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-payload-"));
  const r = run(
    ["generate", "test/fixtures/instance-ecommerce.yaml", "--describe", "x", "--out", join(dir, "d.yaml")],
    fakeEnv({ MF_FAUX_RESPONSE: JSON.stringify([{ name: "Bad Name", display_name: "坏名字" }]) })
  );
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("payload");
  expect(out).toContain("Bad Name");
  expect(out).toContain("snake_case");
  expect(existsSync(join(dir, "d.yaml"))).toBe(false);
});
