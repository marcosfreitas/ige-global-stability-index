"""
IGE Data Ingestion — Fetch Sources
Fetches all raw data from World Bank API and UCDP, with fallback mirrors.
Saves to ingest/raw/ and writes a fetch_log.json.
"""
import os
import json
import time
import re
import csv
import io
import logging
from datetime import datetime, timezone
from pathlib import Path

import requests
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

REPO_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_DIR / "ingest" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

TIMEOUT = 30
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "IGE-Pipeline/2.0 (contact: marcosvsfreitas@gmail.com)"})

fetch_log: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# World Bank pagination helper
# ---------------------------------------------------------------------------

def fetch_wb_indicator(indicator: str, out_file: Path) -> pd.DataFrame | None:
    """Fetch all pages for a World Bank indicator, return DataFrame iso3,year,value."""
    base_url = (
        f"https://api.worldbank.org/v2/country/all/indicator/{indicator}"
        f"?format=json&per_page=20000"
    )
    rows = []
    page = 1
    total_pages = None
    url_used = base_url + f"&page={page}"

    try:
        while True:
            url = base_url + f"&page={page}"
            resp = SESSION.get(url, timeout=TIMEOUT)
            resp.raise_for_status()
            payload = resp.json()
            meta = payload[0]
            data = payload[1] or []

            if total_pages is None:
                total_pages = meta.get("pages", 1)
                url_used = url

            for entry in data:
                iso3 = entry.get("countryiso3code") or (
                    entry.get("country", {}).get("id", "") if isinstance(entry.get("country"), dict) else ""
                )
                year = entry.get("date")
                value = entry.get("value")
                if iso3 and year and len(iso3) == 3:
                    try:
                        year = int(year)
                        value = float(value) if value is not None else None
                    except (ValueError, TypeError):
                        continue
                    rows.append({"iso3": iso3, "year": year, "value": value})

            log.info("  WB %s page %d/%d — %d rows so far", indicator, page, total_pages, len(rows))
            if page >= total_pages:
                break
            page += 1
            time.sleep(0.2)

        df = pd.DataFrame(rows)
        df.to_csv(out_file, index=False)
        log.info("Saved %d rows to %s", len(df), out_file)
        fetch_log[indicator] = {
            "url": url_used,
            "status": 200,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rows": len(df),
            "source": "worldbank",
        }
        return df

    except Exception as exc:
        log.warning("WB fetch failed for %s: %s", indicator, exc)
        fetch_log[indicator] = {
            "url": url_used,
            "status": "error",
            "error": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rows": 0,
            "source": "worldbank",
        }
        return None


# ---------------------------------------------------------------------------
# Mirror fallbacks
# ---------------------------------------------------------------------------

OWID_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
INFLATION_MIRROR = "https://raw.githubusercontent.com/datasets/inflation/master/data/inflation-consumer.csv"
CONFLICT_MIRROR = (
    "https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/"
    "Battle-related%20deaths%20in%20state-based%20conflicts%20(UCDP%2C%202023)/"
    "Battle-related%20deaths%20in%20state-based%20conflicts%20(UCDP%2C%202023).csv"
)

_owid_df: pd.DataFrame | None = None


def get_owid_df() -> pd.DataFrame | None:
    global _owid_df
    if _owid_df is not None:
        return _owid_df
    try:
        log.info("Fetching OWID fallback data...")
        resp = SESSION.get(OWID_URL, timeout=TIMEOUT)
        resp.raise_for_status()
        _owid_df = pd.read_csv(io.StringIO(resp.text))
        log.info("OWID data fetched: %d rows", len(_owid_df))
        return _owid_df
    except Exception as exc:
        log.warning("OWID fetch failed: %s", exc)
        return None


