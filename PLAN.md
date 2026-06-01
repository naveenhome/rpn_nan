# RPN Calculator — Implementation Plan

> **Source of truth for _how_ we build.**
>
> - _What to build_ → [`Docs/Requirement Document`](./Docs/Requirement%20Document)
> - _What was decided & why_ → [`decisions/tasks.md`](./decisions/tasks.md)
> - _How we build it_ → this file

Last updated: 2026-06-01

---

## 1. Overview

A web-based Reverse Polish Notation (postfix) calculator. Angular frontend, NestJS backend
(server-side evaluation), MySQL for calculation history. Built as an **Nx integrated monorepo**,
delivered **agile / vertically-sliced** with **TDD**.

---

## 2. Architecture

```
rpn_nan/
├─ apps/
│  ├─ web/         Angular app (standalone components + signals)
│  ├─ web-e2e/     Playwright browser e2e
│  ├─ api/         NestJS backend (server-side RPN evaluation)
│  └─ api-e2e/     Jest + supertest endpoint e2e
├─ libs/
│  ├─ rpn-engine/    Pure-TS tokenizer + stack evaluator (imported ONLY by api)
│  └─ shared-types/  Request/response interfaces shared by web + api (no logic)
├─ .github/workflows/  GitHub Actions CI/CD
├─ Docs/Requirement Document
├─ decisions/tasks.md
└─ PLAN.md
```

**Evaluation flow:** Angular UI → `POST /api/v1/calculate { expression }` → NestJS controller
→ `rpn-engine` (tokenize + evaluate) → persist to MySQL → response → UI. The browser never
evaluates; all math is server-side.

### Key components

