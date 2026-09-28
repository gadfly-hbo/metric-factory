import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolve } from "node:path";
import { defaultTemplatesDir } from "../paths.js";
import { loadInstance, loadTemplate } from "../engine/loader.js";
import { materialize } from "../engine/materialize.js";
import { validateInstance } from "../engine/validate.js";
import { auditInstance } from "../engine/audit.js";
import { buildGeneratePrompt, buildRefinePrompt } from "../llm/prompt.js";
import { createLlmClientFromEnv, estimateTokens } from "../llm/index.js";
import { generateDraft, generateRefineDraft } from "../engine/generate.js";
import { metricflowExporter } from "../export/metricflow.js";
import { excelExporter } from "../export/excel.js";
import { mermaidExporter } from "../export/mermaid.js";
import type { Template } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";



const exporters = {
  metricflow: metricflowExporter,
  excel: excelExporter,
  mermaid: mermaidExporter
} as const;

// MCP 语义（GRILL 决议 #6）：工具一律返回草案/结果 JSON，不写盘——人审由 agent 会话呈现给用户，落盘走 CLI apply/review
export function buildMcpServer(): McpServer {
  const server = new McpServer({ name: "metric-factory", version: "0.2.0" });
  const templatesDir = defaultTemplatesDir();

  async function loadContext(instancePath: string): Promise<{ instance: Instance; base: Template }> {
    const loaded = await loadInstance(instancePath);
    if (!loaded.ok) {
      throw new Error(`实例加载失败：${loaded.errors.map((e) => `${e.path}: ${e.message}`).join("；")}`);
    }
    const baseId = loaded.instance.base.split("@")[0]!;
    const base = await loadTemplate(resolve(templatesDir, `${baseId}.yaml`));
    if (!base.ok) {
      throw new Error(`找不到基模板 ${loaded.instance.base}（目录：${templatesDir}）`);
    }
    return { instance: loaded.instance, base: base.template };
  }

  server.registerTool(
    "mf_generate",
    {
      description: "在实例的基模板锚定下生成候选指标草案（返回 draft JSON，不写盘；需人工审核后经 CLI apply 合入）",
      inputSchema: {
        instancePath: z.string().describe("实例 YAML 路径"),
        describe: z.string().describe("业务描述（自然语言）"),
        dryRun: z.boolean().optional().describe("只返回 prompt 预览与 token 估算，不调用模型")
      }
    },
    async ({ instancePath, describe, dryRun }) => {
      const { instance, base } = await loadContext(instancePath);
      const prompt = buildGeneratePrompt(base, instance, describe);
      if (dryRun) {
        return text({
          dryRun: true,
          system: prompt.system,
          user: prompt.user,
          estimatedTokens: estimateTokens(prompt.system) + estimateTokens(prompt.user)
        });
      }
      const client = createLlmClientFromEnv();
      const modelLabel = process.env.MF_LLM_MODEL ?? (process.env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
      const result = await generateDraft(client, prompt, describe, modelLabel, new Date().toISOString());
      if (!result.ok) {
        throw new Error(`生成失败（阶段 ${result.stage}），模型输出整批拒绝；可先 dryRun=true 评估 prompt。原始输出：${result.raw.slice(0, 2000)}`);
      }
      return text({ draft: result.draft, note: "LLM 新增指标需人工审核（CLI review）后才能导出" });
    }
  );

  server.registerTool(
    "mf_refine",
    {
      description: "对既有实例产出微调草案（caliber/modified/removed/added，返回 JSON 不写盘）",
      inputSchema: {
        instancePath: z.string(),
        instruction: z.string().describe("微调指令（自然语言）"),
        dryRun: z.boolean().optional()
      }
    },
    async ({ instancePath, instruction, dryRun }) => {
      const { instance, base } = await loadContext(instancePath);
      const prompt = buildRefinePrompt(base, instance, instruction);
      if (dryRun) {
        return text({
          dryRun: true,
          system: prompt.system,
          user: prompt.user,
          estimatedTokens: estimateTokens(prompt.system) + estimateTokens(prompt.user)
        });
      }
      const client = createLlmClientFromEnv();
      const modelLabel = process.env.MF_LLM_MODEL ?? (process.env.MF_LLM_BACKEND === "faux" ? "fake" : "unknown");
      const result = await generateRefineDraft(client, prompt, instruction, modelLabel, new Date().toISOString());
      if (!result.ok) {
        throw new Error(`微调草案生成失败（阶段 ${result.stage}）；可先 dryRun=true。原始输出：${result.raw.slice(0, 2000)}`);
      }
      return text({ draft: result.draft, note: "草案需人工确认后经 CLI apply 合入；LLM 新增需 review" });
    }
  );

  server.registerTool(
    "mf_audit",
    {
      description: "审计实例：口径完整性 / 虚荣指标 / 归口 / 孤儿指标",
      inputSchema: { instancePath: z.string() }
    },
    async ({ instancePath }) => {
      const { instance, base } = await loadContext(instancePath);
      const materialized = materialize(base, instance);
      return text({ findings: auditInstance(materialized, base, instance) });
    }
  );

  server.registerTool(
    "mf_validate",
    {
      description: "校验实例（fail-closed 规则全集，含未审核 LLM 指标检查）",
      inputSchema: { instancePath: z.string() }
    },
    async ({ instancePath }) => {
      const { instance, base } = await loadContext(instancePath);
      const materialized = materialize(base, instance);
      const issues = validateInstance(materialized, base, instance);
      return text({ ok: issues.length === 0, issues });
    }
  );

  server.registerTool(
    "mf_diff",
    {
      description: "实例相对基模板的结构化差异（caliber/modified/removed/added）",
      inputSchema: { instancePath: z.string() }
    },
    async ({ instancePath }) => {
      const { instance, base } = await loadContext(instancePath);
      const d = materialize(base, instance).diff;
      return text({
        base: instance.base,
        removed: d.removed,
        modified: d.modified,
        added: d.added.map((m) => ({ name: m.name, display_name: m.display_name, provenance: m.provenance })),
        caliber: d.caliber
      });
    }
  );

  server.registerTool(
    "mf_export",
    {
      description: "导出实例（metricflow/excel/mermaid），返回文件内容不写盘；未审核 LLM 指标会被 fail-closed 阻断",
      inputSchema: {
        instancePath: z.string(),
        format: z.enum(["metricflow", "excel", "mermaid"])
      }
    },
    async ({ instancePath, format }) => {
      const { instance, base } = await loadContext(instancePath);
      const materialized = materialize(base, instance);
      const issues = validateInstance(materialized, base, instance);
      if (issues.length > 0) {
        throw new Error(`实例校验不通过（与 CLI export 同门）：${issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`).join("；")}`);
      }
      const exporter = exporters[format];
      const result = await exporter.export(materialized);
      const isBinary = result.content instanceof Uint8Array;
      return text({
        filename: result.filename,
        encoding: isBinary ? "base64" : "utf8",
        content: isBinary ? Buffer.from(result.content).toString("base64") : result.content
      });
    }
  );

  return server;
}

function text(payload: unknown): { content: [{ type: "text"; text: string }] } {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}
