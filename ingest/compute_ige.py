"""
IGE Compute — Índice Global de Estabilidade
Reads raw CSVs from ingest/raw/, computes IGE per country-year,
and writes data/ige-dataset-real.json and data/ige-dataset-real.min.json.
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

BASE_WEIGHTS = {
    "conflict": 0.30,
    "gdp_growth": 0.25,
    "inflation": 0.20,
    "unemployment": 0.15,
    "debt": 0.10,
}


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
# NÍVEL computation with reweighting
# ---------------------------------------------------------------------------

def compute_nivel(scores: dict) -> tuple[float, list[str]]:
    """scores: {factor: score_or_nan}. Returns (nivel, factors_used_list)."""
    available = {k: v for k, v in scores.items() if not math.isnan(v)}
    if not available:
        return float("nan"), []
    total_weight = sum(BASE_WEIGHTS[k] for k in available)
    nivel = sum(BASE_WEIGHTS[k] * available[k] for k in available) / total_weight
    return nivel, list(available.keys())


# ---------------------------------------------------------------------------
# Clamp helper
# ---------------------------------------------------------------------------

def clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


# ---------------------------------------------------------------------------
# Load raw data
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
    log.info("=== IGE Compute ===")
    fetch_log = load_fetch_log()

    # Load all raw data
    df_inf = load_wb(RAW_DIR / "inflation_raw.csv", "inflation")
    df_gdp = load_wb(RAW_DIR / "gdp_growth_raw.csv", "gdp_growth")
    df_unem = load_wb(RAW_DIR / "unemployment_raw.csv", "unemployment")
    df_debt = load_wb(RAW_DIR / "debt_raw.csv", "debt")
    df_gdp_usd = load_wb(RAW_DIR / "gdp_usd_raw.csv", "gdp_usd")
    df_pop = load_wb(RAW_DIR / "population_raw.csv", "population")
    df_conflict = load_conflict(RAW_DIR / "conflict_raw.csv")

    # Merge all on iso3, year
    # Start with all unique iso3-year combos across all sources
    all_pairs = set()
    for df, col in [
        (df_inf, "inflation"), (df_gdp, "gdp_growth"),
        (df_unem, "unemployment"), (df_debt, "debt"),
    ]:
        for _, row in df[["iso3", "year"]].iterrows():
            all_pairs.add((row["iso3"], int(row["year"])))

    log.info("Total iso3-year pairs: %d", len(all_pairs))

    # Build master wide table
    base = pd.DataFrame(list(all_pairs), columns=["iso3", "year"])
    base = base.merge(df_inf, on=["iso3", "year"], how="left")
    base = base.merge(df_gdp, on=["iso3", "year"], how="left")
    base = base.merge(df_unem, on=["iso3", "year"], how="left")
    base = base.merge(df_debt, on=["iso3", "year"], how="left")
    base = base.merge(df_gdp_usd, on=["iso3", "year"], how="left")
    base = base.merge(df_pop, on=["iso3", "year"], how="left")
    base = base.merge(df_conflict, on=["iso3", "year"], how="left")

    # Conflict deaths per 100k
    # Pre-1989: NaN (no UCDP coverage). Post-1989 missing: NaN if no data, 0 if country exists in dataset
    base["year_int"] = base["year"].astype(int)

    # For conflict: country-years >= 1989 where battle_deaths is NaN and the country
    # appears at least once in conflict data → treat as 0 (no active conflict recorded)
    countries_in_conflict = set(df_conflict["iso3"].unique())

    def conflict_value(row):
        yr = row["year_int"]
        iso = row["iso3"]
        bd = row["battle_deaths"]
        if yr < 1989:
            return float("nan")
        if pd.isna(bd):
            # If country appears in conflict dataset, assume 0; else NaN
            return 0.0 if iso in countries_in_conflict else float("nan")
        return float(bd)

    base["battle_deaths_clean"] = base.apply(conflict_value, axis=1)

    # deaths per 100k
    def deaths_per_100k(row):
        bd = row["battle_deaths_clean"]
        pop = row["population"]
        if math.isnan(bd) if isinstance(bd, float) else pd.isna(bd):
            return float("nan")
        if pd.isna(pop) or pop <= 0:
            return float("nan")
        return bd / (pop / 100_000)

    base["deaths_per_100k"] = base.apply(deaths_per_100k, axis=1)

    # Inflation penalty: -|inf - 2.0|
    base["inf_pen"] = base["inflation"].apply(
        lambda x: -abs(x - 2.0) if pd.notna(x) else float("nan")
    )

    # Sort for expanding z-score
    base = base.sort_values(["iso3", "year_int"]).reset_index(drop=True)

    # Apply expanding z-score per country, per factor
    log.info("Computing expanding z-scores per country...")
    records = []

    for iso3, grp in base.groupby("iso3"):
        grp = grp.sort_values("year_int").reset_index(drop=True)

        # Expanding z-scores
        z_gdp = expanding_zscore(grp["gdp_growth"])             # direct
        z_unem = -expanding_zscore(grp["unemployment"])          # inverted
        z_debt = -expanding_zscore(grp["debt"])                  # inverted
        z_conflict = -expanding_zscore(grp["deaths_per_100k"])   # inverted
        z_inf = expanding_zscore(grp["inf_pen"])                  # direct (already inverted via pen)

        # Convert to 0-100 scores
        s_gdp = z_gdp.apply(z_to_score)
        s_unem = z_unem.apply(z_to_score)
        s_debt = z_debt.apply(z_to_score)
        s_conflict = z_conflict.apply(z_to_score)
        s_inf = z_inf.apply(z_to_score)

        # NÍVEL per year
        niveles = []
        factors_used_list = []
        for i in range(len(grp)):
            scores_dict = {
                "gdp_growth": s_gdp.iloc[i],
                "unemployment": s_unem.iloc[i],
                "debt": s_debt.iloc[i],
                "conflict": s_conflict.iloc[i],
                "inflation": s_inf.iloc[i],
            }
            nv, fu = compute_nivel(scores_dict)
            niveles.append(nv)
            factors_used_list.append(fu)

        nivel_series = pd.Series(niveles)

        # MOMENTUM: 50 + 2.2 * (nivel_t - nivel_{t-2})
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

        # IGE: 0.60 * nivel + 0.40 * momentum
        # When momentum is NaN (first 2 data years), use nivel only
        iges = []
        for i in range(len(grp)):
            nv = nivel_series.iloc[i]
            mo = momentum_series.iloc[i]
            if math.isnan(nv):
                iges.append(float("nan"))
            elif math.isnan(mo):
                iges.append(nv)  # nivel only
            else:
                iges.append(0.60 * nv + 0.40 * mo)

        ige_series = pd.Series(iges)

        from regions import get_region
        region = get_region(iso3)

        for i, (_, row) in enumerate(grp.iterrows()):
            nv = nivel_series.iloc[i]
            mo = momentum_series.iloc[i]
            ig = ige_series.iloc[i]
            fu = factors_used_list[i]

            if math.isnan(nv) and math.isnan(ig):
                continue  # skip fully missing rows

            def r2(x):
                return round(float(x), 2) if not math.isnan(x) else None

            inf_val = row["inflation"]
            gdp_val = row["gdp_growth"]
            unem_val = row["unemployment"]
            debt_val = row["debt"]
            bd_val = row["battle_deaths_clean"]

            records.append({
                "iso": iso3,
                "region": region,
                "year": int(row["year_int"]),
                "inflation": r2(inf_val) if pd.notna(inf_val) else None,
                "gdp_growth": r2(gdp_val) if pd.notna(gdp_val) else None,
                "unemployment": r2(unem_val) if pd.notna(unem_val) else None,
                "debt": r2(debt_val) if pd.notna(debt_val) else None,
                "conflict_deaths": r2(bd_val) if (
                    not (isinstance(bd_val, float) and math.isnan(bd_val))
                    and bd_val is not None
                    and pd.notna(bd_val)
                ) else None,
                "nivel": r2(nv),
                "momentum": r2(mo),
                "ige": r2(ig),
                "factors_used": fu,
            })

    log.info("Generated %d country-year records", len(records))

    # Regional aggregation
    log.info("Computing regional aggregates...")
    from regions import REGION_CODES, get_region

    df_records = pd.DataFrame(records)

    # Add gdp_usd for weighting
    df_gdp_weight = df_gdp_usd.rename(columns={"gdp_usd": "gdp_weight"})
    df_records = df_records.merge(
        df_gdp_weight[["iso3", "year", "gdp_weight"]].rename(columns={"iso3": "iso"}),
        on=["iso", "year"], how="left"
    )

    regional_records = []

    for region_name, region_code in REGION_CODES.items():
        region_df = df_records[df_records["region"] == region_name].copy()
        if region_df.empty:
            continue
        for year, yr_df in region_df.groupby("year"):
            valid = yr_df[yr_df["ige"].notna() & yr_df["gdp_weight"].notna()].copy()
            if valid.empty:
                valid = yr_df[yr_df["ige"].notna()].copy()
                if valid.empty:
                    continue
                avg_ige = valid["ige"].mean()
                avg_nivel = valid["nivel"].mean() if valid["nivel"].notna().any() else None
                avg_mom = valid["momentum"].mean() if valid["momentum"].notna().any() else None
            else:
                total_w = valid["gdp_weight"].sum()
                if total_w == 0:
                    avg_ige = valid["ige"].mean()
                    avg_nivel = valid["nivel"].mean()
                    avg_mom = valid["momentum"].mean()
                else:
                    avg_ige = (valid["ige"] * valid["gdp_weight"]).sum() / total_w
                    avg_nivel = (valid["nivel"].fillna(valid["nivel"].mean()) * valid["gdp_weight"]).sum() / total_w
                    avg_mom_df = valid[valid["momentum"].notna()]
                    avg_mom = None
                    if not avg_mom_df.empty:
                        tw2 = avg_mom_df["gdp_weight"].sum()
                        avg_mom = (avg_mom_df["momentum"] * avg_mom_df["gdp_weight"]).sum() / tw2 if tw2 > 0 else avg_mom_df["momentum"].mean()

            def r2(x):
                return round(float(x), 2) if x is not None and not math.isnan(x) else None

            regional_records.append({
                "iso": region_code,
                "region": region_name,
                "year": int(year),
                "inflation": None,
                "gdp_growth": None,
                "unemployment": None,
                "debt": None,
                "conflict_deaths": None,
                "nivel": r2(avg_nivel),
                "momentum": r2(avg_mom),
                "ige": r2(avg_ige),
                "factors_used": [],
            })

    # Global aggregate
    for year, yr_df in df_records.groupby("year"):
        valid = yr_df[yr_df["ige"].notna() & yr_df["gdp_weight"].notna()].copy()
        if valid.empty:
            valid = yr_df[yr_df["ige"].notna()].copy()
            if valid.empty:
                continue
            avg_ige = valid["ige"].mean()
            avg_nivel = valid["nivel"].mean() if valid["nivel"].notna().any() else None
            avg_mom = valid["momentum"].mean() if valid["momentum"].notna().any() else None
        else:
            total_w = valid["gdp_weight"].sum()
            avg_ige = (valid["ige"] * valid["gdp_weight"]).sum() / total_w if total_w > 0 else valid["ige"].mean()
            avg_nivel = (valid["nivel"].fillna(valid["nivel"].mean()) * valid["gdp_weight"]).sum() / total_w if total_w > 0 else valid["nivel"].mean()
            avg_mom_df = valid[valid["momentum"].notna()]
            avg_mom = None
            if not avg_mom_df.empty:
                tw2 = avg_mom_df["gdp_weight"].sum()
                avg_mom = (avg_mom_df["momentum"] * avg_mom_df["gdp_weight"]).sum() / tw2 if tw2 > 0 else avg_mom_df["momentum"].mean()

        def r2(x):
            return round(float(x), 2) if x is not None and not math.isnan(x) else None

        regional_records.append({
            "iso": "WORLD",
            "region": "global",
            "year": int(year),
            "inflation": None,
            "gdp_growth": None,
            "unemployment": None,
            "debt": None,
            "conflict_deaths": None,
            "nivel": r2(avg_nivel),
            "momentum": r2(avg_mom),
            "ige": r2(avg_ige),
            "factors_used": [],
        })

    # Combine and sort
    all_records = records + regional_records

    # Drop gdp_weight column from df_records if present (not in output schema)
    all_records_clean = []
    for rec in all_records:
        rec.pop("gdp_weight", None)
        all_records_clean.append(rec)

    all_records_clean.sort(key=lambda r: (r["iso"], r["year"]))

    # Determine meta info
    country_isos = [r["iso"] for r in records]
    unique_countries = len(set(country_isos))
    years_all = [r["year"] for r in records]
    year_range = [int(min(years_all)), int(max(years_all))] if years_all else [1960, 2025]

    def source_meta(key, name, indicator_info):
        entry = fetch_log.get(key, {})
        return {
            "name": name,
            "fetched": entry.get("timestamp", ""),
            "url": entry.get("url", indicator_info),
        }

    output = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "methodology_version": "2.0",
            "sources": {
                "inflation": source_meta(
                    "FP.CPI.TOTL.ZG",
                    "World Bank WDI FP.CPI.TOTL.ZG",
                    "https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json",
                ),
                "gdp_growth": source_meta(
                    "NY.GDP.PCAP.KD.ZG",
                    "World Bank NY.GDP.PCAP.KD.ZG",
                    "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.KD.ZG?format=json",
                ),
                "unemployment": source_meta(
                    "SL.UEM.TOTL.ZS",
                    "World Bank SL.UEM.TOTL.ZS",
                    "https://api.worldbank.org/v2/country/all/indicator/SL.UEM.TOTL.ZS?format=json",
                ),
                "debt": source_meta(
                    "GC.DOD.TOTL.GD.ZS",
                    "World Bank GC.DOD.TOTL.GD.ZS",
                    "https://api.worldbank.org/v2/country/all/indicator/GC.DOD.TOTL.GD.ZS?format=json",
                ),
                "conflict": source_meta(
                    "conflict",
                    "UCDP/PRIO BRD",
                    "https://ucdp.uu.se/downloads/",
                ),
            },
            "year_range": year_range,
            "countries": unique_countries,
            "notes": (
                "expanding z-score (no look-ahead); weights rebalanced when factor absent; "
                "IGE uses nivel-only when momentum unavailable (first 2 data years per country); "
                "conflict coverage starts 1989 (UCDP); debt coverage irregular"
            ),
        },
        "data": all_records_clean,
    }

    # Write pretty JSON
    out_pretty = DATA_DIR / "ige-dataset-real.json"
    with open(out_pretty, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    log.info("Written %s (%d bytes)", out_pretty, out_pretty.stat().st_size)

    # Write minified JSON
    out_min = DATA_DIR / "ige-dataset-real.min.json"
    with open(out_min, "w") as f:
        json.dump(output, f, separators=(",", ":"), ensure_ascii=False)
    log.info("Written %s (%d bytes)", out_min, out_min.stat().st_size)

    log.info("=== Compute complete: %d records, %d countries, years %d-%d ===",
             len(all_records_clean), unique_countries, year_range[0], year_range[1])


if __name__ == "__main__":
    main()
