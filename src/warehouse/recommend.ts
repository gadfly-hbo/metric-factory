import type { Warehouse } from "./parse.js";

export interface MappableMetric {
  name: string;
  display_name: string;
  definition: string;
}

export interface Recommendation {
  metric: string;
  model: string;
  column: string;
  score: number;
  signals: string[];
}

export interface RecommendOutcome {
  recommended: Recommendation[];
  needsManual: string[];
}

// 中英同义词表：中文口径词根 → 英文列名词根（≥20 组；display_name 与 definition 均参与匹配）
const SYNONYMS: Record<string, string[]> = {
  成交额: ["amount", "gmv", "revenue"],
  金额: ["amount", "revenue"],
  收入: ["revenue", "income", "amount"],
  用户: ["user", "customer", "buyer"],
  访客: ["uv", "visit", "visitor"],
  访问: ["visit", "traffic", "session"],
  订单: ["order"],
  转化: ["cvr", "conversion"],
  客单: ["aov", "basket"],
  退款: ["refund"],
  复购: ["repeat", "repurchase"],
  留存: ["retention"],
  注册: ["signup", "register"],
  支付: ["pay", "payment"],
  点击: ["click"],
  曝光: ["impression", "exposure"],
  转发: ["share"],
  分享: ["share"],
  时长: ["duration", "time"],
  数量: ["count"],
  次数: ["count"],
  人数: ["count"],
  搜索: ["search"],
  购物车: ["cart"],
  评论: ["review", "comment"],
  评分: ["rating", "score"],
  品类: ["category"],
  渠道: ["channel"],
  地区: ["region"],
  会员: ["member", "vip"]
};

const RECOMMEND_THRESHOLD = 0.6;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function synonymRoots(text: string): Map<string, string> {
  const roots = new Map<string, string>(); // english root -> chinese keyword
  for (const [cn, ens] of Object.entries(SYNONYMS)) {
    if (text.includes(cn)) {
      for (const en of ens) roots.set(en, cn);
    }
  }
  return roots;
}

// 信号打分：精确(1.0) > 包含(0.8) > 同义词(0.7) > 口径关键词(0.5)，取最高分为综合分
function scoreColumn(metric: MappableMetric, modelName: string, column: string): { score: number; signals: string[] } {
  const mN = normalize(metric.name);
  const cN = normalize(column);
  const signals: { score: number; label: string }[] = [];

  if (mN && mN === cN) {
    signals.push({ score: 1, label: `精确命中：指标名 ${metric.name} = 列名 ${column}` });
  }
  if (mN && cN && (mN.includes(cN) || cN.includes(mN))) {
    // 比率/占比类指标映射到绝对值列是语义错配（如 *_gmv_share → gmv）：包含命中降档为口径级信号
    const ratioLike = /_(share|rate|ratio)$/.test(metric.name) && !/_(share|rate|ratio)$/.test(column);
    signals.push({
      score: ratioLike ? 0.5 : 0.8,
      label: `包含命中：${metric.name} ~ ${modelName}.${column}${ratioLike ? "（比率类降档：列为绝对值，需人工判断）" : ""}`
    });
  }
  const nameRoots = synonymRoots(metric.display_name);
  for (const [root, cn] of nameRoots) {
    if (cN.includes(root)) {
      signals.push({ score: 0.7, label: `同义词命中：${cn} ↔ ${root} ⊂ ${column}` });
    }
  }
  const defRoots = synonymRoots(metric.definition);
  for (const [root, cn] of defRoots) {
    if (cN.includes(root)) {
      signals.push({ score: 0.5, label: `口径关键词命中：${cn} ↔ ${root} ⊂ ${column}` });
    }
  }

  const score = Math.max(0, ...signals.map((s) => s.score));
  return { score, signals: signals.map((s) => `${s.score.toFixed(1)} ${s.label}`) };
}

export function recommendMappings(metrics: MappableMetric[], warehouse: Warehouse): RecommendOutcome {
  const recommended: Recommendation[] = [];
  const needsManual: string[] = [];

  for (const metric of metrics) {
    let best: Recommendation | null = null;
    for (const model of warehouse.models) {
      for (const col of model.columns) {
        const { score, signals } = scoreColumn(metric, model.name, col.name);
        if (score > 0 && (!best || score > best.score)) {
          best = { metric: metric.name, model: model.name, column: col.name, score, signals };
        }
      }
    }
    if (best && best.score >= RECOMMEND_THRESHOLD) {
      recommended.push(best);
    } else {
      needsManual.push(metric.name);
    }
  }

  recommended.sort((a, b) => b.score - a.score);
  return { recommended, needsManual };
}
