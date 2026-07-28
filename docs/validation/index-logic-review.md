# IGE — Index Logic & Trustworthiness Review

Review of the IGE construction (`ingest/compute_ige.py`, `ingest/fetch_sources.py`) and of
the published dataset (`data/ige-dataset-real.json`, vintage `2026-07-27`), assessing whether
the index measures what it claims to measure and where it can mislead a reader.

Every claim below is reproduced against the committed dataset; figures in parentheses are the
observed values.

---

## Summary

The IGE's stated purpose is a **historically self-referential** stability signal: how a country
is doing relative to its own past. The implementation is faithful to that definition in one
respect — the expanding z-score genuinely has no look-ahead — but the composite that gets
published is not a stability *level*. Algebraically it is a **two-year difference operator**,
and it is presented with absolute-sounding band labels (`Crise` / `Estável` / `Robusta`) and
sorted into cross-country rankings that the methodology explicitly says are invalid.

The consequences are not theoretical. In the shipped data, Syria at the height of the civil war
(66,090 battle deaths) scores `Estável`, Afghanistan 2023 scores `Robusta`, and Switzerland
ranks 202nd of 214.

| # | Finding | Severity |
|---|---------|----------|
| 1 | Momentum double-counts NÍVEL; IGE is a difference operator, not a level | Critical |
| 2 | Current-year records computed from 1–2 factors, published on the same scale | Critical |
| 3 | Cross-country ranking and GDP-weighted aggregates on a self-referential score | Critical |
| 4 | Expanding baseline makes sustained deterioration invisible | Critical |
| 5 | Security pillar present or absent depending on whether a country ever had a war | High |
| 6 | Conflict source excludes one-sided and non-state violence | High |
| 7 | Debt merges two incompatible definitions (central vs general government) | High |
| 8 | Small-*n* z-scores mechanically compressed; attainable range grows with series length | Medium |
| 9 | Momentum indexes rows, not years | Low (latent) |
| 10 | No vintage archiving — published history mutates silently | Medium |
| 11 | Sanity tests cannot fail on any of the above | High |

---

## 1. Momentum double-counts NÍVEL — IGE is a difference operator (Critical)

`momentum` is not an independent signal. It is a deterministic function of `nivel`:

```
momentum_t = clamp(50 + 2.2 · (nivel_t − nivel_{t−2}), 0, 100)
ige_t      = 0.60 · nivel_t + 0.40 · momentum_t
```

Substituting, whenever momentum is unclamped:

```
ige_t = 1.48 · nivel_t − 0.88 · nivel_{t−2} + 20
```

Verified against the dataset: the identity holds for **10,034 of 10,035** unclamped records
(the one exception is a rounding edge). So the headline weights "60% level / 40% momentum" are
misleading — the true loading on the current level is 1.48, and there is a **negative** loading
of −0.88 on the level two years ago.

Two consequences:

**Momentum dominates the composite.** Contribution standard deviations: `0.60 · nivel` = 7.08,
`0.40 · momentum` = 9.86. Momentum accounts for **66% of IGE variance**. The index is mostly
reporting change, not condition.

**A country is rewarded for having been worse.** Because the `nivel_{t−2}` coefficient is
negative, a catastrophic year two years ago mechanically raises today's score:

| Country-year | Battle deaths | NÍVEL | IGE | Band shown |
|---|---|---|---|---|
| SYR 2014 | 66,090 | 27.74 | **56.65** | Estável |
| SYR 2015 | 51,105 | 27.65 | **56.59** | Estável |
| AFG 2023 | 270 | 57.96 | **74.78** | Robusta |
| YEM 2013 | — | — | **68** | Estável |
| RWA 1995 | 0 | 67.20 | **80.32** | Robusta |

Syria in 2014–15 is scored as a stable country. Rwanda the year after the genocide is scored
`Robusta`. These are not edge cases — they are the direct, intended output of the formula.

**The 2.2 multiplier also saturates.** 1,202 of 11,237 momentum values (**10.7%**) are pinned at
exactly 0 or 100. For roughly one record in nine, the momentum term carries no information
beyond its sign, and 40% of the composite is a constant.

## 2. Current-year records are computed from 1–2 factors (Critical)

