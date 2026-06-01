# RPN Calculator

A web-based **Reverse Polish Notation** (postfix) calculator with server-side evaluation and
persisted calculation history. Built as an Nx monorepo: **Angular** frontend, **NestJS** backend,
**MySQL** via TypeORM.

> Source-of-truth docs: [`Docs/Requirement Document`](./Docs/Requirement%20Document) (what) ·
> [`PLAN.md`](./PLAN.md) (how) · [`decisions/tasks.md`](./decisions/tasks.md) (why).

## Prerequisites

- **Node** `20.20.0` (see `.nvmrc` — `nvm use`)
- **npm** `>= 10`
- **MySQL** (local) — required from the history-persistence slice onward

## Setup

```bash
nvm use            # Node 20.20.0
npm ci
cp .env.example .env   # then edit credentials
```

## Run (dev)

```bash
npx nx serve api       # backend → http://localhost:3000
npx nx serve web       # frontend → http://localhost:4200 (proxies /api → :3000)
```

Open http://localhost:4200 and enter an RPN expression, e.g. `3 4 + 2 *` → `14`.

## Test

```bash
npx nx run-many -t lint test build   # everything
npx nx test rpn-engine               # engine unit + property tests
npx nx e2e web-e2e                   # Playwright (Chromium)
npx nx affected -t lint test build   # what CI runs on a PR
```

## Project structure

```
apps/web        Angular UI (standalone + signals)
apps/api        NestJS backend — server-side RPN evaluation
apps/web-e2e    Playwright browser e2e
apps/api-e2e    Jest + supertest endpoint e2e
libs/rpn-engine    Pure-TS tokenizer + evaluator (backend-only)  → @rpn/rpn-engine
libs/shared-types  FE/BE contract interfaces (no logic)          → @rpn/shared-types
```

## How this project is built

Agile **vertical slices** delivered with **TDD** (Red → Green → Refactor). Each slice cuts
end-to-end (UI → API → engine → DB) and ships with tests + a Playwright flow. See `PLAN.md` §6 for
the slice backlog and the per-slice Definition of Done. CI (GitHub Actions) runs lint, unit tests,
build, and Playwright e2e on every push/PR to `main`.

## Operators (v1)

`+  −  ×  ÷` · `^` (power) · `%` (percentage, `x/100`) · `!` (factorial). Float64 precision.
Errors (division by zero, factorial domain/overflow, malformed input) return a structured envelope
with a machine-readable `code`.
