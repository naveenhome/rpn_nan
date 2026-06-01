# RPN Calculator — Decisions Log

This file records every decision made while planning and building the project, so the rationale is never lost. Newest decisions appended at the bottom of each section.

Last updated: 2026-06-01

---

## Project summary

A web-based Reverse Polish Notation (postfix) calculator. Angular frontend, NestJS backend
(server-side evaluation), MySQL for calculation history. Built as an Nx integrated monorepo.
Source of truth for requirements: `Docs/Requirement Document`.

---

## Architecture & stack decisions

| #   | Decision                | Choice                                                         | Rationale                                                                 |
| --- | ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Monorepo tool           | **Nx** (integrated monorepo preset)                            | Single workspace for Angular + NestJS + shared libs.                      |
| 2   | Frontend                | **Angular** (standalone components + signals)                  | Per requirement; modern Angular idioms.                                   |
| 3   | Backend                 | **NestJS**                                                     | Per requirement.                                                          |
| 4   | Database                | **MySQL** (local)                                              | Per requirement.                                                          |
| 5   | RPN evaluation location | **NestJS backend**                                             | All evaluation server-side; frontend never evaluates.                     |
| 6   | RPN engine placement    | **Backend-only Nx lib** `libs/rpn-engine`                      | Isolated unit-testing; imported only by `apps/api`, never by the web app. |
| 7   | Shared types            | **`libs/shared-types`** (interfaces/DTO shapes only, no logic) | Type-safe contract between web + api.                                     |
| 8   | ORM                     | **TypeORM** (`@nestjs/typeorm`, `mysql2`)                      | First-class NestJS integration; entity/repository pattern.                |
| 9   | Schema management       | **TypeORM migrations** (no `synchronize`)                      | Explicit, reviewable schema changes.                                      |
| 10  | Test runner             | **Jest** across the entire monorepo (incl. Angular)            | Single runner; Nx default.                                                |
| 11  | API input shape         | **`{ "expression": "3 4 +" }`** (RPN string)                   | Backend tokenizes; one field to validate.                                 |
| 12  | API versioning          | Routes under **`/api/v1/...`**                                 | Consistent, versioned API.                                                |

---

## Scope decisions

| #   | Decision             | Choice                                                                               | Rationale                               |
| --- | -------------------- | ------------------------------------------------------------------------------------ | --------------------------------------- |
| 13  | Authentication       | **None** (anonymous sessions)                                                        | Explicit non-goal in requirement §3.    |
| 14  | DB persistence scope | **Calculation history only** (expression + result + timestamp)                       | No user accounts. Requirement §3.       |
| 15  | UI scope (v1)        | **Functional calculator UI** (button grid + display + history panel + clear-history) | Usable RPN calculator per user stories. |

---

## Operator & numeric decisions

| #   | Decision          | Choice                                     | Rationale                                                                                                                        |
| --- | ----------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 16  | Operator set      | `+  −  ×  ÷  ^  %  !`                      | Requirement §4 user stories (overrides an earlier "basic four" answer).                                                          |
| 17  | `^` semantics     | Binary exponentiation (`Math.pow`)         | e.g. `2 10 ^` = 1024.                                                                                                            |
| 18  | `%` semantics     | **Unary percentage**: `x %` → `x / 100`    | e.g. `75 %` = 0.75 (NOT modulo). Requirement §4.                                                                                 |
| 19  | `!` semantics     | **Unary factorial**                        | e.g. `7 !` = 5040; `0 !` = 1.                                                                                                    |
| 20  | Numeric precision | **Pure 64-bit float (float64) everywhere** | Requirement §2/§3. NOTE: large factorials (e.g. `20!`) are best-effort float, NOT guaranteed exact integers — accepted tradeoff. |

---

## Error-handling decisions (defensive everywhere)