`MAX_YEAR = datetime.now().year` admits a record for the current calendar year as soon as *any*
single source has a value. For 2026 the published dataset contains **183 countries at an average
of 1.38 factors used** — 114 of them scored on `debt` alone, 69 on `debt` + `conflict`. No GDP,
no inflation, no unemployment, no governance.

Because momentum compares a 1-factor `nivel_t` against a 6-factor `nivel_{t−2}`, the delta is
measuring **which factors happened to be available**, not any change in stability:

| Record | Factors used | NÍVEL | Momentum | IGE |
|---|---|---|---|---|
| CHE 2026 | `debt` | 3.26 | 0.00 | **1.95** |
| USA 2026 | `debt` | 21.56 | 3.69 | **14.41** |
| BRA 2026 | `debt`, `conflict` | 32.82 | 23.28 | **29.01** |

Band distribution, 2026 vs 2024:

| Year | Crise | Atenção | Estável | Robusta |
|---|---|---|---|---|
| 2024 (210 countries) | 35 | 100 | 68 | 7 |
| 2026 (183 countries) | **86** | 43 | 38 | 16 |

The frontend's `bestEntry()` partially shields the headline number by preferring entries with
≥3 factors — but the time-series chart plots the full array, and `README.md` advertises the raw
JSON as a public consumption URL. Any third-party consumer reads Switzerland at 1.95.

**The same mechanism fires system-wide at 2025.** TI CPI is not yet published for 2025, so
*every* country simultaneously loses the governance pillar and is reweighted to Economic 57% /
Security 43%. Mean NÍVEL change 2024→2025 is **+1.65**, against **−0.05** for 2023→2024 — a
synthetic, uniform uplift in exactly the year that **185 of 214 countries** use as their headline
score.

## 3. Cross-country ranking on a self-referential score (Critical)

By construction every country is z-scored against its own history, so every country's lifetime
mean converges to ~50. Observed across countries with ≥10 records: **mean of country means 49.51,
standard deviation 2.12**. There is essentially no cross-country signal to rank on.

| Country | Lifetime mean IGE |
|---|---|
| SOM | 51.9 |
| AFG | 51.6 |
| DNK | 49.7 |
| NOR | 48.4 |
| DEU | 48.2 |
| USA | 47.0 |
| PRK | 47.0 |
| **CHE** | **45.8** |
| SYR | 45.8 |

`README.md` states this plainly ("IGE is not a cross-country ranking"). The product does it
anyway, in three places:

- `web/src/hooks/useIgeData.js` — `regionCountriesFor()` sorts every country list by
  `b.ige - a.ige`, descending.
- `regionSummaryFor()` — takes medians of IGE across countries.
- `ingest/compute_ige.py` — emits **GDP-weighted** regional and `WORLD` aggregates.

Reproducing the shipped ranking:

```
top:     MNP 83.5 (2022) · GUM 79.8 (2022) · LKA 76.7 · PLW 73.4 · MHL 70.5
         NIC 68.1 · LBN 67.4 · COM 67.3 · SMR 66.6 · NLD 66.5
CHE  202/214   SOM 168/214   AFG 177/214   SDN 179/214   YEM 193/214
```

Lebanon and Nicaragua rank above the Netherlands; Switzerland ranks below Somalia, Afghanistan,
Sudan and Yemen. GDP-weighting compounds the error — it applies an absolute quantity as a weight
over a quantity that is relative to each country's own history, which has no defined meaning.

**The ranking also mixes vintages.** `bestEntry()` returns whatever recent year has ≥3 factors,
so headline years span 2016–2026 and the global list is topped by a 2022 record. Ten countries
are ranked on pre-2023 data.

## 4. The expanding baseline hides sustained deterioration (Critical)

The reference mean expands with the series, so a country in prolonged decline continuously
re-centres on its own decline. The index cannot represent "bad and staying bad".

```
VEN  12:57 13:37 14:33 15:34 16:35 17:51 18:50 19:31 20:29 21:51 22:63 23:52 24:42 25:53
LBN  12:41 13:48 14:42 15:42 16:50 17:50 18:45 19:47 20:21 21:20 22:48 23:49 24:24 25:67
SYR  12:01 13:03 14:57 15:57 16:32 17:51 18:62 19:50 20:44 21:46 22:48 23:45 24:43 25:47
YEM  12:18 13:68 14:49 15:07 16:22 17:54 18:43 19:41 20:30 21:24 22:57 23:63 24:41 25:42
```

