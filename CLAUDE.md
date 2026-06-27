# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Python pipeline (ingest/)

```bash
# Setup
python3 -m venv .venv && source .venv/bin/activate
pip install -r ingest/requirements.txt

# Fetch raw data → ingest/raw/
python ingest/fetch_sources.py

# Compute IGE → data/ige-dataset-real.json + .min.json
python ingest/compute_ige.py

# Sanity tests (exit 1 on failure)
python ingest/test_compute.py

# Full pipeline (fetch → compute → test → git commit if data changed)
./run.sh
```

### Frontend (web/)

```bash
cd web
npm install
npm run dev      # Vite dev server
npm run build    # Production build → web/dist/
npm run preview  # Serve web/dist/
```

## Architecture

Two independent components share only the `data/` directory:

**`ingest/` — Python pipeline**
- `fetch_sources.py` — pulls World Bank API (paginated JSON), UCDP conflict CSV, and OWID governance CSV; writes to `ingest/raw/`
- `compute_ige.py` — reads raw CSVs, computes expanding z-scores (no look-ahead), applies hierarchical pillar weights, emits `data/ige-dataset-real.json` and `.min.json`
- `regions.py` — ISO-3 → World Bank region mapping; used by compute for `region` field and regional aggregates
- `test_compute.py` — standalone sanity tests against the output JSON; run directly, not via pytest

**`web/` — React SPA (Vite + Recharts)**
- Single file: `web/src/App.jsx` — all UI logic lives here (~1050 lines)
- Fetches dataset live from GitHub raw URL at runtime (no build-time data dependency)
- No routing, no state management library, no CSS framework — pure inline styles with design tokens in the `C` object

**`data/` — JSON output**
- `ige-dataset-real.json` — pretty-printed, ~MB range; consumed by the web app
- `ige-dataset-real.min.json` — minified variant
- Committed to git; updated weekly by GitHub Actions (`.github/workflows/update-data.yml`) or `./run.sh`

## IGE methodology (v3.0)

Three pillars, reweighted proportionally when any pillar is missing:
- **Economic** 40%: GDP growth 30%, inflation 25%, unemployment 25%, debt 20%
- **Security** 30%: conflict deaths per 100k (UCDP, 1989+)
- **Governance** 30%: TI CPI via OWID (2012–2024 only)

Each factor uses an **expanding z-score** (no look-ahead, min 3 obs), mapped to [0,100] via `clamp(50 + (z/3)*50, 0, 100)`.

`NÍVEL` = pillar-weighted score. `MOMENTUM` = `clamp(50 + 2.2*(nivel_t - nivel_{t-2}), 0, 100)`. `IGE = 0.60*nivel + 0.40*momentum` (nivel-only for first 2 years).

Records carry `data_quality: []` (complete) or `data_quality: ["governance", ...]` (missing factors — UI shows yellow warning).

## Data quality notes

- Governance (CPI) is absent pre-2012; those records have governance pillar reweighted out
- Conflict is absent pre-1989; zero-filled for countries with any UCDP entry post-1989
- Debt merges World Bank + IMF WEO as fallback
- All sources hard-capped at year ≤ 2025 to exclude forward projections
- Regional pseudo-ISO codes (EAP, ECA, LAC, MNA, NAC, WLD, etc.) are filtered out of the country list
