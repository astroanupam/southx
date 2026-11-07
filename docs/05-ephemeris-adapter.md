# Deliverable 5 — Astronomical Engine & Ephemeris Adapter Design

Design only. No engine is selected, purchased or integrated (gate D-01).

## 1. Adapter interface (language-neutral contract)
```
interface EphemerisAdapter {
  id(): string                    // "swisseph-pro" | "skyfield-de441" | "mock"
  version(): string               // library + data-file versions
  julianDayUT(utc: Instant): float
  bodyPosition(body, utc, opts): { lon_trop, lat, dist, speed_lon, flags }
  ayanamshaValue(code, utc, custom?): { value_deg, standard_ref, epoch, supported: bool }
  nodePosition(kind: mean|true, utc): { lon_trop, speed }
  ascendantAndHouses(utc, lat, lon, houseSystem): { asc, mc, cusps[] }
  capabilities(): { ayanamshas[], houseSystems[], nodeKinds[], date_range }
}
```
- Input is always **UTC**; time-zone logic lives in `TimeZoneAdapter` (IANA TZDB), never inside the engine.
- Output tropical + the adapter's own ayanamsha; the **Layer B** converts to sidereal through one function so the formula is auditable: `sidereal = (tropical − ayanamsha) mod 360`.
- Unsupported option → `supported:false`, never silently approximated.
- `mock` adapter returns fixture values from JHora reference files, enabling Layer B development and tests before engine approval.

## 2. Design rules
- UI/API handlers depend on `ChartService`, which depends on the interface only.
- Engine id/version/data-file hash stored in each snapshot.
- Time scale: UT → TT via ΔT model recorded (ΔT source varies by engine; document in validation matrix).
- Retrograde = sign of ecliptic longitudinal speed. Station edge cases tested.
- Combustion thresholds are a **rule** (Layer B, approval required), not engine logic.
- Rahu/Ketu: Ketu = Rahu + 180° (Layer B); mean vs true selected by setting.

## 3. Licensing comparison (to be verified by owner/legal; figures change)

| Criterion | Swiss Ephemeris — Professional | Swiss Ephemeris — AGPL | JPL DE + Skyfield |
|---|---|---|---|
| Licence | Commercial licence from Astrodienst (paid) | GNU AGPL v3 | Skyfield: MIT; JPL ephemeris files: free to use (NASA/JPL) |
| Closed-source commercial app | Allowed per licence terms | **No** — network use triggers source disclosure of the whole combined work | Allowed |
| Ayanamsha built-in | Many (Lahiri, Raman, KP, Yukteswar, Fagan-Bradley, others) | same | **None** — must implement and validate each ourselves |
| Lunar nodes | Mean + true built in | same | Must implement mean node series; true node derived |
| Houses/Ascendant | Built in | same | Must implement |
| Match with JHora | JHora uses Swiss Ephemeris → closest expected agreement | same | Expected sub-arcsecond planets; ayanamsha/node conventions need manual alignment |
| Accuracy | Sub-arcsecond with JPL-derived data files | same | Sub-arcsecond |
| Engineering effort | Low | Low | High |
| Risk | Cost/contract terms; per-product or per-seat restrictions to confirm | **Legal exposure** | Higher validation burden |
| Python integration | `pyswisseph` wrapper — check its own licence (it follows Swiss Eph) | same | pure Python |

Recommendation (non-binding): **Swiss Ephemeris Professional**, conditional on owner reading and approving the current contract (mobile app distribution, SaaS use, number of users/products). **Do not use AGPL** without legal sign-off (per brief). JPL/Skyfield retained as fallback and as an independent cross-check for planetary longitudes.

Owner action items: obtain written quote and licence text from Astrodienst; confirm it covers (a) hosted web API, (b) App Store/Play distribution if any engine code ships to devices (recommended: engine runs server-side only), (c) redistribution of data files.

## 4. Where computation runs
Server-side only (FastAPI). Mobile apps call the API; this keeps engine code off devices and simplifies licensing. Offline viewing uses cached snapshots.

## 5. Owner decision update (2026-11-07): free ephemeris, no licence purchase
Owner direction: use a free ephemeris that needs no licence. This replaces the earlier Swiss Ephemeris Professional recommendation.

**Selected primary engine: JPL DE ephemeris (e.g. DE440/DE441) via Skyfield.** Skyfield is MIT-licensed and the JPL files are freely usable, so nothing is purchased and the proprietary app stays closed-source. Swiss Ephemeris stays out: its "free" option is the AGPL licence, which is not licence-free for a closed commercial app.

What this means in practice:
- We must write and validate, in Layer A: the ayanamsha formulas (Lahiri, Raman, KP, Yukteswar, Pushya Paksha, Fagan-Bradley), the mean lunar node (and true node), the Ascendant and whole-sign houses, apparent-place corrections, and the ΔT model.
- Planet longitudes should agree with JHora to well under an arcsecond. The risk is in the conventions (ayanamsha constants, node formula, ΔT), so those are the first things the validation matrix (doc 06) tests.
- Extra effort is roughly +2–3 weeks in Stage 2 (now ~5–7 weeks instead of 3–4).
- JPL data file size: DE440 about 115 MB, DE441 about 3 GB for the long span; decide the date range (DE440 covers 1550–2650) before download.
- The adapter interface is unchanged; a commercial engine could still be swapped in later.
- Legal check still advised for attribution/notice requirements of Skyfield and JPL data, but no fee or contract is needed.