Venezuela oscillates around 50 through the worst peacetime economic collapse on record and peaks
at 63 in 2022. Lebanon scores 67 in 2025. Syria scores in the 40s–60s throughout its civil war.

This is the central purpose/instrument mismatch: the pipeline computes an **acceleration**, and
the UI labels it with **condition** words (`Crise`, `Estável`, `Robusta`) on a red-to-green scale.
A reader has no way to tell "recovering from catastrophe" from "genuinely stable" — the index
assigns them the same number by design.

## 5. Security pillar depends on whether a country ever had a war (High)

`conflict_value()` returns `NaN` for countries absent from UCDP entirely, and `0.0` for countries
present in UCDP in any year. So:

- **36 countries have no security pillar in any year** (CHE, AND, BHS, ISL, FSM, GRL, HKG, …).
  They are scored Economic 57% / Governance 43% — the 30% security weight silently vanishes.
- **177 countries are zero-filled**, and those zeros are then z-scored *against that country's own
  conflict history*. A war country's peace years therefore score **high** on security, while a
  permanently peaceful country gets no security score at all.

Observed effect (mean NÍVEL, peace years vs war years within the same country):

| Country | Peace-year NÍVEL | War-year NÍVEL |
|---|---|---|
| RWA | 55.9 (n=20) | 49.8 (n=18) |
| KHM | 58.7 (n=24) | 50.9 (n=14) |
| NIC | 54.0 (n=36) | 44.4 (n=2) |

Two country-years with identical zero battle deaths receive materially different security
treatment based on the country's past. Additionally, a country with constant zero deaths hits the
`sigma == 0 → z = 0` branch and scores exactly 50 — while a war-torn country in a calm year can
score near 100 on the same pillar.

## 6. Conflict source excludes one-sided and non-state violence (High)

`fetch_sources.py` aggregates `sb_total_deaths_best` — UCDP **state-based** conflict only.
One-sided violence (genocide, mass atrocities against civilians) and non-state conflict
(cartel/criminal violence) are not counted. In the published data:

- **RWA 1994 = 1,882 conflict deaths.** The genocide (500k–800k, one-sided) is absent.
- **MEX 2019 = 0 conflict deaths**, in a year with ~35,000 homicides and active cartel conflict.

A pillar that is 30% of the index and labelled "Security" excludes two of the largest categories
of organised lethal violence.

## 7. Debt merges two incompatible definitions (High)

```python
df_debt["debt"] = df_debt["debt"].combine_first(df_debt["debt_imf"])
```

World Bank `GC.DOD.TOTL.GD.ZS` is **central government** debt. IMF `GGXWDG_NGDP` is **general
government gross** debt — a broader aggregate including sub-national government and social
security funds, systematically higher for the same country-year. `combine_first` allows a single
country's series to switch definition mid-stream with no marker.

The published series contains **249 year-over-year jumps exceeding 25 percentage points of GDP**,
e.g. `AFG 2005→2006: 206.4 → 23.0`, `ARG 2001→2002: 48.0 → 147.2`, `AGO 2020→2021: 119.8 → 75.5`.
Some are genuine (Argentina 2002 is a real default), but the expanding z-score treats every one
of them as a real fiscal event, and definitional switches are indistinguishable from crises.

## 8. Small-*n* z-scores are mechanically compressed (Medium)

`expanding_zscore` includes `x_t` in the sample used to compute its own mean and standard
deviation. The maximum attainable |z| is therefore bounded by (n−1)/√n:

| n | 3 | 4 | 5 | 8 | 10 | 13 | 20 |
|---|---|---|---|---|---|---|---|
| max &#124;z&#124; | 1.15 | 1.50 | 1.79 | 2.47 | 2.85 | 3.00 | 4.25 |

With `min_obs = 3`, a country's first scored year rests on a 3-point standard deviation and cannot
produce a score outside roughly [30, 70] no matter what happens. The ±3 clamp is unreachable until
n ≈ 13. The attainable score range therefore **widens monotonically with series length**, so any
comparison of early vs late years — or of a long series vs a short one — is confounded by sample
size rather than substance.

## 9. Momentum indexes rows, not years (Low, latent)

```python
momentums.append(clamp(50.0 + 2.2 * (nivel_series.iloc[i] - nivel_series.iloc[i - 2]), ...))
```

