# Deliverable 9 — Karma Nakshatra Rule Registry

Two independent systems. Neither replaces the other. A side-by-side view is a UI feature only.

## System A — `KARMA.A` v0.1 — 10th Tara from Janma Nakshatra — UNVERIFIED
- Zero-based nakshatra index i (Ashwini = 0 … Revati = 26), `i = floor(λ☽ / (360/27))`.
- Karma index = (i + 9) mod 27. (Counting Janma as 1st → 10th.)
- Display: Janma nakshatra, Karma nakshatra, its lord (Vimshottari order), pada(s), associated rashi (sign(s) of the nakshatra; Karma nakshatra spans one or two signs — show both when it does).
- Pada of "Karma nakshatra" is not defined by the formula (it names a nakshatra, not a point). Open Q-10: show all 4 padas, or the pada matching Moon's own pada?

Checks: i=0→9 (Ashwini→Magha); i=18→(27 mod 27)=0 (Ashwini); wrap tested.

## System B — `KARMA.B` v0.1 — Owner's reference table — UNVERIFIED (preserved exactly)
| Rashi | Karma Nakshatra | Planet(s) placed |
|---|---|---|
| Aries | Ashwini | — |
| Taurus | Mrigashira | — |
| Gemini | Ardra | — |
| Cancer | Ashlesha | — |
| Leo | Purva Phalguni | — |
| Virgo | Hasta | — |
| Libra | Chitra | — |
| Scorpio | Anuradha | Ketu |
| Sagittarius | Mula, Purva Ashadha, Uttara Ashadha | Jupiter, Venus |
| Capricorn | Dhanishtha | — |
| Aquarius | Purva Bhadrapada | — |
| Pisces | Uttara Bhadrapada | Ascendant |

Observations (not changes):
- Reference table is keyed by **Rashi** — which rashi is the key for a chart (Lagna? Moon sign? Sun sign?) is not stated → Q-11.
- Entries are whole nakshatras (not degree ranges); some nakshatras straddle two signs (e.g., Mrigashira 23°20′ Taurus–Gemini; Dhanishtha Capricorn–Aquarius; Chitra Virgo–Libra). The table is stored as given, with no sign-boundary reinterpretation.
- "Planets placed" column is a static annotation from the owner's table, not a chart computation. Chart-based "planets occupying" is computed separately from natal positions.

## Outputs (both systems)
Selected system · reference rashi (B) / Janma nakshatra (A) · Karma nakshatra(s) · lord · natal occupants (computed) · transit activation (transiting planet inside the nakshatra) · Dasha connections (Mahadasha/Antardasha lord == Karma nakshatra lord or occupant).

## Storage
`karma_nakshatra_results.system_code` ∈ {A,B}; B's table lives in `rule_versions.data_json`, versioned and immutable once approved.

## Verification against DAGDHA RASHI.docx (2026-11-07)
The docx's Hindi and transliterated Karma tables match System B above entry for entry (Scorpio/Anuradha: Ketu; Sagittarius: Jupiter, Venus; Pisces: Lagna). Q-11 (which rashi keys the table) is not answered in the docx.
