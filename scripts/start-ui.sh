#!/usr/bin/env bash
# 一键启动 Metric Factory 工作台（双端通用：Mac mini / MacBook）
# 参考 deep-research 的 启动深度研究.command 模式：
#   依赖缺失自动安装 → 构建产物缺失自动构建 → 起本机服务 → 健康检查 → 打开浏览器。
# 本机单用户：仅监听 127.0.0.1，不联网，不处理凭据。
# 端口默认 4173（被占用时自动顺延到 4174）；MF_UI_PORT 可覆盖。
# 测试/无浏览器环境：MF_UI_NO_OPEN=1 跳过 open。
set -e
cd "$(dirname "$0")/.."

echo "== Metric Factory 工作台 =="
if [ ! -d node_modules ]; then
  echo "[首次运行] 安装依赖…"
  npm install --no-audit --no-fund
fi
# 构建判定：产物缺失，或 src/templates/package.json 比产物新（拉取新代码后自动重建）
if [ ! -f dist/cli.js ] || [ -n "$(find src templates package.json -newer dist/cli.js -print -quit 2>/dev/null)" ]; then
  echo "[构建] 引擎与 UI（源码比产物新或缺产物）…"
  npm run build
fi

PORT="${MF_UI_PORT:-4173}"
if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then
  echo "[端口] ${PORT} 已被占用，改用 4174"
  PORT=4174
fi

# 实例自动发现：当前目录或 ./my-instance 下有 instance.yaml 则带入工作台
INSTANCE_ARGS=()
for CAND in instance.yaml my-instance/instance.yaml; do
  if [ -f "$CAND" ]; then
    INSTANCE_ARGS=(--instance "$CAND")
    echo "[实例] 使用 $CAND"
    break
  fi
done

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "[启动] 本机服务 http://127.0.0.1:${PORT} (Ctrl+C 退出)"
node dist/cli.js ui --port "$PORT" "${INSTANCE_ARGS[@]}" &
SERVER_PID=$!

for _ in $(seq 1 40); do
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/"; then break; fi
  sleep 1
done

if [ -z "${MF_UI_NO_OPEN:-}" ] && command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:${PORT}"
fi

wait "$SERVER_PID"
