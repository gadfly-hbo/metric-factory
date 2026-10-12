import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "vitest";

// F6 特征测试：钉住 cli 装载行为的对外可见输出（GRILL F6 终态 = 全量收集打印；
// 基线实为「首个坏文件即退出」，勘误见 .flow/prd.md GRILL F6 收敛勘误）

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

test("特征：模板目录含多个损坏 YAML → 全量错误逐行输出（每个坏文件路径都在）+ 非零退出", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-load-tpl-"));
  copyFileSync("templates/ecommerce-marketplace.yaml", join(dir, "good.yaml"));
  writeFileSync(join(dir, "broken.yaml"), "broken: [ {", "utf8");
  writeFileSync(join(dir, "broken2.yaml"), "also: broken", "utf8");

  const r = spawnSync(process.execPath, [bin, "validate", "examples/ecommerce-instance.yaml", "-t", dir], {
    encoding: "utf8"
  });
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  // GRILL F6 终态：共享核收集全部错误不短路，cli 打印全部坏文件后退出
  expect(out).toContain("broken.yaml");
  expect(out).toContain("broken2.yaml");
  expect(out).toContain("ERROR [template]");
});

test("特征：--mapping 指向 YAML 解析损坏文件 → 无法读取文案 + 非零退出（required 策略）", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-load-map-"));
  const mapping = join(dir, "broken.mapping.yaml");
  writeFileSync(mapping, "mappings: [ { broken", "utf8");

  const r = spawnSync(
    process.execPath,
    [bin, "export", "examples/ecommerce-instance.yaml", "--format", "metricflow", "--mapping", mapping],
    { encoding: "utf8" }
  );
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  // 实测行为：解析错误与读取错误同走「无法读取」分支（无 [mapping] 前缀）；路径必须出现
  expect(out).toContain("无法读取映射文件");
  expect(out).toContain(mapping);
});

test("特征：--mapping 指向形状违规文件 → ERROR [mapping] 逐条 + 非零退出（required 策略）", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-load-map2-"));
  const mapping = join(dir, "badshape.mapping.yaml");
  writeFileSync(mapping, "mappings: not-an-array", "utf8");

  const r = spawnSync(
    process.execPath,
    [bin, "export", "examples/ecommerce-instance.yaml", "--format", "metricflow", "--mapping", mapping],
    { encoding: "utf8" }
  );
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("[mapping]");
  expect(out).toContain(mapping);
});
