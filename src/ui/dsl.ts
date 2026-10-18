// 场景表单 DSL 解析（GRILL Q1 冻结版，2026-10-09）：question_tree 逐行 id|label|parent|metric、
// metric_usages 逐行 metric|role|note（竖线分槽、空槽留空）。纯函数、零 IO；
// 错误串按 .flow/ui-contract.md §4 E-03…E-08 逐字产出（行号 = textarea 内 1 起算物理行）。
// 槽数判定：question_tree 接受 4 槽 id|label|parent|metric 或 3 槽根形式 id|label|parent|（T-10 例
// `root|GMV 差距诊断|`，尾部空槽可省一节）；metric_usages 接受 3 槽或 note 省略的 2 槽。
// 其余槽数（含 >4/>3 的多竖线）一律 E-03/格式错，不吞并余下竖线——B1 取舍见契约 §8。

export interface QuestionNode {
  id: string;
  label: string;
  parent?: string;
  metric?: string;
}

export type MetricRole = "outcome" | "driver" | "guardrail";

export interface MetricUsage {
  metric: string;
  role: MetricRole;
  note?: string;
}

const ROLES: readonly MetricRole[] = ["outcome", "driver", "guardrail"];

function physicalLines(text: string): { line: number; text: string }[] {
  return text
    .split(/\r?\n/)
    .map((text, i) => ({ line: i + 1, text }))
    .filter((l) => l.text.trim() !== "");
}

function treeFormatError(line: number): string {
  return `[scenario-tree-ref] question_tree 第 ${line} 行: 格式须为 id|label|parent|metric（4 槽竖线分隔，空槽留空）`;
}

function usagesFormatError(line: number): string {
  return `[scenario-metric-ref] metric_usages 第 ${line} 行: 格式须为 metric|role|note（note 可留空）`;
}

export function parseQuestionTreeDsl(
  text: string,
  knownMetrics: ReadonlySet<string>
): { nodes: QuestionNode[]; errors: string[] } {
  // 收集 {line, msg} 以便按行号升序输出（跨行成环错误置尾）
  const errors: { line: number; msg: string }[] = [];
  const rows: (QuestionNode & { line: number })[] = [];

  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    // 槽形（GRILL Q1 + 原型落样）：4 槽 id|label|parent|metric；根节点可省尾部空槽为 3 槽 id|label|parent|
    // （T-10 例 `root|GMV 差距诊断|`）。1/2/≥5 槽为格式错；id/label 必填。
    if ((slots.length !== 3 && slots.length !== 4) || slots[0] === "" || slots[1] === "") {
      errors.push({ line, msg: treeFormatError(line) });
      continue;
    }
    rows.push({
      id: slots[0]!,
      label: slots[1]!,
      ...(slots[2] ? { parent: slots[2] } : {}),
      ...(slots[3] ? { metric: slots[3] } : {}),
      line
    });
  }

  const nodeIds = new Set(rows.map((r) => r.id));

  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.id)) {
      errors.push({ line: r.line, msg: `[scenario-tree-ref] question_tree 第 ${r.line} 行: 节点 id "${r.id}" 在本场景内重复` });
    } else {
      seen.add(r.id);
    }
  }

  for (const r of rows) {
    if (!r.parent) continue;
    if (r.parent !== r.id && !nodeIds.has(r.parent)) {
      errors.push({
        line: r.line,
        msg: `[scenario-tree-ref] question_tree 第 ${r.line} 行: parent "${r.parent}" 不存在（须引用同场景内已定义的节点 id）`
      });
    }
  }

  // 成环/自指（E-05）：沿 parent 上溯，回到走过的节点即成环；按环成员集去重，每环一条
  const parentOf = new Map(rows.map((r) => [r.id, r.parent]));
  const reportedCycles = new Set<string>();
  for (const r of rows) {
    const stack: string[] = [];
    const pos = new Map<string, number>();
    let cur: string | undefined = r.id;
    while (cur !== undefined && parentOf.has(cur) && !pos.has(cur)) {
      pos.set(cur, stack.length);
      stack.push(cur);
      cur = parentOf.get(cur);
    }
    if (cur === undefined || !pos.has(cur)) continue;
    const members = stack.slice(pos.get(cur)!);
    const cycle = [...members, cur];
    const key = [...members].sort().join("→");
    if (reportedCycles.has(key)) continue;
    reportedCycles.add(key);
    errors.push({
      line: Number.MAX_SAFE_INTEGER,
      msg: `[scenario-tree-ref] question_tree: 检测到环 ${cycle.join(" → ")}（禁止循环与自指）`
    });
  }

  for (const r of rows) {
    if (r.metric && !knownMetrics.has(r.metric)) {
      errors.push({
        line: r.line,
        msg: `[scenario-metric-ref] question_tree 第 ${r.line} 行: metric "${r.metric}" 不是物化指标（可用指标见指标树与指标字典）`
      });
    }
  }

  errors.sort((a, b) => a.line - b.line);
  const nodes = rows.map(({ line: _line, ...node }) => node);
  return { nodes, errors: errors.map((e) => e.msg) };
}

