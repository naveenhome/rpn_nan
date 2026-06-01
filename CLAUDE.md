<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

---

# RPN Calculator — Project Guide

A web-based Reverse Polish Notation calculator. **Read these first** — they are the source of truth:

- `Docs/Requirement Document` — _what_ to build
- `PLAN.md` — _how_ we build it (architecture, API contract, slice backlog, testing/CI)
- `decisions/tasks.md` — _what was decided & why_ (numbered decision log)

## Workspace layout

| Project        | Path                | Purpose                                                                                   |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `web`          | `apps/web`          | Angular UI (standalone + signals). Calls relative `/api` (dev proxy → `:3000`).           |
| `api`          | `apps/api`          | NestJS backend — **all RPN evaluation happens here**.                                     |
| `rpn-engine`   | `libs/rpn-engine`   | Pure-TS tokenizer + stack evaluator. **Imported only by `api`.** Alias `@rpn/rpn-engine`. |
| `shared-types` | `libs/shared-types` | Request/response contract interfaces. Alias `@rpn/shared-types`. No logic.                |
| `web-e2e`      | `apps/web-e2e`      | Playwright browser e2e (Chromium-only).                                                   |
| `api-e2e`      | `apps/api-e2e`      | Jest + supertest endpoint e2e.                                                            |

## Common commands

```bash
npx nx serve api            # backend on :3000
npx nx serve web            # frontend on :4200 (proxies /api → :3000)
npx nx test <project>       # Jest unit tests
npx nx e2e web-e2e          # Playwright e2e
npx nx run-many -t lint test build
npx nx affected -t lint test build   # what CI runs
```

## How we work (non-negotiable)

- **Agile vertical slices + TDD.** Write the failing test(s) first, implement to green, refactor, commit. See the slice backlog in `PLAN.md` and the per-slice Definition of Done.
- **Server-side evaluation only.** The web app must never import `rpn-engine`. Module boundaries are enforced by `@nx/enforce-module-boundaries` (tags `scope:web|api|shared`, `type:engine`).
- **Defensive everywhere.** Validate inputs (DTOs/reactive forms), wrap risky ops, return the structured error envelope `{ statusCode, error, message, code }` with a machine-readable `code`.
- **Numbers are float64.** No arbitrary precision.
- **Hand-roll over dependencies.** Never add a package without asking. Rate limiting, security headers, health check, config validation, and API docs are deliberately hand-rolled.
- **Accessibility = WCAG 2.1 AA** for any UI change (aria-live result, role=alert errors, contrast, focus).
- **Confirm before**: creating/migrating the local MySQL DB, and the first `git push`.

## Conventions

- Comments explain _why_, not _what_; types carry the weight. No JSDoc on private helpers.
- Conventional Commits (`feat(engine): …`, `test(api): …`).
- Strong typing; avoid `any`. Reactive forms; RxJS pipe operators over nested subscriptions.
