import { expect, test } from "vitest";
import { generateDraft, generateRefineDraft } from "../../src/engine/generate.js";
import type { LlmClient } from "../../src/llm/index.js";

const METRICS = JSON.stringify([
  {
    name: "pv_count",
    display_name: "访客数",
    type: "simple",
    definition: "去重访客数",
    dimensions: ["channel"],
    time_grains: ["day"],
    owner_role: "增长负责人"
  }
]);

const REFINE = JSON.stringify({ caliber: {}, modified: [], removed: [], added: [] });

function truthClient(text: string, provider?: string, model?: string): LlmClient {
  return {
    async complete() {
      return { text, provider, model, taskId: "mf:generate-1" };
    }
  };
}

// M3 T4（D5/G4）：provenance.model = 实际出稿真值（provider/model），modelLabel 降级 fallback

test("generateDraft：completion 带真值 → provenance.model = provider/model", async () => {
  const r = await generateDraft(truthClient(METRICS, "minimax-cn", "MiniMax-M3"), { system: "s", user: "u" }, "d", "fallback-label", "now");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.draft.added[0]!.provenance.model).toBe("minimax-cn/MiniMax-M3");
    expect(r.draft.added[0]!.provenance.origin).toBe("llm");
  }
});

test("generateDraft：无真值（faux）→ provenance.model = fallback 标签", async () => {
  const r = await generateDraft(truthClient(METRICS), { system: "s", user: "u" }, "d", "fake", "now");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.draft.added[0]!.provenance.model).toBe("fake");
});

test("generateRefineDraft：同真值回填语义（generator.model）", async () => {
  const r = await generateRefineDraft(truthClient(REFINE, "xiaomi-token-plan-cn", "mimo-v2.6-flash"), { system: "s", user: "u" }, "i", "fallback", "now");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.draft.generator.model).toBe("xiaomi-token-plan-cn/mimo-v2.6-flash");
});
