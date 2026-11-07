# Deliverable 12 — Unresolved Questions & Owner Approval Register

Owner decisions recorded 2026-11-07 (from the owner's returned register). "Approved" means approved as recommended in the Recommended column. Items marked ⚠ carry a condition that is still outstanding and gates the stage shown.

| ID | Question | Recommended | Owner decision | Status | Outstanding condition (gate) |
|---|---|---|---|---|---|
| D-01 | Ephemeris engine/licence | Swiss Eph Pro, subject to contract; JPL for cross-check | CHANGED 2026-11-07: use a free, licence-free ephemeris | APPROVED (revised): JPL DE + Skyfield | Owner to confirm date range (DE440 1550–2650 vs DE441). Ayanamsha, nodes, houses built in-house and validated vs JHora (Stage 2) |
| Q-01 | Ayanamsha definitions | Engine constants, validate vs JHora (now: own formulas, since Skyfield has none) | APPROVED | APPROVED ⚠ | JHora settings screenshots (Stage 2) |
| Q-02 | Mean vs true Rahu/Ketu default | Match JHora default; expose setting | KEEP BOTH SETTING SELECTION (reconfirmed 2026-11-08: Rahu/Ketu stays a selection tab; ayanamsha also a selection) | APPROVED (modified) ⚠ | Both Mean and True stay user-selectable. Which is the initial default is not stated — will follow JHora's setting unless told otherwise |
| Q-03 | Geocentric positions | Geocentric | APPROVED | APPROVED | — |
| Q-04 | House system | Whole sign D-1 display | APPROVED | APPROVED | — |
| Q-05 | Historical time-zone policy | TZDB + provenance flag + manual override | APPROVED | APPROVED | India 1942–45 test cases (Stage 2 validation) |
| Q-06 | Purnima/Amavasya Dagdha | Show "none" with table label | APPROVED | APPROVED | Check against DAGDHA RASHI.docx |
| Q-07 | Dagdha order | Treat as set | APPROVED | APPROVED | — |
| Q-08 | Default Dagdha table | B default only if owner confirms source | APPROVED | APPROVED ⚠ | Table B as default requires the source passage (Nārada Saṃhitā / Vidhānamālai) — to be supplied |
| Q-09 | Krishna tithi mapping | n−15; 30 = Amavasya | APPROVED | APPROVED | — |
| Q-10 | Karma A pada display | Show all four | APPROVED | APPROVED | — |
| Q-11 | Karma B key rashi | User-selectable, default per owner | APPROVED | APPROVED ⚠ | Owner's default key rashi (Lagna / Moon / Sun) still to be named |
| Q-12 | Validation tolerances | As proposed (doc 06 §D) | APPROVED | APPROVED | — |
| Q-13 | Vimshottari year length | Match JHora's setting | APPROVED | APPROVED ⚠ | JHora's year-length setting to be read from screenshots (Stage 4) |
| Q-14 | Dasha display span | 120 yrs | APPROVED | APPROVED | — |
| Q-15 | Dasha date time zone | Birth zone, switchable | APPROVED | APPROVED | — |
| Q-16 | Yogi Method A authority text | Cite verse/source | APPROVED | APPROVED ⚠ | Docx gives only secondary sources; primary verse still to be supplied (Stage 3) |
| Q-17 | Yogi Method B | Keep disabled | APPROVED | APPROVED | Stays UNVERIFIED — NOT ENABLED until source and math supplied |
| Q-18 | Avyogi intent (point vs planet) | Clarify | APPROVED | APPROVED ⚠ | "Clarify" is not yet answered: owner to state whether Avyogi point/nakshatra or planet only is the output (Stage 3) |
| Q-19 | Sahayogi definition | Sign lord at Yogi point (brief) | APPROVED | APPROVED | — |
| Q-20 | Dignity tables | Parashari classical; nodes configurable | APPROVED | APPROVED ⚠ | Source text for degrees/moolatrikona/node rules (Stage 3) |
| Q-21 | Benefic/malefic & friendship | Parashari | APPROVED | APPROVED ⚠ | Source text (Stage 3) |
| Q-22 | Combustion orbs | Match JHora | APPROVED | APPROVED ⚠ | JHora orb values (Stage 2) |
| Q-23 | Nakshatra system | 27 | APPROVED | APPROVED | — |
| Q-24 | Custom ayanamsha | Defer | APPROVED | APPROVED (deferred) | Owner spec when wanted |
| Q-25 | Geocoder provider | GeoNames-based or OSM with caching; confirm ToS | APPROVED | APPROVED ⚠ | Final provider and terms check (Stage 1) |
| Q-26 | Report fonts / HI-GU glossary | Owner reviews glossary | APPROVED | APPROVED ⚠ | Glossary review (Stage 5) |
| Q-27 | DAGDHA RASHI.docx and JHora charts | Upload both | APPROVED | PARTLY RESOLVED ⚠ | DAGDHA RASHI.docx received and checked (docs 07-09). JHora reference charts and settings screenshots still not received |
| Q-29 | JHora future-date delta-T differs from IERS-based table by ~12 s in 2026 (Moon 7 arcsec) | Follow IERS-based values (more accurate) or mimic JHora | — | NEW - OPEN | Owner decision; more 2020s reference charts |
| Q-30 | JHora ayanamsha appears to be True Chitra Paksha, not classic Lahiri; confirm setting name and whether Lahiri must also be offered | Offer both; True Chitra validated first | — | NEW - OPEN | Screenshot of JHora ayanamsha setting; a chart set to Lahiri |
| Q-28 | Docx says Table B differs at Saptami, but Saptami is identical in both tables | Confirm no Saptami difference intended | — | NEW – OPEN | Owner confirmation (Stage 3) |

## Approval log
| Date | Items | Decision | Source |
|---|---|---|---|
| 2026-11-07 | D-01, Q-01, Q-03–Q-27 | APPROVED as recommended | Owner's returned register |
| 2026-11-07 | Q-02 | Keep both Mean and True selectable | Owner's returned register |
| 2026-11-07 | D-01 | Revised: free ephemeris (JPL DE + Skyfield), no licence purchase | Owner message |
| 2026-11-08 | Q-01, Q-02 | Both ayanamsha and Rahu/Ketu (mean/true) remain user-selectable settings; engine must support every listed option | Owner message |
