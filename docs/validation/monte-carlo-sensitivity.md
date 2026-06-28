# Monte Carlo Pillar Weight Sensitivity Analysis

> Analysis-only. Weights were NOT changed based on these results.

## Setup

| Parameter | Value |
|-----------|-------|
| Simulations | 1,000 |
| Countries | 220 (with ≥ 1 pillar data available) |
| Year | Latest entry per country (factors_used ≥ 3) |

### Weight Bounds

| Pillar | Nominal | Min | Max |
|--------|---------|-----|-----|
| Economic | 40% | 30% | 50% |
| Security | 30% | 20% | 40% |
| Governance | 30% | 20% | 40% |

Weights are drawn uniformly within the box and normalised to sum to 1.0. 
Vectors where the normalised values fall outside the bounds are re-drawn.

### Pillar Score Approximation

The raw z-scores are not stored in the JSON output — only the processed factor values.
Pillar scores for sensitivity analysis are therefore approximated from raw factor values:

- **Economic**: GDP growth (±5 → ±50pt), inflation deviation from 2% (−6pt/%), unemployment (−4pt/%), debt/GDP (−0.5pt/%) — combined with ECON_WEIGHTS.
- **Security**: 100 − 16.67 × log₁₀(deaths + 1); 0 deaths → 100, 10k deaths → ~0.
- **Governance**: CPI score mapped directly (0–100, higher = less corrupt).

These approximations preserve ordinal rank ordering well but absolute pillar score
values may differ from the pipeline's expanding-z-score outputs.

## Distribution of Rank Stability

| Class | Countries | Std(rank) threshold | Interpretation |
|-------|-----------|---------------------|----------------|
| Stable   | 73 | ≤ 1.3 | Rank changes < 1 positions across all weight combinations |
| Moderate | 74 | 1.3–2.6 | Moderate rank sensitivity |
| Volatile | 73 | > 2.6 | Rank shifts > 3 positions |

## Most Stable Countries (rank robust across all simulations)

These countries' relative positions are insensitive to which pillar dominates.

| ISO | Region | Nominal Rank | Mean Rank | Std(rank) | Range |
|-----|--------|-------------|-----------|-----------|-------|
| ECA | europe_central_asia | 2 | 1 | 0.4 | 1–2 |
| EAP | east_asia_pacific | 1 | 2 | 0.9 | 2–4 |
| LAC | latin_america_caribb | 3 | 3 | 0.0 | 3–3 |
| SAS | south_asia | 6 | 5 | 0.0 | 5–5 |
| SSA | sub_saharan_africa | 7 | 6 | 0.0 | 6–6 |
| MNP | east_asia_pacific | 5 | 6 | 1.3 | 4–7 |
| LIE | europe_central_asia | 8 | 8 | 0.0 | 8–8 |
| XKX | europe_central_asia | 9 | 9 | 0.4 | 9–10 |
| TUV | east_asia_pacific | 10 | 10 | 0.4 | 9–10 |
| MHL | east_asia_pacific | 11 | 11 | 0.0 | 11–11 |
| NRU | east_asia_pacific | 12 | 12 | 0.2 | 12–13 |
| TLS | east_asia_pacific | 13 | 13 | 0.2 | 12–13 |
| TWN | east_asia_pacific | 14 | 14 | 0.5 | 14–16 |
| VNM | east_asia_pacific | 15 | 15 | 0.4 | 14–16 |
| TKM | europe_central_asia | 16 | 16 | 0.4 | 15–17 |
| AND | europe_central_asia | 17 | 17 | 0.9 | 15–21 |
| BRN | east_asia_pacific | 18 | 18 | 0.5 | 17–18 |
| BGR | europe_central_asia | 19 | 19 | 0.3 | 18–19 |
| BLR | europe_central_asia | 20 | 20 | 0.1 | 19–20 |
| OMN | middle_east_north_af | 21 | 21 | 0.0 | 20–21 |
| KAZ | europe_central_asia | 22 | 22 | 0.0 | 22–22 |
| CZE | europe_central_asia | 23 | 23 | 0.0 | 23–23 |
| SMR | europe_central_asia | 24 | 24 | 0.0 | 24–24 |
| MLT | middle_east_north_af | 25 | 25 | 0.0 | 25–25 |
| PNG | east_asia_pacific | 26 | 26 | 0.0 | 26–26 |

## Most Volatile Countries (rank sensitive to pillar weights)

These countries score very differently depending on which pillar is emphasised.
Their IGE classification (CRISE/ATENÇÃO/ESTÁVEL/ROBUSTA) may change between simulations.

