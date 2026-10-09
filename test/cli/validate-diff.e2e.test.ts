import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

const BAD_INSTANCES: [string, string[]][] = [
  ["instance-bad-dangling-dim.yaml", ["dangling", "unknown_dim"]],
  ["instance-bad-empty-def.yaml", ["definition"]],
  ["instance-bad-provenance.yaml", ["template_ref"]],
  ["instance-llm-unreviewed.yaml", ["审核"]],
  ["instance-bad-modified-missing.yaml", ["修改目标"]]
];

test.each(BAD_INSTANCES)("validate 拒绝坏实例：%s", (fixture, keywords) => {
  const r = run(["validate", `test/fixtures/${fixture}`]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  for (const kw of keywords) {
    expect(out).toContain(kw);
  }
});

test("validate 通过合法实例", () => {
  const r = run(["validate", "test/fixtures/instance-ecommerce.yaml"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("PASS");
});

test("diff 输出 added/removed/modified/caliber 四段且与构造一致", () => {
  const r = run(["diff", "test/fixtures/instance-ecommerce.yaml"]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  const out = r.stdout;
  expect(out).toContain("删除");
  expect(out).toContain("nps");
  expect(out).toContain("修改");
  expect(out).toContain("gmv");
  expect(out).toContain("新增");
  expect(out).toContain("custom_gmv_excluding_gift");
  expect(out).toContain("口径");
  expect(out).toContain("include_refund");
  // fixture 无 added_scenarios（缺省 []）→ 场景计数行显示 +0
  expect(out).toContain("场景 scenarios: +0（added）");
});

test("diff --json 输出可解析的结构化差异", () => {
  const r = run(["diff", "test/fixtures/instance-ecommerce.yaml", "--json"]);
  expect(r.status).toBe(0);
  const parsed = JSON.parse(r.stdout) as {
    base: string;
    removed: string[];
    modified: { name: string }[];
    added: { name: string }[];
    caliber: { metric: string; key: string; from: boolean; to: boolean }[];
    scenarios_added: number;
  };
  expect(parsed.base).toBe("ecommerce-marketplace@0.1.0");
  expect(parsed.removed).toEqual(["nps"]);
  expect(parsed.modified.map((m) => m.name)).toContain("gmv");
  expect(parsed.added.map((a) => a.name)).toContain("custom_gmv_excluding_gift");
  expect(parsed.caliber).toContainEqual({ metric: "gmv", key: "include_refund", from: false, to: true });
  expect(parsed.scenarios_added).toBe(0);
});

test("fail-closed 矩阵：已审核 LLM 指标放行导出", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-matrix-"));
  const r = run(["export", "test/fixtures/instance-llm-reviewed.yaml", "--out", outDir]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
});

// 最小合法实例头（ecommerce 基模板 + 零指标 patch）；场景相关 e2e 复用
const INSTANCE_HEAD = `instance:
  created_at: "2026-10-08T00:00:00.000Z"
base: ecommerce-marketplace@0.1.0
answers:
  revenue_model: 交易抽佣
  user_structure: 双边市场
  core_loop: 交易
  caliber: {}
caliber_switches: {}
removed: []
modified: []
added: []
`;

function writeInstance(tmp: string, name: string, tail: string) {
  const path = join(tmp, name);
  writeFileSync(path, INSTANCE_HEAD + tail, "utf8");
  return path;
}

test("validate 拒绝坏场景：added_scenarios 引用不存在指标 → scenario-metric-ref 非零退出", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mf-cli-scn-bad-"));
  const instancePath = writeInstance(
    tmp,
    "bad-scenario.yaml",
    `added_scenarios:
  - id: broken_scenario
    version: 0.1.0
    title: 引用幽灵指标的场景
    decision_purpose: 结构合法但指标引用悬空，应被场景引用完整性规则拒绝
    question_tree:
      - id: root
        label: 根问题
        metric: ghost_metric
    metric_usages:
      - metric: ghost_metric
        role: outcome
`
  );
  const r = run(["validate", instancePath]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("scenario-metric-ref");
  expect(out).toContain("ghost_metric");
});

test("diff 场景计数：带 2 条 added_scenarios → 文本「场景 scenarios: +2（added）」且 --json 计数一致", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mf-cli-scn-diff-"));
  const instancePath = writeInstance(
    tmp,
    "scn-two.yaml",
    `added_scenarios:
  - id: promo_effect_check
    version: 0.1.0
    title: 大促效果复盘
    decision_purpose: 大促结束后评估 GMV 增量与副作用，决定下次大促的资源档位
    question_tree:
      - id: root
        label: 大促带来多少增量
        metric: gmv
      - id: side_effect
        label: 是否推高退款
        parent: root
        metric: refund_rate
    metric_usages:
      - metric: gmv
        role: outcome
      - metric: refund_rate
        role: guardrail
  - id: new_user_funnel_review
    version: 0.1.0
    title: 新客转化漏斗周检
    decision_purpose: 每周定位新客漏斗流失环节，决定落地页与首单激励的调整方向
    question_tree:
      - id: root
        label: 新客转化是否下滑
        metric: cvr
    metric_usages:
      - metric: uv
        role: driver
      - metric: cvr
        role: outcome
`
  );

  const r = run(["diff", instancePath]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("场景 scenarios: +2（added）");

  const j = run(["diff", instancePath, "--json"]);
  expect(j.status).toBe(0);
  const parsed = JSON.parse(j.stdout) as { scenarios_added: number };
  expect(parsed.scenarios_added).toBe(2);
});
