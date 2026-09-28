import { existsSync } from "node:fs";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { select, confirm } from "@inquirer/prompts";
import { loadTemplate } from "../engine/loader.js";
import { lintTemplate } from "../engine/lint.js";
import { matchTemplates } from "../engine/match.js";
import { buildInstance } from "../engine/instantiate.js";
import { AnswersSchema } from "../schema/answers.js";
import { InstanceSchema } from "../schema/instance.js";
import { loadInstance } from "../engine/loader.js";
import { materialize } from "../engine/materialize.js";
import { validateInstance } from "../engine/validate.js";
import { metricflowExporter } from "../export/metricflow.js";
import { excelExporter } from "../export/excel.js";
import { mermaidExporter } from "../export/mermaid.js";
import { ExportBlockedError } from "../export/gate.js";
import type { Exporter } from "../export/types.js";
import type { Template } from "../schema/template.js";
import type { Answers } from "../schema/answers.js";

const exporters: Record<string, Exporter> = {
  metricflow: metricflowExporter,
  excel: excelExporter,
  mermaid: mermaidExporter
};

const program = new Command();

function defaultTemplatesDir(): string {
  // 兼容 dist 布局（dist/cli.js → ../templates）与 src 布局（src/cli/index.ts → ../../templates）
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [resolve(here, "../templates"), resolve(here, "../../templates")];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0]!;
}

async function loadAnswers(path: string): Promise<Answers> {
  const raw = await readFile(path, "utf8");
  const parsed = AnswersSchema.safeParse(parseYaml(raw));
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      console.error(`ERROR [answers] ${path} ${i.path.join(".")}: ${i.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

async function discoverTemplates(dir: string): Promise<Template[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (e) {
    console.error(`ERROR 无法读取模板目录 ${dir}：${(e as Error).message}`);
    process.exit(1);
  }
  const templates: Template[] = [];
  for (const f of entries.filter((n) => n.endsWith(".yaml")).sort()) {
    const loaded = await loadTemplate(join(dir, f));
    if (!loaded.ok) {
      for (const e of loaded.errors) {
        console.error(`ERROR [template] ${join(dir, f)} ${e.path}: ${e.message}`);
      }
      process.exit(1);
    }
    templates.push(loaded.template);
  }
  if (templates.length === 0) {
    console.error(`ERROR 模板目录 ${dir} 中没有可用的 .yaml 模板`);
    process.exit(1);
  }
  return templates;
}

// 交互口径问卷：对模板中出现的去重口径开关逐个确认取值，再展开为按指标的覆盖值
async function askCaliberInteractively(template: Template): Promise<Record<string, Record<string, boolean>>> {
  const switchDefaults = new Map<string, boolean>();
  for (const m of template.metrics) {
    for (const [k, v] of Object.entries(m.caliber_switches)) {
      if (!switchDefaults.has(k)) switchDefaults.set(k, v);
    }
  }
  // 直接询问取值（默认 = 模板默认），确认结果即开关取值，避免「保持默认？」带来的语义反转
  const global: Record<string, boolean> = {};
  for (const [key, def] of switchDefaults) {
    global[key] = await confirm({
      message: `口径开关 ${key} 是否启用？（模板默认：${def ? "启用" : "关闭"}）`,
      default: def
    });
  }
  const perMetric: Record<string, Record<string, boolean>> = {};
  for (const m of template.metrics) {
    for (const k of Object.keys(m.caliber_switches)) {
      if (global[k] === undefined) continue;
      (perMetric[m.name] ??= {})[k] = global[k];
    }
  }
  return perMetric;
}

async function interactiveAnswers(): Promise<Answers> {
  const revenue_model = await select({
    message: "收入模式",
    choices: (["交易抽佣", "订阅", "广告", "服务费", "混合"] as const).map((value) => ({ value }))
  });
  const user_structure = await select({
    message: "用户结构",
    choices: (["2C", "2B", "双边市场"] as const).map((value) => ({ value }))
  });
  const core_loop = await select({
    message: "核心循环",
    choices: (["交易", "内容消费", "创作消费", "协作"] as const).map((value) => ({ value }))
  });
  return { revenue_model, user_structure, core_loop, caliber: {} };
}

program
  .name("metric-factory")
  .description("指标体系设计态工具：业务目标 → 指标树 + 指标字典")
  .version("0.1.0");

program
  .command("init")
  .description("问卷向导：匹配行业模板并生成企业指标实例")
  .option("-a, --answers <path>", "非交互模式：问卷答案 YAML 文件")
  .option("-t, --templates <dir>", "行业模板目录", defaultTemplatesDir())
  .option("-o, --out <dir>", "实例输出目录", ".")
  .action(async (opts: { answers?: string; templates: string; out: string }) => {
    const templates = await discoverTemplates(opts.templates);

    let answers: Answers;
    let caliberFromInteractive = false;
    if (opts.answers) {
      answers = await loadAnswers(opts.answers);
    } else if (process.stdin.isTTY) {
      answers = await interactiveAnswers();
      caliberFromInteractive = true;
    } else {
      console.error("ERROR 非交互环境必须提供 --answers <file>（或分配 TTY 进入交互向导）");
      process.exit(1);
    }

    const match = matchTemplates(answers, templates);
    const chosen = templates.find((t) => t.template.id === match.best.templateId)!;

    // 交互模式在选定模板后追问口径；非交互模式口径来自 answers 文件
    if (caliberFromInteractive) {
      answers = { ...answers, caliber: await askCaliberInteractively(chosen) };
    }

    // 口径目标存在性检查：answers 指向的指标必须存在于选中模板（写盘前拦截，不留坏实例）
    const chosenMetricNames = new Set(chosen.metrics.map((m) => m.name));
    const badTargets = Object.keys(answers.caliber).filter((n) => !chosenMetricNames.has(n));
    if (badTargets.length > 0) {
      for (const n of badTargets) {
        console.error(`ERROR [caliber-target] answers.caliber.${n}：口径开关目标不存在于模板 ${chosen.template.id}（可选指标见模板 metrics）`);
      }
      process.exit(1);
    }

    const instance = buildInstance(chosen, answers, new Date().toISOString());
    const validated = InstanceSchema.safeParse(instance);
    if (!validated.success) {
      for (const i of validated.error.issues) {
        console.error(`ERROR [instance] ${i.path.join(".")}: ${i.message}`);
      }
      process.exit(1);
    }

    await mkdir(opts.out, { recursive: true });
    const outPath = join(opts.out, "instance.yaml");
    const header = `# Metric Factory 企业实例（fork 自 ${instance.base}）\n# 微调方式：编辑 caliber_switches / added / removed / modified，用 validate 校验、diff 查看变更\n`;
    await writeFile(outPath, header + stringifyYaml(validated.data), "utf8");

    console.log(`已选择模板：${match.best.templateId}（匹配 ${match.best.score}/3）`);
    for (const r of match.best.reasons) console.log(`  - ${r}`);
    console.log(`实例已写入：${outPath}`);
  });

