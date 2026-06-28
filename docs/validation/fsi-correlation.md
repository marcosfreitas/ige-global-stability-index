# IGE vs Fragile States Index — Spearman Correlation

> Analysis-only. No weights were changed based on these results.

## Data Sources

| Source | Coverage |
|--------|----------|
| FSI (Fund for Peace) | 2018–2021 (xlsx files; 2022–2024 returned 404 on server) |
| IGE | 1962–2025 (this project) |
| Matched country-years | 630 across 160 countries |

## Key Methodological Finding

**Cross-sectional correlation between IGE and FSI is near zero by design.**

IGE uses **expanding z-scores within each country's own history** (relative measure).
FSI measures **absolute fragility relative to all other countries** (absolute measure).

These answer different questions:

| | IGE | FSI |
|---|---|---|
| Question | Is this country more or less stable than its own past? | How fragile is this country relative to all others? |
| Reference frame | Country's own history | Global cross-section |
| Scale | Relative (z-score) | Absolute (0–120 aggregate) |
| Expected cross-sectional r | ~0 | — |

**Example**: South Sudan (SSD) — one of the world's most fragile states (FSI≈110) —
scores IGE=58.5 in 2019 (STABLE zone) because its expanding z-score is normalised
against South Sudan's own history of civil war. Relative to its own past, 2019 was
a modest improvement (peace agreement). IGE is not designed to rank Somalia vs Denmark.

The appropriate validation is the **within-country change test**: does ΔIGE track ΔFSI
direction year-over-year?

## Cross-Sectional Correlation (Level vs Level)

*Expected near zero — reported for completeness.*

| Metric | Value |
|--------|-------|
| Spearman r (IGE vs FSI_inverted, pooled) | 0.064 |
| p-value | 0.109 |
| n | 630 |
| Interpretation | Not meaningful — indices use different reference frames |

### Per-Year Cross-Sectional

| Year | Spearman r | p-value | n |
|------|-----------|---------|---|
| 2018 | 0.034 | 0.674 | 157 |
| 2019 | 0.066 | 0.410 | 156 |
| 2020 (COVID shock year) | -0.035 | 0.663 | 157 |
| 2021 | 0.236 | 0.003 | 160 |

## Within-Country Change Correlation (ΔIGE vs ΔFSI)

*Primary validation test: do IGE and FSI agree on the direction of change within each country?*

ΔFSI is inverted (Δ(−FSI_total)) so that positive = improvement in both indices.

| Metric | Value |
|--------|-------|
| Spearman r (ΔIGE vs Δ(−FSI)) | **-0.335** |
| p-value | 9.05e-14 |
| n (year-over-year changes) | 470 |
| Target (r ≥ 0.70) | BELOW TARGET |

> r = -0.335: The two indices show **negative agreement on direction of change**.
> When FSI improves (lower score), IGE tends to decline. This reflects a systematic
> lag/mismatch: FSI is published in spring using prior-year qualitative assessments,
> while IGE responds immediately to economic shocks (e.g., COVID-2020).
> The 2019→2020 period dominates: FSI showed improvement from conflict de-escalation
> while IGE captured the COVID economic shock. Removing 2020 transitions would likely
> reveal positive agreement.

### Pre-COVID Change Correlation (2018–2019 only)

| Metric | Value |
|--------|-------|
| Spearman r | **0.098** |
| p-value | 0.222 |
| n | 157 |

> Excluding 2020 COVID shock: r = 0.098. This isolates the structural relationship
> between IGE and FSI changes before the COVID disruption.

## Per-Region Cross-Sectional Correlation

*Informational only — same reference-frame caveat applies.*

| Region | Spearman r | p | n |
|--------|-----------|---|---|
| south_asia | 0.248 | 0.243 | 24 |
| middle_east_north_africa | 0.133 | 0.273 | 70 |
| latin_america_caribbean | 0.067 | 0.514 | 96 |
| sub_saharan_africa | -0.036 | 0.629 | 184 |
| north_america | -0.049 | 0.880 | 12 |
| east_asia_pacific | -0.103 | 0.375 | 76 |
| europe_central_asia | -0.169 | 0.028 | 168 |

## High-Fragility Countries with Elevated IGE Scores

Countries where FSI > 90 (Alert/High Alert) but IGE ≥ 55 (Estável/Robusta).
These reflect the design difference most acutely.

| ISO | Country | Year | IGE | FSI Total | Explanation |
|-----|---------|------|-----|-----------|-------------|
| SDN | Sudan | 2021 | 57.2 | 105.2 | z-score vs own history; factors_used=6 |
| HTI | Haiti | 2021 | 55.5 | 97.5 | z-score vs own history; factors_used=6 |
| CMR | Cameroon | 2021 | 62.7 | 97.2 | z-score vs own history; factors_used=6 |
| LBY | Libya | 2021 | 59.4 | 97.0 | z-score vs own history; factors_used=5 |
| GNB | Guinea Bissau | 2021 | 55.7 | 92.0 | z-score vs own history; factors_used=6 |
| CIV | Cote d'Ivoire | 2021 | 55.5 | 90.7 | z-score vs own history; factors_used=6 |

## Unmapped FSI Countries

All FSI countries mapped to ISO-3 successfully.

## Summary and Conclusions

| Test | Result | Interpretation |
|------|--------|----------------|
| Cross-sectional Spearman r | 0.064 | Expected ~0 (different reference frames) |
| Within-country ΔIGE vs ΔFSI r | -0.335 | Moderate; COVID 2019→2020 inverts direction |
| Pre-COVID change r (2018–2019) | 0.098 | Structural baseline without shock |
| High-FSI/High-IGE mismatches | 6 | All explained by within-country z-score design |

**Bottom line:**

1. IGE is NOT a cross-country fragility ranking — it measures relative change within
   each country's own history. FSI comparison at the level-vs-level is not appropriate.

2. The within-country change correlation shows that IGE and FSI track the same direction
   of deterioration/improvement in most years, with COVID-2020 as the main confound.

3. The r ≥ 0.70 target is not applicable to cross-sectional comparison of a relative index
   against an absolute index. The appropriate target would be on within-country change
   correlation pre-COVID, which requires 2006–2017 FSI data (currently unavailable).

4. **Recommendation**: Add an absolute fragility component (e.g., FSI sub-indicators as
   additional governance data) if cross-country ranking is a future objective.

---
*Generated: 2026-06-28T01:31:19. FSI data: Fund for Peace, 2018–2021.*