`iloc[i-2]` is two *records* back, not two *years* back. Where a country has a coverage gap, the
"2-year momentum" silently spans a different interval. Only **1 record** is affected in the current
dataset (`DMA 1980`, a 3-year gap), so impact today is negligible — but it is a correctness bug that
activates whenever source coverage develops holes.

## 10. No vintage archiving (Medium)

Every weekly run recomputes the full 1962–present history from the current source vintage and
overwrites `data/`. World Bank and IMF revise history routinely, so published "historical" values
mutate silently. Comparing commits `e077c61` (2026-07-13) and `1aba635` (2026-07-27):
**45 records changed IGE, 21 of them for years ≤ 2020** (e.g. `TUV 2014: 58.2 → 62.4`,
`TUV 2006: 59.4 → 55.3`).

The magnitude is small in this two-week window, but nothing in the pipeline pins, stamps, or
diffs the historical series, so a citation of an IGE value is not reproducible.

## 11. The sanity tests cannot fail on any of the above (High)

`ingest/test_compute.py` runs in CI as the gate before data is committed. It does not test the
index.

- **Test 3** iterates over all countries looking for *any one* that satisfies "high-conflict year
  has depressed NÍVEL", then calls `check(..., True, ...)` — literally passing the constant `True`.
  It is a search for a confirming example across 214 countries, not a test; it cannot fail while
  one country cooperates.
- **Test 4** asserts `0 ≤ ige ≤ 100`, which `clamp()` guarantees by construction.
- **Test 2** falls back to "any year in 1960–1970" when its target year is missing.
- **Test 5/6** check field non-emptiness and country count.

None of these would have caught `CHE 2026 = 1.95`, the 2025 governance dropout, the momentum
inversion at Syria 2014, or the debt definition switches. Missing entirely: a minimum-factor-coverage
assertion for the latest year, a per-year distribution regression against the previous vintage, and
a directional test on named crisis country-years.

---

## What is sound

- **No look-ahead.** `expanding_zscore` is correctly implemented — the window is strictly
  `[0..t]`, and the min-observations guard is honoured. This is the part most composite indices
  get wrong, and it is right here.
- **`data_quality` / `factors_used` per record.** The pipeline records exactly which factors
  fed each score. The information needed to detect finding #2 is already in the file; nothing
  consumes it as a gate.
- **`README.md` "Known Limitations"** is candid about the relative scale, the coverage windows,
  and the debt gaps. The documentation is more honest than the product.
- **The FSI cross-validation** correctly diagnoses why level-vs-level correlation is ~0.

---

## Recommendations, in priority order

1. **Separate the level from the change.** Publish `nivel` and `momentum` as two distinct
   series and stop collapsing them into one 0–100 number, or at minimum rename the composite and
   restate the true coefficients (1.48 / −0.88). The current single number cannot be interpreted.
2. **Gate record emission on factor coverage.** Suppress any country-year whose `factors_used`
   does not cover at least two pillars, and never compute momentum across a pillar-count change.
   This removes the 2026 artefacts and the 2025 governance-dropout break.
3. **Either drop the ranking or add an absolute layer.** If cross-country comparison is a product
   requirement, add a cross-sectional z-score (country vs. all countries in the same year) as a
   separate index. Remove GDP-weighted aggregates over the relative score; they have no defined
   meaning.
4. **Re-label the bands.** `Crise`/`Estável`/`Robusta` describe condition; the number describes
   change relative to own history. Rename to change language ("Deteriorating / Stable / Improving")
   or supply an absolute score to label.
5. **Fix the security pillar.** Zero-fill all countries uniformly (not just UCDP-present ones), and
   include UCDP one-sided and non-state datasets. Consider scoring conflict on an absolute scale —
   deaths per 100k is already absolute and comparable; z-scoring it against own history destroys
   that.
6. **Flag the debt definition.** Carry a `debt_source` field per record and never allow a series to
   switch definitions without a break marker.
7. **Raise `min_obs`** to ~10 and document that early-series scores are range-compressed.
8. **Archive vintages** — write `data/vintages/ige-YYYY-MM-DD.min.json` per run, and diff against
   the prior vintage in CI.
9. **Replace the test suite** with assertions that can fail: minimum factor coverage per year,
   year-over-year distribution stability, and directional checks on named crisis country-years
   (SYR 2014 must not be `Estável`).
