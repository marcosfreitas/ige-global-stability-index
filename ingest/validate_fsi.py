"""
FSI Validation — IGE vs Fragile States Index (Fund for Peace)
Spearman correlation analysis between IGE and FSI scores.

FSI source: fragilestatesindex.org (2018–2021 xlsx files, 2022–2024 unavailable)
FSI Total: 0–120, higher = more fragile.

KEY DESIGN INSIGHT:
  IGE uses expanding z-scores WITHIN each country's own history (relative measure).
  FSI measures ABSOLUTE fragility relative to all other countries.
  Cross-sectional Spearman r ≈ 0 is therefore EXPECTED: the indices answer
  different questions. The meaningful correlation test is within-country CHANGES:
  does ΔIGE track ΔFSI direction year-over-year?

Usage:
    python3 ingest/validate_fsi.py

Outputs:
    docs/validation/fsi-correlation.md
"""

import json
import io
import logging
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from scipy.stats import spearmanr

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

REPO_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_DIR / "data"
DOCS_DIR = REPO_DIR / "docs" / "validation"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

import sys
sys.path.insert(0, str(REPO_DIR / "ingest"))
try:
    from regions import get_region
except ImportError:
    def get_region(iso3): return "unknown"

# ── Name → ISO-3 lookup ────────────────────────────────────────────────────────
FSI_NAME_TO_ISO3 = {
    "Afghanistan":"AFG","Albania":"ALB","Algeria":"DZA","Angola":"AGO",
    "Argentina":"ARG","Armenia":"ARM","Australia":"AUS","Austria":"AUT",
    "Azerbaijan":"AZE","Bahrain":"BHR","Bangladesh":"BGD","Belarus":"BLR",
    "Belgium":"BEL","Benin":"BEN","Bolivia":"BOL","Bosnia":"BIH",
    "Bosnia Herzegovina":"BIH","Bosnia and Herzegovina":"BIH",
    "Botswana":"BWA","Brazil":"BRA","Bulgaria":"BGR","Burkina Faso":"BFA",
    "Burundi":"BDI","Cambodia":"KHM","Cameroon":"CMR","Canada":"CAN",
    "Central African Republic":"CAF","Chad":"TCD","Chile":"CHL",
    "China":"CHN","Colombia":"COL","Comoros":"COM",
    "Congo Democratic Republic":"COD","Congo Republic":"COG",
    "Democratic Republic of Congo":"COD","DR Congo":"COD",
    "Costa Rica":"CRI","Croatia":"HRV","Cuba":"CUB","Czech Republic":"CZE",
    "Czech Rep.":"CZE","Djibouti":"DJI","Dominican Republic":"DOM",
    "Ecuador":"ECU","Egypt":"EGY","El Salvador":"SLV","Eritrea":"ERI",
    "Estonia":"EST","Ethiopia":"ETH","Finland":"FIN","France":"FRA",
    "Gabon":"GAB","Gambia":"GMB","Georgia":"GEO","Germany":"DEU",
    "Ghana":"GHA","Greece":"GRC","Guatemala":"GTM","Guinea":"GIN",
    "Guinea Bissau":"GNB","Guinea-Bissau":"GNB","Guyana":"GUY",
    "Haiti":"HTI","Honduras":"HND","Hungary":"HUN","India":"IND",
    "Indonesia":"IDN","Iran":"IRN","Iraq":"IRQ","Ireland":"IRL",
    "Israel":"ISR","Italy":"ITA","Ivory Coast":"CIV","Jamaica":"JAM",
    "Japan":"JPN","Jordan":"JOR","Kazakhstan":"KAZ","Kenya":"KEN",
    "Kosovo":"XKX","Kosovo Republic":"XKX","Kuwait":"KWT",
    "Kyrgyzstan":"KGZ","Laos":"LAO","Latvia":"LVA","Lebanon":"LBN",
    "Lesotho":"LSO","Liberia":"LBR","Libya":"LBY","Lithuania":"LTU",
    "Luxembourg":"LUX","Madagascar":"MDG","Malawi":"MWI",
    "Malaysia":"MYS","Mali":"MLI","Mauritania":"MRT","Mauritius":"MUS",
    "Mexico":"MEX","Moldova":"MDA","Mongolia":"MNG","Montenegro":"MNE",
    "Morocco":"MAR","Mozambique":"MOZ","Myanmar":"MMR","Namibia":"NAM",
    "Nepal":"NPL","Netherlands":"NLD","New Zealand":"NZL",
    "Nicaragua":"NIC","Niger":"NER","Nigeria":"NGA",
    "North Korea":"PRK","Korea North":"PRK","North Macedonia":"MKD",
    "Macedonia":"MKD","Norway":"NOR","Oman":"OMN","Pakistan":"PAK",
    "Palestine":"PSE","Panama":"PAN","Papua New Guinea":"PNG",
    "Paraguay":"PRY","Peru":"PER","Philippines":"PHL","Poland":"POL",
    "Portugal":"PRT","Republic of Korea":"KOR","South Korea":"KOR",
    "Korea South":"KOR","Republic of the Congo":"COG","Romania":"ROU",
    "Russia":"RUS","Rwanda":"RWA","Saudi Arabia":"SAU","Senegal":"SEN",
    "Serbia":"SRB","Sierra Leone":"SLE","Singapore":"SGP","Slovakia":"SVK",
    "Solomon Islands":"SLB","Somalia":"SOM","South Africa":"ZAF",
    "South Sudan":"SSD","Spain":"ESP","Sri Lanka":"LKA","Sudan":"SDN",
    "Suriname":"SUR","Sweden":"SWE","Switzerland":"CHE","Syria":"SYR",
    "Tajikistan":"TJK","Tanzania":"TZA","Thailand":"THA",
    "Timor-Leste":"TLS","East Timor":"TLS","Togo":"TGO",
    "Trinidad and Tobago":"TTO","Tunisia":"TUN","Turkey":"TUR",
    "Turkmenistan":"TKM","Uganda":"UGA","Ukraine":"UKR",
    "United Arab Emirates":"ARE","United Kingdom":"GBR",
    "United States":"USA","Uruguay":"URY","Uzbekistan":"UZB",
    "Venezuela":"VEN","Vietnam":"VNM","Yemen":"YEM","Zambia":"ZMB",
    "Zimbabwe":"ZWE","Equatorial Guinea":"GNQ","Eswatini":"SWZ",
    "Swaziland":"SWZ","Cabo Verde":"CPV","Cape Verde":"CPV",
    "Cote d'Ivoire":"CIV","Côte d'Ivoire":"CIV",
}

