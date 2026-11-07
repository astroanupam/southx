# Deliverable 10 — Vimshottari Dasha Calculation Specification

Status: SPEC ONLY. Rule `DASHA.VIM` v0.1 — UNVERIFIED.

## Constants
Nakshatra span `N = 360°/27 = 13°20′`. Lord order and years (total 120):
Ketu 7 · Venus 20 · Sun 6 · Moon 10 · Mars 7 · Rahu 18 · Jupiter 16 · Saturn 19 · Mercury 17.
Nakshatra k (0-based) has lord `order[k mod 9]` (Ashwini→Ketu, Bharani→Venus, …).

## Algorithm
1. `λ = λ☽` sidereal (selected ayanamsha). `k = floor(λ / N)`; `f = (λ mod N)/N` = fraction elapsed.
2. Birth Mahadasha lord L0 = order[k mod 9]; balance = (1 − f) × years(L0).
3. Mahadasha sequence starts at L0 (partial), then continues in cyclic order, each full length.
4. Mahadasha start date of L0 = birth instant − f × years(L0) (conceptual start); end = birth + balance.
5. Antardasha within a Mahadasha M (full length Y_M): lord order starts from M's lord; duration of sub-lord s = Y_M × Y_s / 120. For the birth (partial) Mahadasha, sub-periods are the tail of the full sequence from the conceptual start; those already elapsed are marked "before birth".
6. Pratyantardasha within Antardasha (A, length D_A): duration of p = D_A × Y_p / 120, starting from A's lord.
7. All arithmetic in exact rational/decimal form (Python `Decimal` or integer seconds of a fixed convention); convert to dates at the end. Boundary dates: period is [start, end).

## Year-length convention (REQUIRED DECISION — Q-13)
| Option | Year = | Note |
|---|---|---|
| 1 | 365.25 days (Julian year) | common in software |
| 2 | 365.2425 days (Gregorian mean) | |
| 3 | 360 days (savana) | used in some traditions |
| 4 | 365.2564 days (sidereal year) | |
| 5 | Calendar years (add years/months/days on calendar) | non-uniform; avoid for sub-periods |

"Do not use approximate calendar durations" → recommend an exact fixed-length convention decided by matching JHora's setting; record in each snapshot (`vimshottari_dasha.year_convention`).

## Display requirements → data
Current M/A/P (as of `now` in user time zone) · start/end · remaining = end − now · previous/next at each level · full tree (3 levels = 9 + 81 + 729 periods) · calendar view · lookup by date (binary search) · export PDF/Excel.

## Edge cases / tests
- Moon at exactly k×N (f=0 → full balance) and (k+1)×N−ε (f≈1 → near-zero balance).
- Moon 359.9999° → k=26 (Revati→Mercury); wrap to Ketu.
- Birth near end of 120-yr cycle: dates beyond birth+120y are shown (cycle repeats) — confirm display cap (Q-14).
- DST: all Dasha instants stored as UTC, rendered in birth-zone or user-zone (setting Q-15).
- Leap years under each convention.
- Sum of Antardashas == Mahadasha length; Pratyantardashas == Antardasha length (to rounding tolerance 0).
Verification: compare against JHora Vimshottari dates for all reference charts (doc 06).
