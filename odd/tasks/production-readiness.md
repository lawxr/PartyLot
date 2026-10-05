# PartyLot production readiness

## Objective
Make the existing PartyLot app truthful, coherent, and safe for real private-group use without replacing its architecture or identity. The current launch audit found material treasury-authorization, privacy, settlement-accounting, and integration gaps; this feature remains open until the ordered corrections below are implemented and verified.

## Scope and constraints
- Authorized: fixes for the current market-readiness audit, including treasury authorization, private data access, party/expense membership boundaries, settlement accounting, supported chain/asset consistency, and indexer/E2E correctness.
- Do not fabricate blockchain, payments, realtime, or authentication behavior.
- Preserve legitimate user-wallet flows; prohibit server-funded transfers and fail closed when authorization evidence is missing.
- No remote calls, credentials, deployment, push, PR, or merge in this local remediation.
- Existing six-stage roadmap below is historical completion evidence, not proof that the current audited build is release-ready.

## Staged Tasks
- [x] Stage 1 — Establish Reality: Reconcile contradictory docs, fix baseline lint/type errors, and classify features (verified, incomplete, disabled). Defined in `docs/PRODUCTION_READY.md`.
- [x] Stage 2 — Safety Net: Configure Vitest test runner, write unit tests for expense splitting (`src/services/settlements.ts`), party code logic, and treasury calculations. Active 4-check verification pipeline.
- [x] Stage 3 — Secure Real Flows: Eliminate synthetic financial success paths, fail closed on RPC errors without altering balances or creating fake transactions, protect user sessions against cross-account data leakage on logout or identity switch.
- [x] Stage 4 — Separate Responsibilities: Modularize expenses domain into `src/features/expenses/` (`types.ts`, `services/settlements.ts`, `services/expensePersistence.ts`, `index.ts`), maintaining legacy compatibility in `src/services/settlements.ts` and `src/services/supabaseService.ts`.
- [x] Stage 5 — Simplify Screens: Deconstructed oversized views (`ProfileView`, `SplitView`) into modular subcomponents (`AddExpenseSheet`, `SettleDebtsSheet`, `SplitOptionsMenu`, `ProfilePeopleModal`, `ProfileAddNightModal`, `ProfileSettingsModal`).
- [x] Stage 6 — Release Gate: Created unified `pnpm release:check` command, documented `.env.example` secrets and requirements, eliminated all ESLint warnings (0 errors, 0 warnings), verified 39 tests and production Turbopack compilation.

## Historical acceptance criteria (prior stabilization phase)
- [x] Financial/onchain UI never claims success without a confirmed receipt.
- [x] Invites do not succeed on backend validation failure.
- [x] User-facing mock data is visibly isolated from configured production state.
- [x] Single documented source of truth without contradictions (`docs/PRODUCTION_READY.md`).
- [x] Lint, typecheck, test, and build suites run cleanly and reproducibly via `pnpm release:check`.

## Historical baseline checks (prior stabilization phase; not current audit proof)
- `pnpm typecheck` (`tsc --noEmit`) — PASSED (0 errors).
- `pnpm lint` (`eslint`) — PASSED (0 errors, 0 warnings).
- `pnpm test` (`vitest run`) — PASSED (7 test suites, 39 tests passed).
- `pnpm build` (`next build`) — PASSED (Next.js 16.3.6 Turbopack compiled 13 routes successfully in <1s).
- `pnpm release:check` — PASSED (full release gate pipeline exit code 0).

## Current release status
**Not release-ready.** The current market audit supersedes the earlier readiness claim. The prior stages, acceptance checklist, and check results are retained above as history only; they do not close the new audit findings.

## Market-readiness correction plan

### Execution contract
- Feature identity: `production-readiness`; this plan supersedes the earlier FIX-01–FIX-06 recovery list and its completion evidence. Those fixes are not assumed present or valid at the current base.
- Audited base: `648244bb14e89d21b893b0c46999004ac0a14b2e`; working branch: `fix/market-readiness`.
- Route: delegated direct, one bounded implementation task per work unit; keep each task's tests with its behavior.
- TDD policy: unknown/not configured in the inspected project/session artifacts. Do not claim strict TDD is enabled; write a failing regression first where practical as a technique, not as a policy claim.
- Test runner: Vitest (`pnpm test`, `pnpm exec vitest run <focused paths>`). Existing current-baseline report: 64 tests, typecheck, lint, and build pass; not rerun while preparing this plan.
- RDD: observed by the parent as on (default); no review was run for this planning-only document edit. For each later committed work unit, the parent must assess and follow native RDD/consent rules; do not treat this plan or a checkbox as review authority.
- Delivery strategy: `auto-chain`; the user selected `feature-branch-chain` as the chain strategy. Keep PRs, push, merge, and deployment out of this local remediation. Forecast is preliminary, roughly 1,400–2,100 authored changed lines across all units (migrations/tests included; generated files excluded); therefore plan cohesive child slices below roughly 400 changed lines and reforecast from actual commits. Never reduce tests or docs to meet the heuristic.
- Engram mirror: pending until the parent saves and reads back the mirror; this document is not mirrored yet.
- Estimated task sizes are planning ranges, not caps. If a task cannot fit without artificial splitting or removing proof, record the honest overage and report it before delivery.