| ISO | Region | Nominal Rank | Std(rank) | Range | Missing pillars |
|-----|--------|-------------|-----------|-------|-----------------|
| BHS | latin_america_caribb | 153 | 10.1 | 132–174 | conflict |
| PLW | east_asia_pacific | 173 | 9.5 | 139–184 | unemployment, conflict, governance |
| FSM | east_asia_pacific | 131 | 9.0 | 119–158 | unemployment, conflict, governance |
| QAT | middle_east_north_af | 66 | 8.8 | 45–85 | gdp_growth, inflation, governance |
| LCA | latin_america_caribb | 170 | 8.1 | 144–181 | conflict |
| BEN | sub_saharan_africa | 159 | 7.7 | 138–174 | none |
| PRK | east_asia_pacific | 132 | 7.3 | 109–145 | gdp_growth, inflation, debt |
| ISR | middle_east_north_af | 191 | 7.3 | 168–206 | none |
| ERI | sub_saharan_africa | 138 | 7.0 | 113–158 | gdp_growth, inflation, debt |
| ABW | latin_america_caribb | 121 | 7.0 | 110–147 | unemployment, conflict, governance |
| IDN | east_asia_pacific | 166 | 6.4 | 152–178 | none |
| NAM | north_america | 157 | 6.3 | 140–169 | none |
| SYC | sub_saharan_africa | 119 | 5.8 | 109–137 | unemployment, conflict |
| BMU | north_america | 42 | 5.6 | 33–56 | inflation, unemployment, debt, conflict, governance |
| TCA | latin_america_caribb | 59 | 5.5 | 50–72 | inflation, unemployment, debt, conflict, governance |
| GUM | east_asia_pacific | 38 | 5.4 | 31–51 | gdp_growth, inflation, debt, conflict, governance |
| CHI | europe_central_asia | 47 | 5.4 | 34–60 | gdp_growth, inflation, debt, conflict, governance |
| CHE | europe_central_asia | 111 | 5.4 | 106–131 | conflict |
| NIC | latin_america_caribb | 174 | 5.3 | 160–182 | none |
| TON | east_asia_pacific | 54 | 5.2 | 42–70 | gdp_growth, conflict, governance |
| TJK | europe_central_asia | 147 | 5.1 | 134–160 | inflation |
| CUW | latin_america_caribb | 70 | 4.9 | 57–77 | inflation, unemployment, debt, conflict, governance |
| THA | east_asia_pacific | 171 | 4.9 | 159–179 | none |
| GNB | sub_saharan_africa | 164 | 4.7 | 157–177 | none |
| ITA | europe_central_asia | 136 | 4.7 | 128–148 | none |
| EGY | middle_east_north_af | 190 | 4.6 | 184–203 | none |
| JOR | middle_east_north_af | 162 | 4.6 | 147–173 | none |
| IMN | europe_central_asia | 110 | 4.4 | 107–130 | inflation, unemployment, debt, conflict, governance |
| LSO | sub_saharan_africa | 169 | 4.4 | 160–177 | none |
| PSE | middle_east_north_af | 184 | 4.4 | 165–189 | debt, conflict, governance |

## Volatility by Region

Mean rank standard deviation per region (higher = region rankings more weight-sensitive):

| Region | Mean Std(rank) | Max Std(rank) |
|--------|---------------|---------------|
| north_america | 4.0 | 6.3 |
| middle_east_north_africa | 2.7 | 8.8 |
| latin_america_caribbean | 2.7 | 10.1 |
| east_asia_pacific | 2.6 | 9.5 |
| sub_saharan_africa | 2.4 | 7.7 |
| europe_central_asia | 1.9 | 5.4 |
| south_asia | 1.5 | 2.6 |

## Weight Sensitivity Interpretation

Countries are volatile when:

1. **One pillar is missing** — reweighting amplifies the remaining pillars.
   Countries without governance data (pre-2012) or conflict data shift most.

2. **Pillar scores diverge** — e.g., good economy but active conflict. Depending
   on whether Security weight is 20% or 40%, the overall IGE changes substantially.

3. **Single-factor pillars dominate** — Security and Governance are each a single
   factor. A country heavily dependent on one of these (e.g., conflict-dominant)
   shows high rank volatility as that pillar's weight swings ±10pp.

Countries are stable when:

1. **All pillars point the same direction** — consistently stable/unstable economies,
   governance, and conflict record. The composite moves with all pillars.

2. **Factor data is sparse** — only 1–2 factors available; the nivel is the same
   regardless of reweighting because absent pillars simply don't contribute.

## Pilot Policy: Governance Weight Sensitivity

