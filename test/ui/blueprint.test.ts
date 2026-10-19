import { mkdtempSync, copyFileSync, readFileSync, existsSync, mkdirSync, cpSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// A1 批次 T13：分析体系工作台四视图与蓝图规则 UI e2e（真实 server + fetch 边界，零客户端脚本）
// 覆盖：四视图骨架 / 手工建立与编辑 / 复核确认与失效（D5）/ 假设判断分轴（D6）/
//       指标删除影响（D8）/ 方法绑定阻断（D4）/ 方法库与另存方法 / 粘贴导入 / NL 创建流（faux）

function tmpFixture(fixture = "instance-blueprint.yaml"): { dir: string; inst: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-bp-ui-"));
  const inst = join(dir, "instance.yaml");
  copyFileSync(`test/fixtures/${fixture}`, inst);
  return { dir, inst };
}

async function startUi(inst: string | undefined, dir: string, templatesDir = "templates") {
  const server = createUiServer({
    authJsonPath: join(tmpdir(), "mf-ui-no-auth.json"),
    templatesDir,
    workspaceDir: dir,
    envFilePath: join(dir, ".env.local"),
    ...(inst ? { instancePath: inst } : {})
  });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

const post = (base: string, path: string, params: Record<string, string> | URLSearchParams) =>
  fetch(`${base}${path}`, {
    method: "POST",
    body: params instanceof URLSearchParams ? params : new URLSearchParams(params),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    redirect: "manual"
  });

const VALID_BLUEPRINT_FORM: Record<string, string> = {
  title: "增长诊断分析体系",
  intent: "设计具体分析方案",
  purpose: "把增长与费用放回经营目标中比较改善方案。",
  decision: "本季度应调整什么？",
  boundary: "资源批准由业务负责人承担。",
  deliverable: "差距诊断与试点安排。",
  questions: "q1|利润差距由哪些部分组成？|按毛利与费用分解|gmv,commission_revenue",
  hypotheses: "h1|费用增加抵消了收入增长|费用明细证据|一次性投入可解释|核验不支持时保留其他解释",
  evidence_plan: "e1|收入成本费用明细|内部数据|同范围同期间记录|复核范围与计算关系|缺失时不输出仿成功结论|待获取",
  options: "promo_up|加大促销投入|短期起量，费用率上升"
};

function blueprintFormParams(over: Record<string, string> = {}): URLSearchParams {
  const p = new URLSearchParams({ ...VALID_BLUEPRINT_FORM, ...over });
  p.append("contexts", "经营改善");
  p.append("organizations", "假设先行");
  return p;
}

// ===== 四视图骨架 =====

test("四视图：导航往返 + 当前项高亮 + 无实例空态", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml"); // 无蓝图实例
  const { server, base } = await startUi(inst, dir);

  for (const v of ["/instance/overview", "/instance", "/instance/scenarios", "/instance/delivery"]) {
    const res = await fetch(`${base}${v}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('aria-label="分析体系视图"');
    expect(html).toContain(`href="${v}" class="active"`);
    expect(html).not.toContain("<script>");
  }
  // 仅指标体系模式：总览给三起点（AI 起草 / 手工建立），不渲染蓝图区块
  const overview = await (await fetch(`${base}/instance/overview`)).text();
  expect(overview).toContain("当前工作区还没有分析体系");
  expect(overview).toContain('action="/instance/blueprint/generate"');
  expect(overview).toContain('href="/instance/blueprint/edit"');
  expect(overview).toContain("仅指标体系");
  server.close();

  // 无实例：四视图统一空态
  const dir2 = mkdtempSync(join(tmpdir(), "mf-bp-noinst-"));
  const { server: s2, base: b2 } = await startUi(undefined, dir2);
  for (const v of ["/instance/overview", "/instance", "/instance/scenarios", "/instance/delivery"]) {
    const html = await (await fetch(`${b2}${v}`)).text();
    expect(html).toContain("还没有实例");
  }
  s2.close();
});

// ===== 手工建立与编辑（蓝图表单）=====

test("手工建立分析体系：编辑页 → 保存 303 → 总览呈现四段；坏 DSL 422 值保留零写盘", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst, dir);

  const form = await (await fetch(`${base}/instance/blueprint/edit`)).text();
  expect(form).toContain('action="/instance/blueprint"');
  expect(form).toContain("业务需求理解");
  expect(form).toContain("问题结构");
  expect(form).toContain("关键假设");
  expect(form).toContain("证据计划");
  expect(form).toContain("候选道路");

  const res = await post(base, "/instance/blueprint", blueprintFormParams());
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/instance/overview");

  const written = parseYaml(readFileSync(inst, "utf8"));
  expect(written.blueprint.title).toBe("增长诊断分析体系");
  expect(written.blueprint.questions).toHaveLength(1);
  expect(written.blueprint.hypotheses[0].judgment).toBe("待验证假设"); // 新增假设缺省判断性质
  expect(written.blueprint.provenance.origin).toBe("manual");

  const overview = await (await fetch(`${base}/instance/overview`)).text();
  expect(overview).toContain("增长诊断分析体系");
  expect(overview).toContain("利润差距由哪些部分组成？");
  expect(overview).toContain("费用增加抵消了收入增长");
  expect(overview).toContain("加大促销投入");
  expect(overview).toContain("未复核");
  // 指标引用解析为可跳转 chip（唯一权威来源在指标体系视图）
  expect(overview).toContain('class="metric-ref" href="/instance"');
  server.close();

  // 坏 DSL：未知指标引用 + 坏 id → 422 逐行 + 值保留 + 零写盘
  const { dir: dir2, inst: inst2 } = tmpFixture("instance-ecommerce.yaml");
  const { server: s2, base: b2 } = await startUi(inst2, dir2);
  const before = readFileSync(inst2);
  const bad = await post(b2, "/instance/blueprint", blueprintFormParams({
    questions: "Q1|坏 id|x|ghost_metric",
    hypotheses: "h1|陈述|支持|反对|改变条件"
  }));
  expect(bad.status).toBe(422);
  const badHtml = await bad.text();
  expect(badHtml).toContain('id &quot;Q1&quot; 须为小写 snake_case');
  expect(badHtml).toContain("Q1|坏 id|x|ghost_metric"); // 值保留
  expect(readFileSync(inst2).equals(before)).toBe(true);
  s2.close();
});

// ===== 业务复核（D5 指纹失效）=====

test("业务复核：确认 → 有效；修改设计 → 失效；失效后发布被 design-review 阻断", async () => {
  const { dir, inst } = tmpFixture(); // instance-blueprint.yaml：缺口为零
  const { server, base } = await startUi(inst, dir);

  // 未复核态呈现 + 复核表单可用（缺口为零）
  const before = await (await fetch(`${base}/instance/delivery`)).text();
  expect(before).toContain("未复核");
  expect(before).toContain('action="/instance/review/confirm"');
  expect(before).toContain("确认业务复核");

  const confirm = await post(base, "/instance/review/confirm", { confirmed_by: "业务负责人-王磊" });
  expect(confirm.status).toBe(303);
  expect(confirm.headers.get("location")).toBe("/instance/delivery");

  const after = await (await fetch(`${base}/instance/delivery`)).text();
  expect(after).toContain("已复核 · 有效");
  expect(after).toContain("业务负责人-王磊");
  expect(after).toContain("设计就绪");

  // 相关修改（编辑蓝图改 decision）→ 复核失效
  const edit = await post(base, "/instance/blueprint", blueprintFormParams({ decision: "改为：是否进入新市场？" }));
  expect(edit.status).toBe(303);
  const stale = await (await fetch(`${base}/instance/delivery`)).text();
  expect(stale).toContain("复核已失效 · 需重新确认");
  expect(stale).toContain("设计在复核后被修改");

  // 失效态发布 → 422 design-review（fail-closed）
  const rel = await post(base, "/instance/release", { version: "1.0.0", note: "" });
  expect(rel.status).toBe(422);
  const relHtml = await rel.text();
  expect(relHtml).toContain("业务复核已失效");
  expect(existsSync(join(dir, "releases"))).toBe(false);
  server.close();
});

test("复核 fail-closed：设计缺口未清零不可确认（零写盘）", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml");
  const { server, base } = await startUi(inst, dir);
  // 建一份带缺口的蓝图（purpose 留空）
  const create = await post(base, "/instance/blueprint", blueprintFormParams({ purpose: "" }));
  expect(create.status).toBe(303); // 草稿允许缺口：保存成功

  const delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).toContain("blueprint-purpose");
  expect(delivery).toContain("请先处理上方设计缺口");

  const confirm = await post(base, "/instance/review/confirm", { confirmed_by: "王磊" });
  expect(confirm.status).toBe(422);
  expect(await confirm.text()).toContain("设计缺口");
  const written = parseYaml(readFileSync(inst, "utf8"));
  expect(written.blueprint.review).toBeUndefined();
  server.close();
});

// ===== 假设判断分轴（D6）=====

test("假设判断状态：分轴维护；事实/核验越过证据状态在交付视图呈现缺口", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);

  // 标记 h1 为「事实」但未核验 → 保存成功（写时不阻断），交付视图呈现 D6 缺口
  const res = await post(base, "/instance/blueprint/hypotheses/h1/state", { judgment: "事实" });
  expect(res.status).toBe(303);
  let written = parseYaml(readFileSync(inst, "utf8"));
  expect(written.blueprint.hypotheses[0].judgment).toBe("事实");
  expect(written.blueprint.hypotheses[0].verified).toBe(false);

  let delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).toContain("hypothesis-verification");
  expect(delivery).toContain("声明为「事实」但未核验");

  // 核验标记但证据计划无「已核验」→ 仍缺口
  await post(base, "/instance/blueprint/hypotheses/h1/state", { judgment: "事实", verified: "true" });
  delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).toContain("没有「已核验」证据");

  // 证据转已核验（编辑蓝图）→ 缺口清零
  const fix = await post(base, "/instance/blueprint", blueprintFormParams({
    decision: "当前经营周期应调整什么（促销力度、商品结构、费用节奏）？",
    purpose: "把销售增长、毛利变化和费用放回经营目标与约束中，比较改善方案的收益与代价。",
    title: "增长与利润改善分析体系",
    questions: "q1|利润差距由哪些部分组成？|先复核口径，按毛利与费用分解。|gmv,commission_revenue\nq2|流量规模是否拖累了成交？|拆解访客与转化|uv",
    hypotheses: "h1|费用增加可能抵消了收入增长。|费用明细与业务过程证据。|一次性投入或季节性可以解释。|核验不支持时保留其他解释。",
    evidence_plan: "e1|收入成本费用明细|内部数据|同范围同期间的财务记录|复核范围与计算关系|缺失时不输出仿成功结论|已核验",
    options: "promo_up|加大促销投入|短期起量，费用率上升，可能推高退款。"
  }));
  expect(fix.status).toBe(303);
  written = parseYaml(readFileSync(inst, "utf8"));
  // 编辑表单不触碰判断性质/核验状态（按 id 保留）
  expect(written.blueprint.hypotheses[0].judgment).toBe("事实");
  expect(written.blueprint.hypotheses[0].verified).toBe(true);
  delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).not.toContain("hypothesis-verification");
  expect(delivery).toContain("已核验 1");

  // 不存在的假设 → 404
  const miss = await post(base, "/instance/blueprint/hypotheses/nope/state", { judgment: "事实" });
  expect(miss.status).toBe(404);
  server.close();
});

// ===== 指标删除影响（D8）=====

test("指标删除：被引用指标先展示六路影响并阻断；无引用指标可删", async () => {
  const { dir, inst } = tmpFixture(); // 蓝图引用 gmv/commission_revenue/uv；场景种子引用 gmv 等
  const { server, base } = await startUi(inst, dir);
  const before = readFileSync(inst);

  // gmv：指标树 + 北极星 + 问题引用 + 场景引用 全列出
  const intent = await (await fetch(`${base}/instance/metrics/gmv/delete-intent`)).text();
  expect(intent).toContain("删除指标「gmv」前的影响确认");
  expect(intent).toContain("指标树");
  expect(intent).toContain("北极星");
  expect(intent).toContain("问题引用");
  expect(intent).toContain("场景引用");
  expect(intent).toContain("不能删除");
  expect(intent).not.toContain("确认删除 gmv"); // 被引用时不给删除按钮

  // 强删 → 422 阻断零写盘
  const del = await post(base, "/instance/metrics/gmv/delete", {});
  expect(del.status).toBe(422);
  expect(readFileSync(inst).equals(before)).toBe(true);

  // 无引用指标（实例自增 scratch_quality_score：不入树、无蓝图/场景/方法绑定引用）→ 可删
  const safeIntent = await (await fetch(`${base}/instance/metrics/scratch_quality_score/delete-intent`)).text();
  expect(safeIntent).toContain("未发现任何计算、树、问题、场景或方法绑定引用该指标");
  const delOk = await post(base, "/instance/metrics/scratch_quality_score/delete", {});
  expect(delOk.status).toBe(303);
  const written = parseYaml(readFileSync(inst, "utf8"));
  expect((written.added ?? []).map((m: { name: string }) => m.name)).not.toContain("scratch_quality_score");

  // 不存在指标 → 404
  expect((await fetch(`${base}/instance/metrics/ghost_metric/delete-intent`)).status).toBe(404);
  server.close();
});

// ===== 方法绑定（D4：写时引用完整性 / 交付适用性）=====

test("方法绑定：未知方法写时阻断；缺必需角色允许保存但呈现交付缺口并阻断发布", async () => {
  const { dir, inst } = tmpFixture();
  const { server, base } = await startUi(inst, dir);
  const before = readFileSync(inst);

  // 未知方法 ref → 422 零写盘（禁止凭名伪造方法）
  const bad = await post(base, "/instance/scenarios", {
    id: "ghost_method_scene",
    title: "坏方法场景",
    decision_purpose: "测试未知方法阻断。",
    question_tree: "",
    metric_usages: "",
    method_refs: "",
    method_bindings: "ghost-method@9.9.9|profit_result|gmv",
    evidence_requirements: "",
    output_spec: "",
    review_rules: ""
  });
  expect(bad.status).toBe(422);
  const badHtml = await bad.text();
  expect(badHtml).toContain("[scenario-method-ref]");
  expect(badHtml).toContain("ghost-method@9.9.9");
  expect(readFileSync(inst).equals(before)).toBe(true);

  // 合法方法但缺必需角色（profit-change-diagnosis 需 profit_result + expense_constraint，只绑一个）
  // → 写时放行（草稿允许缺口），交付视图呈现缺口，发布阻断
  const partial = await post(base, "/instance/scenarios", {
    id: "partial_binding_scene",
    title: "部分绑定场景",
    decision_purpose: "测试缺必需角色的交付门。",
    question_tree: "",
    metric_usages: "",
    method_refs: "",
    method_bindings: "profit-change-diagnosis@0.1.0|profit_result|gmv",
    evidence_requirements: "",
    output_spec: "",
    review_rules: ""
  });
  expect(partial.status).toBe(303);

  const delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).toContain("[scenario-method-role]");
  expect(delivery).toContain("必需角色");
  expect(delivery).toContain("expense_constraint");

  const rel = await post(base, "/instance/release", { version: "1.0.0", note: "" });
  expect(rel.status).toBe(422);
  expect(await rel.text()).toContain("必需角色");
  expect(existsSync(join(dir, "releases"))).toBe(false);
  server.close();
});

// ===== 方法库与另存方法（T10）=====

test("方法库：列表/详情/404；另存方法落盘 templates/methods 并可被详情页打开", async () => {
  // 临时模板库（save-as-method 写 methods/，隔离仓内真实模板）
  const dir = mkdtempSync(join(tmpdir(), "mf-bp-method-"));
  const tdir = join(dir, "templates");
  cpSync("templates", tdir, { recursive: true });
  const inst = join(dir, "instance.yaml");
  copyFileSync("test/fixtures/instance-ecommerce.yaml", inst);
  const { server, base } = await startUi(inst, dir, tdir);

  const list = await (await fetch(`${base}/templates/methods`)).text();
  expect(list).toContain("profit-change-diagnosis");
  expect(list).toContain("strategic-options-comparison");
  expect(list).toContain("association-vs-increment");
  // /templates/methods 不被 /templates/:id 通配吞掉
  expect(list).toContain("分析方法库");

  const detail = await (await fetch(`${base}/templates/methods/profit-change-diagnosis`)).text();
  expect(detail).toContain("利润结果");
  expect(detail).toContain("限制");
  expect((await fetch(`${base}/templates/methods/nope-method`)).status).toBe(404);

  // 另存方法：表单预填（场景决策用途 → purpose/description；问题树 → 步骤）
  const form = await (await fetch(`${base}/instance/scenarios/gmv_gap_diagnosis/save-as-method`)).text();
  expect(form).toContain('action="/instance/scenarios/gmv_gap_diagnosis/save-as-method"');
  expect(form).toContain("GMV 差距诊断");

  const save = await post(base, "/instance/scenarios/gmv_gap_diagnosis/save-as-method", {
    id: "gmv-gap-playbook",
    name: "GMV 差距诊断套路",
    family: "描述分解",
    purpose: "定位 GMV 差距的量价来源",
    description: "把 GMV 差距拆到流量、转化、客单三侧。",
    contexts: "经营改善",
    steps: "复核口径|同范围同期间\n分解差距|流量转化客单",
    evidence: "GMV 与分项指标序列。",
    limits: "分解不证明因果。",
    references: "公开电商分析实务"
  });
  expect(save.status).toBe(303);
  expect(save.headers.get("location")).toBe("/templates/methods/gmv-gap-playbook");

  const savedFile = join(tdir, "methods", "gmv-gap-playbook.yaml");
  expect(existsSync(savedFile)).toBe(true);
  const saved = parseYaml(readFileSync(savedFile, "utf8"));
  expect(saved.method.id).toBe("gmv-gap-playbook");
  expect(saved.method.version).toBe("0.1.0");
  expect(saved.roles.map((r: { id: string }) => r.id)).toEqual(["outcome", "driver", "guardrail"]);
  expect(saved.roles.find((r: { id: string }) => r.id === "guardrail").required).toBe(false);

  // 新详情页可打开；重复 id → 422 零写盘
  expect((await fetch(`${base}/templates/methods/gmv-gap-playbook`)).status).toBe(200);
  const dup = await post(base, "/instance/scenarios/gmv_gap_diagnosis/save-as-method", {
    id: "gmv-gap-playbook", name: "x", family: "x", purpose: "x", description: "x",
    contexts: "经营改善", steps: "s|d", evidence: "e", limits: "l", references: "r"
  });
  expect(dup.status).toBe(422);
  expect(await dup.text()).toContain("已存在");
  server.close();
});

// ===== 粘贴导入（次要起点）=====

test("导入：方法 YAML 预览 → 保存落盘；坏 YAML 422；重复 id 422；指标模板入库", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-bp-import-"));
  const tdir = join(dir, "templates");
  cpSync("templates", tdir, { recursive: true });
  const { server, base } = await startUi(undefined, dir, tdir);

  const home = await (await fetch(`${base}/import`)).text();
  expect(home).toContain('action="/import/preview"');
  expect(home).toContain("粘贴外部模板 YAML");

  const methodYaml = `method:
  id: churn-driver-review
  name: 流失驱动复盘
  version: 0.1.0
  description: 复盘流失的结构来源。
  references:
    - 公开留存分析实务
contexts:
  - 经营改善
family: 描述分解
purpose: 定位流失来源
roles: []
steps:
  - title: 圈定流失口径
evidence: 分群留存序列。
limits: 不证明干预效果。
provenance:
  origin: manual
`;
  const preview = await post(base, "/import/preview", { kind: "method", source: methodYaml });
  expect(preview.status).toBe(200);
  const previewHtml = await preview.text();
  expect(previewHtml).toContain("导入预览 · 流失驱动复盘（churn-driver-review）");
  expect(previewHtml).toContain("templates/methods/churn-driver-review.yaml");
  expect(previewHtml).toContain("无（定性方法）");

  const save = await post(base, "/import/save", { kind: "method", source: methodYaml });
  expect(save.status).toBe(303);
  expect(save.headers.get("location")).toBe("/templates/methods/churn-driver-review");
  expect(existsSync(join(tdir, "methods", "churn-driver-review.yaml"))).toBe(true);

  // 坏 YAML → 422；重复 id → 422
  expect((await post(base, "/import/preview", { kind: "method", source: "method: [broken" })).status).toBe(422);
  const dup = await post(base, "/import/save", { kind: "method", source: methodYaml });
  expect(dup.status).toBe(422);
  expect(await dup.text()).toContain("已存在");

  // 指标模板入库（最小合法 TemplateSchema）
  const metricTpl = readFileSync("templates/cloud-cost.yaml", "utf8").replace('id: cloud-cost', 'id: cloud-cost-copy');
  const saveTpl = await post(base, "/import/save", { kind: "metric", source: metricTpl });
  expect(saveTpl.status).toBe(303);
  expect(saveTpl.headers.get("location")).toBe("/templates/cloud-cost-copy");
  expect(existsSync(join(tdir, "cloud-cost-copy.yaml"))).toBe(true);
  server.close();
});

// ===== NL 创建流（faux 确定性后端，零网络）=====

const FAUX_BP = JSON.stringify({
  blueprint: {
    title: "门店扩张选择分析体系",
    intent: "设计具体分析方案",
    purpose: "评估是否继续扩店，比较候选道路的收益与代价。",
    decision: "下一阶段是否继续扩店？",
    boundary: "不承诺资源投入；选址执行归运营。",
    deliverable: "候选道路比较与试点建议。",
    contexts: ["战略选择"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "现有店型是否值得复制？", detail: "看单店回收。", metric_refs: [] }],
    hypotheses: [
      { id: "h1", statement: "现有店型可回收。", support: "单店模型。", counter: "样本期太短。", change_condition: "回收期超阈值则放弃。" }
    ],
    evidence_plan: [
      { id: "e1", name: "单店回收模型", kind: "测算模型", source: "财务与运营记录", check: "复核假设参数", insufficiency: "缺失时只输出定性比较" }
    ],
    options: [
      { id: "expand", name: "选择性继续扩店", tradeoff: "占用资本；需证明店型可复制。" },
      { id: "hold", name: "暂停扩店优化存量", tradeoff: "放弃增长窗口。" }
    ]
  },
  added_metrics: [],
  added_scenarios: []
});

test("AT2 零指标战略：首页一句话 → faux 草稿 → 预览 → 采纳建空白工作稿 → 复核 → 发布零指标包", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-bp-create-"));
  const envFile = join(dir, ".env.local");
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_BP });
  const { server, base } = await startUi(undefined, dir);

  // 空描述 → 422
  expect((await post(base, "/blueprint/generate", { describe: "" })).status).toBe(422);

  const gen = await post(base, "/blueprint/generate", { describe: "销售在增长，利润却下降，是否继续扩店？" });
  expect(gen.status).toBe(303);
  const jobId = gen.headers.get("location")!.split("/").pop()!;
  // 等 job 完成（faux 即时，轮询兜底）
  let previewRes: Response | undefined;
  for (let i = 0; i < 50; i++) {
    const jr = await fetch(`${base}/drafts/jobs/${jobId}`, { redirect: "manual" });
    if (jr.status === 303) {
      expect(jr.headers.get("location")).toBe("/blueprint/preview");
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  previewRes = await fetch(`${base}/blueprint/preview`);
  expect(previewRes.status).toBe(200);
  const preview = await previewRes.text();
  expect(preview).toContain("门店扩张选择分析体系");
  expect(preview).toContain("AI 建议 · 先看影响再决定");
  expect(preview).toContain("零指标定性设计"); // 不为填满指标表编造量化定义
  expect(preview).toContain("选择性继续扩店");

  // 采纳并创建（目录名校验：坏名字 422）
  expect((await post(base, "/blueprint/apply-create", { name: "Bad Name" })).status).toBe(422);
  const apply = await post(base, "/blueprint/apply-create", { name: "store-expansion" });
  expect(apply.status).toBe(303);
  expect(apply.headers.get("location")).toBe("/instance/overview");

  // 空白基座工作稿：无 base、零指标、blueprint 落盘
  const written = parseYaml(readFileSync(join(dir, "store-expansion", "instance.yaml"), "utf8"));
  expect(written.base).toBeUndefined();
  expect(written.added ?? []).toHaveLength(0);
  expect(written.blueprint.title).toBe("门店扩张选择分析体系");
  expect(written.blueprint.provenance.prompt_version).toBe("v1.0.1"); // D9 corrected contract retains an explicit prompt version

  // 总览/交付渲染；复核确认 → 就绪；发布零指标包成功（D13 + A04 兼容面）
  const overview = await (await fetch(`${base}/instance/overview`)).text();
  expect(overview).toContain("（空白起点）");
  expect(overview).toContain("现有店型是否值得复制？");
  await post(base, "/instance/review/confirm", { confirmed_by: "战略负责人" });
  const delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).toContain("设计就绪");
  const rel = await post(base, "/instance/release", { version: "0.1.0", note: "" });
  expect(rel.status).toBe(200);
  // 包 id = 实例文件名 slug（CLI/UI 共用既有语义，含向导与 NL 创建工作稿）
  expect(await rel.text()).toContain("发布成功 · instance@0.1.0");
  const pkg = parseYaml(readFileSync(join(dir, "releases", "instance", "0.1.0.sap.yaml"), "utf8"));
  expect(pkg.blueprint.title).toBe("门店扩张选择分析体系");
  expect(pkg.metrics).toHaveLength(0); // 零指标定性设计包
  expect(pkg.blueprint.review).toBeUndefined();
  server.close();
});

test("AT1 经营诊断（模板起点）：蓝图修正 faux → 预览 → 采纳替换 → 复核发布含 blueprint 段", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml");
  const envFile = join(dir, ".env.local");
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, {
    MF_LLM_BACKEND: "faux",
    MF_FAUX_RESPONSE: JSON.stringify({
      blueprint: {
        title: "利润变化诊断体系",
        intent: "设计具体分析方案",
        purpose: "定位利润变化来源并比较调整方案。",
        decision: "利润下降的主因是什么，应调整什么？",
        boundary: "诊断在先，行动批准归业务负责人。",
        deliverable: "归因结论与调整建议。",
        contexts: ["经营改善"],
        organizations: ["假设先行"],
        questions: [{ id: "q1", title: "利润差距由哪些部分组成？", detail: "分解。", metric_refs: ["gmv", "commission_revenue"] }],
        hypotheses: [{ id: "h1", statement: "费用增加抵消收入增长。", support: "费用明细。", counter: "一次性投入。", change_condition: "核验不支持时换解释。" }],
        evidence_plan: [{ id: "e1", name: "费用明细", kind: "内部数据", source: "财务记录", check: "范围复核", insufficiency: "缺失不输出结论" }],
        options: []
      },
      added_metrics: [],
      added_scenarios: [
        {
          id: "profit_diag", title: "利润变化诊断", decision_purpose: "定位利润变化来源",
          question_tree: [{ id: "root", label: "利润变化多少", metric: "commission_revenue" }],
          metric_usages: [{ metric: "commission_revenue", role: "outcome" }],
          method_refs: [],
          method_bindings: [{ method_ref: "profit-change-diagnosis@0.1.0", role: "profit_result", metric: "commission_revenue" }]
        }
      ]
    })
  });
  const { server, base } = await startUi(inst, dir);

  const gen = await post(base, "/instance/blueprint/generate", { describe: "销售在增长，利润却下降。" });
  expect(gen.status).toBe(303);
  const jobId = gen.headers.get("location")!.split("/").pop()!;
  for (let i = 0; i < 50; i++) {
    const jr = await fetch(`${base}/drafts/jobs/${jobId}`, { redirect: "manual" });
    if (jr.status === 303) {
      expect(jr.headers.get("location")).toBe("/instance/blueprint/preview");
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const preview = await (await fetch(`${base}/instance/blueprint/preview`)).text();
  expect(preview).toContain("利润变化诊断体系");
  expect(preview).toContain("利润变化诊断"); // 建议场景段
  expect(preview).toContain('action="/instance/blueprint/apply"');

  const apply = await post(base, "/instance/blueprint/apply", {});
  expect(apply.status).toBe(303);
  expect(apply.headers.get("location")).toBe("/instance/overview");

  const written = parseYaml(readFileSync(inst, "utf8"));
  expect(written.blueprint.title).toBe("利润变化诊断体系");
  expect(written.added_scenarios.map((s: { id: string }) => s.id)).toContain("profit_diag");
  // 场景绑定的方法引用合法（profit-change-diagnosis 在内置库），但缺必需角色 expense_constraint → 交付缺口
  const delivery = await (await fetch(`${base}/instance/delivery`)).text();
  expect(delivery).toContain("expense_constraint");

  // 补齐绑定（三必需角色）→ 缺口清零 → 复核 → 发布（包内 blueprint 段剥 review）
  await post(base, "/instance/scenarios/profit_diag", {
    id: "profit_diag",
    title: "利润变化诊断",
    decision_purpose: "定位利润变化来源",
    question_tree: "root|利润变化多少||commission_revenue",
    metric_usages: "commission_revenue|outcome|",
    method_refs: "",
    method_bindings: "profit-change-diagnosis@0.1.0|profit_result|commission_revenue\nprofit-change-diagnosis@0.1.0|gross_profit_comp|gmv\nprofit-change-diagnosis@0.1.0|expense_constraint|marketing_spend",
    evidence_requirements: "",
    output_spec: "",
    review_rules: ""
  });
  await post(base, "/instance/review/confirm", { confirmed_by: "业务负责人" });
  const rel = await post(base, "/instance/release", { version: "1.0.0", note: "" });
  expect(rel.status).toBe(200);

  const pkg = parseYaml(readFileSync(join(dir, "releases", "instance", "1.0.0.sap.yaml"), "utf8"));
  expect(pkg.blueprint.title).toBe("利润变化诊断体系");
  expect(pkg.blueprint.review).toBeUndefined(); // D12：复核状态不随包携带
  server.close();
});

test("AT3 独立数据专题（既有实例 NL 修正入口）：放弃草案不改工作稿", async () => {
  const { dir, inst } = tmpFixture(); // 已有蓝图
  const envFile = join(dir, ".env.local");
  const { writeManagedEnv } = await import("../../src/ui/env-file.js");
  await writeManagedEnv(envFile, { MF_LLM_BACKEND: "faux", MF_FAUX_RESPONSE: FAUX_BP });
  const { server, base } = await startUi(inst, dir);

  const before = readFileSync(inst);
  const gen = await post(base, "/instance/blueprint/refine", { instruction: "补充增长方向的假设" });
  expect(gen.status).toBe(303);
  const jobId = gen.headers.get("location")!.split("/").pop()!;
  for (let i = 0; i < 50; i++) {
    const jr = await fetch(`${base}/drafts/jobs/${jobId}`, { redirect: "manual" });
    if (jr.status === 303) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  // 预览呈现建议，但选择放弃 → 实例文件字节零变化
  const preview = await (await fetch(`${base}/instance/blueprint/preview`)).text();
  expect(preview).toContain('action="/instance/blueprint/discard"');
  const discard = await post(base, "/instance/blueprint/discard", {});
  expect(discard.status).toBe(303);
  expect(readFileSync(inst).equals(before)).toBe(true);
  expect(existsSync(join(dir, "draft.pending.yaml"))).toBe(false);
  server.close();
});
