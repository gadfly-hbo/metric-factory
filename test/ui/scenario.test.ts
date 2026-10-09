import { mkdtempSync, copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { parse as parseYaml } from "yaml";
import { createUiServer, listenUi } from "../../src/ui/server.js";
import { loadInstance, loadTemplate } from "../../src/engine/loader.js";
import { materialize } from "../../src/engine/materialize.js";
import { validateInstance } from "../../src/engine/validate.js";

// v5 切片 4：UI 决策场景区块 e2e（真实 server + fetch；期望字面量独立推导自
// .flow/ui-contract.md §4 与 templates/ecommerce-marketplace.yaml 种子场景）

function tmpFixture(fixture = "instance-ecommerce.yaml"): { dir: string; inst: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-scn-ui-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync(`test/fixtures/${fixture}`, inst);
  return { dir, inst };
}

async function startUi(inst: string, dir: string) {
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local"), instancePath: inst });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

function postForm(base: string, path: string, fields: Record<string, string>) {
  return fetch(`${base}${path}`, {
    method: "POST",
    body: new URLSearchParams(fields),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    redirect: "manual"
  });
}

// 种子场景（模板直读）：usages = gmv outcome + uv/cvr/aov driver + retention_30d/refund_rate guardrail
const SEED = {
  id: "gmv_gap_diagnosis",
  title: "GMV 差距诊断",
  purpose: "定位 GMV 与目标差距的量价来源，决定流量、转化、客单三侧的资源投放优先级"
};

const VALID_NEW_SCENARIO = {
  id: "promo_roi_review",
  title: "大促 ROI 复盘",
  decision_purpose: "大促结束 7 天内复盘补贴效率与增量成交，决定下次大促的预算与补贴节奏。",
  question_tree: "root|大促增量在哪|\ntraffic|流量端|root|uv",
  metric_usages: "gmv|outcome|增量归因\nrefund_rate|guardrail|防以退款换增长",
  method_refs: "dame.m2.driver_decomposition@1.1.0",
  evidence_requirements: "大促前后各 14 天的 GMV 与退款率序列",
  output_spec: "一页 ROI 复盘结论 + 下次预算档位建议",
  review_rules: "大促后 7 天内由业务负责人签字确认"
};

test("S1 列表渲染：种子场景在列 + 来源 chip「模板种子」+ 角色计数 + 区块居页面末位", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);
  const html = await (await fetch(`${base}/instance`)).text();

  expect(html).toContain('<div class="view-title">决策场景 · 分析体系</div>');
  expect(html).toContain(SEED.purpose); // T-01 用途全文（v0.1 不截断）
  expect(html).toContain("把「这个业务问题应该怎样分析」固化为配置：决策用途、问题树、指标角色、方法引用。场景随实例写盘并进入 SAP 语义包；写回前经全量校验，失败零写盘。");
  expect(html).toContain(`<strong>${SEED.title}</strong><br><span class="mono">${SEED.id}</span>`);
  expect(html).toContain('<span class="num">6</span> 个（outcome 1 · driver 3 · guardrail 2）');
  expect(html).toContain('chip chip-ok">模板种子</span>');
  expect(html).toContain('href="/instance/scenarios/gmv_gap_diagnosis/edit"');
  expect(html).toContain('href="/instance/scenarios/new"');
  // 区块位置钉死：实例页最后一块（patch 表单之后）
  expect(html.indexOf("决策场景 · 分析体系")).toBeGreaterThan(html.indexOf('action="/instance/patch"'));
  // 表头五列逐字（T-18）
  for (const h of ["<th>场景</th>", "<th>决策用途</th>", "<th>指标角色</th>", "<th>来源</th>", "<th>操作</th>"]) {
    expect(html).toContain(h);
  }
  // 零客户端脚本（N1）
  expect(html).not.toContain("<script>");
  server.close();
});