Since governance data (TI CPI) only starts 2012, the governance pillar is absent
for pre-2012 records and for any country the OWID CPI dataset does not cover.
When governance is missing, IGE reweights to Economic (57%) + Security (43%).

Countries with governance available and high pillar score divergence:

| ISO | Region | Econ | Sec | Gov | Std(rank) | Pillar spread |
|-----|--------|------|-----|-----|-----------|---------------|
| VEN | latin_america_caribb | 70 | 100 | 10 | 3.9 | 90 |
| ERI | sub_saharan_africa | 94 | 100 | 13 | 7.0 | 87 |
| NIC | latin_america_caribb | 76 | 100 | 14 | 5.3 | 86 |
| PRK | east_asia_pacific | 96 | 100 | 15 | 7.3 | 85 |
| TJK | europe_central_asia | 85 | 100 | 19 | 5.1 | 81 |
| LBY | middle_east_north_af | 67 | 92 | 13 | 2.8 | 79 |
| COM | sub_saharan_africa | 76 | 100 | 21 | 4.0 | 79 |
| GNB | sub_saharan_africa | 74 | 100 | 21 | 4.7 | 79 |
| KHM | east_asia_pacific | 87 | 100 | 21 | 4.1 | 79 |
| ZWE | sub_saharan_africa | 68 | 100 | 21 | 3.5 | 79 |
| AZE | europe_central_asia | 82 | 100 | 22 | 3.6 | 78 |
| COG | sub_saharan_africa | 54 | 100 | 23 | 3.5 | 77 |
| PRY | latin_america_caribb | 77 | 100 | 24 | 3.2 | 76 |
| GTM | latin_america_caribb | 82 | 100 | 25 | 2.5 | 75 |
| KGZ | europe_central_asia | 84 | 100 | 25 | 2.9 | 75 |

## Nominal vs Worst-Case IGE Shifts

Countries where worst-case rank is substantially worse than nominal:

| ISO | Region | Nominal | Best | Worst | Shift↓ | Class |
|-----|--------|---------|------|-------|--------|-------|
| FSM | east_asia_pacific | 131 | 119 | 158 | 27 | Volatile |
| ABW | latin_america_caribb | 121 | 110 | 147 | 26 | Volatile |
| BHS | latin_america_caribb | 153 | 132 | 174 | 21 | Volatile |
| CHE | europe_central_asia | 111 | 106 | 131 | 20 | Volatile |
| ERI | sub_saharan_africa | 138 | 113 | 158 | 20 | Volatile |
| IMN | europe_central_asia | 110 | 107 | 130 | 20 | Volatile |
| QAT | middle_east_north_af | 66 | 45 | 85 | 19 | Volatile |
| SYC | sub_saharan_africa | 119 | 109 | 137 | 18 | Volatile |
| GBR | europe_central_asia | 114 | 106 | 130 | 16 | Volatile |
| TON | east_asia_pacific | 54 | 42 | 70 | 16 | Volatile |
| BEN | sub_saharan_africa | 159 | 138 | 174 | 15 | Volatile |
| ISR | middle_east_north_af | 191 | 168 | 206 | 15 | Volatile |
| BMU | north_america | 42 | 33 | 56 | 14 | Volatile |
| COM | sub_saharan_africa | 160 | 156 | 174 | 14 | Volatile |
| BEL | europe_central_asia | 112 | 107 | 125 | 13 | Volatile |
| CHI | europe_central_asia | 47 | 34 | 60 | 13 | Volatile |
| EGY | middle_east_north_af | 190 | 184 | 203 | 13 | Volatile |
| GNB | sub_saharan_africa | 164 | 157 | 177 | 13 | Volatile |
| GUM | east_asia_pacific | 38 | 31 | 51 | 13 | Volatile |
| PRK | east_asia_pacific | 132 | 109 | 145 | 13 | Volatile |

## Conclusions

1. **Most stable countries** have consistent pillar scores (all good or all bad).
   Their IGE ranking is robust to ±10pp pillar weight perturbations.

2. **Most volatile countries** either have missing pillar data OR have strongly
   contradictory signals (e.g., strong economy + active conflict). These countries
   benefit most from additional data sources and the data_quality yellow notice.

3. **The nominal weights** (Economic 40% / Security 30% / Governance 30%) represent
   a reasonable centre-of-mass — rank stability is similar across the sampled range.

4. **Governance gap** (pre-2012): when governance is missing, the effective weight
   split is Economic 57% / Security 43%. Countries with divergent economic vs.
   security signals in pre-2012 years show inflated rank volatility.

---
*Generated: 2026-06-28T01:33:28. N=1000 simulations.*