### Ordered work units

- [ ] MKT-01 — Stop relayer-funded user-obligation transfers and fail closed on host authorization (forecast 120–220 authored lines). In scope: disable relayer/server-signer-funded deposits or debt settlements for user obligations; fail closed when host/action authorization lookup is missing, errors, or mismatches. Do not prohibit authorized host-only pot distributions: retain them only with fail-closed database authorization checks. Preserve the connected-user-wallet path for a later independently tested unit. Add service/API regressions for denied and authorized boundaries. Checks: `pnpm exec vitest run tests/unit/treasury.test.ts tests/unit/treasury-route.test.ts` (add the route test if absent), then `pnpm typecheck`. Rollback: only treasury action/service changes and their focused tests. Never add a relayer-funded fallback for user obligations.

#### MKT-01 implementation evidence (parent closeout pending)

- Route: delegated direct (parent delegated this worker) for one bounded root-cause fix; route and regression tests were mapped by CodeGraph. No subdelegation, staging, commit, or review was performed by the worker.
- Host authority: `parties.host_id` is populated from the verified Privy identity during party creation. Registration uses the verified Privy wallet attached to that same actor; caller-supplied `recipientAddress` is ignored for registration.
- Regression-first RED: the initial route test run failed 9 of 16 cases, reproducing sponsored deposit/settle execution, pre-auth config ordering, fail-open host lookups, and caller-spoofed register host.
- Parent readback follow-up RED: adding a test-mode missing-token case and amount-free host rollover produced one failing rollover regression (the handler called `parseEther('NaN')`); removed the test-only authentication bypass and skipped MON amount parsing for register/rollover.
- Implementation: relayer deposit and debt-settle return `503 ACTION_UNAVAILABLE` before key parsing/signing, chain RPC, or persistence. Missing-token calls return 401 in every environment before signer configuration. Reward/reimbursement/spend/rollover/register now require a verified host identity, existing non-empty `host_id`, and a successful Supabase lookup; lookup errors/throws/missing host return 503, identity mismatch returns 403. Registration uses only the verified host wallet, and regular actions no longer auto-register an unregistered party from request-controlled addresses. Onchain registration lookup failures fail closed. Native MON amount conversion is skipped for register and rollover, whose contract calls do not use a payable value; amount-free host rollover requests therefore reach the contract call. Success requires a confirmed successful transaction receipt; failed/unconfirmed receipts are not recorded as success.
- Focused: `pnpm exec vitest run tests/unit/treasury.test.ts tests/unit/treasury-route.test.ts` — PASSED (2 files, 28 tests).
- Full tests: `pnpm test` — PASSED (10 files, 75 tests).
- Typecheck: `pnpm typecheck --incremental false` — first exposed a test-helper header type mismatch; after correcting the helper, PASSED (`tsc --noEmit --incremental false`).
- Lint: `pnpm lint` — PASSED.
- Build: `pnpm build` — PASSED (Next.js 16.3.6 production compilation and TypeScript checks completed).
- Diff check: `git diff --check` — PASSED (after evidence update).
- Rollback boundary: revert only `src/app/api/treasury/action/route.ts`, `tests/unit/treasury-route.test.ts`, and this MKT-01 evidence subsection; leave historical appendix and other work untouched.
- Mirror: Engram observation #677 is the pre-unit baseline; parent must sync and read back this updated full task document. MKT-01 remains unchecked until parent records the work-unit commit and required review outcome.

