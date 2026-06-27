#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$REPO_DIR/ingest/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run_$(date -u +%Y%m%d_%H%M%S).log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting IGE pipeline"

cd "$REPO_DIR"

# Virtualenv setup
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r ingest/requirements.txt

# Fetch
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Fetching sources..."
python ingest/fetch_sources.py

# Compute
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Computing IGE..."
python ingest/compute_ige.py

# Run tests
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Running sanity tests..."
python ingest/test_compute.py || echo "WARNING: some sanity tests failed — check output above"

# Commit and push only if data changed
cd "$REPO_DIR"
git add data/
if git diff --cached --quiet; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] No data changes — skipping commit"
else
    git commit -m "data: update IGE $(date -u +%Y-%m-%d)"
    git push
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Pushed updated data"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Pipeline complete"
