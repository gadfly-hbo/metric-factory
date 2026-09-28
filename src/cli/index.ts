import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Command } from "commander";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { select, confirm } from "@inquirer/prompts";
import { loadTemplate } from "../engine/loader.js";
import { lintTemplate } from "../engine/lint.js";
import { matchTemplates } from "../engine/match.js";
import { buildInstance } from "../engine/instantiate.js";
import { AnswersSchema } from "../schema/answers.js";
import { InstanceSchema } from "../schema/instance.js";
import { defaultTemplatesDir } from "../paths.js";
import { loadInstance } from "../engine/loader.js";
import { materialize } from "../engine/materialize.js";
import { validateInstance } from "../engine/validate.js";
import { findPendingReview, applyApproval, applyRejection } from "../engine/review.js";
import { auditInstance } from "../engine/audit.js";
import { buildGeneratePrompt, buildRefinePrompt } from "../llm/prompt.js";
import { estimateTokens } from "../llm/tokens.js";
import { createLlmClientFromEnv } from "../llm/index.js";
import { generateDraft, generateRefineDraft } from "../engine/generate.js";
import { applyDraft } from "../engine/apply.js";
import { DraftSchema } from "../schema/draft.js";
import type { Instance } from "../schema/instance.js";
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
  .command("generate")
  .description("LLM 在基模板锚定下生成候选指标草案（需先 init 出实例）")
  .argument("<instance>", "实例 YAML 文件路径")
  .requiredOption("-d, --describe <text>", "业务描述（自然语言）")
  .option("--dry-run", "只打印完整 prompt 与 token 估算，不调用模型")
  .option("--out <path>", "草案输出路径", "draft.yaml")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .action(async (instancePath: string, opts: { describe: string; dryRun?: boolean; out: string; templates: string }) => {
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

    const prompt = buildGeneratePrompt(base, loaded.instance, opts.describe);

    if (opts.dryRun) {
      const sysTokens = estimateTokens(prompt.system);
      const userTokens = estimateTokens(prompt.user);
      console.log("===== system =====");
      console.log(prompt.system);
      console.log("===== user =====");
      console.log(prompt.user);
      console.log("===== token 估算 =====");
      console.log(`system ≈ ${sysTokens}，user ≈ ${userTokens}，合计 ≈ ${sysTokens + userTokens}（粗估：CJK 1 token/字，其余 4 字符/token）`);
      return;
    }

    let client;
    try {
      client = createLlmClientFromEnv();
    } catch (e) {
      console.error(`ERROR ${(e as Error).message}`);
      console.error("提示：先用 --dry-run 评估 prompt；测试/演示可用 MF_LLM_BACKEND=faux");
      process.exit(1);
    }

    const modelLabel = process.env.MF_LLM_MODEL ?? (process.env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
    const result = await generateDraft(client, prompt, opts.describe, modelLabel, new Date().toISOString());
    if (!result.ok) {
      console.error(`ERROR 生成失败（阶段：${result.stage}），模型输出整批拒绝，未写入任何文件`);
      if (result.issues) {
        for (const i of result.issues) console.error(`  - ${i}`);
      }
      console.error("===== 模型原始输出 =====");
      console.error(result.raw);
      process.exit(1);
    }

    await writeFile(opts.out, stringifyYaml(result.draft), "utf8");
    console.log(`草案已写入：${opts.out}（新增 ${result.draft.added.length} 个候选指标，全部待人工审核）`);
    for (const m of result.draft.added) {
      console.log(`  - ${m.name}（${m.display_name}）：${m.definition}`);
    }
    console.log("下一步：metric-factory apply <instance> <draft> 合入，然后 review 逐条审核");
  });

program
  .command("apply")
  .description("把 LLM 草案合入实例（validate 全过才写盘，fail-closed）")
  .argument("<instance>", "实例 YAML 文件路径")
  .argument("<draft>", "草案 YAML/JSON 文件路径")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .action(async (instancePath: string, draftPath: string, opts: { templates: string }) => {
    const loaded = await loadInstance(instancePath);
    if (!loaded.ok) {
      for (const e of loaded.errors) {
        console.error(`ERROR [schema] ${instancePath} ${e.path}: ${e.message}`);
      }
      process.exitCode = 1;
      return;
    }

    let draftDoc: unknown;
    try {
      draftDoc = parseYaml(await readFile(draftPath, "utf8"));
    } catch (e) {
      console.error(`ERROR 无法读取或解析草案 ${draftPath}：${(e as Error).message}`);
      process.exit(1);
    }
    const draftParsed = DraftSchema.safeParse(draftDoc);
    if (!draftParsed.success) {
      for (const i of draftParsed.error.issues) {
        console.error(`ERROR [draft] ${draftPath} ${i.path.join(".")}: ${i.message}`);
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

    const applied = applyDraft(loaded.instance, draftParsed.data, base);
    if (!applied.ok) {
      for (const e of applied.errors) {
        console.error(`ERROR [${e.rule}] ${draftPath}: ${e.message}`);
      }
      console.error("草案未合入（零写盘）");
      process.exit(1);
    }

    // 合入后全量校验（跳过审核门：新 LLM 指标必然待审，执法点在 export）；不过不落盘
    const materialized = materialize(base, applied.instance);
    const issues = validateInstance(materialized, base, applied.instance, { skipReviewGate: true });
    if (issues.length > 0) {
      for (const i of issues) {
        console.error(`ERROR [${i.rule}] ${instancePath} ${i.path}: ${i.message}`);
      }
      console.error("草案合入后校验不通过（零写盘）");
      process.exit(1);
    }

    await writeInstanceFile(instancePath, applied.instance);
    console.log(
      `已合入：新增 ${draftParsed.data.added.length}、修改 ${draftParsed.data.modified.length}、删除 ${draftParsed.data.removed.length}、口径 ${Object.keys(draftParsed.data.caliber).length} 项`
    );
    if (draftParsed.data.added.length > 0) {
      console.log("LLM 新增指标待审核：metric-factory review <instance>");
    }
  });

program
  .command("refine")
  .description("LLM 对既有实例产出微调草案（caliber/modified/removed/added）")
  .argument("<instance>", "实例 YAML 文件路径")
  .requiredOption("-i, --instruction <text>", "微调指令（自然语言）")
  .option("--dry-run", "只打印完整 prompt 与 token 估算，不调用模型")
  .option("--out <path>", "草案输出路径", "draft.yaml")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .action(async (instancePath: string, opts: { instruction: string; dryRun?: boolean; out: string; templates: string }) => {
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

    const prompt = buildRefinePrompt(base, loaded.instance, opts.instruction);

    if (opts.dryRun) {
      const sysTokens = estimateTokens(prompt.system);
      const userTokens = estimateTokens(prompt.user);
      console.log("===== system =====");
      console.log(prompt.system);
      console.log("===== user =====");
      console.log(prompt.user);
      console.log("===== token 估算 =====");
      console.log(`system ≈ ${sysTokens}，user ≈ ${userTokens}，合计 ≈ ${sysTokens + userTokens}（粗估：CJK 1 token/字，其余 4 字符/token）`);
      return;
    }

    let client;
    try {
      client = createLlmClientFromEnv();
    } catch (e) {
      console.error(`ERROR ${(e as Error).message}`);
      console.error("提示：先用 --dry-run 评估 prompt；测试/演示可用 MF_LLM_BACKEND=faux");
      process.exit(1);
    }

    const modelLabel = process.env.MF_LLM_MODEL ?? (process.env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
    const result = await generateRefineDraft(client, prompt, opts.instruction, modelLabel, new Date().toISOString());
    if (!result.ok) {
      console.error(`ERROR 微调草案生成失败（阶段：${result.stage}），模型输出整批拒绝，未写入任何文件`);
      if (result.issues) {
        for (const i of result.issues) console.error(`  - ${i}`);
      }
      console.error("===== 模型原始输出 =====");
      console.error(result.raw);
      process.exit(1);
    }

    await writeFile(opts.out, stringifyYaml(result.draft), "utf8");
    const d = result.draft;
    console.log(
      `草案已写入：${opts.out}（新增 ${d.added.length}、修改 ${d.modified.length}、删除 ${d.removed.length}、口径 ${Object.keys(d.caliber).length} 项）`
    );
    for (const m of d.added) {
      console.log(`  - 新增 ${m.name}（${m.display_name}）：${m.definition}`);
    }
    console.log("下一步：metric-factory apply <instance> <draft> 合入；LLM 新增需 review 审核后才能导出");
  });

program
  .command("audit")
  .description("审计实例：口径完整性 / 虚荣指标 / 归口 / 孤儿指标")
  .argument("<instance>", "实例 YAML 文件路径")
  .option("-t, --templates <dir>", "行业模板目录（用于解析实例的基模板）", defaultTemplatesDir())
  .option("--json", "以 JSON 输出结构化结果")
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
    const findings = auditInstance(materialized, base, loaded.instance);

    if (opts.json) {
      console.log(JSON.stringify({ findings }, null, 2));
    } else if (findings.length === 0) {
      console.log(`PASS ${instancePath}（${materialized.metrics.length} 个指标，审计无发现）`);
    } else {
      for (const f of findings) {
        console.log(`${f.severity} [${f.rule}] ${f.metric}：${f.message}`);
      }
      const errors = findings.filter((f) => f.severity === "ERROR").length;
      console.log(`\n共 ${findings.length} 项发现（ERROR ${errors}，WARN ${findings.length - errors}）`);
    }
    if (findings.some((f) => f.severity === "ERROR")) {
      process.exitCode = 1;
    }
  });

program
  .command("mcp")
  .description("以 MCP stdio server 暴露 generate/audit/refine/validate/diff/export 工具")
  .action(async () => {
    const { buildMcpServer } = await import("../mcp/server.js");
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const server = buildMcpServer();
    await server.connect(new StdioServerTransport());
  });

program
  .command("review")
  .description("人工审核 LLM 生成指标：批准写 reviewed_by，拒绝则移除")
  .argument("<instance>", "实例 YAML 文件路径")
  .option("--approve <name>", "非交互：批准指定指标")
  .option("--reject <name>", "非交互：拒绝（移除）指定指标")
  .option("--reviewer <name>", "审核人（默认 MF_REVIEWER 或系统用户名）")
  .action(async (instancePath: string, opts: { approve?: string; reject?: string; reviewer?: string }) => {
    const loaded = await loadInstance(instancePath);
    if (!loaded.ok) {
      for (const e of loaded.errors) {
        console.error(`ERROR [schema] ${instancePath} ${e.path}: ${e.message}`);
      }
      process.exitCode = 1;
      return;
    }
    const inst = loaded.instance;
    const pending = findPendingReview(inst.added);

    const reviewer = opts.reviewer ?? process.env.MF_REVIEWER ?? process.env.USER ?? "unknown";

    if (opts.approve || opts.reject) {
      const name = opts.approve ?? opts.reject!;
      const target = findPendingReview(inst.added).find((m) => m.name === name);
      if (!target) {
        const exists = inst.added.some((m) => m.name === name);
        console.error(
          exists
            ? `ERROR ${name} 不在待审列表（已审核过或非 LLM 指标，拒绝改写既有审核记录）`
            : `ERROR 待审指标不存在：${name}（用无参数 review 查看待审清单）`
        );
        process.exitCode = 1;
        return;
      }
      const updated = opts.approve ? applyApproval(inst, name, reviewer) : applyRejection(inst, name);
      await writeInstanceFile(instancePath, updated);
      console.log(opts.approve ? `已批准 ${name}（审核人：${reviewer}）` : `已拒绝并移除 ${name}`);
      return;
    }

    if (pending.length === 0) {
      console.log("无待审指标（全部已审核或无 LLM 生成指标）");
      return;
    }

    console.log(`待审指标 ${pending.length} 个（origin=llm 且未审核）：`);
    for (const m of pending) {
      console.log(`  - ${m.name}（${m.display_name}）：${m.definition}`);
      console.log(`    出处：LLM 生成（${m.provenance.model}，prompt ${m.provenance.prompt_version}）`);
    }

    if (process.stdin.isTTY) {
      const { select } = await import("@inquirer/prompts");
      let current = inst;
      for (const m of pending) {
        const action = await select({
          message: `指标 ${m.name}（${m.display_name}）`,
          choices: [
            { value: "approve" },
            { value: "reject" },
            { value: "skip" }
          ]
        });
        if (action === "approve") {
          current = applyApproval(current, m.name, reviewer);
          console.log(`已批准 ${m.name}（审核人：${reviewer}）`);
        } else if (action === "reject") {
          current = applyRejection(current, m.name);
          console.log(`已拒绝并移除 ${m.name}`);
        }
      }
      await writeInstanceFile(instancePath, current);
    } else {
      console.log("\n非交互环境：使用 --approve <name> / --reject <name> 处理上述指标");
    }
  });

async function writeInstanceFile(path: string, inst: Instance): Promise<void> {
  const header = `# Metric Factory 企业实例（fork 自 ${inst.base}）\n`;
  await writeFile(path, header + stringifyYaml(inst), "utf8");
}

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
