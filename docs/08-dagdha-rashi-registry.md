# Deliverable 8 — Dagdha Rashi Rule Registry

Source: owner brief PART 10 and DAGDHA RASHI.docx (received; tables below were re-checked against it, see "Verification against the .docx").

## Rules
| Rule ID | Name | Formula | Status |
|---|---|---|---|
| DAGDHA.TITHI.CALC v0.1 | Tithi from elongation | D = (λ☽ − λ☉) mod 360°; n = floor(D/12°)+1; n 1–15 Shukla, 16–30 Krishna; progress = (D mod 12°)/12° | UNVERIFIED |
| DAGDHA.TITHI.A v0.1 | Table A — initial circulated convention | lookup (below) | UNVERIFIED |
| DAGDHA.TITHI.B v0.1 | Table B — Nārada Saṃhitā / Vidhānamālai as documented | lookup (below) | UNVERIFIED |
| DAGDHA.MASA v0 | Masa Dagdha Rashi | **separate module — not defined** | NOT DEFINED |
| DAGDHA.YOGA v0 | Dagdha Yoga | **separate module — not defined** | NOT DEFINED |

Kept as separate modules per brief; formulas never mixed.

## Table A (verbatim from brief)
| # | Tithi | Rashis |
|---|---|---|
| 1 | Pratipada | Libra, Capricorn |
| 2 | Dwitiya | Sagittarius, Pisces |
| 3 | Tritiya | Leo, Capricorn |
| 4 | Chaturthi | Taurus, Aquarius |
| 5 | Panchami | Gemini, Virgo |
| 6 | Shashthi | Aries, Leo |
| 7 | Saptami | Cancer, Sagittarius |
| 8 | Ashtami | Gemini, Virgo |
| 9 | Navami | Leo, Scorpio |
| 10 | Dashami | Leo, Scorpio |
| 11 | Ekadashi | Sagittarius, Pisces |
| 12 | Dwadashi | Libra, Capricorn |
| 13 | Trayodashi | Taurus, Aquarius |
| 14 | Chaturdashi | Gemini, Virgo |
| 15 | Purnima | No universal pair |
| 30 | Amavasya | No universal pair |

## Table B (verbatim from brief)
| # | Tithi | Rashis |
|---|---|---|
| 1 | Pratipada | Libra, Capricorn |
| 2 | Dwitiya | Sagittarius, Pisces |
| 3 | Tritiya | Leo, Capricorn |
| 4 | Chaturthi | Taurus, Aquarius |
| 5 | Panchami | Gemini, Virgo |
| 6 | Shashthi | Aries, Leo |
| 7 | Saptami | Cancer, Sagittarius |
| 8 | Ashtami | Gemini, Virgo |
| 9 | Navami | Leo, Scorpio |
| 10 | Dashami | Scorpio, Leo |
| 11 | Ekadashi | Sagittarius, Pisces |
| 12 | Dwadashi | Libra, Capricorn |
| 13 | Trayodashi | Pisces, Taurus |
| 14 | Chaturdashi | Taurus, Aquarius |
| 15 | Purnima | None |
| 30 | Amavasya | None |

## Differences (reported, NOT reconciled)
| Tithi | Table A | Table B | Note |
|---|---|---|---|
| Dashami | Leo, Scorpio | Scorpio, Leo | same set, order differs (order matters only if "Dagdha 1/2" are ranked — Q-07) |
| Trayodashi | Taurus, Aquarius | Pisces, Taurus | **different sets** |
| Chaturdashi | Gemini, Virgo | Taurus, Aquarius | **different sets** |

Observations: in both tables Panchami and Ashtami share Gemini/Virgo; Table A repeats Gemini/Virgo for Chaturdashi (a duplicate pattern that may be a transcription slip — owner to verify against the document, not assumed).

## Application to natal chart (Stage 3 spec)
Inputs: birth tithi, selected table, D-1 snapshot. Outputs: Dagdha Rashi 1/2; their houses (whole-sign: house = (sign − lagna sign) mod 12 + 1); planets in those signs; sign lords; lords' dignity (from DIGNITY rules); related Dasha periods (Dasha lord in {occupants, lords}). **No automatic malefic labelling.** Tithi on the boundary uses [start, end).

Open questions: Q-06 (Purnima/Amavasya), Q-07 (order), Q-08 (which table default), Q-09 (tithi 16–29 mapping: Krishna tithis use same name list as Shukla — proposed: map n>15 to n−15, with 30→Amavasya).

## Verification against the .docx (2026-11-07)
- Table A (docx §1) and Table B (docx §3) match the tables above entry for entry.
- The docx lists Purnima and Amavasya together as one row "(15)": Table A = "No universal pair in this table; traditions differ", Table B = None / None. Krishna paksha tithis 16–30 map to 1–15, so tithi 30 uses the same row as 15. Registry keeps Purnima (15) and Amavasya (30) as separate keys pointing to that row.
- The docx's own text says the Table B correction affects "Saptami, Trayodashi and Chaturdashi", but Saptami is identical in both tables (Cancer, Sagittarius). Real differences are only Trayodashi, Chaturdashi (and Dashami order). Owner to confirm whether a Saptami difference was intended (new item Q-28).
- The Table A duplicate Gemini/Virgo for Chaturdashi is in the docx itself, not a transcription slip.
- The docx states Table A is "one commonly circulated working convention, not a universally agreed classical standard" and Table B is attributed to Narada Samhita / Vidhanamalai via a secondary web source. No primary verse is quoted, so Q-08 (source passage) stays open.
- Masa Dagdha Rashi: docx only says "one burnt sign for each lunar month, with associated burnt Tithis". No table is supplied, so DAGDHA.MASA stays NOT DEFINED. Dagdha Yoga: only described as weekday + Tithi/Nakshatra, also NOT DEFINED.
- Worked example in the docx: D = 96° gives tithi 8 (Shukla Ashtami) = Gemini, Virgo. Added as a unit-test vector.