export function parseMetricUsagesDsl(
  text: string,
  knownMetrics: ReadonlySet<string>
): { usages: MetricUsage[]; errors: string[] } {
  const errors: { line: number; msg: string }[] = [];
  const usages: MetricUsage[] = [];

  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    if (slots.length < 2 || slots.length > 3 || slots[0] === "") {
      errors.push({ line, msg: usagesFormatError(line) });
      continue;
    }
    const [metric, role, note] = slots as [string, string, string | undefined];
    if (!ROLES.includes(role as MetricRole)) {
      errors.push({
        line,
        msg: `[scenario-metric-ref] metric_usages 第 ${line} 行: role "${role}" 无效（须为 outcome | driver | guardrail）`
      });
    }
    if (!knownMetrics.has(metric)) {
      errors.push({
        line,
        msg: `[scenario-metric-ref] metric_usages 第 ${line} 行: metric "${metric}" 不是物化指标（可用指标见指标树与指标字典）`
      });
    }
    if (ROLES.includes(role as MetricRole)) {
      usages.push({ metric, role: role as MetricRole, ...(note ? { note } : {}) });
    }
  }

  return { usages, errors: errors.map((e) => e.msg) };
}

// 预填序列化（S4）：结构与 DSL 一一对应，可无损往返（槽值不含竖线时）
export function scenarioTreeToDsl(nodes: { id: string; label: string; parent?: string; metric?: string }[]): string {
  return nodes.map((n) => [n.id, n.label, n.parent ?? "", n.metric ?? ""].join("|")).join("\n");
}

export function scenarioUsagesToDsl(usages: { metric: string; role: string; note?: string }[]): string {
  return usages.map((u) => [u.metric, u.role, u.note ?? ""].join("|")).join("\n");
}

// ===== A1 批次 D4：方法绑定 DSL（method_bindings 逐行 method_ref|role|metric，3 槽） =====
// 方法可解析性与角色合法性在引擎 validateMethodBindings 复检；此处只管槽形与指标存在性。

export interface MethodBinding {
  method_ref: string;
  role: string;
  metric: string;
}

function bindingsFormatError(line: number): string {
  return `[scenario-method-role] method_bindings 第 ${line} 行: 格式须为 method_ref|role|metric（3 槽竖线分隔，如 profit-change-diagnosis@0.1.0|profit_result|operating_profit）`;
}

export function parseMethodBindingsDsl(
  text: string,
  knownMetrics: ReadonlySet<string>
): { bindings: MethodBinding[]; errors: string[] } {
  const errors: string[] = [];
  const bindings: MethodBinding[] = [];

  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    if (slots.length !== 3 || slots.some((s) => s === "")) {
      errors.push(bindingsFormatError(line));
      continue;
    }
    const [method_ref, role, metric] = slots as [string, string, string];
    if (!/^[a-z][a-z0-9_]*$/.test(role)) {
      errors.push(`[scenario-method-role] method_bindings 第 ${line} 行: role "${role}" 须为小写 snake_case`);
      continue;
    }
    if (!knownMetrics.has(metric)) {
      errors.push(
        `[scenario-method-role] method_bindings 第 ${line} 行: metric "${metric}" 不是物化指标（可用指标见指标树与指标字典）`
      );
      continue;
    }
    bindings.push({ method_ref, role, metric });
  }

  return { bindings, errors };
}

export function scenarioBindingsToDsl(bindings: { method_ref: string; role: string; metric: string }[]): string {
  return bindings.map((b) => [b.method_ref, b.role, b.metric].join("|")).join("\n");
}

// ===== A1 批次：分析体系编辑 DSL（与场景 DSL 同构：竖线分槽、空槽留空、行级错误）=====
// 草稿允许缺口（方案 §7）：除槽形/枚举/id 外的内容缺口不在表单层阻断，由引擎设计检查呈现。

export interface QuestionRow { id: string; title: string; detail: string; metric_refs: string[]; }
export interface HypothesisRow { id: string; statement: string; support: string; counter: string; change_condition: string; }
export interface EvidenceRow { id: string; name: string; kind: string; source: string; check: string; insufficiency: string; status: string; }
export interface OptionRow { id: string; name: string; tradeoff: string; }

const EVIDENCE_STATUSES = ["待获取", "取得待核", "已核验", "支持不足", "存在冲突"] as const;

function slotError(line: number, label: string, shape: string): string {
  return `[blueprint-dsl] ${label} 第 ${line} 行: 格式须为 ${shape}（竖线分隔，空槽留空）`;
}