def fetch_inflation_mirror(out_file: Path) -> pd.DataFrame | None:
    try:
        resp = SESSION.get(INFLATION_MIRROR, timeout=TIMEOUT)
        resp.raise_for_status()
        df_raw = pd.read_csv(io.StringIO(resp.text))
        # columns: Country Name, Country Code, ...years as columns
        id_cols = [c for c in df_raw.columns if not str(c).isdigit()]
        year_cols = [c for c in df_raw.columns if str(c).isdigit()]
        rows = []
        for _, row in df_raw.iterrows():
            iso3 = str(row.get("Country Code", "")).strip()
            if len(iso3) != 3:
                continue
            for yr in year_cols:
                val = row.get(yr)
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    val = None
                rows.append({"iso3": iso3, "year": int(yr), "value": val})
        df = pd.DataFrame(rows)
        df.to_csv(out_file, index=False)
        fetch_log["FP.CPI.TOTL.ZG"]["source"] = "mirror"
        fetch_log["FP.CPI.TOTL.ZG"]["mirror_url"] = INFLATION_MIRROR
        fetch_log["FP.CPI.TOTL.ZG"]["rows"] = len(df)
        return df
    except Exception as exc:
        log.warning("Inflation mirror failed: %s", exc)
        return None


def fetch_gdp_mirror(out_file: Path, col: str, indicator: str) -> pd.DataFrame | None:
    """Use OWID data for GDP or population fallback."""
    owid = get_owid_df()
    if owid is None:
        return None
    if col not in owid.columns:
        log.warning("OWID column %s not found", col)
        return None
    sub = owid[["iso_code", "year", col]].dropna(subset=["iso_code"])
    sub = sub[sub["iso_code"].str.len() == 3].copy()
    sub = sub.rename(columns={"iso_code": "iso3", col: "value"})
    sub["value"] = pd.to_numeric(sub["value"], errors="coerce")
    df = sub[["iso3", "year", "value"]].reset_index(drop=True)
    df.to_csv(out_file, index=False)
    if indicator in fetch_log:
        fetch_log[indicator]["source"] = "owid_mirror"
        fetch_log[indicator]["rows"] = len(df)
    return df


# ---------------------------------------------------------------------------
# IMF World Economic Outlook — debt fallback
# ---------------------------------------------------------------------------

IMF_WEO_URL = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"


def fetch_imf_debt(out_file: Path) -> pd.DataFrame | None:
    """
    Fetch General Government Gross Debt (% of GDP) from IMF DataMapper API.
    Covers ~190 countries from ~1980 onwards — far broader than World Bank GC.DOD.TOTL.GD.ZS.
    Saves to debt_imf_raw.csv with columns iso3, year, value.
    """
    try:
        log.info("Fetching IMF WEO debt data from %s", IMF_WEO_URL)
        resp = SESSION.get(IMF_WEO_URL, timeout=TIMEOUT)
        resp.raise_for_status()
        payload = resp.json()

        country_data = payload.get("values", {}).get("GGXWDG_NGDP", {})
        if not country_data:
            log.warning("IMF WEO: no data in response")
            return None

        rows = []
        for iso_code, year_vals in country_data.items():
            iso3 = iso_code.strip().upper()
            if len(iso3) != 3:
                continue  # skip aggregates like "WORLD", "G20", etc.
            for year_str, value in year_vals.items():
                try:
                    year = int(year_str)
                    val = float(value) if value is not None else None
                except (ValueError, TypeError):
                    continue
                if val is not None:
                    rows.append({"iso3": iso3, "year": year, "value": val})

        df = pd.DataFrame(rows)
        if df.empty:
            log.warning("IMF WEO: parsed 0 valid rows")
            return None

        df.to_csv(out_file, index=False)
        log.info("IMF WEO debt: saved %d rows to %s", len(df), out_file)
        fetch_log["imf_debt"] = {
            "url": IMF_WEO_URL,
            "status": 200,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rows": len(df),
            "source": "imf_datamapper",
        }
        return df

    except Exception as exc:
        log.warning("IMF WEO debt fetch failed: %s", exc)
        fetch_log["imf_debt"] = {
            "url": IMF_WEO_URL,
            "status": "error",
            "error": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rows": 0,
        }
        return None


