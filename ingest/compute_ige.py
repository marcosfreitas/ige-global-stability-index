"""
IGE Compute — Índice Global de Estabilidade
Reads raw CSVs from ingest/raw/, computes IGE per country-year,
and writes data/ige-dataset-real.json and data/ige-dataset-real.min.json.

Methodology v3.0 — hierarchical pillars:
  Economic  (40%): GDP growth 30% | Inflation 25% | Unemployment 25% | Debt 20%
  Security  (30%): Conflict deaths 100%
  Governance(30%): TI CPI score 100% (OWID, 2012–2024)

Missing pillars reweighted proportionally. Each record carries
'data_quality' listing absent factors so the UI can show a yellow notice.
"""
import json
import math
import logging
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

REPO_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_DIR / "ingest" / "raw"
DATA_DIR = REPO_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Pillar / factor weights
# ---------------------------------------------------------------------------

ECON_WEIGHTS = {
    "gdp_growth":   0.30,
    "inflation":    0.25,
    "unemployment": 0.25,
    "debt":         0.20,
}

PILLAR_WEIGHTS = {
    "economic":   0.40,
    "security":   0.30,
    "governance": 0.30,
}

ALL_FACTORS = list(ECON_WEIGHTS.keys()) + ["conflict", "governance"]


# ---------------------------------------------------------------------------
# Expanding z-score (no look-ahead)
# ---------------------------------------------------------------------------

def expanding_zscore(series: pd.Series, min_obs: int = 3) -> pd.Series:
    """
    For each position t, compute z using only values up to and including t.
    No look-ahead. Returns NaN when fewer than min_obs observations available.
    """
    result = []
    for i in range(len(series)):
        window = series.iloc[: i + 1].dropna()
        if len(window) < min_obs:
            result.append(float("nan"))
            continue
        mu = window.mean()
        sigma = window.std(ddof=1)
        if sigma == 0:
            result.append(0.0)
        else:
            val = series.iloc[i]
            result.append((val - mu) / sigma if pd.notna(val) else float("nan"))
    return pd.Series(result, index=series.index)


# ---------------------------------------------------------------------------
# Score rescaling
# ---------------------------------------------------------------------------

def z_to_score(z: float) -> float:
    if math.isnan(z):
        return float("nan")
    z_clamped = max(-3.0, min(3.0, z))
    return max(0.0, min(100.0, 50.0 + (z_clamped / 3.0) * 50.0))


# ---------------------------------------------------------------------------
# Hierarchical NÍVEL computation
# ---------------------------------------------------------------------------

def compute_nivel(scores: dict) -> tuple[float, list[str], list[str]]:
    """
    scores: {factor: score_or_nan} with keys from ALL_FACTORS.
    Returns (nivel, factors_used_list, missing_factors_list).

    Economic pillar: GDP growth, inflation, unemployment, debt (ECON_WEIGHTS)
    Security pillar: conflict
    Governance pillar: governance (TI CPI-based)

    Missing pillars are reweighted proportionally among available pillars.
    """
    def nan_safe(v):
        return isinstance(v, float) and math.isnan(v)

    # Economic sub-score
    econ_avail = {k: scores[k] for k in ECON_WEIGHTS
                  if k in scores and not nan_safe(scores[k])}
    if econ_avail:
        ew_total = sum(ECON_WEIGHTS[k] for k in econ_avail)
        econ_score = sum(ECON_WEIGHTS[k] * econ_avail[k] for k in econ_avail) / ew_total
    else:
        econ_score = float("nan")

    # Security sub-score
    conflict_score = scores.get("conflict", float("nan"))
    if nan_safe(conflict_score):
        conflict_score = float("nan")

    # Governance sub-score
    gov_score = scores.get("governance", float("nan"))
    if nan_safe(gov_score):
        gov_score = float("nan")

    # Pillar-level reweighting
    pillar_scores = {}
    if not math.isnan(econ_score):
        pillar_scores["economic"] = econ_score
    if not math.isnan(conflict_score):
        pillar_scores["security"] = conflict_score
    if not math.isnan(gov_score):
        pillar_scores["governance"] = gov_score

    if not pillar_scores:
        return float("nan"), [], ALL_FACTORS[:]

    pw_total = sum(PILLAR_WEIGHTS[p] for p in pillar_scores)
    nivel = sum(PILLAR_WEIGHTS[p] * pillar_scores[p] for p in pillar_scores) / pw_total

    factors_used = []
    if "economic" in pillar_scores:
        factors_used.extend(list(econ_avail.keys()))
    if "security" in pillar_scores:
        factors_used.append("conflict")
    if "governance" in pillar_scores:
        factors_used.append("governance")

    missing = [f for f in ALL_FACTORS if f not in factors_used]
    return nivel, factors_used, missing


