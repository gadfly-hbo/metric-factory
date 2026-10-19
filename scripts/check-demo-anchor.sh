#!/bin/zsh
# A2 复刻防漂移锚：对照评审原型 5 文件与仓内字节快照（test/fixtures/demo-anchor/）。
# 原型目录无版本控制——本脚本检测「复刻目标被无声改动」；demo 若有意更新，先重拍基线再 --refresh。
# 用法：zsh scripts/check-demo-anchor.sh [--refresh]
set -euo pipefail
DEMO="${MF_DEMO_DIR:-/Users/huangbo/Documents/Codex/2026-10-18/task/metric-factory-product-prototype}"
ANCHOR="$(dirname "$0")/../test/fixtures/demo-anchor"
FILES=(index.html style.css app.js analysis-model.js 验证记录.md)

if [[ ! -d "$DEMO" ]]; then
  echo "demo 目录不存在：$DEMO（可用 MF_DEMO_DIR 覆盖）"; exit 2
fi

if [[ "${1:-}" == "--refresh" ]]; then
  for f in "${FILES[@]}"; do cp "$DEMO/$f" "$ANCHOR/$f"; done
  (cd "$ANCHOR" && shasum -a 256 "${FILES[@]}" > hashes.txt)
  echo "已刷新锚点快照。注意：必须重跑 oracle 基线（node test/ui/oracle/capture.mjs --base '$DEMO' --mode update）并重新过 UI-GATE。"
  exit 0
fi

cd "$ANCHOR"
fail=0
for f in "${FILES[@]}"; do
  live=$(shasum -a 256 "$DEMO/$f" | cut -d' ' -f1)
  pinned=$(grep "  $f\$" hashes.txt | cut -d' ' -f1)
  if [[ "$live" != "$pinned" ]]; then
    echo "DRIFT: $f"; echo "  锚点 $pinned"; echo "  现场 $live"; fail=1
  fi
done
if [[ $fail -eq 1 ]]; then
  echo "评审原型与锚点不一致。若为有意更新：--refresh 后重拍基线 + 重过 UI-GATE；否则复刻目标被改动，oracle 基线已失效。"
  exit 1
fi
echo "锚点一致（5 文件 SHA-256 == 快照）。"
