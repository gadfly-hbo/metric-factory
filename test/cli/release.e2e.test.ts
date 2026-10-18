import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";
import { contentFingerprint, packageFingerprint } from "../../src/sap/canonical.js";

// release CLI e2e（进程边界：spawn dist/cli.js；PRD 决策 #1-#6 + G1 位置参数 + G10 五键内容指纹）
// 期望值按 PRD/G10 行为推导，不来自实现输出

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));
const ECOMMERCE = "test/fixtures/instance-ecommerce.yaml";

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function runRelease(instancePath: string, version: string, releasesDir: string, extra: string[] = []): RunResult {
  return spawnSync(
    process.execPath,
    [bin, "release", instancePath, version, "--out", releasesDir, ...extra],
    { encoding: "utf8", env: { ...process.env, MF_REVIEWER: "测试人" } }
  ) as unknown as RunResult;
}

function readIndex(releasesDir: string): { releases: any[] } {
  return parseYaml(readFileSync(join(releasesDir, "index.yaml"), "utf8"));
}

test("release：发布成功写快照 + index 登记八字段齐全，双指纹与快照内容对账一致", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-")), "releases");
  const r = runRelease(ECOMMERCE, "1.0.0", rel, ["--note", "首个发布"]);
  expect(r.status, `stdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0);
  expect(r.stdout).toContain("instance-ecommerce@1.0.0");
  expect(r.stdout).toContain("（追加为第 1 条）");

  const snapshotPath = join(rel, "instance-ecommerce", "1.0.0.sap.yaml");
  expect(existsSync(snapshotPath)).toBe(true);
  const doc = parseYaml(readFileSync(snapshotPath, "utf8"));
  expect(doc.sap).toBe("0.1");
  expect(doc.package.id).toBe("instance-ecommerce");
  expect(doc.package.version).toBe("1.0.0");

  const index = readIndex(rel);
  expect(index.releases.length).toBe(1);
  const e = index.releases[0];
  expect(e.package).toBe("instance-ecommerce");
  expect(e.version).toBe("1.0.0");
  expect(e.content_fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(e.package_fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(e.created_at).toBeTruthy();
  expect(e.released_by).toBe("测试人");
  expect(e.note).toBe("首个发布");
  expect(e.file).toBe("instance-ecommerce/1.0.0.sap.yaml");

  // 对账：登记值 = 从落盘快照独立重算值（G10 五键内容指纹 + 包指纹）
  expect(e.content_fingerprint).toBe(contentFingerprint(doc));
  expect(e.package_fingerprint).toBe(doc.package.fingerprint);
  expect(e.package_fingerprint).toBe(packageFingerprint(doc));
});

test("F6：release 坏模板目录 → template-invalid 保持基线格式（首个坏文件 [schema] 全量错误）+ 零写盘", () => {
  const tplDir = mkdtempSync(join(tmpdir(), "mf-release-badtpl-"));
  copyFileSync("templates/ecommerce-marketplace.yaml", join(tplDir, "good.yaml"));
  writeFileSync(join(tplDir, "broken.yaml"), "broken: [ {", "utf8");
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-tpl-")), "releases");

  const r = runRelease(ECOMMERCE, "1.0.0", rel, ["-t", tplDir]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  // 基线格式（f525be6 逐字）：首个坏文件的【全部】zod 错误，[schema] 前缀
  expect(out).toContain("broken.yaml");
  expect(out).toContain("[schema]");
  expect(existsSync(rel)).toBe(false);
});

test("F6：release --mapping 损坏（required）→ mapping-invalid + 非零退出", () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-release-badmap-"));
  const mapping = join(dir, "broken.mapping.yaml");
  writeFileSync(mapping, "mappings: [ { broken", "utf8");
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-map-")), "releases");

  const r = runRelease(ECOMMERCE, "1.0.0", rel, ["--mapping", mapping]);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("无法读取映射文件");
  expect(out).toContain(mapping);
  expect(existsSync(rel)).toBe(false);
});

test("G1：release 误用程序级 --version 旗标 → 只打印 CLI 版本，动作不执行零写盘", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-g1-")), "releases");
  const r = spawnSync(process.execPath, [bin, "release", ECOMMERCE, "--version", "1.0.0", "--out", rel], {
    encoding: "utf8"
  });
  // commander 程序级 --version（0.1.0）拦截子命令旗标：动作未执行（G1 决议的实证依据）
  expect(r.status).toBe(0);
  expect(r.stdout).toContain("0.1.0");
  expect(existsSync(rel)).toBe(false);
});

test("不可变：同 id@version 重复发布被拒绝（含「已发布于…请升级版本号」），index 不变", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-dupe-")), "releases");
  expect(runRelease(ECOMMERCE, "1.0.0", rel).status).toBe(0);

  const before = readFileSync(join(rel, "index.yaml"), "utf8");
  const r2 = runRelease(ECOMMERCE, "1.0.0", rel);
  expect(r2.status).not.toBe(0);
  const out = r2.stdout + r2.stderr;
  expect(out).toContain("已发布于");
  expect(out).toContain("请升级版本号");
  expect(readFileSync(join(rel, "index.yaml"), "utf8")).toBe(before);
  expect(readIndex(rel).releases.length).toBe(1);
});

test("G10（A1 D11 修订）：版本递增但业务内容零变化 → 阻断（未修改不重复发版），零写盘", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-warn-")), "releases");
  expect(runRelease(ECOMMERCE, "1.0.0", rel).status).toBe(0);
  const before = readFileSync(join(rel, "index.yaml"), "utf8");
  const r2 = runRelease(ECOMMERCE, "1.0.1", rel);
  expect(r2.status, `stdout: ${r2.stdout}\nstderr: ${r2.stderr}`).not.toBe(0);
  expect(r2.stdout + r2.stderr).toContain("same-content");
  expect(r2.stdout + r2.stderr).toContain("未修改不重复发版");
  expect(r2.stdout + r2.stderr).toContain("instance-ecommerce@1.0.0");
  expect(readFileSync(join(rel, "index.yaml"), "utf8")).toBe(before);
  expect(readIndex(rel).releases.length).toBe(1);
});

test("口径翻转（真实业务变化）→ 新版本内容指纹必变且无警告；旧快照字节不变；index append-only", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mf-release-flip-"));
  const rel = join(tmp, "releases");
  const instancePath = join(tmp, "flip.yaml");
  const original = readFileSync(ECOMMERCE, "utf8");
  writeFileSync(instancePath, original, "utf8");

  expect(runRelease(instancePath, "1.0.0", rel).status).toBe(0);
  const snapshotV1 = readFileSync(join(rel, "flip", "1.0.0.sap.yaml"), "utf8");
  const indexV1 = readFileSync(join(rel, "index.yaml"), "utf8");

  writeFileSync(instancePath, original.replaceAll("include_refund: true", "include_refund: false"), "utf8");
  const r2 = runRelease(instancePath, "1.0.1", rel);
  expect(r2.status, `stdout: ${r2.stdout}\nstderr: ${r2.stderr}`).toBe(0);
  expect(r2.stdout + r2.stderr).not.toContain("警告");

  const index = readIndex(rel);
  expect(index.releases.length).toBe(2);
  expect(index.releases[0].content_fingerprint).not.toBe(index.releases[1].content_fingerprint);
  expect(readFileSync(join(rel, "flip", "1.0.0.sap.yaml"), "utf8")).toBe(snapshotV1);
  // append-only：首条目逐字不变（不改写既有行）
  expect(readFileSync(join(rel, "index.yaml"), "utf8").startsWith(indexV1)).toBe(true);
});

test("G3：index.yaml 损坏 → 拒绝发布（fail-closed 不静默重建），零写盘", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mf-release-corrupt-"));
  const rel = join(tmp, "releases");
  mkdirSync(rel, { recursive: true });
  writeFileSync(join(rel, "index.yaml"), "releases: [ { broken", "utf8");

  const r = runRelease(ECOMMERCE, "1.0.0", rel);
  expect(r.status).not.toBe(0);
  const out = r.stdout + r.stderr;
  expect(out).toContain("index-corrupt");
  expect(out).toContain("git 恢复");
  expect(existsSync(join(rel, "instance-ecommerce"))).toBe(false);
});

test("R3：非法版本（缺位 / 含路径分隔符）写盘前拒绝", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-badver-")), "releases");
  for (const bad of ["1.0", "1.0.0.0", "../evil", "1.0.0/../x"]) {
    const r = runRelease(ECOMMERCE, bad, rel);
    expect(r.status, `version=${bad}`).not.toBe(0);
    expect(r.stdout + r.stderr).toContain("semver");
  }
  expect(existsSync(rel)).toBe(false);
});

test("fail-closed 审核门：未审核 LLM 指标的实例发布被阻断，零写盘", () => {
  const rel = join(mkdtempSync(join(tmpdir(), "mf-release-gate-")), "releases");
  const r = runRelease("test/fixtures/instance-llm-unreviewed.yaml", "1.0.0", rel);
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain("审核");
  expect(existsSync(rel)).toBe(false);
});
