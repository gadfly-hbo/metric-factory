import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { test, expect } from "vitest";

const bin = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runExport(format: string, outDir: string) {
  return spawnSync(
    process.execPath,
    [bin, "export", "test/fixtures/instance-ecommerce.yaml", "--format", format, "--out", outDir],
    { encoding: "utf8" }
  );
}

test("export excel：四个 sheet 齐全，字典行数与出处列完整", async () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-xlsx-"));
  const r = runExport("excel", outDir);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);

  const outPath = join(outDir, "metric-dictionary.xlsx");
  expect(existsSync(outPath)).toBe(true);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(outPath);
  const sheetNames = wb.worksheets.map((w) => w.name);
  expect(sheetNames).toEqual(["指标字典", "口径开关", "北极星", "变更清单"]);

  const dict = wb.getWorksheet("指标字典")!;
  // 53 个实例指标 + 1 表头
  expect(dict.rowCount - 1).toBe(53);
  const headerRow = dict.getRow(1);
  const headers = (headerRow.values as unknown[]).filter(Boolean) as string[];
  expect(headers.some((h) => String(h).includes("出处"))).toBe(true);

  // 出处列非空：抽查第 2 行（第一个指标）出处单元格
  const provenanceCol = headers.findIndex((h) => String(h).includes("出处")) + 1;
  for (let row = 2; row <= dict.rowCount; row++) {
    const cell = dict.getRow(row).getCell(provenanceCol).value;
    expect(cell, `第 ${row} 行出处为空`).toBeTruthy();
  }

  // 口径开关 sheet：gmv.include_refund 反映实例覆盖值 true
  const caliber = wb.getWorksheet("口径开关")!;
  const caliberRows: string[][] = [];
  caliber.eachRow((row) => {
    caliberRows.push((row.values as unknown[]).slice(1).map((v) => String(v)));
  });
  const gmvRefund = caliberRows.find((r) => r[0] === "gmv" && r[1] === "include_refund");
  expect(gmvRefund).toBeTruthy();
  expect(gmvRefund![2]).toBe("true");

  // 变更清单 sheet：包含口径调整 from false → true、删除 nps、新增 custom 指标、修改 gmv
  const changes = wb.getWorksheet("变更清单")!;
  const changeRows: string[][] = [];
  changes.eachRow((row) => {
    changeRows.push((row.values as unknown[]).slice(1).map((v) => String(v)));
  });
  const joined = changeRows.map((r) => r.join("|")).join("\n");
  expect(joined).toContain("gmv");
  expect(joined).toContain("include_refund");
  expect(joined).toContain("nps");
  expect(joined).toContain("custom_gmv_excluding_gift");
});

test("export mermaid：flowchart TD、北极星、分类 subgraph 与树边一致", () => {
  const outDir = mkdtempSync(join(tmpdir(), "mf-mmd-"));
  const r = runExport("mermaid", outDir);
  expect(r.status, `stderr: ${r.stderr}`).toBe(0);

  const outPath = join(outDir, "metric-tree.mmd");
  expect(existsSync(outPath)).toBe(true);
  const content = readFileSync(outPath, "utf8");

  expect(content.trimStart().startsWith("flowchart TD")).toBe(true);
  expect(content).toContain("北极星");
  expect(content).toContain("subgraph");
  // 树边：revenue 树指向子指标节点（uv 在其 children 中，节点 id 带 m_ 前缀）
  expect(content).toMatch(/--> *m_uv\b/);
  // 指标节点带中文展示名
  expect(content).toContain("成交总额");
  // 已删除指标不出现在图中
  expect(content).not.toContain("净推荐值");
});
