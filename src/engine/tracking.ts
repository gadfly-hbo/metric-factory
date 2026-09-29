import type { MaterializedInstance } from "./materialize.js";

export interface TrackingEvent {
  name: string;
  trigger: string;
  properties: string[];
  metrics: string[];
}

// 指标名关键词 → 事件动词域（GRILL 决议 #5）；无命中 → track_<metric>
const VERB_MAP: [RegExp, string][] = [
  [/login/, "login"],
  [/signup|register/, "register"],
  [/search/, "search"],
  [/click/, "click"],
  [/cart/, "add_cart"],
  [/submit/, "submit"],
  [/pay|order|gmv|purchase|buy/, "pay"],
  [/refund|return/, "refund"],
  [/share/, "share"],
  [/publish|post/, "publish"],
  [/interact|review|comment|rating/, "interact"],
  [/view|visit|uv|play|impression|dau|session|duration/, "view"]
];

const COMMON_PROPERTIES = ["event_name", "event_time", "user_id", "device_id"];

export function deriveTrackingPlan(materialized: MaterializedInstance): TrackingEvent[] {
  // 旅程树（category=旅程）+ 北极星候选（PRD：最需要「有数可采」的指标优先入计划）
  const journeyMetrics = new Set<string>();
  for (const tree of materialized.trees) {
    if (tree.category === "旅程") {
      for (const c of tree.children) journeyMetrics.add(c);
    }
  }
  for (const c of materialized.north_star.candidates) journeyMetrics.add(c.metric);
  const targets = materialized.metrics.filter((m) => journeyMetrics.has(m.name));

  const events: TrackingEvent[] = [];
  for (const m of targets) {
    const verb = VERB_MAP.find(([re]) => re.test(m.name))?.[1];
    const name = verb ? `${verb}_${m.name.replace(/_rate$|_count$|_within_\w+$/, "")}`.replace(/__+/g, "_") : `track_${m.name}`;
    events.push({
      name,
      trigger: `用户完成「${m.display_name}」对应行为：${m.definition}`,
      properties: [...COMMON_PROPERTIES, ...m.dimensions],
      metrics: [m.name]
    });
  }
  return events;
}

export function toJsonSchemas(events: TrackingEvent[]): unknown[] {
  return events.map((e) => ({
    $schema: "http://json-schema.org/draft-07/schema#",
    title: e.name,
    type: "object",
    required: COMMON_PROPERTIES,
    properties: {
      event_name: { type: "string", const: e.name },
      event_time: { type: "string", format: "date-time" },
      user_id: { type: "string" },
      device_id: { type: "string" },
      ...Object.fromEntries(
        e.properties
          .filter((p) => !COMMON_PROPERTIES.includes(p))
          .map((p) => [p, { type: "string", description: "维度属性（按真实采集端补类型）" }])
      )
    }
  }));
}
