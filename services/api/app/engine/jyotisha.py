"""Layer B: pure Jyotisha arithmetic on sidereal longitudes (degrees). No ephemeris dependency.

Rule status: UNVERIFIED until owner approval (see docs/12). Conventions: 27 equal nakshatras,
intervals are start-inclusive / end-exclusive.
"""
from __future__ import annotations

NAK_SPAN = 360.0 / 27.0          # 13 deg 20 min
PADA_SPAN = NAK_SPAN / 4.0       # 3 deg 20 min

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
         "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
SIGN_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars",
              "Jupiter", "Saturn", "Saturn", "Jupiter"]  # classical lordship (nodes not lords)

NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya",
              "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
              "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
              "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]

VIM_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
VIM_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
             "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}


def norm(x: float) -> float:
    return x % 360.0


def sign_index(lon: float) -> int:
    return int(norm(lon) // 30) % 12


def nakshatra_index(lon: float) -> int:
    return int(norm(lon) // NAK_SPAN) % 27


def pada(lon: float) -> int:
    return int((norm(lon) % NAK_SPAN) // PADA_SPAN) + 1


def nakshatra_lord(idx: int) -> str:
    return VIM_ORDER[idx % 9]


def navamsha_sign(lon: float) -> int:
    """D-9 sign index. Fire signs start at Aries, earth at Capricorn, air at Libra, water at Cancer."""
    lon = norm(lon)
    s = sign_index(lon)
    n = int((lon % 30.0) // (30.0 / 9.0))  # 0..8
    start = {0: 0, 1: 9, 2: 6, 3: 3}[s % 4]
    return (start + n) % 12


def navamsha_longitude(lon: float) -> float:
    """Longitude within D-9 (0-360): the 3deg20' navamsha part scaled to 30 degrees."""
    lon = norm(lon)
    part = (lon % (30.0 / 9.0)) * 9.0
    return navamsha_sign(lon) * 30.0 + part


def dms(deg: float) -> dict[str, float | int]:
    d = int(deg)
    m = int((deg - d) * 60)
    s = (deg - d - m / 60) * 3600
    return {"d": d, "m": m, "s": round(s, 2)}


def tithi(sun: float, moon: float) -> dict[str, float | int | str]:
    d = norm(moon - sun)
    n = int(d // 12) + 1
    return {"number": n, "paksha": "shukla" if n <= 15 else "krishna",
            "name_index": (n - 1) % 15 + 1 if n != 30 else 15,
            "elapsed_fraction": (d % 12) / 12.0}


def yogi_method_a(sun: float, moon: float) -> dict[str, object]:
    """Yogi / Avyogi per Method A of docs/07 (UNVERIFIED until owner approval)."""
    y = norm(sun + moon + 93 + 20 / 60)
    a = norm(y + 186 + 40 / 60)
    yi, ai = nakshatra_index(y), nakshatra_index(a)
    return {"yogi_point": y, "yogi_nakshatra": yi, "yogi_planet": nakshatra_lord(yi),
            "sahayogi": SIGN_LORDS[sign_index(y)],
            "avyogi_point": a, "avyogi_nakshatra": ai, "avyogi_planet": nakshatra_lord(ai)}