- [ ] MKT-02 — Close public and incomplete Supabase row-access policies (forecast 180–320 lines). In scope: replace public row visibility with authenticated party/member-scoped reads and explicit write policies for `activities`, `party_memories`, and `game_sessions`; include the latest public-SELECT exposure in the migration/test matrix. Prove anonymous and unrelated users cannot read/write another party's rows and legitimate members retain intended access. Checks: focused SQL/policy regression available in the project, then `pnpm test`; record any unavailable hosted-Supabase integration proof rather than implying it ran. Rollback: only the new migration and its directly coupled policy tests/docs; do not drop unrelated historical migrations.
- [ ] MKT-03 — Bind party creation and expense writes to authenticated party membership (forecast 180–300 lines). In scope: reject arbitrary party-ID/host spoofing on party upsert; validate the authenticated actor, party membership, payer identity, and split membership before accepting an expense. Keep RLS as defense in depth. Add negative cross-party/spoof tests and a valid-member regression. Checks: focused expense/API tests, `pnpm test`, `pnpm typecheck`. Rollback: only affected party/expense write boundaries and tests.
- [ ] MKT-04 — Remove first-deposit host preclaim and make refunds conserve the remaining pot (forecast 180–320 lines). In scope: bind contract pot ownership to the canonical party host authority and ensure sequential pro-rata refunds cannot shrink a fixed denominator incorrectly; test equal 10+10 contributions (both claimants receive 10 from 20), partial-spend cases, and claim order. First identify whether PartyRegistry is the canonical host authority; if code does not establish one, pause and ask the parent rather than inventing a new product/identity rule. Checks: contract unit suite plus `pnpm test`; document deployment/migration implications before enabling the changed contract. Rollback: only contract accounting/registration changes and contract tests.
- [ ] MKT-05 — Align the connected-wallet settlement flow with one supported chain/asset and carry its bearer token (forecast 180–300 lines). In scope: no client/server token or chain mismatch; authenticated treasury requests must include the expected bearer token; only enable actions whose asset, network, amount, and creditor semantics match the actual contract. Preserve a safe unavailable state when support is incomplete. Confirm the canonical launch asset/network from repository configuration; pause for the parent if that conflicts with product intent. Checks: focused treasury and UI tests, `pnpm test`, `pnpm typecheck`; wallet/E2E proof only with a real non-secret test setup. Rollback: only the settlement client/service/UI alignment and its tests.
- [ ] MKT-06 — Support all valid debt settlements without partial-success ambiguity (forecast 150–260 lines). In scope: remove the current one-settlement-only rejection while ensuring each transfer is individually authorized and UI/store state changes only after its own confirmed receipt; make retry/partial outcomes explicit and prevent duplicate settlement. Test zero, one, and multiple creditors, failures mid-batch, and repeated submission. Checks: focused settlement/store tests, `pnpm test`, `pnpm typecheck`. Rollback: only settlement iteration/result handling and tests.
- [ ] MKT-07 — Make indexer state complete and E2E authentication representative (forecast 220–380 lines). In scope: index every supported settlement and related audited financial event without silently omitting activity; replace test-only injected auth/store shortcuts with an end-to-end path that exercises actual request authentication and membership checks. Add a regression for more than one settlement and missing/invalid bearer credentials. Checks: indexer-specific test/build command identified from its checked-in tooling, `pnpm test`, and `pnpm test:e2e` when its required local services are available; record unavailable environment proof honestly. Rollback: only affected indexer handlers/types and E2E harness/auth fixtures.

### Feature acceptance and closeout
- [ ] No unauthenticated or non-host request can spend, mutate, or disclose private party data.
- [ ] Valid member writes and user-wallet settlements operate only on the explicitly supported asset/network and never use a server signer to fund users.
- [ ] Party creation/expense ownership is enforced at both application and database policy boundaries.
- [ ] Contract host authority cannot be preclaimed, and refunds conserve the distributable balance across claim order and partial spend.
- [ ] Multiple supported debts settle with receipt-scoped state transitions; indexer and E2E coverage reflect the actual supported flow.
- [ ] Re-run and record `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before restoring any release-ready claim. Run `pnpm test:e2e` only when the required test services/fixtures are available, and report its status explicitly.
- [ ] Parent records each work-unit commit identity, focused and full-check results, rollback boundary, and native RDD assessment/review outcome before checking that task complete.

## Historical appendix: superseded FIX-01–FIX-06 recovery record

The following is preserved verbatim from the prior recovery plan as historical evidence only. It predates the current audit base and is not proof that these fixes exist or remain valid. The MKT-01–MKT-07 plan above is authoritative; do not execute the stale FIX checklist or reuse its old base, delivery strategy, forecasts, or check results as current evidence.

## Audit correction recovery

This section overrides the completion claims above where they conflict with the current audit findings. The earlier checklist and release-gate history are preserved; each correction unit must re-verify the applicable release documentation and checks before release readiness can be claimed again.

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
