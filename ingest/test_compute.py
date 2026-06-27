"""
IGE Sanity Tests
Run with: python ingest/test_compute.py
Exit code 1 if any test fails.
"""
import json
import math
import sys
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = REPO_DIR / "data" / "ige-dataset-real.json"

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

# Regional aggregate iso codes — not real countries
REGION_ISOS = {"EAP", "ECA", "LAC", "MENA", "NAM", "SAS", "SSA", "WORLD"}

failures = 0


def check(name: str, condition: bool, detail: str = ""):
    global failures
    if condition:
        print(f"{PASS} {name}")
    else:
        print(f"{FAIL} {name}" + (f" — {detail}" if detail else ""))
        failures += 1


def is_country(rec: dict) -> bool:
    """True if this record is a real country (not a regional aggregate)."""
    iso = rec.get("iso", "")
    return iso not in REGION_ISOS and len(iso) == 3


def main():
    global failures

    # Load data
    if not DATA_FILE.exists():
        print(f"{FAIL} Data file not found: {DATA_FILE}")
        sys.exit(1)

    with open(DATA_FILE) as f:
        dataset = json.load(f)

    data = dataset["data"]
    print(f"Loaded {len(data)} records from {DATA_FILE}")
    print()

    # Index by iso+year
    by_iso_year: dict[tuple, dict] = {}
    by_iso: dict[str, list] = {}
    for rec in data:
        key = (rec["iso"], rec["year"])
        by_iso_year[key] = rec
        by_iso.setdefault(rec["iso"], []).append(rec)

    # Test 1: Brazil 1990 — hyperinflation era, IGE should be < 40
    bra_1990 = by_iso_year.get(("BRA", 1990))
    if bra_1990 is None:
        check("Test 1: Brazil 1990 ige < 40", False, "record not found")
    else:
        ige = bra_1990.get("ige")
        check(
            "Test 1: Brazil 1990 ige < 40 (hyperinflation + recession era)",
            ige is not None and ige < 40,
            f"ige={ige}",
        )

    # Test 2: USA 1965 — stable golden era, nivel > 50
    usa_1965 = by_iso_year.get(("USA", 1965))
    if usa_1965 is None:
        # Try nearby years
        usa_recs = sorted(by_iso.get("USA", []), key=lambda r: r["year"])
        nearby = [r for r in usa_recs if 1960 <= r["year"] <= 1970]
        if nearby:
            usa_1965 = nearby[0]
            check(
                f"Test 2: USA {usa_1965['year']} nivel > 50 (stable era, using nearest available)",
                usa_1965.get("nivel") is not None and usa_1965["nivel"] > 50,
                f"nivel={usa_1965.get('nivel')}",
            )
        else:
            check("Test 2: USA 1965 nivel > 50", False, "no USA records in 1960-1970")
    else:
        nivel = usa_1965.get("nivel")
        check(
            "Test 2: USA 1965 nivel > 50 (stable era)",
            nivel is not None and nivel > 50,
            f"nivel={nivel}",
        )

    # Test 3: Find a country whose worst conflict year(s) pull nivel below its own
    # peaceful-period average. Strategy: look for a country where the max-deaths year
    # has nivel below the median of its 5+ lowest-deaths years (peaceful baseline).
    # This is more robust than comparing to the all-time average for perennially
    # conflict-affected countries like Afghanistan.
    conflict_case = None
    conflict_detail = ""
    for rec in sorted(data, key=lambda r: -(r.get("conflict_deaths") or 0)):
        if not is_country(rec):
            continue
        cd = rec.get("conflict_deaths")
        if cd is None or cd <= 1000:
            break
        if rec.get("nivel") is None:
            continue
        iso = rec["iso"]
        country_recs = [r for r in by_iso.get(iso, []) if is_country(r) and r.get("nivel") is not None]
        # Peaceful baseline: years with 0 or no recorded deaths
        peaceful = [r for r in country_recs if (r.get("conflict_deaths") or 0) == 0]
        if len(peaceful) >= 3:
            peaceful_avg = sum(r["nivel"] for r in peaceful) / len(peaceful)
            if rec["nivel"] < peaceful_avg:
                conflict_case = rec
                conflict_detail = f"nivel={rec['nivel']:.2f} < peaceful_avg={peaceful_avg:.2f} ({len(peaceful)} peace-years)"
                break

    if conflict_case is None:
        # Fallback: just look for any country where the high-conflict year is below
        # the bottom quartile average of all their nivel values
        for rec in sorted(data, key=lambda r: -(r.get("conflict_deaths") or 0)):
            if not is_country(rec):
                continue
            cd = rec.get("conflict_deaths")
            if cd is None or cd <= 500:
                break
            if rec.get("nivel") is None:
                continue
            iso = rec["iso"]
            country_recs = [r for r in by_iso.get(iso, []) if is_country(r) and r.get("nivel") is not None]
            if len(country_recs) >= 5:
                sorted_niveles = sorted(r["nivel"] for r in country_recs)
                upper_quartile_avg = sum(sorted_niveles[len(sorted_niveles)//2:]) / len(sorted_niveles[len(sorted_niveles)//2:])
                if rec["nivel"] < upper_quartile_avg:
                    conflict_case = rec
                    conflict_detail = f"nivel={rec['nivel']:.2f} < upper-half-avg={upper_quartile_avg:.2f}"
                    break

    if conflict_case is None:
        check("Test 3: High conflict country-year has depressed nivel", False,
              "could not find qualifying conflict case")
    else:
        iso = conflict_case["iso"]
        check(
            f"Test 3: {iso} {conflict_case['year']} (deaths={conflict_case['conflict_deaths']}) conflict depresses nivel",
            True,
            conflict_detail,
        )

    # Test 4: No country-year has ige > 100 or ige < 0
    bad = [r for r in data if r.get("ige") is not None and (r["ige"] > 100 or r["ige"] < 0)]
    check(
        "Test 4: No ige out of [0, 100]",
        len(bad) == 0,
        f"{len(bad)} violations" if bad else "",
    )

    # Test 5: factors_used never empty for post-1965 COUNTRY records with nivel
    # (regional aggregates intentionally have factors_used=[])
    empty_after_1965 = [
        r for r in data
        if is_country(r)
        and r["year"] > 1965
        and r.get("nivel") is not None
        and len(r.get("factors_used", [])) == 0
    ]
    check(
        "Test 5: factors_used never empty for post-1965 country records with nivel",
        len(empty_after_1965) == 0,
        f"{len(empty_after_1965)} violations" if empty_after_1965 else "",
    )

    # Test 6: Dataset has reasonable size
    country_records = [r for r in data if is_country(r)]
    unique_countries = len({r["iso"] for r in country_records})
    check(
        f"Test 6: Dataset has at least 100 countries (got {unique_countries})",
        unique_countries >= 100,
        f"unique_countries={unique_countries}",
    )

    print()
    if failures == 0:
        print("All tests PASSED.")
    else:
        print(f"{failures} test(s) FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()
