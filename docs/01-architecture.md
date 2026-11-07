# Deliverable 1 — System Architecture (Stage 0)

Status: DRAFT for owner approval. No calculation code exists or is authorised.

## 1. Goals
Professional, transparent, versioned Vedic astrology platform on Web (PWA), Android and iOS, in English / Hindi / Gujarati, light and dark themes.

## 2. Logical architecture

```
 Clients                         API                       Domain services                Adapters
┌───────────────┐   HTTPS   ┌──────────────┐   ┌───────────────────────────────┐   ┌──────────────────┐
│ Next.js (web) │──────────▶│ FastAPI REST │──▶│ ChartService  DashaService     │──▶│ EphemerisAdapter │ (replaceable)
│ Expo (mobile) │           │ /v1, authN/Z │   │ SpecialRulesService (Yogi,     │   │  - SwissEph Pro  │
│ shared pkgs:  │           │ OpenAPI      │   │  Dagdha, Karma)  TransitService│   │  - Skyfield/JPL  │
│  ui-tokens    │           └──────┬───────┘   │ DignityService  ReportService  │   │  - Mock (tests)  │
│  i18n         │                  │           │ RuleRegistryService            │   ├──────────────────┤
│  chart-svg    │                  ▼           └───────────────┬───────────────┘   │ TimeZoneAdapter  │ (IANA TZDB)
│  api-client   │           ┌──────────────┐                   │                   │ GeocodeAdapter   │
└───────────────┘           │ PostgreSQL   │◀──────────────────┘                   └──────────────────┘
                            │ (Supabase)   │
                            └──────────────┘
```

## 3. Layering rules (hard constraints)
1. **UI never imports ephemeris code.** UI consumes only API DTOs (`ChartSnapshot`).
2. **Astronomy ≠ astrology.** Layer A (astronomy: UTC → apparent longitudes, ayanamsha) is separate from Layer B (Jyotisha rules: nakshatra, navamsha, tithi, dasha…). Layer B takes plain numbers (sidereal longitudes) and has no engine dependency, so it is unit-testable with fixtures.
3. **Rules are data + versioned code.** Each rule has an ID in the Rule Registry; every computed result stores `rule_id@version`.
4. **Snapshots are immutable.** A saved horoscope stores inputs, settings, engine id/version, ephemeris data version, rule versions and results. Never silently recomputed (PART 17).
5. **Switching North/South style is purely presentational** over the same `ChartSnapshot`.
6. **No hardcoded UI strings** in components; `/locales/{en,hi,gu}.json` only. Astro vocabulary (planets, signs, nakshatras) lives in `/locales/*` under `astro.*` keys.
7. **Unapproved rules cannot run in production**: a rule with status ≠ `APPROVED` is blocked by a feature flag and rendered with an "UNVERIFIED" badge in non-prod.

## 4. Proposed repository layout (monorepo, pnpm + uv)
```
apps/web        Next.js + TS (PWA)
apps/mobile     Expo React Native
packages/ui-tokens  theme tokens (light/dark)
packages/i18n   locale JSON + helpers
packages/chart-svg  North/South SVG components (platform-neutral; react-native-svg + web svg)
packages/api-client generated from OpenAPI
services/api    FastAPI
services/api/astro/engine      EphemerisAdapter interface + impls (Stage 2)
services/api/astro/rules       Layer B rule modules (Stage 3/4)
services/api/astro/registry    rule definitions (YAML) + loader
db/migrations   SQL
validation/     JHora reference fixtures + comparison harness
docs/
```

## 5. Cross-cutting
- **Auth**: Supabase Auth (email/password, OAuth later). JWT validated in FastAPI. Passwords never handled by our code.
- **Authorisation**: Postgres Row Level Security per `astrologer_id`; roles `owner_admin`, `astrologer`, `student_readonly`, `reviewer` (can approve rules).
- **Storage model**: cloud-authoritative; mobile keeps an encrypted offline cache (read-mostly), writes queued and reconciled by `updated_at` + version.
- **Research notebooks**: private per astrologer; separate `research_notes` + full-text index (Postgres `tsvector`, multilingual config `simple`).
- **Audit**: append-only `audit_log` (who, what, before/after hash, rule versions).
- **Reproducibility**: result hash = sha256(inputs + settings + engine_version + ephemeris_version + rule_versions).
- **Privacy**: data export (JSON/CSV) and deletion endpoints; backups daily with PITR; TLS everywhere; secrets in env vault.
- **Commercial readiness**: `plan`/`entitlement` tables stubbed; no payment processing until approved.
- **Observability**: structured logs, request IDs, calculation timing metrics.
- **Fonts**: Noto Sans / Noto Sans Devanagari / Noto Sans Gujarati bundled for charts and PDFs.

## 6. Traceability structure
`Requirement → Rule → Data → Component → Screen → Test → Owner Approval` is kept in `validation/traceability.csv` (one row per requirement ID `REQ-nnn`). Seed rows are generated from the registries in docs 07–10.

## 7. Key technology risks
| Risk | Mitigation |
|---|---|
| Ephemeris licence | Adapter pattern; decision gate D-01 in doc 12 |
| Historical time zones | IANA TZDB + manual override + provenance flag |
| Ayanamsha differences across engines | Per-engine ayanamsha mapping table, validated vs JHora (doc 06) |
| Rule disagreement between traditions | Each tradition is a separate rule version; never merged |
| Shared chart code web/mobile | SVG components over a thin primitive layer |
