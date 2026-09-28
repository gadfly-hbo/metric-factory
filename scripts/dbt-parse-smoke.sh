#!/usr/bin/env zsh
# Metric Factory · dbt parse 冒烟验证（手动执行，不进 CI）
#
# 用途：验证 metric-factory 导出的 MetricFlow YAML 能否被真实 dbt 解析。
# 前置：本机安装 dbt >= 1.8 与 duckdb 适配器（pip install dbt-core dbt-duckdb）
# 用法：zsh scripts/dbt-parse-smoke.sh <导出的 metricflow.yaml>
set -euo pipefail

EXPORT_FILE="${1:?用法: zsh scripts/dbt-parse-smoke.sh <metricflow.yaml>}"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# 1. 搭最小 dbt 项目
mkdir -p "$WORK/models" "$WORK/semantic_models"
cat > "$WORK/dbt_project.yml" << 'EOF'
name: mf_smoke
version: '1.0.0'
profile: mf_smoke
EOF
cat > "$WORK/profiles.yml" << 'EOF'
mf_smoke:
  target: dev
  outputs:
    dev:
      type: duckdb
      path: ':memory:'
      threads: 1
EOF
# 2. 占位模型（与导出物 model.ref 对齐）
REF_NAME=$(grep -m1 'ref:' "$EXPORT_FILE" | sed 's/.*ref: *//;s/ *$//')
cat > "$WORK/models/${REF_NAME}.sql" << EOF
select 1 as metric_date, 'placeholder' as channel
EOF

# 3. 导出物拆出 metrics + semantic_models 段并入项目
python3 - "$EXPORT_FILE" "$WORK" << 'EOF'
import sys, yaml
src, work = sys.argv[1], sys.argv[2]
text = open(src).read()
body = text.split("semantic_models:", 1)[1]
doc = yaml.safe_load("semantic_models:" + body)
out = []
for sm in doc.get("semantic_models", []):
    out.append({"semantic_models": [sm]})
for m in doc.get("metrics", []):
    out.append({"metrics": [m]})
with open(f"{work}/models/metrics.yml", "w") as f:
    yaml.safe_dump_all(out, f, sort_keys=False)
EOF

cd "$WORK"
export DBT_PROFILES_DIR="$WORK"
echo "== dbt parse（冒烟） =="
dbt parse --no-partial-parse
echo "== PASSED：导出物可被 dbt 解析 =="
