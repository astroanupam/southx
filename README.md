# ASTROSUTRAS — Stage 0 package

| # | Deliverable | File |
|---|---|---|
| 1 | Architecture | docs/01-architecture.md |
| 2 | Screens | docs/02-screens.md |
| 3 | ERD | docs/03-erd.md |
| 4 | API | docs/04-api.md |
| 5 | Ephemeris adapter + licence comparison | docs/05-ephemeris-adapter.md |
| 6 | Ayanamsha / JHora validation matrix | docs/06-ayanamsha-jhora-validation-matrix.md |
| 7 | Yogi / Avyogi comparison | docs/07-yogi-avyogi-comparison.md |
| 8 | Dagdha Rashi registry | docs/08-dagdha-rashi-registry.md |
| 9 | Karma Nakshatra registry | docs/09-karma-nakshatra-registry.md |
| 10 | Vimshottari spec | docs/10-vimshottari-spec.md |
| 11 | UI prototype (EN/HI/GU, light/dark) | prototype/index.html (open in a browser) |
| 12 | Owner approval register | docs/12-owner-approval-register.md |

## Estimated timeline (rough; one developer + Claude Code, working time after each approval)
| Stage | Scope | Estimate | Blocked by |
|---|---|---|---|
| 0 | Documents + prototype | Done (draft) | Owner review of register |
| 1 | Foundation: web + Expo app, auth, birth form, i18n, themes | 3–5 weeks | Stage 0 approval, Supabase/geocoder choice |
| 2 | Engine: planets, ayanamsha, ascendant, nakshatra, D-9 | 3–4 weeks | Licence decision D-01, JHora settings + reference charts |
| 3 | Yogi/Avyogi, Dagdha, Karma, dignity | 2–3 weeks | Q-06…Q-11, Q-16…Q-21 |
| 4 | Dasha, transits, comparison | 3–4 weeks | Q-13 |
| 5 | Reports, store releases, security/perf tests, final validation | 4–6 weeks | App Store / Play accounts, review times |
Total ≈ 15–22 weeks of build, plus waiting time for owner decisions and store review. Stages 1 and 2 can overlap once D-01 is settled.

## Stage 1 build status (2026-11-07)
| Part | Folder | Status |
|---|---|---|
| Web app (Next.js, TypeScript, PWA manifest) | apps/web | Dashboard, EN/HI/GU, light/dark (remembered), birth form with 12/24h time, live DST/historical-offset card with manual override, save/update/duplicate/delete/search (browser storage), empty North/South chart layouts, analysis cards marked pending. 8 unit tests pass; lint and build clean. |
| Mobile app (Expo React Native) | apps/mobile | Birth form, DST card, language and theme switch, saved list. Typechecks and bundles for Android. Not yet run on a device or iOS. |
| API (FastAPI) | services/api | /health, /v1/time/resolve (IANA tz, DST, manual override), /v1/ayanamsha catalogue, chart endpoint returns 501. 8 tests pass. |
| Not built yet | | Login/accounts (needs a Supabase project), cloud storage, place search (geocoder choice Q-25), planetary engine (Stage 2). |

### Run
```
cd apps/web && npm run dev          # http://localhost:3000
cd apps/web && npm test
cd services/api && .venv\Scripts\python -m uvicorn app.main:app --reload
cd services/api && .venv\Scripts\python -m pytest
cd apps/mobile && npx expo start
```
## Stage 2 build status (2026-11-08)
Engine (JPL DE440s via Skyfield, free, no licence) is live in `services/api/app/engine`: planets, mean Rahu/Ketu, Ascendant, nakshatra/pada, navamsha, tithi, Yogi/Avyogi Method A. Validated against JHora REF-001 and REF-002 (see docs/06 section F). Enabled options: ayanamsha True Chitra Paksha, Mean nodes. Others return 409 until validated. API: POST /v1/charts/compute. The web app now shows the computed North/South D-1 and D-9 charts and the planetary table. The mobile app does not call the engine yet. Supported dates 1850-2149 (de440s).
Run API: `cd services/api; .venv\Scripts\python -m uvicorn app.main:app --port 8000`
## Static web app (2026-11-08)
The web app now runs entirely in the browser and deploys to GitHub Pages: see DEPLOY.md. Engine runs in a Web Worker via Pyodide; login and storage are encrypted in the browser (apps/web/src/lib/vault.ts). The FastAPI service in services/api remains the reference implementation and test bed for the engine; the web app does not need it.