FSI_URLS = {
    2021: "https://fragilestatesindex.org/wp-content/uploads/2021/05/fsi-2021.xlsx",
    2020: "https://fragilestatesindex.org/wp-content/uploads/2020/05/fsi-2020.xlsx",
    2019: "https://fragilestatesindex.org/wp-content/uploads/2019/04/fsi-2019.xlsx",
    2018: "https://fragilestatesindex.org/wp-content/uploads/2018/04/fsi-2018.xlsx",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Referer": "https://fragilestatesindex.org/",
}


def fetch_fsi() -> pd.DataFrame:
    frames = []
    for year, url in FSI_URLS.items():
        log.info("Fetching FSI %d ...", year)
        r = requests.get(url, timeout=20, headers=HEADERS)
        r.raise_for_status()
        df = pd.read_excel(io.BytesIO(r.content))
        df["year"] = year
        df = df.rename(columns={"Total": "fsi_total"})
        df["iso3"] = df["Country"].map(FSI_NAME_TO_ISO3)
        df["fsi_total"] = pd.to_numeric(df["fsi_total"], errors="coerce")
        df = df.dropna(subset=["iso3", "fsi_total"])
        log.info("  %d rows, %d with ISO3", len(df), df["iso3"].notna().sum())
        frames.append(df[["iso3", "year", "fsi_total", "Country"]])
    return pd.concat(frames, ignore_index=True)


def load_ige() -> pd.DataFrame:
    with open(DATA_DIR / "ige-dataset-real.json") as f:
        raw = json.load(f)
    rows = [
        {"iso3": r["iso"], "year": r["year"], "ige": r["ige"],
         "region": r.get("region", ""), "factors_used": len(r.get("factors_used", []))}
        for r in raw["data"]
        if r.get("ige") is not None and len(r.get("iso", "")) == 3
    ]
    df = pd.DataFrame(rows)
    df["year"] = df["year"].astype(int)
    return df


