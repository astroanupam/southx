from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .engine.skyfield_engine import AYANAMSHA_SUPPORT, NODE_SUPPORT, NotEnabled, SkyfieldEngine
from .timeres import resolve

app = FastAPI(title="AstroSutras API", version="0.2.0",
              description="Stage 2: engine enabled for validated options only (see /v1/ayanamsha).")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
                   allow_methods=["*"], allow_headers=["*"])

_engine: SkyfieldEngine | None = None


def engine() -> SkyfieldEngine:
    global _engine
    if _engine is None:
        _engine = SkyfieldEngine()
    return _engine

AYANAMSHAS = [
    {"code": "true_chitra", "name": "True Chitra Paksha (Spica 0 Libra)"},
    {"code": "lahiri", "name": "Lahiri / Chitrapaksha"},
    {"code": "raman", "name": "Raman"},
    {"code": "kp", "name": "Krishnamurti (KP)"},
    {"code": "yukteswar", "name": "Yukteswar"},
    {"code": "pushya_paksha", "name": "Pushya Paksha"},
    {"code": "fagan_bradley", "name": "Fagan-Bradley"},
]


class TimeResolveIn(BaseModel):
    year: int = Field(ge=1000, le=2999)
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)
    hour: int = Field(ge=0, le=23)
    minute: int = Field(ge=0, le=59)
    second: int = Field(default=0, ge=0, le=59)
    tz_id: str
    manual_offset_sec: int | None = Field(default=None, ge=-64800, le=64800)
    manual_reason: str | None = None


class TimeResolveOut(BaseModel):
    tz_id: str
    utc_offset_sec: int
    dst_active: bool
    source: str
    local_civil: str
    utc_instant: str
    warnings: list[str]
    manual_reason: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/time/resolve", response_model=TimeResolveOut)
def time_resolve(body: TimeResolveIn) -> TimeResolveOut:
    try:
        local = datetime(body.year, body.month, body.day, body.hour, body.minute, body.second)
    except ValueError as e:
        raise HTTPException(422, detail={"code": "INVALID_DATE", "message_key": "invalidDate", "details": str(e)})
    try:
        r = resolve(local, body.tz_id, body.manual_offset_sec, body.manual_reason)
    except ValueError as e:
        raise HTTPException(422, detail={"code": "INVALID_TZ", "message_key": "invalidTz", "details": str(e)})
    return TimeResolveOut(tz_id=r.tz_id, utc_offset_sec=r.offset_sec, dst_active=r.dst_active, source=r.source,
                          local_civil=r.local_civil, utc_instant=r.utc.isoformat().replace("+00:00", "Z"),
                          warnings=r.warnings, manual_reason=r.manual_reason)


@app.get("/v1/ayanamsha")
def ayanamsha() -> list[dict[str, object]]:
    # Values/epochs intentionally absent until the engine and validation are approved (Stage 2).
    return [{**a, "engine_support": AYANAMSHA_SUPPORT.get(a["code"], "pending_validation")} for a in AYANAMSHAS]


@app.get("/v1/nodes")
def nodes() -> dict[str, str]:
    return NODE_SUPPORT


class ChartIn(BaseModel):
    utc_instant: str  # ISO 8601, e.g. 2026-11-07T18:29:01Z (output of /v1/time/resolve)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)  # east positive
    ayanamsha: str = "true_chitra"
    nodes: str = "mean"


@app.post("/v1/charts/compute")
def compute_chart(body: ChartIn) -> dict:
    try:
        utc = datetime.fromisoformat(body.utc_instant.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(422, detail={"code": "INVALID_DATE", "message_key": "invalidDate"})
    if not (1850 <= utc.year <= 2149):
        raise HTTPException(422, detail={"code": "OUT_OF_EPHEMERIS_RANGE", "message_key": "dateRange",
                                         "details": "de440s covers 1850-2149"})
    try:
        return engine().chart(utc, body.latitude, body.longitude, body.ayanamsha, body.nodes)
    except NotEnabled as e:
        raise HTTPException(409, detail={"code": "OPTION_NOT_VALIDATED", "message_key": "notEnabled", "details": str(e)})
    except ValueError as e:
        raise HTTPException(422, detail={"code": "BAD_OPTION", "message_key": "invalidTz", "details": str(e)})