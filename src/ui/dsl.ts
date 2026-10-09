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
