#!/usr/bin/env node
// 外部指标字典 xlsx → Metric Factory 模板 + 实例（用法一：治理审计语料）
// 机器名 = 指标编码归一化（不伪造英文命名）；口径 = 业务口径优先、指标定义兜底、缺失标记「未登记」；
// 计算公式 best-effort 机翻（token 无法全量命中登记指标时不落 type_params，保留原文进口径）。
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { stringify as stringifyYaml } from "yaml";

const require = createRequire(import.meta.url);
const ExcelJS = require("exceljs");

const COL = {
  name: 1, alias: 2, category: 3, version: 4, tier: 5, theme: 6, code: 7,
  definition: 8, caliber: 9, formula: 10, related: 11, dimensions: 12, unit: 13,
  precision: 14, dept: 15, owner: 16, bizSteward: 17, techDept: 18, techSteward: 19,
  secrecy: 20, issuedAt: 21, revokedAt: 22
};
// 平台占位符：斜杠/竖线/横线在多列里表示「无」
const MISSING = new Set(["", "/", "|", "||", "\\", "-", "—", "无", "无。"]);

function cell(row, col) {
  const v = row.getCell(col).value;
  if (v == null) return "";
  const s = typeof v === "object" && v.richText ? v.richText.map((t) => t.text).join("") : String(v);
  return s.trim();
}
function present(row, col) {
  const v = cell(row, col);
  return MISSING.has(v) ? "" : v;
}

function machineName(code, used) {
  let base;
  if (/^\d+$/.test(code)) base = `legacy_${code}`;
  else {
    base = code.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!/^[a-z]/.test(base)) base = `uncoded_${base}`;
    if (!base) base = "uncoded";
  }
  let name = base, i = 2;
  while (used.has(name)) name = `${base}_${i++}`;
  used.add(name);
  return name;
}

function normalizeDimensions(raw) {
  const out = new Set();
  for (const part of raw.split(/[,，、;；]/)) {
    let d = part.trim().replace(/维度$/, "").trim();
    if (d && !MISSING.has(d)) out.add(d);
  }
  return [...out];
}

