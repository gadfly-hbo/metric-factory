#!/usr/bin/env zsh
# Metric Factory · LLM 真实链路冒烟（手动执行，发布门槛，不进 CI）
#
# 用途：验证真实 provider 下 generate / refine 全链路可用（管道 + 输出格式），
#       并把模型原始输出留档到 /tmp 供人工评估口径质量（红队 kill-assumption #1）。
# 前置：配置真实 provider，例如：
#   export MF_LLM_MODEL=openai/gpt-4o          # pi-ai 目录内模型，<provider>/<model-id> 形式
#   export OPENAI_API_KEY=sk-...                # 或 ANTHROPIC_API_KEY
#   # OpenAI 兼容内部网关：export MF_LLM_BASE_URL=https://your-gateway/v1
# 用法：zsh scripts/llm-smoke.sh [实例路径（默认 examples/ecommerce-instance.yaml）]
set -euo pipefail

INSTANCE="${1:-examples/ecommerce-instance.yaml}"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR="/tmp/mf-llm-smoke-$STAMP"
mkdir -p "$OUT_DIR"

if [ -z "${MF_LLM_MODEL:-}" ]; then
  echo "ERROR 未设置 MF_LLM_MODEL（真实 provider 冒烟不支持 faux）" >&2
  exit 1
fi

echo "== [1/4] generate --dry-run（零成本，检查 prompt 与 token） =="
node dist/cli.js generate "$INSTANCE" \
  --describe "我们是跨境电商平台，主打低价秒杀，会员体系刚上线" \
  --dry-run | tee "$OUT_DIR/generate-prompt.txt"

echo "== [2/4] generate 真实调用 =="
node dist/cli.js generate "$INSTANCE" \
  --describe "我们是跨境电商平台，主打低价秒杀，会员体系刚上线" \
  --out "$OUT_DIR/generate-draft.yaml" | tee "$OUT_DIR/generate-summary.txt"

echo "== [3/4] refine 真实调用 =="
node dist/cli.js refine "$INSTANCE" \
  --instruction "把 GMV 口径改为含退款中；新增会员 GMV；删除 NPS" \
  --out "$OUT_DIR/refine-draft.yaml" | tee "$OUT_DIR/refine-summary.txt"

echo "== [4/4] apply + validate（不写回原实例，用副本） =="
cp "$INSTANCE" "$OUT_DIR/smoke-instance.yaml"
node dist/cli.js apply "$OUT_DIR/smoke-instance.yaml" "$OUT_DIR/generate-draft.yaml"
node dist/cli.js validate "$OUT_DIR/smoke-instance.yaml" || true
node dist/cli.js review "$OUT_DIR/smoke-instance.yaml" || true

echo ""
echo "== 冒烟完成。留档目录：$OUT_DIR =="
echo "人工评估项：generate-draft.yaml 中候选指标的口径正确性（分子/分母/周期/剔除规则）"
