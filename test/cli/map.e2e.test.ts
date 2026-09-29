import { spawnSync } from "node:child_process";
import { mkdtempSync, copyFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function run(args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
}

function tmpInstance(): string {
  const dir = mkdtempSync(join(tmpdir(), "mf-map-"));
  const p = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", p);
  return p;
}

const MF = ["--manifest", "test/fixtures/dbt-manifest.json", "--catalog", "test/fixtures/dbt-catalog.json"];

test("map --draft：产出推荐草案并输出三分类差距清单", () => {
  const inst = tmpInstance();
  const draftPath = join(inst, "..", "map-draft.yaml");
  const r = run(["map", inst, ...MF, "--draft", draftPath]);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);

  const out = r.stdout;
  expect(out).toContain("已映射");
  expect(out).toContain("待确认");
  expect(out).toContain("待人工");
  expect(out).toMatch(/待人工.*\d+/);

  const draft = parseYaml(readFileSync(draftPath, "utf8")) as {
    recommendations: { metric: string; model: string; column: string; score: number }[];
    needsManual: string[];
  };
  const gmv = draft.recommendations.find((x) => x.metric === "gmv")!;
  expect(gmv.model).toBe("fct_orders");
  expect(gmv.column).toBe("gmv");
  expect(draft.needsManual).toContain("cvr");
});

test("map --apply：写映射文件含 confirmed_by，重复 apply 幂等", () => {
  const inst = tmpInstance();
  const draftPath = join(inst, "..", "map-draft.yaml");
  run(["map", inst, ...MF, "--draft", draftPath]);

  const mappingPath = join(inst, "..", "instance.mapping.yaml");
  const a = run(["map", inst, "--apply", draftPath, "--reviewer", "张三"]);
  expect(a.status, `stderr: ${a.stderr}`).toBe(0);
  expect(existsSync(mappingPath)).toBe(true);

  const mapping = parseYaml(readFileSync(mappingPath, "utf8")) as {
    mappings: { metric: string; confirmed_by?: string }[];
  };
  const gmv = mapping.mappings.find((m) => m.metric === "gmv")!;
  expect(gmv.confirmed_by).toBe("张三");

  const before = readFileSync(mappingPath, "utf8");
  const b = run(["map", inst, "--apply", draftPath, "--reviewer", "李四"]);
  expect(b.status).toBe(0);
  const after = readFileSync(mappingPath, "utf8");
  expect(after).toBe(before); // 幂等：同草案重复确认不重复追加、不改写
});

test("map 差距清单 --json 可解析；缺 manifest 报错", () => {
  const inst = tmpInstance();
  const j = run(["map", inst, ...MF, "--json"]);
  expect(j.status).toBe(0);
  const parsed = JSON.parse(j.stdout) as {
    mapped: number;
    recommended: number;
    needsManual: number;
  };
  expect(parsed.mapped).toBe(0);
  expect(parsed.recommended).toBeGreaterThanOrEqual(4);
  expect(parsed.needsManual).toBeGreaterThan(0);

  const no = run(["map", inst, "--json"]);
  expect(no.status).not.toBe(0);
  expect(no.stderr).toContain("--manifest");
});
