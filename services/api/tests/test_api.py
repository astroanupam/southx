from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.timeres import resolve

client = TestClient(app)


def body(**kw):
    base = dict(year=1990, month=6, day=15, hour=10, minute=30, second=0, tz_id="Asia/Kolkata")
    base.update(kw)
    return base


def test_india_modern():
    r = client.post("/v1/time/resolve", json=body())
    assert r.status_code == 200
    j = r.json()
    assert j["utc_offset_sec"] == 19800 and j["dst_active"] is False
    assert j["utc_instant"] == "1990-06-15T05:00:00Z"


def test_us_dst():
    j = client.post("/v1/time/resolve", json=body(year=2024, month=7, day=1, hour=12, tz_id="America/New_York")).json()
    assert j["dst_active"] is True and j["utc_offset_sec"] == -4 * 3600


def test_historical_offset_differs():
    j = client.post("/v1/time/resolve", json=body(year=1943, month=6, day=1, hour=12)).json()
    assert j["utc_offset_sec"] != 19800


def test_overlap_and_gap_flagged():
    assert "AMBIGUOUS_LOCAL_TIME_REPEATED_HOUR" in resolve(datetime(2024, 11, 3, 1, 30), "America/New_York").warnings
    assert "SKIPPED_LOCAL_TIME_CHECK_MANUALLY" in resolve(datetime(2024, 3, 10, 2, 30), "America/New_York").warnings


def test_manual_override_recorded():
    j = client.post("/v1/time/resolve", json=body(year=1900, month=1, day=1, hour=12, minute=0, manual_offset_sec=19800, manual_reason="record")).json()
    assert j["source"] == "manual" and j["utc_instant"] == "1900-01-01T06:30:00Z"


def test_bad_inputs():
    assert client.post("/v1/time/resolve", json=body(tz_id="Nope/Zone")).status_code == 422
    assert client.post("/v1/time/resolve", json=body(month=2, day=30)).status_code == 422


def test_leap_day():
    j = client.post("/v1/time/resolve", json=body(year=2000, month=2, day=29, hour=0, minute=0)).json()
    assert j["utc_instant"] == "2000-02-28T18:30:00Z"


def test_compute_chart_ref001():
    r = client.post("/v1/charts/compute", json={"utc_instant": "2026-11-07T18:29:01Z",
                                                "latitude": 23 + 16 / 60, "longitude": 77 + 24 / 60})
    assert r.status_code == 200
    j = r.json()
    assert j["ayanamsha"]["code"] == "true_chitra"
    moon = [p for p in j["planets"] if p["body"] == "Moon"][0]
    assert moon["sign"] == 6 and moon["pada"] == 4  # Libra, pada 4 (JHora: Chit pada 4)


def test_unvalidated_options_409():
    base = {"utc_instant": "2026-11-07T18:29:01Z", "latitude": 23.0, "longitude": 77.0}
    assert client.post("/v1/charts/compute", json={**base, "ayanamsha": "lahiri"}).status_code == 409
    assert client.post("/v1/charts/compute", json={**base, "nodes": "true"}).status_code == 409
    assert client.post("/v1/charts/compute", json={**base, "ayanamsha": "nope"}).status_code == 422


def test_range_guard():
    r = client.post("/v1/charts/compute", json={"utc_instant": "1700-01-01T00:00:00Z", "latitude": 0, "longitude": 0})
    assert r.status_code == 422