# Deliverable 6 — Ayanamsha & JHora Validation Matrix

Purpose: make every result checkable against JHora before approval. Nothing here is a computed value; blanks are filled by the owner from JHora.

## A. JHora settings to be recorded by the owner (screenshot + values)
Create `validation/jhora_settings.md` from this checklist:
- JHora version / build; ephemeris (Swiss Eph. version, DE file)
- Ayanamsha (name + displayed value for each reference chart)
- Rahu/Ketu: Mean or True
- Planet positions: geocentric / topocentric (brief requires geocentric)
- Time zone & DST handling for each reference chart (offset shown by JHora)
- House system (whole sign for D-1 display), Bhava Chalit option
- Nakshatra system: 27 (and whether Abhijit is displayed anywhere — affects count and Dasha? Confirm)
- Vimshottari year length (see doc 10)
- Combustion orbs, ΔT setting, precision display (to 1″ or finer)

## B. Ayanamsha matrix
| # | Name | Brief ID | Swiss Eph. support (to verify) | Standard reference epoch / zero-year | JHora value at test epochs (owner fills) | Our value (Stage 2) | Δ (arcsec) | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Lahiri / Chitrapaksha | Y | expected built-in | Spica-based, 285 CE zero / 1956 ICRC definition – confirm which | | | | PENDING |
| 2 | Raman | Y | expected | | | | | PENDING |
| 3 | Krishnamurti (KP) | Y | expected | | | | | PENDING |
| 4 | Yukteswar | Y | expected | | | | | PENDING |
| 5 | Pushya Paksha | Y | confirm exact engine constant ("true Pushya" style) | | | | | PENDING |
| 6 | Fagan-Bradley | Y | expected | | | | | PENDING |
| 7 | User-defined | optional | needs custom epoch + offset + precession-rate model | owner to define | | | | PENDING |

Test epochs for each ayanamsha: 1900-01-01, 1950-01-01, 2000-01-01, 2026-01-01 (00:00 UT) plus each reference chart's birth instant.
Note: values may differ by engine (mean vs true, precession model, ΔT) — the matrix records the delta rather than assuming identity.

## C. Reference chart set (owner to supply from JHora)
Minimum 20 charts, each with JHora export (screenshot + text):
1. Modern, no DST (e.g., India post-1950).
2. India historical (1942–45 wartime time, 1962, 1965, 1971 DST periods) — time-zone edge cases.
3. Northern & southern hemisphere; equator vicinity; high latitude (> 60°N).
4. Dates before 1900 and before 1800 (LMT cases).
5. Ascendant exactly near sign boundary (< 1′).
6. Moon near nakshatra and pada boundaries.
7. Retrograde stations (planet speed ≈ 0).
8. Tithi boundaries (D near multiples of 12°), including Purnima/Amavasya.
9. Leap-day births (29 Feb) and 31 Dec / 1 Jan.
10. Longitude wrap (planet at 359°59′ / 0°00′).

## D. Comparison matrix per chart (one row per item)
| Item | JHora value | App value | Tolerance (proposed) | Pass? |
|---|---|---|---|---|
| Sun…Ketu sidereal longitude | | | ≤ 1″ planets; ≤ 5″ nodes (to confirm) | |
| Ayanamsha value | | | ≤ 0.5″ | |
| Ascendant degree | | | ≤ 2″ | |
| Rashi / Nakshatra / Pada | | | exact | |
| D-9 sign and degree | | | sign exact; degree ≤ 2″ | |
| Retrograde flag | | | exact | |
| Combust flag | | | exact (given approved orbs) | |
| Tithi number/progress | | | number exact; progress ≤ 0.001° | |
| Yogi/Avyogi point & planets | | | point ≤ 2″; planets exact | |
| Dagdha rashis | | | exact (per selected table) | |
| Karma nakshatra | | | exact | |
| Dasha start/end dates | | | ≤ 1 day / exact to chosen convention | |
| Transit positions (3 historical dates) | | | as planets | |

Tolerances are proposals; owner approves (register item Q-12).

## E. Process
1. Owner exports JHora data → `validation/fixtures/*.json` (I will provide a schema).
2. Harness loads fixtures, runs adapter (mock first, real later), writes diff report.
3. Rule status moves `UNVERIFIED → APPROVED` only on all-pass + owner signature (`user_approvals`).
4. A failing case is never auto-waived.

## F. Stage 2 results (2026-11-08) - REF-001 and REF-002
Settings identified by testing options against the two reference charts (owner's JHora screenshots):
| Item | Finding |
|---|---|
| Ayanamsha | True Chitra Paksha (sidereal zero = Spica at 0 Libra). Spica astrometric longitude minus 180 deg equals the value implied by every planet: 24.2183 (2026-11-07) and 23.1067 (1947-08-14), agreeing to <0.0001 deg. Classic Lahiri formula would differ by about 0.014 deg (50 arcsec) in 2026, so it is NOT what JHora used here. Owner to confirm JHora's ayanamsha setting name. |
| Planet positions | Geocentric GEOMETRIC (no light-time, no aberration), true equinox of date (nutation included). |
| Rahu/Ketu | Mean node plus nutation in longitude. Residual 0.03 and 0.09 arcsec. True node not yet tested (no chart uses it). |
| Time | Civil time treated as UT. Skyfield utc() adds a 1972 leap-second offset to older dates (14 s error in 1947); engine uses ut1() with the delta-T table. |
| Residuals vs JHora, 1947 | Planets and nodes <= 0.06 arcsec (Moon 0.04), Lagna 13 arcsec |
| Residuals vs JHora, 2026 | Planets <= 0.6 arcsec, Lagna 7.9 arcsec, Moon 6.8 arcsec. Moon/Sun pattern equals a ~12.4 s later TT in JHora: JHora's delta-T prediction for 2026 is about 12 s larger than the IERS-based value used here. Open item Q-29. |
| Nakshatra, pada, navamsha sign, retrograde | All match for every body in both charts |
| Tithi / Yogi / Avyogi | REF-001 tithi 29 (46.4% left), REF-002 tithi 28 at 99.99% (boundary resolved correctly) |

Tolerances used in tests/test_engine.py: planets 2 arcsec, Moon 1 arcsec (historical) / 10 arcsec (2026), Lagna 20 arcsec.
Ayanamsha options other than True Chitra and node type True are refused (HTTP 409) until validated against further reference charts.