| #   | Case                                                                  | Behavior                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21  | Division by zero (`5 0 /`)                                            | Explicit error — never return `Infinity`/`NaN`.                                                                                                                                                                                         |
| 22  | Factorial of negative (`-3 !`)                                        | `FactorialDomainError` — operation undefined.                                                                                                                                                                                           |
| 23  | Factorial of non-integer (`2.5 !`)                                    | `FactorialDomainError`.                                                                                                                                                                                                                 |
| 24  | Factorial overflow (`171 !` → `Infinity`)                             | `OverflowError`.                                                                                                                                                                                                                        |
| 25  | Malformed expression (`+ 3`, leftover operands, unknown token, empty) | `MalformedExpressionError`.                                                                                                                                                                                                             |
| 26  | API error envelope                                                    | Consistent JSON `{ statusCode, error, message, code }` for ALL errors (success + error shapes documented); machine-readable `code` (see #57); `class-validator` string-array normalized; 422 for malformed/domain, 400 for bad payload. |

---

## Workflow / ops decisions

| #   | Decision              | Choice                                                                                           |
| --- | --------------------- | ------------------------------------------------------------------------------------------------ |
| 27  | GitHub repo           | `https://github.com/naveenhome/rpn_nan.git` (currently empty).                                   |
| 28  | When to push          | **After the first working scaffold** (init + commit + push initial). Confirm before first push.  |
| 29  | DB creation/migration | **Confirm before** creating the local DB or running migrations; verify MySQL server is up first. |
| 30  | Dependencies          | Only the approved list may be installed without re-asking (see below).                           |
| 31a | Default branch        | **`main`**; CI triggers on push/PR to `main`.                                                    |

### Approved dependency list

- Nx generators: `@nx/angular`, `@nx/nest`, `@nx/js`, `@nx/playwright`
- Backend: `@nestjs/typeorm`, `typeorm`, `mysql2`, `@nestjs/config`, `class-validator`, `class-transformer`
- E2E: `@playwright/test` (via `@nx/playwright`)
- Angular: provided by `@nx/angular`
- Dev/test (added via gap analysis 2026-06-01): `fast-check` (property-based engine tests), `@axe-core/playwright` (a11y checks in e2e), `husky` + `lint-staged` (pre-commit hooks)
- NOT used (hand-rolled instead): `@nestjs/throttler`, `helmet`, `@nestjs/swagger`, `@nestjs/terminus`, `Joi`
- GitHub-native (no npm dep): `nrwl/nx-set-shas` action, Dependabot, CodeQL

---

## Environment (confirmed 2026-06-01)

- Node `v20.20.0`, npm `10.8.2`
- MySQL client `9.3.0` (Homebrew); **server status not yet confirmed**
- Nx not installed globally (will use `npx`)

---

## Development approach (added 2026-06-01)

| #   | Decision           | Choice                                                                                 | Rationale                                                                                                                          |
| --- | ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 31  | Methodology        | **Agile, vertically-sliced delivery**                                                  | Each slice is a thin end-to-end increment (UI → API → engine → DB) that is independently demoable — not horizontal layer-by-layer. |
| 32  | Testing discipline | **TDD (Red → Green → Refactor)**                                                       | Write the failing test(s) at each affected layer first, implement to green, refactor, then commit. Untested code = incomplete.     |
| 33  | Commit cadence     | One (or more) commits per completed slice                                              | Keeps history aligned with shippable increments.                                                                                   |
| 34  | E2E test runner    | **Playwright** for the Angular web app (full browser flows)                            | User-requested. Nx-native; replaces the Cypress default.                                                                           |
| 35  | API endpoint e2e   | **Jest + supertest** (`apps/api-e2e`)                                                  | Nx default; integration-level endpoint coverage (Playwright is for the browser UI).                                                |
| 36  | CI/CD              | **GitHub Actions** — on push/PR: install → lint → unit (Jest) → build → Playwright e2e | User-requested. Wired in E0 so the first push runs a green pipeline.                                                               |
| 37  | Per-slice e2e      | Each slice extends the Playwright suite to cover its new user-facing flow              | Keeps e2e aligned with vertical slices + TDD.                                                                                      |

## UI look & feel decisions (added 2026-06-01)

| #   | Decision              | Choice                                                               | Rationale                                                                                                          |
| --- | --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 38  | Layout                | **Input-first**                                                      | Large RPN text field + Evaluate button, big result, history list below. Best fit for RPN's keyboard-driven nature. |
| 39  | Styling               | **Plain SCSS, no dependency**                                        | CSS custom properties for theming. Matches "rather write 20 lines than pull a package".                            |
| 40  | Visual vibe           | **Modern flat / minimal**                                            | Rounded cards, subtle shadows, generous spacing, neutral palette + one accent.                                     |
| 41  | Theme                 | **Light + dark toggle**, defaults to system (`prefers-color-scheme`) | Implemented via CSS variables + a toggle persisted in localStorage.                                                |
| 42  | Operator helper chips | Small clickable row of `+ − × ÷ ^ % !` that insert into the input    | Discoverability of supported operators without a full keypad. (Default — vetoable.)                                |
| 43  | Keyboard UX           | `Enter` evaluates; input is the primary interaction                  | Keyboard-first per persona.                                                                                        |
| 44  | Accent color          | Single indigo/blue accent (exact token in SCSS variables)            | Neutral, professional; easy to retheme. (Default.)                                                                 |
| 45  | Responsiveness        | Single-column responsive; comfortable down to mobile width           | Responsive web app per requirement §3 non-goals.                                                                   |

### Vertical slice backlog (ordered)

Each slice = failing tests first, then implementation across all touched layers, then refactor + commit.

- **Enabler E0** — Nx workspace scaffold (web + api), shared-types skeleton. (Not a user-facing slice; minimal.)
- **Slice 1 — Walking skeleton + addition**: `POST /api/v1/calculate` evaluates `3 4 +`; result shown in Angular UI. Engine supports `+` only. No DB yet. Proves the full pipeline. → first push.
- **Slice 2 — Remaining binary arithmetic**: add `−  ×  ÷` to engine; division-by-zero returns explicit error surfaced in UI.
- **Slice 3 — History persistence**: introduce MySQL + TypeORM; persist every calc; `GET /api/v1/history`; history panel in UI.
- **Slice 4 — Clear history**: `DELETE /api/v1/history` + UI "Clear history" button.
- **Slice 5 — Exponentiation `^`**: end-to-end (e.g. `2 10 ^`).
- **Slice 6 — Percentage `%`** (unary, `x/100`): end-to-end (e.g. `75 %`).
- **Slice 7 — Factorial `!`** (unary): incl. `0!`=1, negative/non-integer → `FactorialDomainError`, `171!` → `OverflowError`.
- **Slice 8 — Malformed-expression hardening**: tokenizer/evaluator edge cases (`+ 3`, leftover operands, unknown tokens, empty) + UI error polish.

> Cross-cutting error handling is built _into the slice where it first arises_ (e.g. division-by-zero lands in Slice 2), then extended as later slices add operators.

---

## Gap-analysis outcomes (added 2026-06-01)

Decisions from the 3-agent brainstorm (tech / test / docs). All confirmed by the user.

### Tech / architecture

| #   | Decision                    | Choice                                                                                                                                                                                                                                                                  |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 46  | Property-based testing      | `fast-check` for `rpn-engine` (commutativity, monotonicity, round-trips).                                                                                                                                                                                               |
| 49  | Backend hardening           | **Hand-rolled** in-memory token-bucket throttle guard + small security-headers middleware (no `@nestjs/throttler`/`helmet`).                                                                                                                                            |
| 50  | API docs                    | Maintain the `PLAN.md` `/api/v1` contract table (no `@nestjs/swagger`); DoD requires keeping it current.                                                                                                                                                                |
| 51  | Persist-failure policy      | Compute succeeds but history write fails → return result with **200** + log the failure + soft "not saved to history" notice. Add infra/`InternalError` branch; no transaction (single insert).                                                                         |
| 52  | `GET /history` contract     | Cap at **100** most-recent; `ORDER BY createdAt DESC, id DESC`; empty → `[]` (not 404). DELETE idempotent (always 204).                                                                                                                                                 |
| 54  | Nx module boundaries        | Tags `scope:web`, `scope:api`, `type:engine`, `type:shared` + `@nx/enforce-module-boundaries`: web→shared only; api→engine+shared; engine/shared→nothing. Set in E0.                                                                                                    |
| 55  | Tokenizer grammar           | Normalize UI glyphs at the boundary (`−`→`-`, `×`→`*`, `÷`→`/`); numeric regex (optional sign, decimal, exponent); leading `-`/`+` on digits = negative literal, standalone `-` = binary subtract; collapse arbitrary whitespace; reject `Infinity`/`NaN`/empty tokens. |
| 56  | Non-finite result invariant | Any non-finite **final** result → error (catch-all for "zero silent errors").                                                                                                                                                                                           |
| 57  | Error codes                 | Machine-readable `code` in envelope: `DIV_BY_ZERO`, `FACTORIAL_DOMAIN`, `OVERFLOW`, `UNDERFLOW`, `LEFTOVER_OPERANDS`, `UNKNOWN_TOKEN`, `EMPTY`, `VALIDATION`, `INTERNAL`. UI maps code → friendly copy.                                                                 |
| 58  | Dev/prod topology           | Nx `proxy.conf.json` for dev; frontend calls relative `/api`; prod = same-origin reverse-proxy (no CORS). `setGlobalPrefix('api')` + URI versioning (`v1`).                                                                                                             |
| 59  | Config validation           | Fail-fast at boot via a `class-validator` config schema (no `Joi`); commit `.env.example`.                                                                                                                                                                              |
| 60  | Request hardening           | JSON body limit (~16 KB); `@MaxLength` on `expression` (~1 KB); reject non-`application/json`.                                                                                                                                                                          |
| 61  | DB specifics                | `utf8mb4`; UTC timestamps; index on `(createdAt, id)`; `@CreateDateColumn`.                                                                                                                                                                                             |
| 69  | Ops                         | `GET /api/v1/health` (`SELECT 1`, hand-rolled); Nest `Logger` for 4xx/5xx; scrub 5xx detail from responses (log it).                                                                                                                                                    |
| 70  | UI number formatting        | Display rounding (`toPrecision(15)`, trimmed); raw float stored/returned; plain `.` decimal, no grouping (engineering tool).                                                                                                                                            |

### Testing / CI

| #   | Decision            | Choice                                                                                                                                                                                                                          |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 62  | Coverage thresholds | `rpn-engine` ~100% (95–100% lines/branches); api/web ~80%. Enforced in CI (`coverageThreshold`).                                                                                                                                |
| 63  | CI mechanics        | `nx affected` + `nrwl/nx-set-shas`; `setup-node` npm cache + Nx cache; Playwright **Chromium-only** + browser cache; upload reports/traces on failure; single Node 20 (reads `.nvmrc`); Playwright `retries: 2` in CI, 0 local. |
| 64  | Stateful e2e in CI  | Playwright `webServer` boots api+web; **run TypeORM migrations** against the MySQL service container before tests; truncate `calculation_history` between specs for isolation.                                                  |
| 65  | Branch protection   | On `main`, require lint/test/build/e2e checks; enable **right after** the first scaffold push (#28).                                                                                                                            |
| 66  | Definition of Done  | Per slice: failing tests written first; all touched layers tested; lint+unit+build+e2e green; new Playwright flow added; coverage not regressed; relevant docs updated; a11y check passed.                                      |
| 73  | Security scanning   | GitHub-native: `npm audit` (high) / Dependabot + CodeQL (JS/TS).                                                                                                                                                                |
| 47  | A11y testing        | `@axe-core/playwright` assertions on the main view.                                                                                                                                                                             |

### Docs / DX / a11y

| #   | Decision            | Choice                                                                                                                                                                                                                                                          |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 48  | Pre-commit          | `husky` + `lint-staged` running lint (+ affected unit tests).                                                                                                                                                                                                   |
| 53  | Accessibility       | Target **WCAG 2.1 AA**: result = `aria-live="polite"`, error = `role="alert"`; AA contrast for both themes; keyboard nav + visible focus + focus returns to input after chip insert; `aria-label` on symbol chips/toggle; `<label>` on input. Built in from S1. |
| 67  | Repo hygiene        | E0 ships: `README` (setup/run/test), `.env.example`, complete `.gitignore` (`.env`, `node_modules`, `dist`, `.nx/cache`, `coverage`, `playwright-report`, `test-results`), `.nvmrc` (`20.20.0`), `engines` in `package.json`, `.editorconfig`.                  |
| 68  | RPN discoverability | Inline help/example (`3 4 +` → 7) near the input — "no tutorial" goal only holds for users who already know RPN.                                                                                                                                                |
| 71  | Commit convention   | Conventional Commits as a convention (no enforcement tooling in v1).                                                                                                                                                                                            |
| 72  | PR template         | `.github/pull_request_template.md` with the per-slice DoD checklist.                                                                                                                                                                                            |

> Note: `decisions/tasks.md` is a decision _log_ (named per user request). Left as-is.

---

## Open / deferred to v2

- Authentication & per-user history
- Scientific functions (trig, log), graphing
- Arbitrary-precision arithmetic (exact large factorials)
- Mutation testing (Stryker), visual-regression snapshots
- Structured/JSON logging + external sink, graceful-shutdown hooks, DB pool tuning
- i18n, SemVer + CHANGELOG, OpenAPI/Swagger
