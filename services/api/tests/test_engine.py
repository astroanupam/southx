"""Validation of the engine against JHora reference charts (validation/fixtures)."""
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from app.engine import jyotisha as J
from app.engine.skyfield_engine import NotEnabled, SkyfieldEngine

FIX = Path(__file__).resolve().parents[3] / "validation" / "fixtures"
SIGN = {"Ar": 0, "Ta": 1, "Ge": 2, "Cn": 3, "Le": 4, "Vi": 5, "Li": 6, "Sc": 7, "Sg": 8, "Cp": 9, "Aq": 10, "Pi": 11}
NAK_ABBR = {"Asre": 8, "Visa": 15, "Chit": 13, "Swat": 14, "Magh": 9, "UBha": 25, "Dhan": 22, "Krit": 2,
            "Push": 7, "Ardr": 5, "Anu": 16}

# Tolerances (arcsec). REF-001 is a 2026 chart: JHora's delta-T for future dates differs from the IERS-based table
# used here by ~12 s, which moves the Moon by ~7" (docs/06). Historical REF-002 matches to < 0.1".
TOL = {
    "ref001": {"default": 2.0, "Moon": 10.0, "Rahu": 1.0, "Ketu": 1.0, "Lagna": 20.0},
    "ref002": {"default": 2.0, "Moon": 1.0, "Rahu": 1.0, "Ketu": 1.0, "Lagna": 20.0},
}


def dms(s: str) -> float:
    m = re.match(r"(\d+) (\w\w) (\d+)' ([\d.]+)\"", s)
    return SIGN[m[2]] * 30 + int(m[1]) + int(m[3]) / 60 + float(m[4]) / 3600


@pytest.fixture(scope="module")
def engine():
    return SkyfieldEngine()


def load(ref):
    j = json.load(open(FIX / f"{ref}.json", encoding="utf-8-sig"))
    b = j["birth"]
    utc = datetime.strptime(b["date"] + " " + b["time_local"], "%Y-%m-%d %H:%M:%S") - timedelta(hours=5, minutes=30)
    lat = {"ref001": 23 + 16 / 60, "ref002": 28 + 40 / 60}[ref]
    lon = {"ref001": 77 + 24 / 60, "ref002": 77 + 13 / 60}[ref]
    return j, utc, lat, lon


@pytest.mark.parametrize("ref", ["ref001", "ref002"])
def test_against_jhora(engine, ref):
    j, utc, lat, lon = load(ref)
    c = engine.chart(utc, lat, lon)
    by = {p["body"]: p for p in c["planets"]}
    by["Lagna"] = c["ascendant"]
    report = []
    for r in j["rows"]:
        mine = by[r["body"]]
        want = dms(r["lon"])
        diff = ((mine["longitude"] - want + 180) % 360 - 180) * 3600
        tol = TOL[ref].get(r["body"], TOL[ref]["default"])
        report.append(f'{r["body"]}: {diff:+.2f}"')
        assert abs(diff) <= tol, f'{ref} {r["body"]} off by {diff:.2f}" (tol {tol})'
        assert mine["sign"] == SIGN[r["rasi"]]
        assert mine["pada"] == r["pada"], r["body"]
        assert mine["navamsha_sign"] == SIGN[r["nav"]], r["body"]
        assert mine["nakshatra"] == NAK_ABBR[r["nak"]], r["body"]
    print(ref, "; ".join(report))


def test_retrograde_flags(engine):
    j, utc, lat, lon = load("ref001")
    c = engine.chart(utc, lat, lon)
    by = {p["body"]: p for p in c["planets"]}
    for r in j["rows"]:
        if r["body"] in by and r["body"] not in ("Rahu", "Ketu"):
            assert by[r["body"]]["retrograde"] == bool(r.get("retro")), r["body"]


def test_unvalidated_options_refused(engine):
    j, utc, lat, lon = load("ref001")
    with pytest.raises(NotEnabled):
        engine.chart(utc, lat, lon, ayanamsha="lahiri")
    with pytest.raises(NotEnabled):
        engine.chart(utc, lat, lon, nodes="true")


def test_special_rules_ref001(engine):
    j, utc, lat, lon = load("ref001")
    by = {p["body"]: p for p in engine.chart(utc, lat, lon)["planets"]}
    t = J.tithi(by["Sun"]["longitude"], by["Moon"]["longitude"])
    assert t["number"] == 29 and abs(t["elapsed_fraction"] - 0.5358) < 0.0005
    y = J.yogi_method_a(by["Sun"]["longitude"], by["Moon"]["longitude"])
    assert (y["yogi_planet"], y["sahayogi"], y["avyogi_planet"]) == ("Mercury", "Moon", "Mars")


def test_ref002_tithi_boundary(engine):
    j, utc, lat, lon = load("ref002")
    by = {p["body"]: p for p in engine.chart(utc, lat, lon)["planets"]}
    t = J.tithi(by["Sun"]["longitude"], by["Moon"]["longitude"])
    assert t["number"] == 28  # Krishna Trayodashi, 99.99% elapsed
    y = J.yogi_method_a(by["Sun"]["longitude"], by["Moon"]["longitude"])
    assert (y["yogi_planet"], y["avyogi_planet"]) == ("Mars", "Ketu")


def test_layer_b_boundaries():
    assert J.nakshatra_index(0.0) == 0 and J.nakshatra_index(359.999999) == 26
    assert J.nakshatra_index(360 / 27) == 1
    assert J.pada(0.0) == 1 and J.pada(10 / 3) == 2
    assert J.sign_index(359.9999) == 11 and J.sign_index(30.0) == 1
    assert J.navamsha_sign(0.0) == 0 and J.navamsha_sign(30.0) == 9 and J.navamsha_sign(60.0) == 6 and J.navamsha_sign(90.0) == 3
