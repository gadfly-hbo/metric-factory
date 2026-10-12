import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
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

// 模板目录装载共享核（F6）：result 风格 + 收集全部错误不短路；错误策略（打印退出 / 转 ReleaseError）归调用方
export type TemplatesDirResult =
  | { ok: true; templates: Template[] }
  | { ok: false; kind: "read"; dir: string; message: string }
  | { ok: false; kind: "empty"; dir: string }
  | { ok: false; kind: "load"; errors: { file: string; error: LoadError }[] };

export async function loadTemplatesFromDir(dir: string): Promise<TemplatesDirResult> {
  let entries: string[];
  try {
    entries = (await readdir(dir)).filter((n) => n.endsWith(".yaml")).sort();
  } catch (e) {
    return { ok: false, kind: "read", dir, message: (e as Error).message };
  }
  if (entries.length === 0) return { ok: false, kind: "empty", dir };
  const templates: Template[] = [];
  const errors: { file: string; error: LoadError }[] = [];
  for (const f of entries) {
    const file = join(dir, f);
    const loaded = await loadTemplate(file);
    if (!loaded.ok) {
      errors.push(...loaded.errors.map((error) => ({ file, error })));
      continue;
    }
    templates.push(loaded.template);
  }
  if (errors.length > 0) return { ok: false, kind: "load", errors };
  return { ok: true, templates };
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
