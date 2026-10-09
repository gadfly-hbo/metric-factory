import { test, expect } from "vitest";
import {
  parseQuestionTreeDsl,
  parseMetricUsagesDsl,
  scenarioTreeToDsl,
  scenarioUsagesToDsl
} from "../../src/ui/dsl.js";

// 期望字面量独立推导自 .flow/ui-contract.md §4 E-03…E-08（逐字）与 GRILL Q1 DSL 冻结版
const METRICS = new Set(["gmv", "uv", "cvr", "aov", "refund_rate"]);

test("合法 question_tree DSL：空槽留空 → parent/metric 字段省略", () => {
  const r = parseQuestionTreeDsl("gap_root|GMV 差距||\ntraffic|流量端|gap_root|uv", METRICS);
  expect(r.errors).toEqual([]);
  expect(r.nodes).toEqual([
    { id: "gap_root", label: "GMV 差距" },
    { id: "traffic", label: "流量端", parent: "gap_root", metric: "uv" }
  ]);
});

test("合法 metric_usages DSL：note 可省略（2 槽）或留空（3 槽）", () => {
  const r = parseMetricUsagesDsl("gmv|outcome|月度缺口归因\nuv|driver", METRICS);
  expect(r.errors).toEqual([]);
  expect(r.usages).toEqual([
    { metric: "gmv", role: "outcome", note: "月度缺口归因" },
    { metric: "uv", role: "driver" }
  ]);
});

test("E-03：槽数∉{3,4}（少槽/多槽均格式错，多竖线不吞并——B1 严格版）", () => {
  for (const text of ["traffic|流量端", "a|一|root|gmv|多余槽", "|label|root|gmv", "id||root|gmv"]) {
    const r = parseQuestionTreeDsl(text, METRICS);
    expect(r.errors).toEqual([
      `[scenario-tree-ref] question_tree 第 1 行: 格式须为 id|label|parent|metric（4 槽竖线分隔，空槽留空）`
    ]);
  }
});

test("3 槽根形式 id|label|parent| 合法（T-10 例 root|GMV 差距诊断|）", () => {
  const r = parseQuestionTreeDsl("root|GMV 差距诊断|\ntraffic|流量端|root|uv", METRICS);
  expect(r.errors).toEqual([]);
  expect(r.nodes).toEqual([
    { id: "root", label: "GMV 差距诊断" },
    { id: "traffic", label: "流量端", parent: "root", metric: "uv" }
  ]);
});

test("E-06：节点 id 场景内重复，报在重复出现行", () => {
  const r = parseQuestionTreeDsl("dup|一|\nok|合法|dup|\n dup |二|", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree 第 3 行: 节点 id "dup" 在本场景内重复`
  ]);
});

test("E-04：parent 引用未定义节点 id", () => {
  const r = parseQuestionTreeDsl("root|根|\nx|子|ghost_parent|uv", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree 第 2 行: parent "ghost_parent" 不存在（须引用同场景内已定义的节点 id）`
  ]);
});

test("E-05：自指成环 x → x", () => {
  const r = parseQuestionTreeDsl("x|自指节点|x|", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree: 检测到环 x → x（禁止循环与自指）`
  ]);
});

test("E-05：两节点互指成环，整环仅一条（换起点不重复报）", () => {
  const r = parseQuestionTreeDsl("a|A|b|\nb|B|a|", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree: 检测到环 a → b → a（禁止循环与自指）`
  ]);
});

test("E-05：三节点环给全链路", () => {
  const r = parseQuestionTreeDsl("a|A|b|\nb|B|c|\nc|C|a|", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree: 检测到环 a → b → c → a（禁止循环与自指）`
  ]);
});

test("E-07：树节点 metric 引用物化外指标，行号定位", () => {
  const r = parseQuestionTreeDsl("root|根||gmv_growth", METRICS);
  expect(r.errors).toEqual([
    `[scenario-metric-ref] question_tree 第 1 行: metric "gmv_growth" 不是物化指标（可用指标见指标树与指标字典）`
  ]);
});

test("E-07/E-08：usages 行的指标引用与 role 枚举各报各的，同行双错共存", () => {
  const r = parseMetricUsagesDsl("gmv_growth|north|双错行", METRICS);
  expect(r.errors).toEqual([
    `[scenario-metric-ref] metric_usages 第 1 行: role "north" 无效（须为 outcome | driver | guardrail）`,
    `[scenario-metric-ref] metric_usages 第 1 行: metric "gmv_growth" 不是物化指标（可用指标见指标树与指标字典）`
  ]);
});

test("usages 行格式错（1 槽 / 4 槽 / 空 metric）→ 格式须为 metric|role|note", () => {
  for (const text of ["gmv", "gmv|outcome|note|extra", "|driver|note"]) {
    const r = parseMetricUsagesDsl(text, METRICS);
    expect(r.errors).toEqual([
      `[scenario-metric-ref] metric_usages 第 1 行: 格式须为 metric|role|note（note 可留空）`
    ]);
  }
});

test("空行跳过但行号按物理行计（wrap=off 视觉行=物理行）", () => {
  const r = parseQuestionTreeDsl("root|根|\n\nx|子|ghost", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree 第 3 行: parent "ghost" 不存在（须引用同场景内已定义的节点 id）`
  ]);
});

test("树错误按行号升序输出、跨行成环置尾", () => {
  const r = parseQuestionTreeDsl("root|根|\nx|坏引用|ghost|gmv_growth\ny|三槽坏行\np|P|q|\nq|Q|p|", METRICS);
  expect(r.errors).toEqual([
    `[scenario-tree-ref] question_tree 第 2 行: parent "ghost" 不存在（须引用同场景内已定义的节点 id）`,
    `[scenario-metric-ref] question_tree 第 2 行: metric "gmv_growth" 不是物化指标（可用指标见指标树与指标字典）`,
    `[scenario-tree-ref] question_tree 第 3 行: 格式须为 id|label|parent|metric（4 槽竖线分隔，空槽留空）`,
    `[scenario-tree-ref] question_tree: 检测到环 p → q → p（禁止循环与自指）`
  ]);
});

test("预填序列化与解析无损往返（S4 回填 → 再解析同构）", () => {
  const nodes = [
    { id: "gap_root", label: "GMV 与目标差距多大", metric: "gmv" },
    { id: "uv_gap", label: "访客规模是否拖累", parent: "gap_root", metric: "uv" }
  ];
  const usages = [
    { metric: "gmv", role: "outcome", note: "差距量化对象" },
    { metric: "uv", role: "driver" }
  ] as const;
  expect(parseQuestionTreeDsl(scenarioTreeToDsl(nodes as never), METRICS).nodes).toEqual(nodes);
  expect(parseMetricUsagesDsl(scenarioUsagesToDsl(usages as never), METRICS).usages).toEqual([
    { metric: "gmv", role: "outcome", note: "差距量化对象" },
    { metric: "uv", role: "driver" }
  ]);
});
