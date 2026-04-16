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
### Added
- Vitest test runner (`npm test`, `npm run test:run`) configured for a Node environment.
- `src/lib/units.ts` — imperial ↔ metric conversion helpers and a typed `toMetric` normalizer with input validation.
- `src/lib/references.ts` — cohort reference profiles (universal + 8 sex×age combos) driving the BAI alignment math. Universal profile sourced from WHO (BMI) and Thomas 2013 (BRI); adult sex/age combos are v1 estimates flagged `verified: false` pending verification against primary sources.
- `src/lib/indices.ts` — pure implementations of BMI, BRI (Thomas 2013), a piecewise-linear alignment score, the weighted BAI, and the 5-tier word mapping (Aligned / Centered / Building / Exploring / Awakening).
- Unit tests covering conversions, reference resolution, alignment anchor points, tier boundaries, and a midpoint-body sanity check (49 tests total).

## [0.1.0] - 2026-04-16
### Added
- Initial Next.js 16 scaffold: TypeScript, Tailwind 4, ESLint, App Router, Turbopack, `src/` layout, `@/*` import alias.
- Local git repository on `main`, remote tracking `origin/main` at github.com/mstopka-viber/BAI-Health.
- `.claude/` workspace settings excluded from version control.
- This changelog and a semver release policy.
