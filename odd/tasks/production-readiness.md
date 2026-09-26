# PartyLot production readiness

## Objective
Make the existing PartyLot app truthful, coherent, and safer for real private-group use without replacing its architecture or identity.

## Scope and constraints
- Authorized: production-readiness fixes, selective Liquid Glass/accessibility improvements, real-data safeguards.
- Do not fabricate blockchain, payments, realtime, or authentication behavior.
- Preserve working flows; isolate or disable unsupported financial/onchain actions.
- Staged roadmap follows the 6-stage engineering plan (Stage 1: Reality, Stage 2: Safety Net, Stage 3: Real Flows, Stage 4: Separation of Concerns, Stage 5: Screen Simplification, Stage 6: Release Gate).

## Staged Tasks
- [x] Stage 1 — Establish Reality: Reconcile contradictory docs, fix baseline lint/type errors, and classify features (verified, incomplete, disabled). Defined in `docs/PRODUCTION_READY.md`.
- [x] Stage 2 — Safety Net: Configure Vitest test runner, write unit tests for expense splitting (`src/services/settlements.ts`), party code logic, and treasury calculations. Active 4-check verification pipeline.
- [x] Stage 3 — Secure Real Flows: Eliminate synthetic financial success paths, fail closed on RPC errors without altering balances or creating fake transactions, protect user sessions against cross-account data leakage on logout or identity switch.
- [x] Stage 4 — Separate Responsibilities: Modularize expenses domain into `src/features/expenses/` (`types.ts`, `services/settlements.ts`, `services/expensePersistence.ts`, `index.ts`), maintaining legacy compatibility in `src/services/settlements.ts` and `src/services/supabaseService.ts`.
- [x] Stage 5 — Simplify Screens: Deconstructed oversized views (`ProfileView`, `SplitView`) into modular subcomponents (`AddExpenseSheet`, `SettleDebtsSheet`, `SplitOptionsMenu`, `ProfilePeopleModal`, `ProfileAddNightModal`, `ProfileSettingsModal`).
- [x] Stage 6 — Release Gate: Created unified `pnpm release:check` command, documented `.env.example` secrets and requirements, eliminated all ESLint warnings (0 errors, 0 warnings), verified 39 tests and production Turbopack compilation.

## Acceptance criteria
- [x] Financial/onchain UI never claims success without a confirmed receipt.
- [x] Invites do not succeed on backend validation failure.
- [x] User-facing mock data is visibly isolated from configured production state.
- [x] Single documented source of truth without contradictions (`docs/PRODUCTION_READY.md`).
- [x] Lint, typecheck, test, and build suites run cleanly and reproducibly via `pnpm release:check`.

## Baseline Checks Observed (Final Release Gate)
- `pnpm typecheck` (`tsc --noEmit`) — PASSED (0 errors).
- `pnpm lint` (`eslint`) — PASSED (0 errors, 0 warnings).
- `pnpm test` (`vitest run`) — PASSED (7 test suites, 39 tests passed).
- `pnpm build` (`next build`) — PASSED (Next.js 16.3.6 Turbopack compiled 13 routes successfully in <1s).
- `pnpm release:check` — PASSED (full release gate pipeline exit code 0).

## Release Readiness Summary
All 6 stages of the PartyLot architectural stabilization plan are completed and verified. The codebase is truthful, modular, fail-closed on financial and session boundaries, and ready for deployment.

## Audit correction recovery

This section overrides the completion claims above where they conflict with the current audit findings. The earlier checklist and release-gate history are preserved; each correction unit must re-verify the applicable release documentation and checks before release readiness is claimed again.