export function parseQuestionsDsl(text: string, knownMetrics: ReadonlySet<string>): { rows: QuestionRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: QuestionRow[] = [];
  const seen = new Set<string>();
  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    if (slots.length !== 4 || slots[0] === "" || slots[1] === "") {
      errors.push(slotError(line, "questions", "id|标题|说明|指标引用(逗号分隔)"));
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(slots[0]!)) {
      errors.push(`[blueprint-dsl] questions 第 ${line} 行: id "${slots[0]}" 须为小写 snake_case`);
      continue;
    }
    if (seen.has(slots[0]!)) {
      errors.push(`[blueprint-dsl] questions 第 ${line} 行: id "${slots[0]}" 重复`);
      continue;
    }
    seen.add(slots[0]!);
    const refs = slots[3]! ? slots[3]!.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [];
    for (const ref of refs) {
      if (!knownMetrics.has(ref)) {
        errors.push(`[blueprint-question-ref] questions 第 ${line} 行: 指标 "${ref}" 不存在（可用指标见指标体系视图）`);
      }
    }
    rows.push({ id: slots[0]!, title: slots[1]!, detail: slots[2]!, metric_refs: refs });
  }
  return { rows, errors };
}

export function parseHypothesesDsl(text: string): { rows: HypothesisRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: HypothesisRow[] = [];
  const seen = new Set<string>();
  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    if (slots.length !== 5 || slots[0] === "" || slots[1] === "") {
      errors.push(slotError(line, "hypotheses", "id|假设陈述|支持证据|反对证据|改变判断的条件"));
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(slots[0]!)) {
      errors.push(`[blueprint-dsl] hypotheses 第 ${line} 行: id "${slots[0]}" 须为小写 snake_case`);
      continue;
    }
    if (seen.has(slots[0]!)) {
      errors.push(`[blueprint-dsl] hypotheses 第 ${line} 行: id "${slots[0]}" 重复`);
      continue;
    }
    seen.add(slots[0]!);
    rows.push({ id: slots[0]!, statement: slots[1]!, support: slots[2]!, counter: slots[3]!, change_condition: slots[4]! });
  }
  return { rows, errors };
}

export function parseEvidenceDsl(text: string): { rows: EvidenceRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: EvidenceRow[] = [];
  const seen = new Set<string>();
  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    if ((slots.length !== 6 && slots.length !== 7) || slots[0] === "" || slots[1] === "") {
      errors.push(slotError(line, "evidence_plan", "id|名称|类型|来源|核验办法|不足处置|状态(可省，默认 待获取)"));
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(slots[0]!)) {
      errors.push(`[blueprint-dsl] evidence_plan 第 ${line} 行: id "${slots[0]}" 须为小写 snake_case`);
      continue;
    }
    if (seen.has(slots[0]!)) {
      errors.push(`[blueprint-dsl] evidence_plan 第 ${line} 行: id "${slots[0]}" 重复`);
      continue;
    }
    const status = slots[6] || "待获取";
    if (!EVIDENCE_STATUSES.includes(status as (typeof EVIDENCE_STATUSES)[number])) {
      errors.push(
        `[blueprint-dsl] evidence_plan 第 ${line} 行: 状态 "${status}" 无效（须为 ${EVIDENCE_STATUSES.join(" / ")}）`
      );
      continue;
    }
    seen.add(slots[0]!);
    rows.push({
      id: slots[0]!, name: slots[1]!, kind: slots[2] || "内部数据",
      source: slots[3]!, check: slots[4]!, insufficiency: slots[5]!, status
    });
  }
  return { rows, errors };
}

export function parseOptionsDsl(text: string): { rows: OptionRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: OptionRow[] = [];
  const seen = new Set<string>();
  for (const { line, text: raw } of physicalLines(text)) {
    const slots = raw.split("|").map((s) => s.trim());
    if (slots.length !== 3 || slots[0] === "" || slots[1] === "") {
      errors.push(slotError(line, "options", "id|候选道路|取舍"));
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(slots[0]!)) {
      errors.push(`[blueprint-dsl] options 第 ${line} 行: id "${slots[0]}" 须为小写 snake_case`);
      continue;
    }
    if (seen.has(slots[0]!)) {
      errors.push(`[blueprint-dsl] options 第 ${line} 行: id "${slots[0]}" 重复`);
      continue;
    }
    seen.add(slots[0]!);
    rows.push({ id: slots[0]!, name: slots[1]!, tradeoff: slots[2]! });
  }
  return { rows, errors };
}

// 预填序列化（可无损往返，槽值不含竖线时）
export function questionsToDsl(rows: { id: string; title: string; detail?: string; metric_refs?: string[] }[]): string {
  return rows.map((r) => [r.id, r.title, r.detail ?? "", (r.metric_refs ?? []).join(",")].join("|")).join("\n");
}
export function hypothesesToDsl(rows: { id: string; statement: string; support?: string; counter?: string; change_condition?: string }[]): string {
  return rows.map((r) => [r.id, r.statement, r.support ?? "", r.counter ?? "", r.change_condition ?? ""].join("|")).join("\n");
}
export function evidenceToDsl(rows: { id: string; name: string; kind?: string; source?: string; check?: string; insufficiency?: string; status?: string }[]): string {
  return rows.map((r) => [r.id, r.name, r.kind ?? "", r.source ?? "", r.check ?? "", r.insufficiency ?? "", r.status ?? ""].join("|")).join("\n");
}
export function optionsToDsl(rows: { id: string; name: string; tradeoff?: string }[]): string {
  return rows.map((r) => [r.id, r.name, r.tradeoff ?? ""].join("|")).join("\n");
}
