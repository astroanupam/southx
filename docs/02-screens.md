# Deliverable 2 — Screen Structure (Web / Android / iOS)

Clickable prototype: `prototype/index.html` (Deliverable 11).

## Global shell
Header: logo · profile switcher · **language** (EN/हि/ગુ) · **theme** (☀/🌙) · account menu.
Desktop ≥ 1100px: 3 panels. Tablet 700–1100: left panel as drawer, centre+right stacked. Mobile < 700 / native apps: bottom tab bar.

## Screen map
| ID | Screen | Web | Mobile |
|---|---|---|---|
| S01 | Sign in / Sign up / Reset | page | stack screen |
| S02 | Dashboard (3-panel) | 3 panels | tabs: Profiles · Chart · Analysis |
| S03 | Birth Details form (create/edit) | modal/page | full screen |
| S04 | Location search & coordinate override | inline | sheet |
| S05 | Time-zone / DST panel (auto vs manual, provenance) | inline card | section |
| S06 | Saved Charts library (search, duplicate, delete) | left panel | tab |
| S07 | Chart view: D-1/D-9 × North/South | centre | tab |
| S08 | Planet detail popover (tap planet) | popover | bottom sheet |
| S09 | Planetary Table (11 columns) | table | horizontal-scroll cards |
| S10 | Dignity & classification (with source/method) | right card | section |
| S11 | Yogi / Avyogi (method selector A / B-locked) | right card | section |
| S12 | Dagdha Rashi (table A/B selector) | right card | section |
| S13 | Karma Nakshatra (System A / B / side-by-side) | right card | section |
| S14 | Vimshottari (3 levels, timeline, calendar, date lookup) | right card + full page | section + page |
| S15 | Transit (date/time/location; natal comparison) | page | page |
| S16 | Settings: Astrological (ayanamsha, node, house) | page | page |
| S17 | Settings: App (theme, language, data export/delete) | page | page |
| S18 | Reports (PDF / HTML / Excel; language pick) | page | page |
| S19 | Research notes & search | page | page |
| S20 | Rule Registry browser (read-only; reviewer can approve) | page | — |
| S21 | Validation dashboard (JHora comparison pass/fail) | page | — |

## Key interaction rules
- Planet tap → S08 with: name, longitude, rashi, degree, nakshatra, pada, navamsha, dignity, house, retrograde.
- Chart-style toggle does not call the API (client-side re-render of the same snapshot).
- Every special-rule card shows: **Method · Rule ID@version · Approval badge** (`APPROVED` / `UNVERIFIED — NOT ENABLED`).
- Every snapshot header shows ayanamsha name+value, engine, rule-set version, and "frozen on <date>".
- Time card shows: local civil time, UTC offset, DST yes/no, **Auto** or **Manual override** tag, UTC result.

## Accessibility & i18n
Min 4.5:1 contrast both themes; text scaling to 200%; RTL not required; Devanagari/Gujarati line-height ≥ 1.5; language and theme persisted (localStorage on web; AsyncStorage on mobile; synced to user profile when signed in).
