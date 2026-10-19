// A2 T1：复刻 oracle 集成测试。
// 语义：MF_DEMO_DIR 指向评审原型目录时，对 demo 本体跑 compare——守护「复刻目标未漂移」
//（基线由 demo 本体拍摄）。CI/无 demo 目录时 skip 并显式标注（本地工具仓的诚实降级）。
// 移植产物（T2+）的对照断言在各自切片的 Playwright 测试中复用同一 capture 模块。
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const DEMO = process.env.MF_DEMO_DIR ?? "/Users/huangbo/Documents/Codex/2026-10-18/task/metric-factory-product-prototype";
const hasDemo = existsSync(path.join(DEMO, "app.js"));

describe.runIf(hasDemo)("复刻 oracle：demo 本体 vs 基线", () => {
  it("7 视图骨架/几何与 5 项行为断言全绿（demo 未漂移）", () => {
    expect.hasAssertions();
    let out: string;
    try {
      out = execFileSync("node", ["test/ui/oracle/capture.mjs", "--base", DEMO, "--mode", "compare"], {
        encoding: "utf8",
        timeout: 180_000,
      });
    } catch (e) {
      const err = e as { stdout?: string };
      throw new Error(`oracle compare 失败（demo 与基线漂移？）:\n${err.stdout ?? ""}`);
    }
    const result = JSON.parse(out.slice(out.indexOf("{")));
    expect(result.ok, JSON.stringify(result, null, 2)).toBe(true);
    expect(Object.keys(result.views)).toHaveLength(7);
    for (const [name, status] of Object.entries(result.views)) {
      expect(status, `视图 ${name}`).toBe("pass");
    }
    expect(result.behavior).toEqual({
      dialogOpensNative: true,
      escClosesDialog: true,
      focusReturnsToOpener: true,
      n390NoOverflowWork: true,
      skipLinkPresent: true,
    });
  }, 200_000);
});

describe.skipIf(hasDemo)("复刻 oracle（降级）", () => {
  it("无 demo 目录：显式标注跳过（复刻对照须在有原型的机器跑）", () => {
    expect(true).toBe(true); // skipIf 分支——CI 上此套件不提供 demo 对照覆盖
  });
});