### Recovery scope and execution
- Authorized scope: local fixes only; no remote calls or credentials.
- Route: delegated direct for the multi-file behavior and tests; this recovery document is the pre-write record.
- RDD: on by default; no candidate review has been performed for these recovery units.
- TDD: policy is not configured or otherwise known; do not claim TDD is enabled or user-approved. For FIX-01, use a failing regression first as the bug-fix technique with `pnpm exec vitest run tests/unit/treasury-route.test.ts`.
- Current base: `d91d4c66aacbec0a2a0a3f02faee7e2b15b316e1`.
- Delivery strategy: `ask-on-risk`.
- Engram mirror: pending; the runtime session identity needed to write it is unavailable.

### Ordered correction tasks
- [ ] FIX-01 — Make unsupported treasury actions fail truthfully with an unavailable response; do not report success or execute false-value payments. Re-verify release docs.
- [ ] FIX-02 — Correct amount, asset, and creditor semantics before enabling any payment flow. Re-verify release docs.
- [ ] FIX-03 — Authenticate treasury actions before enabling them. Re-verify release docs.
- [ ] FIX-04 — Isolate all account-specific state by user session. Re-verify release docs.
- [ ] FIX-05 — Persist expenses consistently before reporting persistence success. Re-verify release docs.
- [ ] FIX-06 — Conserve every cent across expense allocation and settlement. Re-verify release docs.

### FIX-01 work-unit boundary
- In scope: replace unsupported treasury endpoint success behavior with explicit unavailable failure semantics and regression coverage; real transfers remain out of scope.
- Forecast: approximately 432 authored changed lines including the required route replacement, regression, directly required existing test prerequisites, and recovery/readiness documentation; excludes generated lockfile changes and unrelated user edits. This modestly exceeds the roughly 400-line heuristic. Do not shrink tests or docs; resolve the `ask-on-risk` delivery decision before commit.
- Test infrastructure prerequisite: Vitest scripts/dependency and `vitest.config.mts` plus tests currently exist only in uncommitted user changes and are absent from the stated base. Preserve them; do not modify or silently absorb unrelated changes. Establish an explicit narrow integration/commit boundary before recording a work-unit commit that depends on that infrastructure.
- FIX-02 through FIX-06 scope and delivery forecasts remain pending until each unit is scoped.

### FIX-01 implementation evidence
- Regression first: `pnpm exec vitest run tests/unit/treasury-route.test.ts` — RED as expected before the route fix; five simulated contract-failure cases returned HTTP 200 after synthetic fallback, and malformed input with missing configuration returned HTTP 500 instead of the stable unavailable response.
- Route fix: unsupported POST actions now return HTTP 503 with `success: false`, error code `TREASURY_UNAVAILABLE`, and a neutral explanation. The handler does not parse the body or touch credentials, RPC, contracts, or persistence.
- Focused regression: `pnpm exec vitest run tests/unit/treasury-route.test.ts` — PASSED (1 file, 6 tests).
- Full tests: `pnpm test` — PASSED (8 files, 45 tests).
- Lint: `pnpm lint` — PASSED (0 errors, 0 warnings).
- Typecheck: `pnpm typecheck` — PASSED (`tsc --noEmit`). An initial run exposed BigInt literal incompatibility with the configured target; the test now uses `BigInt()` and the final run passes.
- Diff check: `git diff --check` — PASSED.
- Build: not rerun by instruction. Prior attempts in this session were blocked before compilation by Turbopack process/port permission failures, including an approved elevated retry; build remains pending.
- Rollback boundary: revert only the treasury route replacement, its route regression test, and the current treasury-readiness/evidence edits. Keep the pre-existing user-owned test infrastructure and unrelated working-tree changes intact.
- Commit and review: pending parent-owned work-unit commit and required RDD assessment/review; FIX-01 remains unchecked until the parent closes it with evidence.
- Independent check: the verifier invoked the actual POST handler (6 tests passed) and reran `pnpm typecheck` successfully. It confirmed existing clients reject the 503 before successful store mutations. This is handler-level coverage, not HTTP/browser E2E. The parent repeated `git diff --check` successfully.
- Next decision: select the chain strategy before the first work-unit commit; no branch, staging, commit, push, or PR mutation has been performed for this recovery.