| Component                       | Responsibility                                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/rpn-engine`               | Tokenize whitespace-separated RPN, evaluate via stack, throw typed errors. Framework-agnostic.                                                                          |
| `libs/shared-types`             | `CalculateRequest`, `CalculateResponse`, `HistoryEntry` interfaces.                                                                                                     |
| `apps/api` CalculatorModule     | DTO validation, calls engine, persists, returns result.                                                                                                                 |
| `apps/api` HistoryModule        | `GET` (cap 100, recent first) / `DELETE` history. `CalculationHistory` entity (id, expression:`varchar utf8mb4`, result:double, createdAt:UTC; index `(createdAt,id)`). |
| `apps/api` exception filter     | Maps engine errors → JSON `{ statusCode, error, message, code }` (422 domain/malformed, 400 bad payload, 5xx scrubbed).                                                 |
| `apps/api` hardening            | Hand-rolled in-memory throttle guard + security-headers middleware; JSON body limit (~16KB); config validation (fail-fast).                                             |
| `apps/api` health               | `GET /api/v1/health` → `{ status, db }` via `SELECT 1`.                                                                                                                 |
| `apps/web` Calculator component | Button grid, expression/result display, error banner.                                                                                                                   |
| `apps/web` History panel        | List + clear-history button.                                                                                                                                            |
| `apps/web` CalculatorApiService | Typed HTTP via `shared-types`, `catchError` → friendly messages.                                                                                                        |

### UI look & feel

- **Layout:** input-first — large RPN text field + `Evaluate`, big result, history list below.
- **Styling:** plain SCSS, no dependency; CSS custom properties for theming.
- **Vibe:** modern flat / minimal — rounded cards, subtle shadows, neutral palette + single indigo accent.
- **Theme:** light + dark toggle, defaults to `prefers-color-scheme`, choice persisted in localStorage.
- **Helpers:** clickable operator chips (`+ − × ÷ ^ % !`) insert into the input; `Enter` evaluates.
- **Responsive:** single-column, comfortable down to mobile width.
- **RPN help:** inline example/hint (`3 4 +` → 7) near the input — most users don't know RPN.
- **Number formatting:** display rounded (`toPrecision(15)`, trimmed); plain `.` decimal, no grouping.
- **Accessibility (WCAG 2.1 AA):** result = `aria-live="polite"`, error = `role="alert"`; AA contrast in both themes; keyboard nav + visible focus; focus returns to input after a chip click; `aria-label` on symbol chips/theme toggle; `<label>` on input.

---

## 3. Operators & numerics

### Tokenizer grammar

- Whitespace-separated; arbitrary runs of spaces/tabs/newlines collapsed.
- **Glyph normalization** at the boundary: `−`→`-`, `×`→`*`, `÷`→`/` (UI chips insert glyphs).
- Numeric literal regex: optional leading sign, decimals, exponent (e.g. `-3`, `.5`, `3.14`, `1e3`).
- Leading `-`/`+` attached to digits = **negative/positive literal**; a standalone `-` = **binary subtract** (so `-3 !` parses as factorial of −3; `5 3 -` is subtraction).
- Reject `Infinity`, `NaN`, and empty tokens → `MalformedExpressionError`.
- **Non-finite final result** (any op) → error — the catch-all guaranteeing "zero silent errors".

| Op                        | Arity  | Semantics                   | Example         |
| ------------------------- | ------ | --------------------------- | --------------- |
| `+` `−` `×`(`*`) `÷`(`/`) | binary | arithmetic                  | `3 4 +` → 7     |
| `^`                       | binary | exponentiation (`Math.pow`) | `2 10 ^` → 1024 |
| `%`                       | unary  | percentage (`x/100`)        | `75 %` → 0.75   |
| `!`                       | unary  | factorial (float64)         | `7 !` → 5040    |

- **Precision:** pure 64-bit float everywhere. Large factorials (e.g. `20!`) are best-effort float, **not** guaranteed exact (accepted tradeoff — see decision #20).

### Error taxonomy

| Error                      | Triggers                                        | HTTP        |
| -------------------------- | ----------------------------------------------- | ----------- |
| `DivisionByZeroError`      | `5 0 /` (never returns Infinity/NaN)            | 422         |
| `FactorialDomainError`     | negative (`-3 !`) or non-integer (`2.5 !`)      | 422         |
| `OverflowError`            | factorial overflow (`171 !` → Infinity)         | 422         |
| `MalformedExpressionError` | too few/leftover operands, unknown token, empty | 422         |
| validation error           | bad request payload (size/length/type)          | 400         |
| infra/`InternalError`      | persistence failure path, unexpected            | 200\* / 503 |

\* Per decision #51: a **successful computation whose history write fails** returns `200` with the
result + logs the failure + a soft "not saved to history" notice (compute is the core value).

Every error carries a machine-readable `code`: `DIV_BY_ZERO`, `FACTORIAL_DOMAIN`, `OVERFLOW`,
`UNDERFLOW`, `LEFTOVER_OPERANDS`, `UNKNOWN_TOKEN`, `EMPTY`, `VALIDATION`, `INTERNAL`. The UI maps
`code` → friendly copy.

---

## 4. API contract (`/api/v1`)

| Method | Path         | Body                        | Response                                                                                       |
| ------ | ------------ | --------------------------- | ---------------------------------------------------------------------------------------------- |
| POST   | `/calculate` | `{ "expression": "3 4 +" }` | `{ id, expression, result, createdAt, saved }`                                                 |
| GET    | `/history`   | –                           | `HistoryEntry[]` (recent first, **cap 100**, `ORDER BY createdAt DESC, id DESC`; empty → `[]`) |
| DELETE | `/history`   | –                           | `204` (clears all; **idempotent**)                                                             |
| GET    | `/health`    | –                           | `{ status, db }`                                                                               |

- Topology: `setGlobalPrefix('api')` + URI versioning (`v1`). Dev uses Nx `proxy.conf.json`; prod is same-origin reverse-proxy (no CORS).
- Errors: `{ statusCode, error, message, code }` (same shape for 400 & 422; `class-validator` array normalized).

---

## 5. Development approach

- **Agile vertical slices** — each slice is a thin end-to-end increment (UI → API → engine → DB)
  that is independently demoable.
- **TDD** — for every slice: write failing tests at each touched layer (Red) → implement (Green)
  → refactor → commit.
- **Cross-cutting concerns** (error handling, e2e coverage) are built into the slice where they
  first arise, then extended by later slices.
- **Commit cadence** — at least one commit per green slice. Conventional Commits (convention only).

### Definition of Done (per slice)

1. Failing test(s) written first (Red).
2. Every touched layer has tests.
3. `lint` + unit + `build` + e2e green locally.
4. New Playwright flow added for the slice's user-facing behavior.
5. Coverage thresholds not regressed.
6. Relevant docs updated (`PLAN.md` API table / decisions log) in the same change.
7. Accessibility check passes (axe) for any UI change.

---

## 6. Slice backlog (ordered)

| Stage                           | Outcome                                                                                 | Layers touched   | DB      |
| ------------------------------- | --------------------------------------------------------------------------------------- | ---------------- | ------- |
| **E0** Scaffold                 | Nx workspace, `web`+`api`+`shared-types`, Playwright, GitHub Actions; everything builds | all              | –       |
| **S1** Skeleton + addition      | `3 4 +` → result in UI; engine `+` only → **first push**                                | web, api, engine | no      |
| **S2** Arithmetic + div-by-zero | `− × ÷`; `5 0 /` → explicit error in UI                                                 | web, api, engine | no      |
| **S3** History persistence      | MySQL+TypeORM; persist calc; `GET /history`; history panel                              | all + DB         | **yes** |
| **S4** Clear history            | `DELETE /history` + UI button                                                           | web, api         | yes     |
| **S5** Exponentiation           | `2 10 ^` = 1024                                                                         | web, api, engine | yes     |
| **S6** Percentage               | `75 %` = 0.75 (unary)                                                                   | web, api, engine | yes     |
| **S7** Factorial                | `0!`=1; `-3!`/`2.5!`→domain; `171!`→overflow                                            | web, api, engine | yes     |
| **S8** Malformed hardening      | `+ 3`, leftover operands, unknown token, empty → clear errors; UI polish                | web, api, engine | yes     |

Each non-E0 slice also extends the **Playwright** suite to cover its new user-facing flow.

---

## 7. Testing strategy

| Layer        | Tooling                                | Focus                                                                                                             |
| ------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `rpn-engine` | Jest + **fast-check** (property-based) | every operator + every doc edge case + properties (commutativity, monotonicity, round-trips). **~100% coverage.** |
| `api`        | Jest (unit)                            | service/controller logic, error mapping. ~80%.                                                                    |
| `api-e2e`    | Jest + supertest                       | endpoint behavior incl. error envelopes + `shared-types` shape assertions                                         |
| `web`        | Jest (unit)                            | service HTTP/error mapping, component behavior. ~80%.                                                             |
| `web-e2e`    | Playwright + **@axe-core/playwright**  | full browser flows per slice + a11y assertions                                                                    |

Coverage thresholds enforced in CI via Jest `coverageThreshold`. Playwright `retries: 2` in CI (0 local).

---

## 8. CI/CD (GitHub Actions)

On push / PR to `main` (CI only — no CD target in v1):

1. checkout + `setup-node` (reads `.nvmrc`, npm cache) + `npm ci`; restore Nx cache
2. `nrwl/nx-set-shas` → `nx affected -t lint test build`
3. Playwright e2e: cache + `npx playwright install --with-deps chromium`; `webServer` boots api+web
4. From **S3**: **MySQL service container** provisioned; **run TypeORM migrations** against it before e2e; truncate `calculation_history` between specs for isolation
5. Upload Playwright report/traces + coverage as artifacts on failure
6. Security: `npm audit`/Dependabot + CodeQL (JS/TS)

**Branch protection** on `main` (enabled right after the first scaffold push): require lint/test/build/e2e checks; no direct pushes.
Pre-commit: **husky + lint-staged** run lint (+ affected unit tests) locally.

---

## 9. Environment & ops

- Node `v20.20.0`, npm `10.8.2`, MySQL client `9.3.0` (server status TBC before S3).
- Local DB config via `.env` (`DB_HOST/PORT/USER/PASS/NAME`), gitignored; **`.env.example` committed**.
- Config validated at boot (fail-fast) via a `class-validator` schema.
- **Confirm before**: creating the local DB, running migrations, first `git push`.
- Schema via TypeORM **migrations** (no `synchronize`).

### E0 repo hygiene (shipped before first push)

`README` (setup/run/test) · `.env.example` · complete `.gitignore` (`.env`, `node_modules`, `dist`,
`.nx/cache`, `coverage`, `playwright-report`, `test-results`) · `.nvmrc` (`20.20.0`) · `engines` in
`package.json` · `.editorconfig` · `.github/pull_request_template.md` (DoD checklist) ·
Nx module-boundary tags + `@nx/enforce-module-boundaries` (`scope:web`→shared only; `scope:api`→engine+shared; engine/shared→nothing).

---

## 10. Approved dependencies

Nx: `@nx/angular`, `@nx/nest`, `@nx/js`, `@nx/playwright` ·
Backend: `@nestjs/typeorm`, `typeorm`, `mysql2`, `@nestjs/config`, `class-validator`, `class-transformer` ·
E2E: `@playwright/test` · Angular via `@nx/angular` ·
Dev/test: `fast-check`, `@axe-core/playwright`, `husky`, `lint-staged`.

**Hand-rolled instead of a dep:** rate limiting (vs `@nestjs/throttler`), security headers (vs `helmet`),
health check (vs `@nestjs/terminus`), config validation (reuses `class-validator`, not `Joi`),
API docs (PLAN table, not `@nestjs/swagger`).

No dependency outside this list is added without asking.

---

## 11. Out of scope (v2+)

Authentication / accounts, scientific functions, graphing, arbitrary-precision arithmetic, mobile-native apps, voice/NLP input.