test("S2 空态：无种子模板实例显示「暂无决策场景」+ 价值说明 + 新建入口", async () => {
  const { dir, inst } = tmpFixture("instance-saas.yaml"); // saas-subscription 无种子场景
  const { server, base } = await startUi(inst, dir);
  const html = await (await fetch(`${base}/instance`)).text();

  expect(html).toContain("暂无决策场景");
  expect(html).toContain("决策场景回答「怎样分析这个问题」：先写清决策用途，再拆问题树、挂指标角色。");
  expect(html).toContain('href="/instance/scenarios/new"');
  // 空态不渲染列表表头与计数行
  expect(html).not.toContain("<th>场景</th>");
  expect(html).not.toContain("场景列表（");
  server.close();
});

test("S3 新建表单页：术语逐字（T-03/T-06…T-17/T-19）+ 原生 form action + id 可填", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);
  const html = await (await fetch(`${base}/instance/scenarios/new`)).text();

  expect(html).toContain("决策场景 · 新建");
  expect(html).toContain("新建决策场景并写回实例（写回前经全量校验，失败零写盘）。</p>");
  expect(html).toContain('<form action="/instance/scenarios" method="post">');
  expect(html).toContain("ScenarioSpec v0.1 · version 0.1.0 由服务端固定");
  const labels = [
    "场景 id（snake_case，实例内唯一，创建后不可修改）",
    "标题 title（非空）",
    "决策用途 decision_purpose（非空——无决策用途不可保存）",
    "问题树 question_tree（逐行 id|label|parent|metric，空槽留空；parent 留空即根节点）",
    "指标角色 metric_usages（逐行 指标名|role|note，role 须为 outcome | driver | guardrail，note 可留空）",
    "方法引用 method_refs（逐行一个自由串，可空，如 dame.m2.driver_decomposition@1.0.0）",
    "证据要求 evidence_requirements（文本段，可空）",
    "输出 output_spec（文本段，可空）",
    "复盘规则 review_rules（文本段，可空）"
  ];
  for (const label of labels) expect(html).toContain(label);
  expect(html).toContain("例：root|GMV 差距诊断|　·　traffic|流量端|root|uv　（节点id|节点label|父节点id|指标名）");
  expect(html).toContain("例：gmv|outcome|月度缺口归因　·　uv|driver|流量端抓手　·　refund_rate|guardrail|防以退款换增长");
  expect(html).toContain('<input type="text" id="scn-id" name="id"');
  expect(html).toContain(">校验并写回场景</button>");
  expect(html).toContain('href="/instance">取消</a>');
  // DSL 两域 mono + wrap=off（行号可对照）
  expect(html).toContain('name="question_tree" rows="5" wrap="off"');
  expect(html).toContain('name="metric_usages" rows="4" wrap="off"');
  expect(html).not.toContain("<script>");
  server.close();
});

test("P2/P4 新建成功：303 回列表 + 实例文件落盘含场景 + 引擎全量校验零 issue（CLI validate 等价）+ 「实例新增」chip", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);

  const res = await postForm(base, "/instance/scenarios", VALID_NEW_SCENARIO);
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/instance");

  // 落盘内容与结构（version 由服务端固定 0.1.0；空槽留空 → parent/metric 省略）
  const written = parseYaml(readFileSync(inst, "utf8")) as {
    added_scenarios: { id: string; version: string; title: string; question_tree: unknown[]; metric_usages: unknown[]; method_refs: string[] }[];
  };
  expect(written.added_scenarios).toHaveLength(1);
  expect(written.added_scenarios[0]!.id).toBe("promo_roi_review");
  expect(written.added_scenarios[0]!.version).toBe("0.1.0");
  expect(written.added_scenarios[0]!.question_tree).toEqual([
    { id: "root", label: "大促增量在哪" },
    { id: "traffic", label: "流量端", parent: "root", metric: "uv" }
  ]);
  expect(written.added_scenarios[0]!.metric_usages).toEqual([
    { metric: "gmv", role: "outcome", note: "增量归因" },
    { metric: "refund_rate", role: "guardrail", note: "防以退款换增长" }
  ]);
  expect(written.added_scenarios[0]!.method_refs).toEqual(["dame.m2.driver_decomposition@1.1.0"]);

  // 引擎管线等价断言（与 CLI validate 同一 loadInstance → materialize → validateInstance）
  const loaded = await loadInstance(inst);
  expect(loaded.ok).toBe(true);
  const tpl = await loadTemplate("templates/ecommerce-marketplace.yaml");
  expect(tpl.ok).toBe(true);
  if (loaded.ok && tpl.ok) {
    const mat = materialize(tpl.template, loaded.instance);
    expect(validateInstance(mat, tpl.template, loaded.instance)).toEqual([]);
    expect(mat.scenarios.map((s) => s.id)).toEqual(["gmv_gap_diagnosis", "promo_roi_review"]);
  }

  // S5 回列表：新行 + 实例新增 chip
  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("<strong>大促 ROI 复盘</strong>");
  expect(html).toContain('chip chip-accent">实例新增</span>');
  expect(html).toContain('chip chip-ok">模板种子</span>');
  server.close();
});

