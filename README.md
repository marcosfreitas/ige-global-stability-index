# IGE — Índice Global de Estabilidade

The **IGE** (Índice Global de Estabilidade) is a composite macroeconomic, conflict, and governance stability index that scores countries on a 0–100 scale. It combines six factors across three pillars — Economic, Security, and Governance — into a single, comparable time-series covering 215 countries from 1962 to the present, updated weekly.

The index is designed for analysts, journalists, and researchers who need a single stability signal that is **historically self-referential**: a country's IGE measures how stable it is *relative to its own history*, not relative to other countries.

**Live dashboard:** https://marcosfreitas.github.io/ige-global-stability-index/

---

## Dataset

| Stat | Value |
|------|-------|
| Countries | 215 sovereign states |
| Year range | 1962–2025 |
| Records | 12,038 country-year rows |
| Update frequency | Weekly (GitHub Actions, every Monday 06:00 UTC) |

---

## Data Sources

| Source | Indicator | Coverage |
|--------|-----------|----------|
| World Bank WDI | GDP per capita growth (`NY.GDP.PCAP.KD.ZG`) | 1960–present |
| World Bank WDI | Inflation, consumer prices (`FP.CPI.TOTL.ZG`) | 1960–present |
| World Bank WDI | Unemployment, total % (`SL.UEM.TOTL.ZS`) | 1991–present (ILO modelled estimates) |
| World Bank WDI | Central government debt, % GDP (`GC.DOD.TOTL.GD.ZS`) | 1990–present (irregular) |
| IMF World Economic Outlook | General government gross debt (`GGXWDG_NGDP`) | 1990–2025 (fallback when WB absent) |
| UCDP/PRIO v26.1 | Battle-Related Deaths Dataset | 1989–present |
| Transparency International / OWID | Corruption Perceptions Index (CPI) | 2012–2024 (~182 countries) |

---

## Methodology

### 1. Expanding Z-Score (No Look-Ahead)

For each country and factor, at year *t*, the z-score is computed using **only data available up to and including year *t*** (expanding window). This prevents any future-data leakage. A minimum of 3 observations is required; earlier years return NaN.

```
z_t = (x_t − mean(x[0..t])) / std(x[0..t])
```

### 2. Factor Directions

| Factor | Pillar | Direction | Transformation |
|--------|--------|-----------|----------------|
| GDP per capita growth | Economic | Higher = more stable | z direct |
| Unemployment | Economic | Lower = more stable | −z |
| Public debt/GDP | Economic | Lower = more stable | −z |
| Inflation | Economic | Closer to 2% = more stable | `inf_pen = −\|inflation − 2.0\|`, then z |
| Conflict deaths per 100k | Security | Lower = more stable | −z |
| Corruption Perceptions Index | Governance | Higher = more stable | z direct |

### 3. Score Rescaling

Each z-score is mapped to [0, 100]:

```
score = clamp(50 + (clamp(z, -3, 3) / 3) × 50, 0, 100)
```

50 = country's own historical median. The scale is derived, not arbitrary.

### 4. Three-Pillar Hierarchy

The IGE uses a hierarchical weight structure with three pillars:

```
NÍVEL = 0.40 × ECONOMIC + 0.30 × SECURITY + 0.30 × GOVERNANCE
```

**Economic pillar** (sub-weights sum to 1):
- GDP growth: 30%
- Inflation: 25%
- Unemployment: 25%
- Debt/GDP: 20%

**Security pillar**: battle-related deaths per 100k population (single factor).

**Governance pillar**: Transparency International CPI score (single factor, 2012+).

When a pillar is unavailable for a country-year, weights are **renormalized** across available pillars. When governance is absent (pre-2012 or uncovered countries), the effective split is Economic 57% / Security 43%. Each record carries a `factors_used` list and a `data_quality` field identifying absent factors.

### 5. MOMENTUM

```
momentum_t = clamp(50 + 2.2 × (nivel_t − nivel_{t-2}), 0, 100)
```

NaN when `nivel_{t-2}` is unavailable (first 2 years of data per country).

### 6. IGE (Composite)

```
ige = 0.60 × nivel + 0.40 × momentum
```

When momentum is unavailable, IGE equals nivel directly.

### 7. Stability Zones

| Zone | IGE range | Meaning |
|------|-----------|---------|
| Crise | 0–40 | Crisis — acute deterioration relative to own history |
| Atenção | 40–55 | Watch — below historical norm |
| Estável | 55–70 | Stable — near or above historical norm |
| Robusta | 70–100 | Robust — significantly above historical norm |

### 8. Regional & Global Aggregates