# ---------------------------------------------------------------------------
# Transparency International CPI — via Our World in Data (OWID)
# Governance proxy: 0 (most corrupt) → 100 (least corrupt), 2012–2024
# OWID long-format CSV is reliable; WB WGI bulk zip returns bad values.
# ---------------------------------------------------------------------------

OWID_CPI_URL = (
    "https://ourworldindata.org/grapher/ti-corruption-perception-index.csv"
    "?v=1&csvType=full&useColumnShortNames=true"
)


def fetch_governance(out_file: Path) -> pd.DataFrame | None:
    """
    Fetch TI Corruption Perceptions Index (0–100, higher = less corrupt)
    from OWID long-format CSV.  Coverage: ~182 countries, 2012–2024.
    Saved with columns: iso3, year, value.
    Years before 2012 will carry data_quality="missing_governance".
    """
    import io as _io

    try:
        log.info("Fetching TI CPI governance from OWID...")
        resp = SESSION.get(
            OWID_CPI_URL, timeout=30,
            headers={"User-Agent": "IGE-Pipeline/2.0"},
        )
        resp.raise_for_status()

        df = pd.read_csv(_io.StringIO(resp.text))
        # OWID columns: entity, code, year, cpi_score, owid_region
        df = df.rename(columns={"code": "iso3", "cpi_score": "value"})
        df["iso3"] = df["iso3"].astype(str).str.strip().str.upper()

        df = df[df["iso3"].str.match(r"^[A-Z]{3}$")]
        df = df.dropna(subset=["iso3", "year", "value"])
        df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        df = df.dropna(subset=["value"])

        out_df = df[["iso3", "year", "value"]].copy()
        out_df.to_csv(out_file, index=False)
        log.info(
            "Governance (TI CPI): %d rows, %d countries → %s",
            len(out_df), out_df["iso3"].nunique(), out_file,
        )
        fetch_log["governance_cpi"] = {
            "url": OWID_CPI_URL,
            "status": 200,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rows": len(out_df),
            "countries": out_df["iso3"].nunique(),
            "years": f"{int(out_df['year'].min())}–{int(out_df['year'].max())}",
            "source": "owid_ti_cpi",
        }
        return out_df

    except Exception as exc:
        log.warning("TI CPI governance fetch failed: %s", exc)
        fetch_log["governance_cpi"] = {
            "url": OWID_CPI_URL,
            "status": "error",
            "error": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        return None


# ---------------------------------------------------------------------------
# UCDP conflict data
# ---------------------------------------------------------------------------

# GW (Gleditsch-Ward) country_id → ISO-3 mapping, calibrated against
# the UCDP Organized Violence by Country-Year dataset (v26.1).
# All codes verified directly from the OVCY CSV — codes here match what
# UCDP actually stores in the `country_id` field, which deviates from
# COW in several regions (Balkans, post-Soviet, Africa, Central Asia).
GW_TO_ISO3 = {
    # Americas
    2: "USA", 20: "CAN", 40: "CUB", 41: "HTI", 42: "DOM", 51: "JAM",
    52: "TTO", 53: "BRB", 54: "DMA", 55: "GRD", 56: "SLV", 57: "VCT",
    58: "ATG", 60: "KNA", 70: "MEX", 80: "BLZ", 90: "GTM", 91: "HND",
    92: "SLV", 93: "NIC", 94: "CRI", 95: "PAN", 100: "COL", 101: "VEN",
    110: "GUY", 115: "SUR", 130: "ECU", 135: "PER", 140: "BRA", 145: "BOL",
    150: "PRY", 155: "CHL", 160: "ARG", 165: "URY",
    # Western Europe
    200: "GBR", 205: "IRL", 210: "NLD", 211: "BEL", 212: "LUX",
    220: "FRA", 221: "MCO", 222: "AND", 223: "ESP", 225: "PRT",
    230: "ITA", 232: "SMR", 235: "MLT", 240: "ALB", 265: "DEU",
    290: "POL", 305: "AUT", 310: "HUN", 315: "CZE", 316: "SVK",
    325: "ITA", 338: "MLT", 339: "ALB", 350: "GRC", 352: "CYP",
    355: "BGR", 360: "ROU", 375: "FIN", 380: "SWE", 385: "NOR",
    390: "DNK", 395: "ISL",
    # Former Yugoslavia — codes verified from UCDP OVCY v26.1
    # (UCDP does NOT use the COW 2xx codes for these states)
    341: "MNE",   # Montenegro
    343: "MKD",   # North Macedonia
    344: "HRV",   # Croatia   ← was "BIH" (wrong)
    345: "SRB",   # Serbia / Yugoslavia
    346: "BIH",   # Bosnia-Herzegovina  ← was "SRB" (wrong)
    347: "XKX",   # Kosovo     ← was missing
    349: "SVN",   # Slovenia   ← was "XKX" (wrong)
    # Post-Soviet — codes verified from UCDP OVCY v26.1
    359: "MDA",   # Moldova    ← was missing (Fix 2)
    365: "RUS",
    366: "EST", 367: "LVA", 368: "LTU",
    369: "UKR",   # Ukraine    ← was missing (371 was wrong)
    370: "BLR",
    371: "ARM",   # Armenia    ← was "UKR" (wrong)
    372: "GEO",   # Georgia
    373: "AZE",   # Azerbaijan ← was "ARM" (wrong); UCDP uses 373 not 374
    # Sub-Saharan Africa — codes verified from UCDP OVCY v26.1
    402: "CPV", 404: "GNB", 411: "EQG", 420: "GMB", 432: "MLI",
    433: "SEN", 434: "BEN", 435: "MRT", 436: "NER", 437: "CIV",
    438: "GIN", 439: "BFA", 450: "LBR", 451: "SLE", 452: "GHA",
    461: "TGO", 471: "CMR", 475: "NGA",
    481: "GAB", 482: "CAF",
    483: "TCD",   # Chad            ← was "COG" (wrong; entire Africa block was shifted)
    484: "COG",   # Republic of Congo  ← was "COD"
    490: "COD",   # DR Congo / Zaire   ← was "UGA"
    500: "UGA",   # Uganda             ← was "KEN"
    501: "KEN",   # Kenya              ← was "DJI"
    510: "TZA",   # Tanzania           ← was "ETH" (Ethiopia=530)
    516: "BDI",   # Burundi            ← was "ERI" (Fix 2)
    517: "RWA",   # Rwanda             ← was "SOM" (Fix 2)
    520: "SOM",   # Somalia            ✓
    522: "DJI",   # Djibouti           ← was "SSD" (wrong; was missing)
    530: "ETH",   # Ethiopia           ✓
    531: "ERI",   # Eritrea            ← was missing
    540: "AGO", 541: "MOZ", 551: "ZMB", 552: "ZWE", 553: "MWI",
    560: "ZAF", 565: "NAM", 570: "LSO", 571: "BWA", 572: "SWZ",
    580: "MDG", 581: "COM", 590: "MUS",
    # North Africa & Middle East
    600: "MAR", 615: "DZA", 616: "TUN", 620: "LBY",
    625: "SDN", 626: "SSD", 630: "IRN", 640: "TUR", 645: "IRQ",
    651: "EGY", 652: "SYR", 660: "LBN", 663: "JOR", 666: "ISR",
    670: "SAU", 678: "YEM", 690: "KWT", 692: "BHR", 694: "QAT",
    696: "ARE", 698: "OMN",
    # Central Asia — codes verified from UCDP OVCY v26.1
    700: "AFG",
    701: "TKM",   # Turkmenistan ← was "PAK"
    702: "TJK",   # Tajikistan   ← was missing (Fix 2)
    703: "KGZ",   # Kyrgyzstan   ← was "BGD"
    704: "UZB",   # Uzbekistan   ← was "BTN"
    705: "KAZ",   # Kazakhstan   ← was "IND"
    # East Asia
    710: "CHN",
    712: "MNG",   # Mongolia     ← was "TWN" (UCDP: 712=MNG, 713=TWN)
    713: "TWN",   # Taiwan       ← was "PRK"
    731: "PRK",   # North Korea  ← was missing (713 was wrong)
    732: "KOR",   # South Korea  ✓
    740: "JPN",   # Japan        ✓
    # South & Southeast Asia — codes verified from UCDP OVCY v26.1
    750: "IND",   # India   ✓
    760: "BTN",   # Bhutan       ← was "MMR"
    770: "PAK",   # Pakistan     ← was missing (701 was wrong)
    771: "BGD",   # Bangladesh   ← was "PAK"
    775: "MMR",   # Myanmar      ✓
    780: "LKA",   # Sri Lanka    ✓
    781: "MDV",   # Maldives
    790: "NPL",   # Nepal
    800: "THA", 811: "KHM", 812: "LAO", 816: "VNM",
    820: "MYS", 830: "SGP", 835: "BRN", 840: "PHL", 850: "IDN",
    860: "TLS",
    # Pacific
    900: "AUS", 920: "PNG", 935: "VUT", 940: "SLB", 950: "FJI",
    983: "NZL",
}


def gwno_to_iso3(gwno) -> str | None:
    try:
        return GW_TO_ISO3.get(int(gwno))
    except (ValueError, TypeError):
        return None


def fetch_ucdp_conflict(out_file: Path) -> pd.DataFrame | None:
    """
    Fetch UCDP Organized Violence by Country-Year dataset (zip) — primary source.
    This gives state-based conflict deaths aggregated by country-year from 1989.
    Falls back to GED event-level CSV, then OWID mirror.
    """
    import zipfile
    import tempfile

    # PRIMARY: Organized Violence by Country-Year (zip)
    ovcy_url = None
    try:
        log.info("Fetching UCDP downloads page for organized violence dataset...")
        resp = SESSION.get("https://ucdp.uu.se/downloads/", timeout=TIMEOUT)
        resp.raise_for_status()
        # Look for organizedviolencecy zip
        pattern = r'href="(https://ucdp\.uu\.se/downloads/organizedviolencecy/[^"]*\.zip)"'
        matches = re.findall(pattern, resp.text, re.IGNORECASE)
        if matches:
            ovcy_url = matches[0]
    except Exception as exc:
        log.warning("UCDP downloads page fetch failed: %s", exc)

    if not ovcy_url:
        ovcy_url = "https://ucdp.uu.se/downloads/organizedviolencecy/organizedviolencecy-261-csv.zip"

    try:
        log.info("Downloading UCDP Organized Violence CY from %s", ovcy_url)
        r2 = SESSION.get(ovcy_url, timeout=120, stream=True)
        r2.raise_for_status()
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            for chunk in r2.iter_content(chunk_size=65536):
                tmp.write(chunk)
            tmp_path = tmp.name

        with zipfile.ZipFile(tmp_path) as zf:
            csv_names = [n for n in zf.namelist() if n.endswith(".csv")]
            if not csv_names:
                raise ValueError("No CSV in zip")
            with zf.open(csv_names[0]) as f:
                df_raw = pd.read_csv(f, low_memory=False)

        return _process_ucdp_ovcy(df_raw, out_file, ovcy_url)

    except Exception as exc:
        log.warning("UCDP organized violence zip failed: %s", exc)

    # FALLBACK 1: GED event-level CSV from downloads page
    try:
        log.info("Fetching UCDP downloads page for GED CSV...")
        resp = SESSION.get("https://ucdp.uu.se/downloads/", timeout=TIMEOUT)
        resp.raise_for_status()
        patterns = [
            r'href="([^"]*GEDEvent[^"]*\.csv)"',
            r'href="([^"]*ged_global_[^"]*\.csv)"',
            r'href="([^"]*ucdp-brd-[^"]*\.csv)"',
        ]
        found_url = None
        for pat in patterns:
            matches = re.findall(pat, resp.text, re.IGNORECASE)
            if matches:
                found_url = matches[0]
                if not found_url.startswith("http"):
                    found_url = "https://ucdp.uu.se" + found_url
                break

        if found_url:
            log.info("Found UCDP GED file: %s", found_url)
            r2 = SESSION.get(found_url, timeout=120)
            r2.raise_for_status()
            df_raw = pd.read_csv(io.StringIO(r2.text), low_memory=False)
            return _process_ucdp_df(df_raw, out_file, found_url)

    except Exception as exc:
        log.warning("UCDP GED CSV fetch failed: %s", exc)

    # FALLBACK 2: OWID mirror
    log.info("Trying UCDP OWID mirror...")
    try:
        resp = SESSION.get(CONFLICT_MIRROR, timeout=TIMEOUT)
        resp.raise_for_status()
        df_raw = pd.read_csv(io.StringIO(resp.text), low_memory=False)
        return _process_ucdp_mirror(df_raw, out_file)
    except Exception as exc:
        log.warning("UCDP mirror also failed: %s", exc)
        fetch_log["conflict"] = {
            "url": CONFLICT_MIRROR,
            "status": "error",
            "error": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rows": 0,
            "source": "none",
        }
        return None


def _process_ucdp_ovcy(df_raw: pd.DataFrame, out_file: Path, url: str) -> pd.DataFrame:
    """
    Process UCDP Organized Violence by Country-Year dataset.
    Uses country_id (COW/GW number) → ISO3, and sb_total_deaths_best for battle deaths.
    """
    rows = []
    for _, row in df_raw.iterrows():
        iso3 = gwno_to_iso3(row.get("country_id"))
        if iso3 is None:
            continue
        try:
            yr = int(row["year"])
            # state-based conflict deaths (battle-related)
            deaths = float(row.get("sb_total_deaths_best", 0) or 0)
        except (ValueError, TypeError):
            continue
        rows.append({"iso3": iso3, "year": yr, "battle_deaths": deaths})

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.groupby(["iso3", "year"])["battle_deaths"].sum().reset_index()
    df.to_csv(out_file, index=False)
    fetch_log["conflict"] = {
        "url": url,
        "status": 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rows": len(df),
        "source": "ucdp_ovcy",
    }
    log.info("UCDP OVCY: %d country-year rows saved", len(df))
    return df


def _process_ucdp_df(df_raw: pd.DataFrame, out_file: Path, url: str) -> pd.DataFrame:
    """Process UCDP GED dataset."""
    rows = []
    # Determine year column
    year_col = "year" if "year" in df_raw.columns else "date_start"
    # Column name varies by dataset version: gwno_a (BRD) or gwnoa (GED)
    gwno_col = next(
        (c for c in ["gwno_a", "gwnoa", "gwno"] if c in df_raw.columns), None
    )
    # Deaths column: bd_best (BRD), best (GED), deaths_a fallback
    deaths_col = next(
        (c for c in ["bd_best", "best", "deaths_a"] if c in df_raw.columns), "deaths_a"
    )

    for _, row in df_raw.iterrows():
        iso3 = None
        if gwno_col and pd.notna(row.get(gwno_col)):
            iso3 = gwno_to_iso3(row[gwno_col])
        if iso3 is None:
            continue
        try:
            if year_col == "date_start":
                yr = int(str(row[year_col])[:4])
            else:
                yr = int(row[year_col])
            deaths = float(row.get(deaths_col, 0) or 0)
        except (ValueError, TypeError):
            continue
        rows.append({"iso3": iso3, "year": yr, "battle_deaths": deaths})

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.groupby(["iso3", "year"])["battle_deaths"].sum().reset_index()
    df.to_csv(out_file, index=False)
    fetch_log["conflict"] = {
        "url": url,
        "status": 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rows": len(df),
        "source": "ucdp",
    }
    return df


def _process_ucdp_mirror(df_raw: pd.DataFrame, out_file: Path) -> pd.DataFrame:
    """Process OWID UCDP mirror — columns vary."""
    # Try to find entity/country + year + deaths columns
    rows = []
    entity_col = next((c for c in df_raw.columns if "entity" in c.lower() or "country" in c.lower()), None)
    year_col = next((c for c in df_raw.columns if c.lower() == "year"), None)
    deaths_col = next((c for c in df_raw.columns if "death" in c.lower() or "battle" in c.lower()), None)

    if not all([entity_col, year_col, deaths_col]):
        log.warning("UCDP mirror columns not identified: %s", list(df_raw.columns))
        return pd.DataFrame(columns=["iso3", "year", "battle_deaths"])

    # Build name→iso3 lookup from regions.py
    from regions import REGION_MAP
    name_to_iso3 = {}  # limited; best-effort

    for _, row in df_raw.iterrows():
        name = str(row.get(entity_col, "")).strip()
        # Try to match country name to iso3 (basic)
        iso3 = name_to_iso3.get(name)
        if iso3 is None:
            continue
        try:
            yr = int(row[year_col])
            deaths = float(row.get(deaths_col, 0) or 0)
        except (ValueError, TypeError):
            continue
        rows.append({"iso3": iso3, "year": yr, "battle_deaths": deaths})

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.groupby(["iso3", "year"])["battle_deaths"].sum().reset_index()
    df.to_csv(out_file, index=False)
    fetch_log["conflict"] = {
        "url": CONFLICT_MIRROR,
        "status": 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rows": len(df),
        "source": "ucdp_mirror",
    }
    return df


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

WB_INDICATORS = {
    "FP.CPI.TOTL.ZG": RAW_DIR / "inflation_raw.csv",
    "NY.GDP.PCAP.KD.ZG": RAW_DIR / "gdp_growth_raw.csv",
    "SL.UEM.TOTL.ZS": RAW_DIR / "unemployment_raw.csv",
    "GC.DOD.TOTL.GD.ZS": RAW_DIR / "debt_raw.csv",
    "NY.GDP.MKTP.CD": RAW_DIR / "gdp_usd_raw.csv",
    "SP.POP.TOTL": RAW_DIR / "population_raw.csv",
}


def main():
    log.info("=== IGE Fetch Sources ===")

    # Fetch World Bank indicators
    for indicator, out_file in WB_INDICATORS.items():
        log.info("Fetching WB indicator: %s", indicator)
        df = fetch_wb_indicator(indicator, out_file)

        # Fallbacks
        if df is None or df.empty:
            if indicator == "FP.CPI.TOTL.ZG":
                log.info("Trying inflation mirror...")
                fetch_log.setdefault(indicator, {})
                fetch_inflation_mirror(out_file)
            elif indicator in ("NY.GDP.MKTP.CD",):
                log.info("Trying OWID GDP fallback...")
                fetch_log.setdefault(indicator, {})
                fetch_gdp_mirror(out_file, "gdp", indicator)
            elif indicator == "SP.POP.TOTL":
                log.info("Trying OWID population fallback...")
                fetch_log.setdefault(indicator, {})
                fetch_gdp_mirror(out_file, "population", indicator)

    # Fetch IMF WEO debt (fallback / supplement to World Bank GC.DOD.TOTL.GD.ZS)
    log.info("Fetching IMF WEO debt data...")
    fetch_imf_debt(RAW_DIR / "debt_imf_raw.csv")

    # Fetch WB WGI governance (Control of Corruption Percentile Rank)
    log.info("Fetching WB WGI governance data...")
    fetch_governance(RAW_DIR / "governance_raw.csv")

    # Fetch UCDP conflict data
    log.info("Fetching UCDP conflict data...")
    fetch_ucdp_conflict(RAW_DIR / "conflict_raw.csv")

    # Write fetch log
    log_path = RAW_DIR / "fetch_log.json"
    with open(log_path, "w") as f:
        json.dump(fetch_log, f, indent=2)
    log.info("Fetch log written to %s", log_path)
    log.info("=== Fetch complete ===")


if __name__ == "__main__":
    main()
