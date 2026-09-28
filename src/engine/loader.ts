import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { TemplateSchema, type Template } from "../schema/template.js";
import { InstanceSchema, type Instance } from "../schema/instance.js";

export interface LoadError {
  path: string;
  message: string;
}

export type LoadResult =
  | { ok: true; template: Template }
  | { ok: false; errors: LoadError[] };

export type InstanceLoadResult =
  | { ok: true; instance: Instance }
  | { ok: false; errors: LoadError[] };

function formatIssues(issues: { path: PropertyKey[]; message: string }[]): LoadError[] {
  return issues.map((i) => ({
    path: i.path.length ? i.path.join(".") : "$",
    message: i.message
  }));
}

async function readYaml(path: string): Promise<unknown> {
  const raw = await readFile(path, "utf8");
  return parseYaml(raw);
}

function readFailure(path: string, e: unknown): LoadError[] {
  return [{ path: "$", message: `无法读取文件 ${path}：${(e as Error).message}` }];
}

export async function loadTemplate(path: string): Promise<LoadResult> {
  let doc: unknown;
  try {
    doc = await readYaml(path);
  } catch (e) {
    return { ok: false, errors: readFailure(path, e) };
  }

  const parsed = TemplateSchema.safeParse(doc);
  if (!parsed.success) {
    return { ok: false, errors: formatIssues(parsed.error.issues) };
  }
  return { ok: true, template: parsed.data };
}

export async function loadInstance(path: string): Promise<InstanceLoadResult> {
  let doc: unknown;
  try {
    doc = await readYaml(path);
  } catch (e) {
    return { ok: false, errors: readFailure(path, e) };
  }

  const parsed = InstanceSchema.safeParse(doc);
  if (!parsed.success) {
    return { ok: false, errors: formatIssues(parsed.error.issues) };
  }
  return { ok: true, instance: parsed.data };
}