GDP-weighted averages of IGE, NÍVEL, and MOMENTUM are computed for each World Bank region and globally. These appear in the dataset with ISO codes `EAP`, `ECA`, `LAC`, `MENA`, `NAM`, `SAS`, `SSA`, and `WORLD`.

---

## Validation

Full reports in `docs/validation/`.

### FSI Cross-Validation (`docs/validation/fsi-correlation.md`)

Compared IGE against the Fund for Peace Fragile States Index (FSI, 2018–2021, 160 countries, 630 matched country-years).

**Key finding:** Cross-sectional correlation between IGE and FSI is near zero by design — IGE is a *relative* index (country vs. own history); FSI is an *absolute* index (country vs. all others). These answer different questions and level-vs-level comparison is not appropriate.

The meaningful test is within-country change direction (ΔIGE vs ΔFSI): r = −0.335, dominated by the 2019→2020 COVID shock where FSI showed conflict de-escalation while IGE captured the economic recession. Pre-COVID (2018→2019 only): r = 0.098.

| Comparison | Spearman r | Note |
|------------|-----------|------|
| Level vs level (pooled) | 0.064 | Expected ~0 — different reference frames |
| Within-country ΔIGE vs ΔFSI | −0.335 | COVID-2020 confound inverts direction |
| Pre-COVID change (2018–2019) | 0.098 | Structural baseline |

### Monte Carlo Sensitivity (`docs/validation/monte-carlo-sensitivity.md`)

1,000 simulations varying pillar weights within ±10pp of nominal (Economic 30–50%, Security 20–40%, Governance 20–40%).

| Class | Countries | Rank std | Interpretation |
|-------|-----------|----------|----------------|
| Stable | 73 | ≤ 1.3 | Ranking robust regardless of weight choice |
| Moderate | 74 | 1.3–2.6 | Moderate sensitivity |
| Volatile | 73 | > 2.6 | Ranking shifts >3 positions across weight range |

Most volatile: small island states (FSM, PLW, BHS) and countries with missing pillar data. Most stable: countries whose economic, security, and governance signals all point the same direction (consistently stable or consistently unstable).

**Conclusion:** The nominal weights (40/30/30) represent a reasonable centre-of-mass. Volatile rankings are concentrated in data-sparse territories, not major economies.

---

## How to Run Manually

```bash
# Install virtualenv and dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r ingest/requirements.txt

# Or use the pipeline script directly:
./run.sh
```

The pipeline:
1. Fetches all raw data → `ingest/raw/`
2. Computes IGE → `data/ige-dataset-real.json` and `data/ige-dataset-real.min.json`
3. Runs sanity tests
4. Commits and pushes `data/` if anything changed

---

## Frontend

Live dashboard: https://marcosfreitas.github.io/ige-global-stability-index/

Built with Vite + React + Recharts. Source in `web/`. Deployed automatically via GitHub Actions on push to `main` when `web/` changes.

Raw JSON URLs for direct consumption:

```
https://raw.githubusercontent.com/marcosfreitas/ige-global-stability-index/main/data/ige-dataset-real.json
https://raw.githubusercontent.com/marcosfreitas/ige-global-stability-index/main/data/ige-dataset-real.min.json
```

---

## GitHub Actions

Two workflows:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Update Data | `.github/workflows/update-data.yml` | Weekly Mon 06:00 UTC + manual | Fetch, compute, test, commit data |
| Deploy Frontend | `.github/workflows/deploy-web.yml` | Push to `main` (web/** changes) + manual | Build and deploy to GitHub Pages |

---

## Known Limitations

- **Governance coverage starts 2012**: TI CPI via OWID covers 2012–2024 (~182 countries). Pre-2012 records have no governance factor; weights redistribute to Economic + Security.
- **Unemployment coverage starts ~1991**: ILO modelled estimates are unavailable before 1991 for all countries.
- **Conflict data starts 1989**: UCDP/PRIO Battle-Related Deaths Dataset covers 1989 onward. Earlier years have the conflict factor absent (not zero), and weights redistribute to remaining factors.
- **Debt coverage irregular**: World Bank debt data is missing for many countries pre-2000. IMF WEO is used as fallback; combined coverage is ~55% of country-years.
- **Relative scale**: IGE measures stability relative to each country's own history. South Sudan in a relative recovery year may score higher than Switzerland in a relative downturn year. IGE is not a cross-country ranking.
- **PERCEPÇÃO not fully implemented**: A third governance sub-dimension (World Bank WGI, Freedom House, RSF Press Freedom) would improve the Governance pillar but lacks a stable programmatic source at the required frequency.