test("S6/P5/N4/N6 坏 DSL：422 同页回显行号与原文、合法行不报错、值保留、实例文件字节零变化", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);
  const before = readFileSync(inst);

  const badTree = "root|GMV 差距|\ntraffic|流量端|ghost_parent|uv\nprice 客单价端 root aov";
  const badUsages = "gmv_growth|outcome|目标指标\nuv|north|角色手滑\nrefund_rate|guardrail|合法行不应报错";
  const res = await postForm(base, "/instance/scenarios", {
    id: "broken_scenario",
    title: "坏 DSL 场景",
    decision_purpose: "决策用途非空，仅 DSL 坏行应逐行报错。",
    question_tree: badTree,
    metric_usages: badUsages,
    method_refs: "",
    evidence_requirements: "",
    output_spec: "",
    review_rules: ""
  });
  expect(res.status).toBe(422);
  const html = await res.text();

  // T-05 + 错误卡标题
  expect(html).toContain("全量校验未通过（零写盘）——修正下列问题后重试。</p>");
  expect(html).toContain("校验失败");
  // 逐条错误（escapeHtml 将引号转 &quot;；行号 = textarea 物理行）
  expect(html).toContain('[scenario-tree-ref] question_tree 第 2 行: parent &quot;ghost_parent&quot; 不存在（须引用同场景内已定义的节点 id）');
  expect(html).toContain('[scenario-tree-ref] question_tree 第 3 行: 格式须为 id|label|parent|metric（4 槽竖线分隔，空槽留空）');
  expect(html).toContain('[scenario-metric-ref] metric_usages 第 1 行: metric &quot;gmv_growth&quot; 不是物化指标（可用指标见指标树与指标字典）');
  expect(html).toContain('[scenario-metric-ref] metric_usages 第 2 行: role &quot;north&quot; 无效（须为 outcome | driver | guardrail）');
  // 恰 4 条：合法行（第 1/3 行树、第 3 行 usages）不产生条目
  expect(html.match(/<li>/g)).toHaveLength(4);
  // 值保留：坏 DSL 原文与已填字段仍在表单中
  expect(html).toContain("traffic|流量端|ghost_parent|uv");
  expect(html).toContain("price 客单价端 root aov");
  expect(html).toContain('value="broken_scenario"');
  expect(html).toContain('value="坏 DSL 场景"');
  // 可访问性：错误列表 role=alert；DSL 两域 aria-describedby 指向错误列表
  expect(html).toContain('role="alert" id="scn-errors"');
  expect((html.match(/aria-describedby="scn-errors"/g) ?? []).length).toBe(2);
  // 零写盘（字节对比）
  expect(readFileSync(inst).equals(before)).toBe(true);
  server.close();
});

