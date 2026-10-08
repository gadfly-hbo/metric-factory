import { mkdtempSync, copyFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect } from "vitest";
import { createUiServer, listenUi } from "../../src/ui/server.js";

// SAP 语义包下载：与三格式同管线同 gate（createSapExporter 工厂复用）；文件名 <实例名>.sap.yaml（D2）
// 实例文件名刻意不用 instance.yaml，钉死 D2 口径：文件名 = 实例 YAML 文件名去后缀 slugify
function tmpFixture(fixture: string, name: string): { dir: string; inst: string } {
  const dir = mkdtempSync(join(tmpdir(), "mf-sap-"));
  const inst = join(dir, name);
  copyFileSync(`test/fixtures/${fixture}`, inst);
  return { dir, inst };
}

async function startUi(inst: string, dir: string) {
  const server = createUiServer({ templatesDir: "templates", workspaceDir: dir, envFilePath: join(dir, ".env.local"), instancePath: inst });
  const port = await listenUi(server, 0);
  return { server, base: `http://127.0.0.1:${port}` };
}

test("干净实例：SAP 下载 200 + attachment 文件名（D2 slug）+ 包字节契约", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const res = await fetch(`${base}/instance/export/sap`);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/yaml");
  expect(res.headers.get("content-disposition")).toContain('attachment; filename="ecommerce-instance.sap.yaml"');

  const raw = await res.text();
  // 规范化序列化保守加双引号（canonical 契约）：非标量字面以引号形态出现
  expect(raw).toContain('sap: "0.1"');
  expect(raw).toContain("runtime_state: design_only");
  expect(raw).toContain('fingerprint: "sha256:');
  expect(raw).toContain("namespace: mf.ecommerce-instance");
  server.close();
});

test("未审核 LLM 指标：SAP 导出 422 fail-closed 阻断（无 attachment，列未审核指标名并链接审核中心）", async () => {
  const { dir, inst } = tmpFixture("instance-llm-unreviewed.yaml", "blocked-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const res = await fetch(`${base}/instance/export/sap`);
  expect(res.status).toBe(422);
  // 阻断态零下载成功迹象（§5 negative）：无 attachment 响应头
  expect(res.headers.get("content-disposition")).toBeNull();
  const html = await res.text();
  // 钉死实际走的门：LLM 未审核触发器由 validate 门 llm-unreviewed 规则拦截（fail-closed 门 S2-1 不可达），
  // 页面标题为「导出前校验未通过」；侧栏导航恒含 /review 不算数
  expect(html).toContain("导出前校验未通过");
  expect(html).toContain("ai_suggested_magic_metric");
  expect(html).toContain("/review");
  server.close();
});

// 供应侧查重拒绝（B1 双出口等价）：added 指标与基模板重名 → SapAssemblyError(duplicate-identity)
// 在 UI 必须为带文字的 422 错误页，不得退化为兜底 500（CLI 同输入干净 exit 1）
test("查重拒绝：added 指标与基模板重名 → 422 供应侧 duplicate-identity 错误页（非 500，无 attachment）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mf-sap-dupe-ui-"));
  const inst = join(dir, "dupe-name.yaml");
  // fixture 构造与 CLI 查重 e2e 同源（added gmv 与基模板 gmv 重名，validateInstance 无查重规则，直达装配器）
  writeFileSync(
    inst,
    `instance:
  created_at: "2026-10-08T00:00:00.000Z"
base: ecommerce-marketplace@0.1.0
answers:
  revenue_model: 交易抽佣
  user_structure: 双边市场
  core_loop: 交易
  caliber: {}
caliber_switches: {}
removed: []
modified: []
added:
  - name: gmv
    display_name: 与模板重名的违规指标
    type: simple
    definition: 与基模板 gmv 重名，供应侧查重应拒绝
    dimensions: [channel]
    time_grains: [day]
    owner_role: 电商业务负责人
    caliber_switches: {}
    provenance:
      origin: manual
      note: duplicate name fixture
    review:
      required: false
`,
    "utf8"
  );
  const { server, base } = await startUi(inst, dir);

  const res = await fetch(`${base}/instance/export/sap`);
  expect(res.status).toBe(422);
  // 阻断态零下载成功迹象（§5 negative）：无 attachment 响应头
  expect(res.headers.get("content-disposition")).toBeNull();
  const html = await res.text();
  // 422 错误页带 rule 语义文案：标题 + duplicate-identity 规则名 + 重名信息（UI-contract §5 negative #2）
  expect(html).toContain("导出装配未通过");
  expect(html).toContain("duplicate-identity");
  expect(html).toContain("重名");
  expect(html).toContain("gmv");
  server.close();
});

test("实例页下载区：SAP 项恒居末位 + §4 术语逐字（标签 / 说明文案 / aria 关联）", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const html = await (await fetch(`${base}/instance`)).text();
  expect(html).toContain("导出 SAP 语义包");
  expect(html).toContain("SAP 语义包：JuanerAI 语义资产包（YAML，含指纹与出处）");
  expect(html).toContain('href="/instance/export/sap" aria-describedby="sap-export-note"');
  expect(html).toContain('id="sap-export-note"');
  // 末位钉死：SAP 链接在 mermaid 与 excel 之后（DOM 序 = Tab 序）
  const idxSap = html.indexOf("/instance/export/sap");
  expect(html.indexOf("/instance/export/mermaid")).toBeLessThan(idxSap);
  expect(html.indexOf("/instance/export/excel")).toBeLessThan(idxSap);
  expect(html.indexOf("/instance/export/metricflow")).toBeLessThan(idxSap);
  server.close();
});

test("未知格式 404：枚举串含 sap（D1 连带同步串）", async () => {
  const { dir, inst } = tmpFixture("instance-ecommerce.yaml", "ecommerce-instance.yaml");
  const { server, base } = await startUi(inst, dir);

  const res = await fetch(`${base}/instance/export/pdf`);
  expect(res.status).toBe(404);
  const html = await res.text();
  expect(html).toContain("可选：metricflow / excel / mermaid / sap");
  server.close();
});
