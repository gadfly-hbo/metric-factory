#!/usr/bin/env zsh
# Metric Factory · LLM 真实链路冒烟（手动执行，发布门槛，不进 CI）
#
# 用途：验证真实 provider 下 generate / refine 全链路可用（管道 + 输出格式），
#       并把模型原始输出留档到 /tmp 供人工评估口径质量（红队 kill-assumption #1）。
# 前置（三选一）：
#   1) 真值表已验证模型（M1 起默认循环两候选，推荐）：
#      minimax-cn/MiniMax-M3 · xiaomi-token-plan-cn/mimo-v2.6-flash
#      —— 密钥缺失时本脚本自动从 ~/.pi/agent/auth.json 抽取注入（已设变量优先，不覆盖；
#         此为 smoke 专用 dev 便利，与 M2 产品面密钥自动发现无关）
#   2) pi-ai 目录内模型：export MF_LLM_MODEL=openai/gpt-4o + export OPENAI_API_KEY=sk-...
#      （catalog 回退为最佳-effort 兼容路径，协议经 openai-completions 映射）
#   3) OpenAI 兼容内部网关：export MF_LLM_BASE_URL=https://your-gateway/v1（协议缺省
#      openai-completions，MF_LLM_API=anthropic-messages 可覆盖）
# 用法：zsh scripts/llm-smoke.sh [实例路径（默认 examples/ecommerce-instance.yaml）]
#       设置 MF_LLM_MODEL 时退化为单模型冒烟（向后兼容）
set -euo pipefail

INSTANCE="${1:-examples/ecommerce-instance.yaml}"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR="/tmp/mf-llm-smoke-$STAMP"
mkdir -p "$OUT_DIR"

AUTH_JSON="$HOME/.pi/agent/auth.json"

# smoke 专用 dev 便利：从 pi CLI 凭据文件抽取 provider key（已设环境变量优先，不覆盖）
inject_key_from_auth_json() {
  local env_name="$1" provider="$2"
  if [ -n "${(P)env_name:-}" ]; then return 0; fi
  if [ ! -f "$AUTH_JSON" ]; then return 1; fi
  local key
  key=$(node -e "try{const a=require('$AUTH_JSON');process.stdout.write(a['$provider']?.key??'')}catch{process.stdout.write('')}")
  if [ -n "$key" ]; then export "$env_name=$key"; echo "  · $env_name 已从 auth.json($provider) 注入"; return 0; fi
  return 1
}

run_smoke_for_model() {
  local model="$1"
  echo ""
  echo "######## 模型：$model ########"
  export MF_LLM_MODEL="$model"
  local tag="${model//\//_}"
  local dir="$OUT_DIR/$tag"
  mkdir -p "$dir"

  echo "== [1/4] generate --dry-run（零成本，检查 prompt 与 token） =="
  node dist/cli.js generate "$INSTANCE" \
    --describe "我们是跨境电商平台，主打低价秒杀，会员体系刚上线" \
    --dry-run | tee "$dir/generate-prompt.txt"

  echo "== [2/4] generate 真实调用 =="
  node dist/cli.js generate "$INSTANCE" \
    --describe "我们是跨境电商平台，主打低价秒杀，会员体系刚上线" \
    --out "$dir/generate-draft.yaml" | tee "$dir/generate-summary.txt" || return 1

  echo "== [3/4] refine 真实调用 =="
  node dist/cli.js refine "$INSTANCE" \
    --instruction "把 GMV 口径改为含退款中；新增会员 GMV；删除 NPS" \
    --out "$dir/refine-draft.yaml" | tee "$dir/refine-summary.txt" || return 1

  echo "== [4/4] apply + validate（不写回原实例，用副本） =="
  cp "$INSTANCE" "$dir/smoke-instance.yaml"
  node dist/cli.js apply "$dir/smoke-instance.yaml" "$dir/generate-draft.yaml" || return 1
  node dist/cli.js validate "$dir/smoke-instance.yaml" || true
  node dist/cli.js review "$dir/smoke-instance.yaml" || true
}

if [ -n "${MF_LLM_MODEL:-}" ]; then
  # 单模型模式（向后兼容）：调用方自备 MF_LLM_MODEL 与对应 key
  run_smoke_for_model "$MF_LLM_MODEL"
else
  # 默认：循环两真值表已验证候选，缺 key 候选跳过并记录；
  # 逐候选容错（REVIEW F2）：失败记入该候选目录并继续下一候选，结尾汇总——单命令双候选留档恒可达
  RAN=0
  FAILED=0
  for pair in \
    "minimax-cn/MiniMax-M3 MINIMAX_CN_API_KEY minimax-cn" \
    "xiaomi-token-plan-cn/mimo-v2.6-flash XIAOMI_TOKEN_PLAN_CN_API_KEY xiaomi-token-plan-cn"; do
    set -- $=pair
    model="$1"; env_name="$2"; provider="$3"
    echo ""
    echo "== 候选 $model =="
    if [ -z "${(P)env_name:-}" ]; then
      inject_key_from_auth_json "$env_name" "$provider" || { echo "  · 跳过：$env_name 未设置且 auth.json 无 $provider.key"; continue; }
    fi
    tag="${model//\//_}"
    if run_smoke_for_model "$model"; then
      echo "  · 结果：成功"
    else
      echo "候选 $model 冒烟失败（exit=$?）——引擎路径或模型输出质量问题，详见本目录留档" | tee "$OUT_DIR/$tag/smoke-failure.txt"
      FAILED=$((FAILED+1))
    fi
    RAN=$((RAN+1))
  done
  echo ""
  echo "== 汇总：执行 $RAN 候选，成功 $((RAN-FAILED))，失败 $FAILED =="
  if [ "$RAN" -eq 0 ]; then
    echo "ERROR 真值表两候选均无可用密钥（auth.json 与环境变量均无），无法真实冒烟" >&2
    exit 1
  fi
  if [ "$FAILED" -gt 0 ]; then
    echo "WARN 有候选冒烟失败（留档齐全），按发布门槛需人工评估后放行" >&2
    exit 1
  fi
fi

echo ""
echo "== 冒烟完成。留档目录：$OUT_DIR =="
echo "人工评估项：generate-draft.yaml 中候选指标的口径正确性（分子/分母/周期/剔除规则）"
