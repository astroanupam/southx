"""Layer A: astronomy via JPL DE ephemeris + Skyfield (adapter 'skyfield-de440s').

Conventions validated against JHora reference charts REF-001 / REF-002 (see validation/):
  - geocentric GEOMETRIC positions (no light-time / aberration), true equinox of date (nutation included)
  - ayanamsha "true_chitra": sidereal zero at Spica = 180 deg (astrometric Spica longitude - 180)
  - mean lunar node (Meeus polynomial) + nutation in longitude; Ketu = Rahu + 180
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from skyfield.api import Loader, Star
from skyfield.nutationlib import iau2000b_radians

from . import jyotisha as J

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
EPHEMERIS_FILE = "de440s.bsp"  # 1849-2150; swap for DE440 (1550-2650) when wider range is needed

_BODIES = {
    "Sun": "sun", "Moon": "moon", "Mars": "mars barycenter", "Mercury": "mercury",
    "Jupiter": "jupiter barycenter", "Venus": "venus", "Saturn": "saturn barycenter",
}
PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]

# Spica (HIP 65474), ICRS J2000, Hipparcos values.
_SPICA = dict(ra_hours=13.4198831, dec_degrees=-11.1613194,
              ra_mas_per_year=-42.35, dec_mas_per_year=-31.73, parallax_mas=12.44)

AYANAMSHA_SUPPORT = {
    "true_chitra": "validated",          # matches REF-001 and REF-002 to < 0.1 arcsec
    "lahiri": "pending_validation",
    "raman": "pending_validation",
    "kp": "pending_validation",
    "yukteswar": "pending_validation",
    "pushya_paksha": "pending_validation",
    "fagan_bradley": "pending_validation",
}
NODE_SUPPORT = {"mean": "validated", "true": "pending_validation"}


class NotEnabled(Exception):
    """Requested option exists in the catalogue but has not passed validation."""


@dataclass
class EngineInfo:
    id: str = "skyfield-de440s"
    ephemeris: str = EPHEMERIS_FILE


class SkyfieldEngine:
    def __init__(self, data_dir: Path | str = DATA_DIR):
        loader = Loader(str(data_dir))
        self.eph = loader(EPHEMERIS_FILE)
        self.ts = loader.timescale()
        self.earth = self.eph["earth"]
        self.spica = Star(**_SPICA)
        self.info = EngineInfo()

    # ---- helpers -------------------------------------------------------------------------
    def _time(self, utc: datetime):
        if utc.tzinfo is not None:
            utc = utc.astimezone(timezone.utc).replace(tzinfo=None)
        # Civil time is treated as UT (as JHora does). Skyfield's utc() applies the 1972 leap-second offset to
        # earlier dates, which shifts pre-1972 charts by ~14 s; ut1() + the delta-T table avoids that.
        return self.ts.ut1(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second + utc.microsecond / 1e6)

    def ayanamsha(self, t, code: str) -> float:
        status = AYANAMSHA_SUPPORT.get(code)
        if status is None:
            raise ValueError(f"unknown ayanamsha: {code}")
        if status != "validated":
            raise NotEnabled(f"ayanamsha '{code}' not validated yet")
        lon = self.earth.at(t).observe(self.spica).ecliptic_latlon(epoch="date")[1].degrees
        return (lon - 180.0) % 360.0

    def _trop(self, t, name: str) -> float:
        return (self.eph[_BODIES[name]] - self.earth).at(t).ecliptic_latlon(epoch="date")[1].degrees % 360.0

    @staticmethod
    def _mean_node(t) -> float:
        T = (t.tt - 2451545.0) / 36525.0
        om = 125.0445479 - 1934.1362891 * T + 0.0020754 * T**2 + T**3 / 467441 - T**4 / 60616000
        dpsi = math.degrees(iau2000b_radians(t)[0])
        return (om + dpsi) % 360.0

    def _ascendant_trop(self, t, lat: float, lon_east: float) -> float:
        dpsi, deps = iau2000b_radians(t)
        T = (t.tt - 2451545.0) / 36525.0
        eps0 = 84381.406 - 46.836769 * T - 0.0001831 * T**2 + 0.00200340 * T**3
        eps = math.radians(eps0 / 3600.0) + deps
        ramc = math.radians((t.gast * 15.0 + lon_east) % 360.0)
        phi = math.radians(lat)
        asc = math.atan2(math.cos(ramc), -(math.sin(ramc) * math.cos(eps) + math.tan(phi) * math.sin(eps)))
        return math.degrees(asc) % 360.0

    # ---- public --------------------------------------------------------------------------
    def chart(self, utc: datetime, lat: float, lon_east: float,
              ayanamsha: str = "true_chitra", nodes: str = "mean") -> dict:
        if NODE_SUPPORT.get(nodes) != "validated":
            raise NotEnabled(f"node type '{nodes}' not validated yet")
        t = self._time(utc)
        ayan = self.ayanamsha(t, ayanamsha)
        t_prev = self.ts.tt_jd(t.tt - 0.5)
        t_next = self.ts.tt_jd(t.tt + 0.5)

        sid: dict[str, float] = {}
        retro: dict[str, bool] = {}
        for name in _BODIES:
            sid[name] = (self._trop(t, name) - ayan) % 360.0
            if name in ("Sun", "Moon"):
                retro[name] = False
            else:
                delta = (self._trop(t_next, name) - self._trop(t_prev, name) + 180.0) % 360.0 - 180.0
                retro[name] = delta < 0
        sid["Rahu"] = (self._mean_node(t) - ayan) % 360.0
        sid["Ketu"] = (sid["Rahu"] + 180.0) % 360.0
        retro["Rahu"] = retro["Ketu"] = True
        asc = float((self._ascendant_trop(t, lat, lon_east) - ayan) % 360.0)

        def row(name: str, lon: float) -> dict:
            lon = float(lon)
            ni = J.nakshatra_index(lon)
            return {"body": name, "longitude": lon, "sign": J.sign_index(lon),
                    "degree_in_sign": lon % 30.0, "nakshatra": ni, "pada": J.pada(lon),
                    "navamsha_sign": J.navamsha_sign(lon), "retrograde": bool(retro.get(name, False)),
                    "house": (J.sign_index(lon) - J.sign_index(asc)) % 12 + 1}

        return {
            "engine": self.info.id, "ayanamsha": {"code": ayanamsha, "value": float(ayan)},
            "nodes": nodes, "house_system": "whole_sign",
            "ascendant": {**row("Lagna", asc), "house": 1},
            "planets": [row(n, sid[n]) for n in PLANET_ORDER],
        }