# ---------------------------------------------------------------------------
# Clamp helper
# ---------------------------------------------------------------------------

def clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


# ---------------------------------------------------------------------------
# Load raw data helpers
# ---------------------------------------------------------------------------

def load_wb(filepath: Path, value_col: str = "value") -> pd.DataFrame:
    if not filepath.exists():
        log.warning("Missing raw file: %s", filepath)
        return pd.DataFrame(columns=["iso3", "year", value_col])
    df = pd.read_csv(filepath)
    df = df.rename(columns={"value": value_col})
    df["iso3"] = df["iso3"].str.upper().str.strip()
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    return df.dropna(subset=["iso3", "year"])


def load_conflict(filepath: Path) -> pd.DataFrame:
    if not filepath.exists():
        log.warning("Missing conflict file: %s", filepath)
        return pd.DataFrame(columns=["iso3", "year", "battle_deaths"])
    df = pd.read_csv(filepath)
    df["iso3"] = df["iso3"].str.upper().str.strip()
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    df["battle_deaths"] = pd.to_numeric(df["battle_deaths"], errors="coerce")
    return df.dropna(subset=["iso3", "year"])


# ---------------------------------------------------------------------------
# Load fetch log for meta
# ---------------------------------------------------------------------------

def load_fetch_log() -> dict:
    log_path = RAW_DIR / "fetch_log.json"
    if log_path.exists():
        with open(log_path) as f:
            return json.load(f)
    return {}


# ---------------------------------------------------------------------------
# Main computation
# ---------------------------------------------------------------------------