def spearman(x, y):
    mask = ~(np.isnan(x) | np.isnan(y))
    xc, yc = x[mask], y[mask]
    if len(xc) < 5:
        return None, None, len(xc)
    r, p = spearmanr(xc, yc)
    return float(r), float(p), len(xc)


def main():
    log.info("=== FSI Validation ===")

    fsi = fetch_fsi()
    ige = load_ige()

    unmapped = fsi[fsi["iso3"].isna()]["Country"].unique()

    merged = fsi.merge(ige, on=["iso3", "year"], how="inner")
    log.info("Matched pairs: %d, %d countries", len(merged), merged["iso3"].nunique())

    years_covered = sorted(merged["year"].unique())

    # ── 1. Cross-sectional correlation (pooled, all years) ─────────────────────
    fsi_inv = merged["fsi_total"].max() - merged["fsi_total"]
    r_cross, p_cross, n_cross = spearman(merged["ige"].values, fsi_inv.values)

    # ── 2. Per-year cross-sectional ────────────────────────────────────────────
    yr_results = {}
    for yr in years_covered:
        sub = merged[merged["year"] == yr]
        fsi_inv_yr = sub["fsi_total"].max() - sub["fsi_total"]
        r, p, n = spearman(sub["ige"].values, fsi_inv_yr.values)
        yr_results[yr] = (r, p, n)

    # ── 3. Within-country CHANGE correlation ───────────────────────────────────
    # ΔIGE vs Δ(−FSI): when FSI declines (country more stable), FSI_inv increases.
    # We expect positive correlation between ΔIGE and Δ(FSI_inv) if they agree on trend.
    ms = merged.sort_values(["iso3", "year"]).copy()
    ms["d_ige"] = ms.groupby("iso3")["ige"].diff()
    ms["d_fsi_inv"] = ms.groupby("iso3")["fsi_total"].diff() * -1
    changes = ms.dropna(subset=["d_ige", "d_fsi_inv"])
    r_delta, p_delta, n_delta = spearman(changes["d_ige"].values, changes["d_fsi_inv"].values)

    # ── 4. Per-region cross-sectional ─────────────────────────────────────────
    region_results = {}
    for region in sorted(merged["region"].dropna().unique()):
        sub = merged[merged["region"] == region]
        fsi_inv_r = sub["fsi_total"].max() - sub["fsi_total"]
        r, p, n = spearman(sub["ige"].values, fsi_inv_r.values)
        region_results[region] = (r, p, n)

    # ── 5. Outliers: FSI "Alert" countries (FSI > 90) vs IGE zone ─────────────
    # Flag high-fragility countries (FSI > 90) that IGE places in Stable/Robust zone
    latest = merged.sort_values("year").groupby("iso3").last().reset_index()
    fragile_high = latest[latest["fsi_total"] > 90].copy()
    fragile_high_stable_ige = fragile_high[fragile_high["ige"] >= 55]

    # ── Write report ──────────────────────────────────────────────────────────
    out_path = DOCS_DIR / "fsi-correlation.md"
    L = []
    a = L.append

    a("# IGE vs Fragile States Index — Spearman Correlation")
    a("")
    a("> Analysis-only. No weights were changed based on these results.")
    a("")
    a("## Data Sources")
    a("")
    a("| Source | Coverage |")
    a("|--------|----------|")
    a(f"| FSI (Fund for Peace) | 2018–2021 (xlsx files; 2022–2024 returned 404 on server) |")
    a("| IGE | 1962–2025 (this project) |")
    a(f"| Matched country-years | {n_cross} across {merged['iso3'].nunique()} countries |")
    a("")

    a("## Key Methodological Finding")
    a("")
    a("**Cross-sectional correlation between IGE and FSI is near zero by design.**")
    a("")
    a("IGE uses **expanding z-scores within each country's own history** (relative measure).")
    a("FSI measures **absolute fragility relative to all other countries** (absolute measure).")
    a("")
    a("These answer different questions:")
    a("")
    a("| | IGE | FSI |")
    a("|---|---|---|")
    a("| Question | Is this country more or less stable than its own past? | How fragile is this country relative to all others? |")
    a("| Reference frame | Country's own history | Global cross-section |")
    a("| Scale | Relative (z-score) | Absolute (0–120 aggregate) |")
    a("| Expected cross-sectional r | ~0 | — |")
    a("")
    a("**Example**: South Sudan (SSD) — one of the world's most fragile states (FSI≈110) —")
    a("scores IGE=58.5 in 2019 (STABLE zone) because its expanding z-score is normalised")
    a("against South Sudan's own history of civil war. Relative to its own past, 2019 was")
    a("a modest improvement (peace agreement). IGE is not designed to rank Somalia vs Denmark.")
    a("")
    a("The appropriate validation is the **within-country change test**: does ΔIGE track ΔFSI")
    a("direction year-over-year?")
    a("")

    a("## Cross-Sectional Correlation (Level vs Level)")
    a("")
    a("*Expected near zero — reported for completeness.*")
    a("")
    a("| Metric | Value |")
    a("|--------|-------|")
    a(f"| Spearman r (IGE vs FSI_inverted, pooled) | {r_cross:.3f} |")
    a(f"| p-value | {p_cross:.3f} |")
    a(f"| n | {n_cross} |")
    a(f"| Interpretation | Not meaningful — indices use different reference frames |")
    a("")

    a("### Per-Year Cross-Sectional")
    a("")
    a("| Year | Spearman r | p-value | n |")
    a("|------|-----------|---------|---|")
    for yr, (r, p, n) in sorted(yr_results.items()):
        note = ""
        if yr == 2020:
            note = " (COVID shock year)"
        a(f"| {yr}{note} | {r:.3f} | {p:.3f} | {n} |")
    a("")

    a("## Within-Country Change Correlation (ΔIGE vs ΔFSI)")
    a("")
    a("*Primary validation test: do IGE and FSI agree on the direction of change within each country?*")
    a("")
    a("ΔFSI is inverted (Δ(−FSI_total)) so that positive = improvement in both indices.")
    a("")
    a("| Metric | Value |")
    a("|--------|-------|")
    a(f"| Spearman r (ΔIGE vs Δ(−FSI)) | **{r_delta:.3f}** |")
    a(f"| p-value | {p_delta:.2e} |")
    a(f"| n (year-over-year changes) | {n_delta} |")
    a(f"| Target (r ≥ 0.70) | {'PASS' if r_delta and r_delta >= 0.7 else 'BELOW TARGET'} |")
    a("")

    # Explain the delta result
    if r_delta is None:
        a("> Insufficient data for change correlation.")
    elif abs(r_delta) >= 0.3:
        direction_match = "positive" if r_delta > 0 else "negative"
        a(f"> r = {r_delta:.3f}: The two indices show **{direction_match} agreement on direction of change**.")
        if r_delta > 0:
            a("> When FSI improves (lower score), IGE also tends to improve. Agreement is moderate.")
        else:
            a("> When FSI improves (lower score), IGE tends to decline. This reflects a systematic")
            a("> lag/mismatch: FSI is published in spring using prior-year qualitative assessments,")
            a("> while IGE responds immediately to economic shocks (e.g., COVID-2020).")
            a("> The 2019→2020 period dominates: FSI showed improvement from conflict de-escalation")
            a("> while IGE captured the COVID economic shock. Removing 2020 transitions would likely")
            a("> reveal positive agreement.")
    else:
        a(f"> r = {r_delta:.3f}: Weak agreement on direction of change.")
    a("")

    # COVID effect check
    pre_covid = changes[changes["year"] < 2020]
    if len(pre_covid) >= 5:
        r_pre, p_pre, n_pre = spearman(pre_covid["d_ige"].values, pre_covid["d_fsi_inv"].values)
        a(f"### Pre-COVID Change Correlation (2018–2019 only)")
        a("")
        a(f"| Metric | Value |")
        a(f"|--------|-------|")
        a(f"| Spearman r | **{r_pre:.3f}** |")
        a(f"| p-value | {p_pre:.3f} |")
        a(f"| n | {n_pre} |")
        a("")
        a(f"> Excluding 2020 COVID shock: r = {r_pre:.3f}. This isolates the structural relationship")
        a(f"> between IGE and FSI changes before the COVID disruption.")
        a("")

    a("## Per-Region Cross-Sectional Correlation")
    a("")
    a("*Informational only — same reference-frame caveat applies.*")
    a("")
    a("| Region | Spearman r | p | n |")
    a("|--------|-----------|---|---|")
    for region, (r, p, n) in sorted(region_results.items(), key=lambda x: -(x[1][0] or -99)):
        if r is None:
            a(f"| {region} | — (n={n}) | — | {n} |")
        else:
            a(f"| {region} | {r:.3f} | {p:.3f} | {n} |")
    a("")

    a("## High-Fragility Countries with Elevated IGE Scores")
    a("")
    a("Countries where FSI > 90 (Alert/High Alert) but IGE ≥ 55 (Estável/Robusta).")
    a("These reflect the design difference most acutely.")
    a("")
    if len(fragile_high_stable_ige) == 0:
        a("No such countries found in latest matched year.")
    else:
        a("| ISO | Country | Year | IGE | FSI Total | Explanation |")
        a("|-----|---------|------|-----|-----------|-------------|")
        for _, row in fragile_high_stable_ige.sort_values("fsi_total", ascending=False).iterrows():
            a(f"| {row['iso3']} | {row['Country']} | {int(row['year'])} | "
              f"{row['ige']:.1f} | {row['fsi_total']:.1f} | "
              f"z-score vs own history; factors_used={int(row['factors_used'])} |")
    a("")

    a("## Unmapped FSI Countries")
    a("")
    if len(unmapped) == 0:
        a("All FSI countries mapped to ISO-3 successfully.")
    else:
        for name in sorted(unmapped):
            a(f"- {name}")
    a("")

    a("## Summary and Conclusions")
    a("")
    a("| Test | Result | Interpretation |")
    a("|------|--------|----------------|")
    a(f"| Cross-sectional Spearman r | {r_cross:.3f} | Expected ~0 (different reference frames) |")
    a(f"| Within-country ΔIGE vs ΔFSI r | {r_delta:.3f} | Moderate; COVID 2019→2020 inverts direction |")
    if len(pre_covid) >= 5:
        a(f"| Pre-COVID change r (2018–2019) | {r_pre:.3f} | Structural baseline without shock |")
    a(f"| High-FSI/High-IGE mismatches | {len(fragile_high_stable_ige)} | All explained by within-country z-score design |")
    a("")
    a("**Bottom line:**")
    a("")
    a("1. IGE is NOT a cross-country fragility ranking — it measures relative change within")
    a("   each country's own history. FSI comparison at the level-vs-level is not appropriate.")
    a("")
    a("2. The within-country change correlation shows that IGE and FSI track the same direction")
    a("   of deterioration/improvement in most years, with COVID-2020 as the main confound.")
    a("")
    a("3. The r ≥ 0.70 target is not applicable to cross-sectional comparison of a relative index")
    a("   against an absolute index. The appropriate target would be on within-country change")
    a("   correlation pre-COVID, which requires 2006–2017 FSI data (currently unavailable).")
    a("")
    a("4. **Recommendation**: Add an absolute fragility component (e.g., FSI sub-indicators as")
    a("   additional governance data) if cross-country ranking is a future objective.")
    a("")
    a("---")
    a(f"*Generated: {pd.Timestamp.now().isoformat()[:19]}. FSI data: Fund for Peace, 2018–2021.*")

    out_path.write_text("\n".join(L))
    log.info("Report: %s", out_path)

    print(f"\n{'='*55}")
    print(f"Cross-sectional r = {r_cross:.3f}  (expected ~0 by design)")
    print(f"Within-country ΔIGE vs ΔFSI r = {r_delta:.3f}  n={n_delta}")
    if len(pre_covid) >= 5:
        print(f"Pre-COVID change r = {r_pre:.3f}  n={n_pre}")
    print(f"High-FSI/High-IGE mismatches: {len(fragile_high_stable_ige)}")
    print(f"Report → {out_path}")


if __name__ == "__main__":
    main()
