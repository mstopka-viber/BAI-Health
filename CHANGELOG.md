# Changelog

All notable changes to BAI Health are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** (X.0.0) — breaking changes users will feel.
- **MINOR** (0.X.0) — new features, backwards compatible.
- **PATCH** (0.0.X) — bug fixes only.

**Release workflow:** move items out of `[Unreleased]` into a new dated version
section, bump the `version` field in `package.json`, commit, then tag the commit
`vX.Y.Z` (e.g. `git tag v0.2.0 && git push origin v0.2.0`).

---

## [Unreleased]

## [0.3.0] - 2026-04-16
### Added
- `src/app/manifest.ts` generates the web app manifest at `/manifest.webmanifest`, marking the app installable with `display: standalone`, orientation hint, theme + background colors, and references to the generated PNG icons.
- `src/app/icon.tsx` uses `generateImageMetadata` + `next/og` `ImageResponse` to produce 192×192 and 512×512 PNG icons plus a maskable 512×512 variant (60% safe zone so Android mask crops don't clip the mark). `src/app/apple-icon.tsx` produces the 180×180 iOS touch icon with the same visual mark.
- `public/sw.js` — hand-rolled service worker. Pre-caches the five app routes on install, network-first for navigations with cache fallback, stale-while-revalidate for same-origin static assets (`/_next/static/*`, fonts, images). Cleans up old caches on activate.
- `src/components/ServiceWorkerRegister.tsx` registers the service worker on first client render in production only (development registration is skipped so Turbopack HMR doesn't fight a cache-first SW).
- `next.config.ts` sets `Cache-Control: no-cache` and the correct MIME type on `/sw.js` so SW updates propagate.
- Root layout exports a `viewport` with per-scheme theme colors and `appleWebApp` metadata, and mounts the SW registration component.

## [0.2.0] - 2026-04-16
### Added
- Vitest test runner (`npm test`, `npm run test:run`) configured for a Node environment.
- `src/lib/units.ts` — imperial ↔ metric conversion helpers and a typed `toMetric` normalizer with input validation.
- `src/lib/references.ts` — cohort reference profiles (universal + 8 sex×age combos) driving the BAI alignment math. Universal profile sourced from WHO (BMI) and Thomas 2013 (BRI); adult sex/age combos are v1 estimates flagged `verified: false` pending verification against primary sources.
- `src/lib/indices.ts` — pure implementations of BMI, BRI (Thomas 2013), a piecewise-linear alignment score, the weighted BAI, and the 5-tier word mapping (Aligned / Centered / Building / Exploring / Awakening).
- `src/lib/db.ts` — local-first IndexedDB persistence via `idb`, with `entries` (auto-incrementing, indexed by `createdAt`) and singleton `profile` stores. Each entry snapshots the cohort midpoints used at compute time so history stays interpretable if the profile or reference table changes later.
- `/` dashboard rendering the latest measurement: tier word, progress ring (0–100), BAI / BMI / BRI values, and an encouraging one-line blurb per tier. Empty state routes first-time users to `/measure`. Adds a trend arrow (up / flat / down) next to the BAI number whenever a previous entry exists, with an accessible label describing the delta.
- `/measure` form for height / weight / waist (+ optional hip), metric ↔ imperial toggle, client-side compute via `computeBai`, persistence to IndexedDB, and an inline result card on success.
- `/settings` page: units toggle, optional sex and age-band dropdowns (stored as the singleton profile), current-cohort indicator with a v1-estimates / pediatric-fallback notice where applicable, and a clear-all-history action.
- `/history` page listing past entries newest-first, with a hand-rolled SVG line chart of BAI over time and optional BMI/BRI overlays (min-max normalized per series for shape comparison, with a caption explaining the normalization). Per-entry delete with a confirm dialog.
- `/about` page: plain-language explanations of BMI / BRI / BAI, how personalization works, the honest Limitations list (pediatric / ethnicity / body-composition / encouragement-frame caveats), and a programmatically rendered cohort-verification table driven by `allProfiles()` so the page stays in sync with the reference table.
- Root layout now brands the app (BAI Health, top-nav for Dashboard / Measure / History / Settings / About) and includes a "Not medical advice" footer.
- `deleteEntry(id)` added to `src/lib/db.ts` with tests covering the happy path and the unknown-id no-op.
- Unit tests covering conversions, reference resolution, alignment anchor points, tier boundaries, a midpoint-body sanity check, and the IndexedDB layer (63 tests total, all passing).

## [0.1.0] - 2026-04-16
### Added
- Initial Next.js 16 scaffold: TypeScript, Tailwind 4, ESLint, App Router, Turbopack, `src/` layout, `@/*` import alias.
- Local git repository on `main`, remote tracking `origin/main` at github.com/mstopka-viber/BAI-Health.
- `.claude/` workspace settings excluded from version control.
- This changelog and a semver release policy.