// 公式机翻：操作数全部命中登记指标名 → expr；纯 A/B 形态 → numerator/denominator
function translateFormula(formula, displayIndex) {
  const cleaned = formula
    .replace(/[×✕]/g, "*").replace(/[÷]/g, "/")
    .replace(/（/g, "(").replace(/）/g, ")")
    .replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/([+\-*/()])/);
  const rebuilt = [];
  const resolvedNames = new Set();
  let unresolved = [];
  for (const part of parts) {
    const t = part.trim();
    if (t === "" || /^[+\-*/()]$/.test(part)) { rebuilt.push(part); continue; }
    if (/^\d+(\.\d+)?%?$/.test(t)) { rebuilt.push(t); continue; }
    const hit = displayIndex.get(t);
    if (hit) { rebuilt.push(hit); resolvedNames.add(hit); }
    else { unresolved.push(t); rebuilt.push(t); }
  }
  if (unresolved.length > 0) return { ok: false, unresolved };
  const expr = rebuilt.join(" ").replace(/\s*([+\-*/()])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
  const simple = expr.match(/^([a-z_][a-z0-9_]*) \/ ([a-z_][a-z0-9_]*)$/);
  if (simple) return { ok: true, typeParams: { numerator: simple[1], denominator: simple[2] }, expr };
  return { ok: true, typeParams: { expr }, expr, refs: [...resolvedNames] };
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      xlsx: { type: "string", default: expandDefault() },
      out: { type: "string", default: "imports" },
      company: { type: "string", default: "外部企业" },
      "template-id": { type: "string", default: "imported-dictionary" }
    }
  });
  function expandDefault() { return ""; }
  const templateId = args["template-id"];

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(args.xlsx));
  const ws = wb.worksheets[0];
  const rows = [];
  ws.eachRow((row, n) => { if (n > 1 && present(row, COL.name)) rows.push(row); });

  const usedNames = new Set();
  const records = rows.map((row) => {
    const code = cell(row, COL.code);
    return {
      row,
      name: machineName(code, usedNames),
      rawCode: code,
      displayName: cell(row, COL.name),
      alias: cell(row, COL.alias),
      category: present(row, COL.category),
      tier: present(row, COL.tier),
      theme: present(row, COL.theme),
      caliber: present(row, COL.caliber),
      definition: present(row, COL.definition),
      formula: present(row, COL.formula),
      dimensionsRaw: present(row, COL.dimensions),
      dept: present(row, COL.dept)
    };
  });

  // 中文名/别称 → 机器名（别称撞名则放弃该别称）
  const displayIndex = new Map();
  for (const r of records) displayIndex.set(r.displayName, r.name);
  for (const r of records) {
    if (r.alias && !displayIndex.has(r.alias.trim())) displayIndex.set(r.alias.trim(), r.name);
  }

  const stats = {
    total: records.length,
    noDefNoCaliber: 0, formulaTotal: 0, formulaTranslated: 0,
    formulaUnresolvedSamples: [], unresolvedTermFreq: new Map(),
    dimsRegistered: 0, deptFilled: 0, tierFilled: 0, themeFilled: 0,
    garbageCodes: [], aliasCount: 0
  };

  const templateDimensions = new Set();
  const metrics = [];
  for (const r of records) {
    const def = r.caliber && r.definition ? `${r.caliber}\n【指标定义】${r.definition}` : (r.caliber || r.definition);
    if (!def) stats.noDefNoCaliber++;
    let type;
    if (r.category === "原子指标") type = "simple";
    else if (r.category === "派生指标") type = "derived";
    else type = "derived"; // 复合/未分类：无公式时归 derived，有公式再按形态判 ratio
    let typeParams;
    let definition = def || "未登记";
    if (r.formula) {
      stats.formulaTotal++;
      const t = translateFormula(r.formula, displayIndex);
      if (t.ok) {
        stats.formulaTranslated++;
        typeParams = t.typeParams;
        if (t.typeParams.numerator) type = "ratio";
      } else {
        for (const u of t.unresolved) stats.unresolvedTermFreq.set(u, (stats.unresolvedTermFreq.get(u) || 0) + 1);
        if (stats.formulaUnresolvedSamples.length < 15) stats.formulaUnresolvedSamples.push(`${r.displayName}: ${r.formula}`);
        // 公式原文保留进口径，但不掩盖「未登记」的审计信号
        if (def) definition = `${definition}\n【计算公式（未能机翻）】${r.formula}`;
      }
    }
    const dims = normalizeDimensions(r.dimensionsRaw);
    if (dims.length > 0) stats.dimsRegistered++;
    if (r.dept) stats.deptFilled++;
    if (r.tier) stats.tierFilled++;
    if (r.theme) stats.themeFilled++;
    if (r.alias) stats.aliasCount++;
    for (const d of dims) templateDimensions.add(d);
    if (/^[0-9./|\\-]+$/.test(r.rawCode) && !/^\d+$/.test(r.rawCode) && r.rawCode !== "") stats.garbageCodes.push(`${r.displayName}(${r.rawCode})`);

    metrics.push({
      name: r.name,
      display_name: r.displayName,
      type,
      definition,
      dimensions: dims,
      time_grains: ["day", "month"],
      owner_role: r.dept || "未指定",
      caliber_switches: {},
      ...(typeParams ? { type_params: typeParams } : {}),
      provenance: { origin: "manual", note: `导入自${args.company}BI指标字典导出（2026-09-29）` },
      review: { required: false }
    });
  }

  // 树：仅用已挂主题的指标建（未挂主题 → 审计孤儿告警，对应其治理缺口）
  const themeOrder = [];
  const themeGroups = new Map();
  for (const r of records) {
    if (!r.theme) continue;
    if (!themeGroups.has(r.theme)) { themeGroups.set(r.theme, []); themeOrder.push(r.theme); }
    themeGroups.get(r.theme).push(r.name);
  }
  const gmv = records.find((r) => r.displayName === "GMV");
  const trees = themeOrder.map((theme) => ({ id: theme, children: themeGroups.get(theme) }));

  const template = {
    template: {
      id: templateId,
      industry: "外部导入字典",
      business_models: ["导入语料"],
      version: "0.1.0",
      references: [`${args.company}BI平台指标字典 xlsx 导出（${records.length} 指标，仅本地审计用，勿提交公开仓库）`]
    },
    matching: { revenue_models: ["导入语料"], user_structure: ["导入语料"], core_loops: ["导入语料"] },
    north_star: gmv
      ? { candidates: [{ metric: gmv.name, rationale: "导入字典中 T1 战略层首位指标（零售管理域）" }], decision_guide: "导入语料仅为审计载体，北极星为占位" }
      : { candidates: [{ metric: metrics[0].name, rationale: "占位" }], decision_guide: "占位" },
    trees,
    dimensions: [...templateDimensions].sort(),
    metrics
  };

  const instance = {
    instance: { created_at: "2026-09-29", company: args.company },
    base: `${templateId}@0.1.0`,
    answers: { revenue_model: "混合", user_structure: "2C", core_loop: "交易", caliber: {} },
    caliber_switches: {}, added: [], removed: [], modified: []
  };

  const outDir = resolve(args.out);
  const tplDir = join(outDir, "templates");
  await mkdir(tplDir, { recursive: true });
  const tplHeader = `# 外部指标字典导入语料（真实企业数据，已 gitignore，禁止提交公开仓库）\n# 机器名=指标编码；口径=业务口径优先；time_grains 为转换器默认值（字典无此字段）\n`;
  const instHeader = `# 外部字典审计实例：base=${instance.base}，全量指标在基模板中，无本地 patch\n`;
  await writeFile(join(tplDir, `${templateId}.yaml`), tplHeader + stringifyYaml(template));
  await writeFile(join(outDir, "instance.yaml"), instHeader + stringifyYaml(instance));

  // 导入报告
  const freq = [...stats.unresolvedTermFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const report = `# 导入报告 · ${args.company}指标字典

- 源文件：${args.xlsx}
- 指标总数：${stats.total}（机器名由指标编码归一化生成）
- 口径缺失（业务口径与指标定义均空）：${stats.noDefNoCaliber} → definition=「未登记」，audit 将报 incomplete-caliber
- 计算公式：${stats.formulaTotal} 条，机翻成功 ${stats.formulaTranslated} 条（token 全量命中登记指标名）
- 公式未命中词 TOP：${freq.map(([k, v]) => `${k}(${v})`).join("、") || "无"}
- 维度已登记：${stats.dimsRegistered}；主责部门已填：${stats.deptFilled}；层级已标：${stats.tierFilled}；主题已挂：${stats.themeFilled}
- 垃圾编码：${stats.garbageCodes.join("、") || "无"}
- 树：${trees.length} 棵（仅含已挂主题指标；未挂主题 ${stats.total - stats.themeFilled} 个将成为 audit 孤儿告警）
- 模板维度全集：${template.dimensions.length} 个

## 公式未机翻样本
${stats.formulaUnresolvedSamples.map((s) => "- " + s).join("\n") || "无"}

## 运行方式
\`\`\`bash
node dist/cli.js validate ${join(outDir, "instance.yaml")} -t ${tplDir}
node dist/cli.js audit ${join(outDir, "instance.yaml")} -t ${tplDir} --json
\`\`\`
`;
  await writeFile(join(outDir, "import-report.md"), report);

  console.log(report);
}

main().catch((e) => { console.error(e); process.exit(1); });
