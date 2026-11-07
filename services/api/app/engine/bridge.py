"""Entry point used when the engine runs inside the browser (Pyodide). JSON in, JSON out."""
from __future__ import annotations

import json
from datetime import datetime

from .skyfield_engine import NotEnabled, SkyfieldEngine

_engine: SkyfieldEngine | None = None


def compute(request_json: str, data_dir: str = "/data") -> str:
    global _engine
    req = json.loads(request_json)
    try:
        utc = datetime.fromisoformat(req["utc_instant"].replace("Z", "+00:00"))
        if not (1850 <= utc.year <= 2149):
            return json.dumps({"error": "range"})
        if _engine is None:
            _engine = SkyfieldEngine(data_dir)
        chart = _engine.chart(utc, float(req["latitude"]), float(req["longitude"]),
                              req.get("ayanamsha", "true_chitra"), req.get("nodes", "mean"))
        return json.dumps({"chart": chart})
    except NotEnabled:
        return json.dumps({"error": "notValidated"})
    except Exception as e:  # noqa: BLE001 - surfaced to the UI as a generic error
        return json.dumps({"error": "other", "details": str(e)})