program
  .command("lint")
  .description("校验行业模板（口径必填、维度引用完整、出处存在）")
  .argument("<paths...>", "模板 YAML 文件路径（可多个）")
  .action(async (paths: string[]) => {
    let failed = false;
    for (const path of paths) {
      const loaded = await loadTemplate(path);
      if (!loaded.ok) {
        for (const e of loaded.errors) {
          console.error(`ERROR [schema] ${path} ${e.path}: ${e.message}`);
        }
        failed = true;
        continue;
      }
      const issues = lintTemplate(loaded.template);
      if (issues.length > 0) {
        for (const i of issues) {
          console.error(`ERROR [${i.rule}] ${path} ${i.path}: ${i.message}`);
        }
        failed = true;
        continue;
      }
      console.log(`PASS ${path}（${loaded.template.metrics.length} 个指标）`);
    }
    if (failed) process.exitCode = 1;
  });

program
  .command("validate")
  .description("校验企业实例（含相对模板的修改部分）")
  .argument("<instance>", "实例 YAML 文件路径")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .action(async (instancePath: string, opts: { templates: string }) => {
    const loaded = await loadInstance(instancePath);
    if (!loaded.ok) {
      for (const e of loaded.errors) {
        console.error(`ERROR [schema] ${instancePath} ${e.path}: ${e.message}`);
      }
      process.exitCode = 1;
      return;
    }

    const templates = await discoverTemplates(opts.templates);
    const baseId = loaded.instance.base.split("@")[0]!;
    const base = templates.find((t) => t.template.id === baseId);
    if (!base) {
      console.error(`ERROR 找不到基模板 ${loaded.instance.base}（目录：${opts.templates}）`);
      process.exitCode = 1;
      return;
    }

    const materialized = materialize(base, loaded.instance);
    const issues = validateInstance(materialized, base, loaded.instance);
    if (issues.length > 0) {
      for (const i of issues) {
        console.error(`ERROR [${i.rule}] ${instancePath} ${i.path}: ${i.message}`);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`PASS ${instancePath}（${materialized.metrics.length} 个指标，基模板 ${loaded.instance.base}）`);
  });

program
  .command("diff")
  .description("输出实例相对基模板的结构化差异")
  .argument("<instance>", "实例 YAML 文件路径")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .option("--json", "以 JSON 输出")
  .action(async (instancePath: string, opts: { templates: string; json?: boolean }) => {
    const loaded = await loadInstance(instancePath);
    if (!loaded.ok) {
      for (const e of loaded.errors) {
        console.error(`ERROR [schema] ${instancePath} ${e.path}: ${e.message}`);
      }
      process.exitCode = 1;
      return;
    }

    const templates = await discoverTemplates(opts.templates);
    const baseId = loaded.instance.base.split("@")[0]!;
    const base = templates.find((t) => t.template.id === baseId);
    if (!base) {
      console.error(`ERROR 找不到基模板 ${loaded.instance.base}（目录：${opts.templates}）`);
      process.exitCode = 1;
      return;
    }

    const materialized = materialize(base, loaded.instance);
    const d = materialized.diff;

    if (opts.json) {
      const payload = {
        base: materialized.base,
        removed: d.removed,
        modified: d.modified,
        added: d.added.map((m) => ({
          name: m.name,
          display_name: m.display_name,
          provenance: m.provenance
        })),
        caliber: d.caliber
      };
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log(`基模板：${materialized.base}`);
    console.log(`\n【口径调整】${d.caliber.length ? "" : "（无）"}`);
    for (const c of d.caliber) console.log(`  ${c.metric}.${c.key}: ${c.from} → ${c.to}`);
    console.log(`\n【字段修改】${d.modified.length ? "" : "（无）"}`);
    for (const m of d.modified) console.log(`  ${m.name}（${m.fields.join("、")}）`);
    console.log(`\n【删除指标】${d.removed.length ? "" : "（无）"}`);
    for (const name of d.removed) console.log(`  ${name}`);
    console.log(`\n【新增指标】${d.added.length ? "" : "（无）"}`);
    for (const m of d.added) console.log(`  ${m.name}（${m.display_name}）`);
  });

program
  .command("export")
  .description("导出实例：--format metricflow | excel | mermaid")
  .argument("<instance>", "实例 YAML 文件路径")
  .option("-f, --format <format>", "导出格式", "metricflow")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .option("-o, --out <dir>", "导出输出目录", ".")
  .action(async (instancePath: string, opts: { format: string; templates: string; out: string }) => {
    const exporter = exporters[opts.format];
    if (!exporter) {
      console.error(`ERROR 不支持的导出格式 "${opts.format}"（可选：${Object.keys(exporters).join(" | ")}）`);
      process.exit(1);
    }

    const loaded = await loadInstance(instancePath);
    if (!loaded.ok) {
      for (const e of loaded.errors) {
        console.error(`ERROR [instance] ${instancePath} ${e.path}: ${e.message}`);
      }
      process.exit(1);
    }

    const templates = await discoverTemplates(opts.templates);
    const baseId = loaded.instance.base.split("@")[0]!;
    const base = templates.find((t) => t.template.id === baseId);
    if (!base) {
      console.error(`ERROR 找不到基模板 ${loaded.instance.base}（目录：${opts.templates}）`);
      process.exit(1);
    }

    const materialized = materialize(base, loaded.instance);

    // 导出前全量校验（fail-closed 门之外的第二道门：坏实例不导出，PRD story 7）
    const issues = validateInstance(materialized, base, loaded.instance);
    if (issues.length > 0) {
      for (const i of issues) {
        console.error(`ERROR [${i.rule}] ${instancePath} ${i.path}: ${i.message}`);
      }
      process.exit(1);
    }

    try {
      const result = await exporter.export(materialized);
      await mkdir(opts.out, { recursive: true });
      const outPath = join(opts.out, result.filename);
      await writeFile(outPath, result.content);
      console.log(`已导出：${outPath}（${materialized.metrics.length} 个指标，格式 ${opts.format}）`);
    } catch (e) {
      if (e instanceof ExportBlockedError) {
        console.error(`ERROR ${e.message}`);
        process.exit(1);
      }
      throw e;
    }
  });

program.parse();
