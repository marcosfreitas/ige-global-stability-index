# IGE — Índice Global de Estabilidade

The **IGE** (Índice Global de Estabilidade) is a composite macroeconomic and conflict stability index that scores countries on a 0–100 scale. It combines five dimensions — GDP per capita growth, inflation, unemployment, public debt, and battle-related deaths — into a single, comparable time-series updated weekly. The index is designed for use in data-driven dashboards and research contexts where a single stability signal across all countries and time periods is needed.

---

## Data Sources

| Source | Indicator | URL | Coverage |
|--------|-----------|-----|----------|
| World Bank WDI | GDP per capita growth (NY.GDP.PCAP.KD.ZG) | https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.KD.ZG | 1960–present |
| World Bank WDI | Inflation, consumer prices (FP.CPI.TOTL.ZG) | https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG | 1960–present |
| World Bank WDI | Unemployment, total % (SL.UEM.TOTL.ZS) | https://api.worldbank.org/v2/country/all/indicator/SL.UEM.TOTL.ZS | 1960–present |
| World Bank WDI | Central government debt, % GDP (GC.DOD.TOTL.GD.ZS) | https://api.worldbank.org/v2/country/all/indicator/GC.DOD.TOTL.GD.ZS | 1990–present (irregular) |
| UCDP/PRIO | Battle-Related Deaths Dataset | https://ucdp.uu.se/downloads/ | 1989–present |

---

## Methodology

### Expanding Z-Score (No Look-Ahead)

For each country and factor, at each year *t*, the z-score is computed using **only data available up to and including year *t*** (expanding window). This prevents any future-data leakage. A minimum of 3 observations is required; earlier years return NaN.

### Factor Directions

| Factor | Direction | Transformation |
|--------|-----------|----------------|
| GDP per capita growth | Higher = more stable | z direct |
| Unemployment | Lower = more stable | −z |
| Public debt/GDP | Lower = more stable | −z |
| Conflict deaths per 100k | Lower = more stable | −z |
| Inflation | Closer to 2% = more stable | `inf_pen = −|inflation − 2.0|`, then z |

### Score Rescaling

Each z-score is mapped to [0, 100]:

```
score = clamp(50 + (clamp(z, -3, 3) / 3) × 50, 0, 100)
```

### NÍVEL (Level Score)

Base weights: Conflict 30%, GDP Growth 25%, Inflation 20%, Unemployment 15%, Debt 10%.

When a factor is unavailable for a country-year, weights are **renormalized** across available factors so the total always sums to 1.

### MOMENTUM

```
momentum_t = clamp(50 + 2.2 × (nivel_t − nivel_{t-2}), 0, 100)
```

NaN when `nivel_{t-2}` is unavailable (first 2 years of data per country).

### IGE (Composite Index)

```
ige = 0.60 × nivel + 0.40 × momentum
```

When momentum is unavailable (first 2 data years per country), IGE equals nivel directly.

### Regional & Global Aggregates

GDP-weighted averages of IGE, NÍVEL, and MOMENTUM are computed for each World Bank region and globally. These appear in the dataset with ISO codes `EAP`, `ECA`, `LAC`, `MENA`, `NAM`, `SAS`, `SSA`, and `WORLD`.

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

## Frontend Consumption

The raw JSON URL for direct consumption:

```
https://raw.githubusercontent.com/marcosfreitas/ige-global-stability-index/main/data/ige-dataset-real.json
```

Minified version (smaller, faster):

```
https://raw.githubusercontent.com/marcosfreitas/ige-global-stability-index/main/data/ige-dataset-real.min.json
```

Both files are committed to the repository and updated weekly by GitHub Actions.

---

## Cron Setup (Local Machine)

To run the pipeline every Monday at 06:00 UTC on your local machine:

```bash
# Add to crontab non-destructively:
(crontab -l 2>/dev/null; echo "0 6 * * 1  cd /home/chain34/Projects/Web/ige-global-stability-index && ./run.sh >> ingest/logs/cron.log 2>&1") | crontab -

# Verify:
crontab -l
```

Logs are written to `ingest/logs/cron.log` and timestamped per-run files in `ingest/logs/`.

---

## GitHub Actions

The workflow is pre-configured at `.github/workflows/update-data.yml`. It runs every Monday at 06:00 UTC and can also be triggered manually from the Actions tab. It fetches, computes, tests, and commits updated data automatically.

---

## Known Limitations

- **PERCEPÇÃO dimension omitted**: Corruption perceptions (TI CPI), governance quality (WGI), and rule-of-law scores would meaningfully improve the index but lack a stable, freely accessible programmatic source at the required frequency.
- **Debt coverage irregular**: World Bank debt data (`GC.DOD.TOTL.GD.ZS`) is missing for many countries pre-2000 and several low-income countries.
- **Conflict data starts 1989**: UCDP/PRIO Battle-Related Deaths Dataset covers 1989 onward. Earlier years have the conflict factor absent (not zero), and weights are redistributed to remaining factors.
- **Country-name to ISO-3 mapping for UCDP**: The GW (Correlates of War) number → ISO-3 mapping is comprehensive but may miss a small number of micro-states or entities with contested status.
