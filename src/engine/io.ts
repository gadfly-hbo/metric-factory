import { readFile, writeFile } from "node:fs/promises";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Instance } from "../schema/instance.js";
import { MappingSchema, type Mapping } from "../schema/mapping.js";

export function defaultMappingPath(instancePath: string): string {
  return instancePath.replace(/\.yaml$/, ".mapping.yaml");
}

// 映射文件装载共享核（F6）：result 风格；required/静默空策略归调用方
export type MappingFileResult =
  | { ok: true; mapping: Mapping }
  | { ok: false; kind: "read"; message: string }
  | { ok: false; kind: "invalid"; issues: { path: string; message: string }[] };

export async function loadMappingFile(path: string): Promise<MappingFileResult> {
  let doc: unknown;
  try {
    doc = parseYaml(await readFile(path, "utf8"));
  } catch (e) {
    return { ok: false, kind: "read", message: (e as Error).message };
  }
  const parsed = MappingSchema.safeParse(doc);
  if (!parsed.success) {
    return {
      ok: false,
      kind: "invalid",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    };
  }
  return { ok: true, mapping: parsed.data };
}

export async function writeInstanceFile(path: string, inst: Instance): Promise<void> {
  const header = `# Metric Factory 企业实例${inst.base ? `（fork 自 ${inst.base}）` : "（blank 基座，无行业模板）"}\n`;
  await writeFile(path, header + stringifyYaml(inst), "utf8");
}