test("S4/D2 编辑模板种子：预填 DSL 原文 + id 只读 + fork 提示 → 保存后 added_scenarios 为实例覆盖 + chip「实例覆盖种子」", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);

  // S4 表单：预填 + id 只读（hidden，不提交可见控件）+ T-04 fork 语义提示
  const editHtml = await (await fetch(`${base}/instance/scenarios/gmv_gap_diagnosis/edit`)).text();
  expect(editHtml).toContain("决策场景 · 编辑");
  expect(editHtml).toContain("编辑决策场景（写回前经全量校验，失败零写盘）。保存后此场景以实例版本生效（覆盖模板种子）。</p>");
  expect(editHtml).toContain('<form action="/instance/scenarios/gmv_gap_diagnosis" method="post">');
  expect(editHtml).toContain('<input type="hidden" name="id" value="gmv_gap_diagnosis">');
  expect(editHtml).not.toContain('id="scn-id"'); // 无可编辑 id 控件（D1）
  expect(editHtml).toContain("gap_root|GMV 与目标差距多大||gmv");
  expect(editHtml).toContain("uv_gap|访客规模是否拖累|gap_root|uv");
  expect(editHtml).toContain("gmv|outcome|差距量化对象，对齐北极星候选 gmv 的模板口径");
  expect(editHtml).toContain("refund_rate|guardrail|转化抢救动作不得推高退款率");

  // 保存修订版（种子 id → 实例覆盖条目）
  const res = await postForm(base, "/instance/scenarios/gmv_gap_diagnosis", {
    id: "gmv_gap_diagnosis",
    title: "GMV 差距诊断（本地修订）",
    decision_purpose: SEED.purpose,
    question_tree: "gap_root|GMV 与目标差距多大||gmv",
    metric_usages: "gmv|outcome|月度缺口归因",
    method_refs: "",
    evidence_requirements: "",
    output_spec: "",
    review_rules: ""
  });
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/instance");

  const written = parseYaml(readFileSync(inst, "utf8")) as { added_scenarios: { id: string; title: string }[] };
  expect(written.added_scenarios).toEqual([{ id: "gmv_gap_diagnosis", title: "GMV 差距诊断（本地修订）", version: "0.1.0", decision_purpose: SEED.purpose, question_tree: [{ id: "gap_root", label: "GMV 与目标差距多大", metric: "gmv" }], metric_usages: [{ metric: "gmv", role: "outcome", note: "月度缺口归因" }], method_refs: [], evidence_requirements: "", output_spec: "", review_rules: "" }]);

  // 列表：该行变「实例覆盖种子」，模板种子 chip 消失；再次进入编辑无 fork 提示（已是实例版本）
  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("<strong>GMV 差距诊断（本地修订）</strong>");
  expect(html).toContain('chip chip-accent">实例覆盖种子</span>');
  expect(html).not.toContain('chip chip-ok">模板种子</span>');
  const editAgain = await (await fetch(`${base}/instance/scenarios/gmv_gap_diagnosis/edit`)).text();
  expect(editAgain).not.toContain("覆盖模板种子");
  server.close();
});

test("N7 编辑不存在的场景：404 empty 卡「场景不存在」+ 返回实例，不渲染空表单", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);

  const res = await fetch(`${base}/instance/scenarios/nope_scenario/edit`);
  expect(res.status).toBe(404);
  const html = await res.text();
  expect(html).toContain("场景不存在");
  expect(html).toContain('href="/instance">返回实例</a>');
  expect(html).not.toContain('name="decision_purpose"');
  server.close();
});

test("N5/N3 撞种子 id + 空决策用途：422 同时给出 E-02 与 E-01（逐字），零写盘", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);
  const before = readFileSync(inst);

  const res = await postForm(base, "/instance/scenarios", {
    id: "gmv_gap_diagnosis",
    title: "撞种子 id",
    decision_purpose: " ",
    question_tree: "",
    metric_usages: "",
    method_refs: "",
    evidence_requirements: "",
    output_spec: "",
    review_rules: ""
  });
  expect(res.status).toBe(422);
  const html = await res.text();
  expect(html).toContain('[scenario-id] scenarios: 场景 id &quot;gmv_gap_diagnosis&quot; 已存在（实例内唯一；编辑已有场景请从列表「编辑」进入）');
  expect(html).toContain('[scenario-purpose] scenarios[gmv_gap_diagnosis].decision_purpose: 决策用途不能为空（无决策用途不可保存）');
  expect(readFileSync(inst).equals(before)).toBe(true);
  server.close();
});

test("N8 无实例：/instance 维持既有 empty 态，场景区块不渲染", async () => {
  const server = createUiServer({ templatesDir: "templates" });
  const port = await listenUi(server, 0);
  const base = `http://127.0.0.1:${port}`;
  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("还没有实例");
  expect(html).not.toContain("决策场景");
  server.close();
});
