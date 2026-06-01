## What & why

<!-- Which slice / change is this, and what user-facing outcome does it deliver? -->

## Definition of Done (per slice)

- [ ] Failing test(s) written first (Red → Green → Refactor)
- [ ] Every touched layer has tests (engine / api / web as applicable)
- [ ] `npx nx run-many -t lint test build` is green locally
- [ ] New/updated Playwright e2e flow for the user-facing behavior
- [ ] Coverage thresholds not regressed
- [ ] Accessibility check passes (axe) for any UI change
- [ ] Docs updated in this PR if anything changed (`PLAN.md` API table / `decisions/tasks.md`)

## Notes

<!-- Edge cases, follow-ups, anything reviewers should know. -->
