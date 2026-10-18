import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { MethodTemplateSchema, type MethodTemplate } from "../schema/method.js";
import type { LoadError } from "./loader.js";
import type { LintIssue } from "./lint.js";

// A1 批次 D3：方法模板（第二类模板）的装载与 lint；result 风格与 loader/lint 对齐。

export type MethodLoadResult =
  | { ok: true; method: MethodTemplate }
  | { ok: false; errors: LoadError[] };

export type MethodsDirResult =
  | { ok: true; methods: MethodTemplate[] }
  | { ok: false; kind: "read"; dir: string; message: string }
  | { ok: false; kind: "load"; errors: { file: string; error: LoadError }[] };

export async function loadMethodTemplate(path: string): Promise<MethodLoadResult> {
  let doc: unknown;
  try {
    const raw = await readFile(path, "utf8");
    doc = parseYaml(raw);
  } catch (e) {
    return { ok: false, errors: [{ path: "$", message: `无法读取文件 ${path}：${(e as Error).message}` }] };
  }
  const parsed = MethodTemplateSchema.safeParse(doc);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({ path: i.path.length ? i.path.join(".") : "$", message: i.message }))
    };
  }
  return { ok: true, method: parsed.data };
}

// 方法目录缺省语义：目录不存在视为「无方法库」（空库合法——方法为可选增强），
// 与模板目录「不存在即错误」刻意不同：既有部署升级后不强制立刻有方法目录。
export async function loadMethodsFromDir(dir: string): Promise<MethodsDirResult> {
  let entries: string[];
  try {
    entries = (await readdir(dir)).filter((n) => n.endsWith(".yaml")).sort();
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { ok: true, methods: [] };
    return { ok: false, kind: "read", dir, message: (e as Error).message };
  }
  if (entries.length === 0) return { ok: true, methods: [] };
  const methods: MethodTemplate[] = [];
  const errors: { file: string; error: LoadError }[] = [];
  for (const f of entries) {
    const file = join(dir, f);
    const loaded = await loadMethodTemplate(file);
    if (!loaded.ok) {
      errors.push(...loaded.errors.map((error) => ({ file, error })));
      continue;
    }
    methods.push(loaded.method);
  }
  if (errors.length > 0) return { ok: false, kind: "load", errors };
  return { ok: true, methods };
}

export function lintMethodTemplate(m: MethodTemplate): LintIssue[] {
  const issues: LintIssue[] = [];
  if (m.provenance.origin === "template") {
    const expected = `${m.method.id}@${m.method.version}`;
    if (m.provenance.template_ref !== expected) {
      issues.push({
        rule: "provenance-ref",
        path: "provenance.template_ref",
        message: `方法 ${m.method.id} 的 provenance.template_ref "${m.provenance.template_ref}" 与方法标识 ${expected} 不一致`
      });
    }
  }
  if (m.method.references.length === 0) {
    issues.push({
      rule: "method-references",
      path: "method.references",
      message: `方法 ${m.method.id} 未标注方法论出处（references 必填，不得搬运付费内容）`
    });
  }
  return issues;
}

// method_ref 解析：<method-id>@<semver>；找不到返回 undefined（调用方决定报错策略）
export function resolveMethodRef(
  methods: MethodTemplate[],
  ref: string
): MethodTemplate | undefined {
  return methods.find((m) => `${m.method.id}@${m.method.version}` === ref);
}

export function defaultMethodsDir(templatesDir: string): string {
  return join(templatesDir, "methods");
}