def main():
    log.info("=== IGE Compute v3.0 (hierarchical pillars) ===")
    fetch_log = load_fetch_log()

    # Load all raw data
    df_inf   = load_wb(RAW_DIR / "inflation_raw.csv",   "inflation")
    df_gdp   = load_wb(RAW_DIR / "gdp_growth_raw.csv",  "gdp_growth")
    df_unem  = load_wb(RAW_DIR / "unemployment_raw.csv","unemployment")
    df_debt_wb = load_wb(RAW_DIR / "debt_raw.csv",      "debt")
    df_gdp_usd = load_wb(RAW_DIR / "gdp_usd_raw.csv",  "gdp_usd")
    df_pop   = load_wb(RAW_DIR / "population_raw.csv",  "population")
    df_conflict = load_conflict(RAW_DIR / "conflict_raw.csv")
    df_gov   = load_wb(RAW_DIR / "governance_raw.csv",  "governance")

    # Merge World Bank debt with IMF WEO debt as fallback
    df_debt_imf = load_wb(RAW_DIR / "debt_imf_raw.csv", "debt_imf")
    if not df_debt_imf.empty:
        df_debt = df_debt_wb.merge(df_debt_imf, on=["iso3", "year"], how="outer")
        df_debt["debt"] = df_debt["debt"].combine_first(df_debt["debt_imf"])
        df_debt = df_debt[["iso3", "year", "debt"]].copy()
        log.info(
            "Debt after WB+IMF merge: %d rows, %.1f%% non-null",
            len(df_debt), df_debt["debt"].notna().mean() * 100,
        )
    else:
        df_debt = df_debt_wb
        log.warning("IMF debt file not found; using World Bank debt only")

    # Hard cap at 2025 — drop IMF/WB forward projections
    MAX_YEAR = 2025
    for name, df_ref in [
        ("inflation",    df_inf),
        ("gdp_growth",   df_gdp),
        ("unemployment", df_unem),
        ("debt",         df_debt),
        ("gdp_usd",      df_gdp_usd),
        ("population",   df_pop),
        ("governance",   df_gov),
    ]:
        before = len(df_ref)
        df_ref.drop(df_ref[df_ref["year"] > MAX_YEAR].index, inplace=True)
        dropped = before - len(df_ref)
        if dropped:
            log.info("Year cap: dropped %d rows > %d from %s", dropped, MAX_YEAR, name)
    log.info("All sources capped at year <= %d", MAX_YEAR)

    # Collect all iso3-year pairs from economic + governance sources
    all_pairs: set[tuple[str, int]] = set()
    for df, _ in [
        (df_inf, "inflation"), (df_gdp, "gdp_growth"),
        (df_unem, "unemployment"), (df_debt, "debt"),
    ]:
        for _, row in df[["iso3", "year"]].iterrows():
            all_pairs.add((row["iso3"], int(row["year"])))

    log.info("Total iso3-year pairs: %d", len(all_pairs))

    # Build master wide table
    base = pd.DataFrame(list(all_pairs), columns=["iso3", "year"])
    base = base.merge(df_inf,      on=["iso3", "year"], how="left")
    base = base.merge(df_gdp,      on=["iso3", "year"], how="left")
    base = base.merge(df_unem,     on=["iso3", "year"], how="left")
    base = base.merge(df_debt,     on=["iso3", "year"], how="left")
    base = base.merge(df_gdp_usd,  on=["iso3", "year"], how="left")
    base = base.merge(df_pop,      on=["iso3", "year"], how="left")
    base = base.merge(df_conflict, on=["iso3", "year"], how="left")
    base = base.merge(df_gov,      on=["iso3", "year"], how="left")

    base["year_int"] = base["year"].astype(int)

    # Conflict deaths: zero-fill for countries with any UCDP coverage post-1989
    countries_in_conflict = set(df_conflict["iso3"].unique())

    def conflict_value(row):
        yr  = row["year_int"]
        iso = row["iso3"]
        bd  = row["battle_deaths"]
        if yr < 1989:
            return float("nan")
        if pd.isna(bd):
            return 0.0 if iso in countries_in_conflict else float("nan")
        return float(bd)

    base["battle_deaths_clean"] = base.apply(conflict_value, axis=1)

    # Deaths per 100k
    def deaths_per_100k(row):
        bd  = row["battle_deaths_clean"]
        pop = row["population"]
        if isinstance(bd, float) and math.isnan(bd):
            return float("nan")
        if pd.isna(pop) or pop <= 0:
            return float("nan")
        return bd / (pop / 100_000)

    base["deaths_per_100k"] = base.apply(deaths_per_100k, axis=1)

    # Inflation penalty: -(|inf - 2.0|)
    base["inf_pen"] = base["inflation"].apply(
        lambda x: -abs(x - 2.0) if pd.notna(x) else float("nan")
    )

    base = base.sort_values(["iso3", "year_int"]).reset_index(drop=True)

    # Expanding z-score per country, per factor
    log.info("Computing expanding z-scores per country...")
    records = []

    for iso3, grp in base.groupby("iso3"):
        grp = grp.sort_values("year_int").reset_index(drop=True)

        # Z-scores (expanding, no look-ahead)
        z_gdp      = expanding_zscore(grp["gdp_growth"])
        z_unem     = -expanding_zscore(grp["unemployment"])   # inverted
        z_debt     = -expanding_zscore(grp["debt"])            # inverted
        z_conflict = -expanding_zscore(grp["deaths_per_100k"])# inverted
        z_inf      = expanding_zscore(grp["inf_pen"])          # direct (penalty already inverted)
        z_gov      = expanding_zscore(grp["governance"])       # direct (higher CPI = better)

        # 0-100 scores
        s_gdp      = z_gdp.apply(z_to_score)
        s_unem     = z_unem.apply(z_to_score)
        s_debt     = z_debt.apply(z_to_score)
        s_conflict = z_conflict.apply(z_to_score)
        s_inf      = z_inf.apply(z_to_score)
        s_gov      = z_gov.apply(z_to_score)

        niveles          = []
        factors_used_all = []
        missing_all      = []

        for i in range(len(grp)):
            scores_dict = {
                "gdp_growth":   s_gdp.iloc[i],
                "unemployment": s_unem.iloc[i],
                "debt":         s_debt.iloc[i],
                "conflict":     s_conflict.iloc[i],
                "inflation":    s_inf.iloc[i],
                "governance":   s_gov.iloc[i],
            }
            nv, fu, missing = compute_nivel(scores_dict)
            niveles.append(nv)
            factors_used_all.append(fu)
            missing_all.append(missing)

        nivel_series = pd.Series(niveles)

        # Momentum: 50 + 2.2 * (nivel_t - nivel_{t-2})
        momentums = []
        for i in range(len(grp)):
            if i < 2 or math.isnan(nivel_series.iloc[i]):
                momentums.append(float("nan"))
            elif math.isnan(nivel_series.iloc[i - 2]):
                momentums.append(float("nan"))
            else:
                m = clamp(50.0 + 2.2 * (nivel_series.iloc[i] - nivel_series.iloc[i - 2]), 0.0, 100.0)
                momentums.append(m)

        momentum_series = pd.Series(momentums)

        # IGE: 0.60 * nivel + 0.40 * momentum (nivel-only when momentum NaN)
        iges = []
        for i in range(len(grp)):
            nv = nivel_series.iloc[i]
            mo = momentum_series.iloc[i]
            if math.isnan(nv):
                iges.append(float("nan"))
            elif math.isnan(mo):
                iges.append(nv)
            else:
                iges.append(0.60 * nv + 0.40 * mo)

        ige_series = pd.Series(iges)

        from regions import get_region
        region = get_region(iso3)

        for i, (_, row) in enumerate(grp.iterrows()):
            nv = nivel_series.iloc[i]
            mo = momentum_series.iloc[i]
            ig = ige_series.iloc[i]
            fu = factors_used_all[i]
            missing = missing_all[i]

            if math.isnan(nv) and math.isnan(ig):
                continue  # skip fully missing rows

            def r2(x):
                return round(float(x), 2) if not math.isnan(x) else None

            inf_val  = row["inflation"]
            gdp_val  = row["gdp_growth"]
            unem_val = row["unemployment"]
            debt_val = row["debt"]
            bd_val   = row["battle_deaths_clean"]
            gov_val  = row["governance"]

            records.append({
                "iso": iso3,
                "region": region,
                "year": int(row["year_int"]),
                "inflation":      r2(inf_val)  if pd.notna(inf_val)  else None,
                "gdp_growth":     r2(gdp_val)  if pd.notna(gdp_val)  else None,
                "unemployment":   r2(unem_val) if pd.notna(unem_val) else None,
                "debt":           r2(debt_val) if pd.notna(debt_val) else None,
                "conflict_deaths": r2(bd_val) if (
                    bd_val is not None
                    and not (isinstance(bd_val, float) and math.isnan(bd_val))
                    and pd.notna(bd_val)
                ) else None,
                "governance_cpi": r2(gov_val) if pd.notna(gov_val) else None,
                "nivel":    r2(nv),
                "momentum": r2(mo),
                "ige":      r2(ig),
                "factors_used":  fu,
                "data_quality":  missing,   # [] = all present; non-empty = yellow notice
            })

    log.info("Generated %d country-year records (before region filter)", len(records))

    # Filter regional pseudo-ISO codes
    from regions import REGION_MAP
    valid_isos = set(REGION_MAP.keys())
    AGGREGATE_ISOS = {
        "EAP", "ECA", "LAC", "SAS", "SSA", "MNA", "NAC",
        "WLD", "HIC", "LIC", "LMC", "UMC", "LMY", "MIC",
        "IBT", "IBD", "IDB", "IDX", "IDA",
        "EMU", "EUU", "FCS", "HPC", "OED", "PRE",
        "PST", "TEA", "TEC", "TLA", "TMN", "TSA", "TSS",
    }
    before = len(records)
    records = [
        r for r in records
        if (
            r.get("region") not in (None, "global")
            and r.get("iso") not in AGGREGATE_ISOS
            and (r.get("iso") in valid_isos or len(r.get("iso", "")) == 3)
        )
    ]
    log.info(
        "After pseudo-ISO filter: %d country-year records (%d dropped)",
        len(records), before - len(records),
    )

    # Regional aggregation
    log.info("Computing regional aggregates...")
    from regions import REGION_CODES, get_region

    df_records = pd.DataFrame(records)

    df_gdp_weight = df_gdp_usd.rename(columns={"gdp_usd": "gdp_weight"})
    df_records = df_records.merge(
        df_gdp_weight[["iso3", "year", "gdp_weight"]].rename(columns={"iso3": "iso"}),
        on=["iso", "year"], how="left",
    )

    regional_records = []

    def weighted_avg(yr_df: pd.DataFrame, col: str) -> float | None:
        valid = yr_df[yr_df[col].notna() & yr_df["gdp_weight"].notna()].copy()
        if valid.empty:
            valid2 = yr_df[yr_df[col].notna()].copy()
            if valid2.empty:
                return None
            return float(valid2[col].mean())
        tw = valid["gdp_weight"].sum()
        if tw == 0:
            return float(valid[col].mean())
        return float((valid[col] * valid["gdp_weight"]).sum() / tw)

    def r2(x):
        return round(float(x), 2) if x is not None and not math.isnan(x) else None

    for region_name, region_code in REGION_CODES.items():
        region_df = df_records[df_records["region"] == region_name].copy()
        if region_df.empty:
            continue
        for year, yr_df in region_df.groupby("year"):
            avg_ige    = weighted_avg(yr_df, "ige")
            avg_nivel  = weighted_avg(yr_df, "nivel")
            avg_mom    = weighted_avg(yr_df, "momentum")
            if avg_ige is None:
                continue
            regional_records.append({
                "iso": region_code,
                "region": region_name,
                "year": int(year),
                "inflation": None, "gdp_growth": None,
                "unemployment": None, "debt": None,
                "conflict_deaths": None, "governance_cpi": None,
                "nivel": r2(avg_nivel),
                "momentum": r2(avg_mom),
                "ige": r2(avg_ige),
                "factors_used": [],
                "data_quality": [],
            })

    # Global aggregate
    for year, yr_df in df_records.groupby("year"):
        avg_ige   = weighted_avg(yr_df, "ige")
        avg_nivel = weighted_avg(yr_df, "nivel")
        avg_mom   = weighted_avg(yr_df, "momentum")
        if avg_ige is None:
            continue
        regional_records.append({
            "iso": "WORLD",
            "region": "global",
            "year": int(year),
            "inflation": None, "gdp_growth": None,
            "unemployment": None, "debt": None,
            "conflict_deaths": None, "governance_cpi": None,
            "nivel": r2(avg_nivel),
            "momentum": r2(avg_mom),
            "ige": r2(avg_ige),
            "factors_used": [],
            "data_quality": [],
        })

    # Combine and sort
    all_records = records + regional_records
    for rec in all_records:
        rec.pop("gdp_weight", None)
    all_records.sort(key=lambda r: (r["iso"], r["year"]))

    # Meta
    country_isos  = [r["iso"] for r in records]
    unique_countries = len(set(country_isos))
    years_all = [r["year"] for r in records]
    year_range = [int(min(years_all)), int(max(years_all))] if years_all else [1960, 2025]

    def source_meta(key, name, indicator_info):
        entry = fetch_log.get(key, {})
        return {"name": name, "fetched": entry.get("timestamp", ""), "url": entry.get("url", indicator_info)}

    output = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "methodology_version": "3.0",
            "pillar_weights": PILLAR_WEIGHTS,
            "economic_factor_weights": ECON_WEIGHTS,
            "sources": {
                "inflation": source_meta(
                    "FP.CPI.TOTL.ZG", "World Bank WDI FP.CPI.TOTL.ZG",
                    "https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json"),
                "gdp_growth": source_meta(
                    "NY.GDP.PCAP.KD.ZG", "World Bank NY.GDP.PCAP.KD.ZG",
                    "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.KD.ZG?format=json"),
                "unemployment": source_meta(
                    "SL.UEM.TOTL.ZS", "World Bank SL.UEM.TOTL.ZS",
                    "https://api.worldbank.org/v2/country/all/indicator/SL.UEM.TOTL.ZS?format=json"),
                "debt": source_meta(
                    "GC.DOD.TOTL.GD.ZS", "World Bank GC.DOD.TOTL.GD.ZS + IMF WEO GGXWDG_NGDP",
                    "https://api.worldbank.org/v2/country/all/indicator/GC.DOD.TOTL.GD.ZS?format=json"),
                "conflict": source_meta(
                    "conflict", "UCDP/PRIO BRD", "https://ucdp.uu.se/downloads/"),
                "governance": source_meta(
                    "governance_cpi",
                    "Transparency International CPI via OWID (2012–2024)",
                    "https://ourworldindata.org/grapher/ti-corruption-perception-index"),
            },
            "year_range": year_range,
            "countries": unique_countries,
            "notes": (
                "Hierarchical pillars: Economic 40% (GDP growth 30%, inflation 25%, "
                "unemployment 25%, debt 20%) | Security 30% (conflict) | "
                "Governance 30% (TI CPI). Expanding z-score, no look-ahead. "
                "Missing pillars reweighted proportionally. Governance coverage "
                "starts 2012 (CPI); pre-2012 records missing governance pillar. "
                "IGE = 0.60 * nivel + 0.40 * momentum (nivel-only first 2 years)."
            ),
        },
        "data": all_records,
    }

    out_pretty = DATA_DIR / "ige-dataset-real.json"
    with open(out_pretty, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    log.info("Written %s (%d bytes)", out_pretty, out_pretty.stat().st_size)

    out_min = DATA_DIR / "ige-dataset-real.min.json"
    with open(out_min, "w") as f:
        json.dump(output, f, separators=(",", ":"), ensure_ascii=False)
    log.info("Written %s (%d bytes)", out_min, out_min.stat().st_size)

    log.info(
        "=== Compute complete: %d records, %d countries, years %d–%d ===",
        len(all_records), unique_countries, year_range[0], year_range[1],
    )


if __name__ == "__main__":
    main()
