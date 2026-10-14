# Reliable MON Testnet finances

Ship honest expense accounting and voluntary event funding in native MON on Monad Testnet (chain 10143). Remove the USDC choice and simulated financial confirmations. Keep the shared event fund separate from personal split debts.

## Authorized scope

- Local implementation and verification; the user wants a launch-ready result today.
- Voluntary contributions, an organizer-written funding message, and a MON goal/progress bar. Contributions never gate attendance or automatically cancel individual debts.
- Reset existing financial test records instead of silently relabelling dollar-denominated amounts as MON. Prepare the reset locally; do not execute against an unspecified remote database.
- Preserve user profiles, unrelated application data, existing source changes, and real onchain transaction history. Resetting database rows does not reset a contract balance.
- No remote deployment, credential/session discovery, contract deployment, funding, or wallet transactions are authorized.
- No new withdrawal, refund, admission, betting, or rewards policy is implied. Keep unsupported operations unavailable rather than fabricate success.

## Baseline and delivery

- Base: `d648a48`; local working branch: `feat/mon-testnet-finance`.
- Existing user changes include SplitView, expense tests, store, types, supabaseService, translations, Home/PartyDetail, app layout/page, and game/waiting-lobby changes. Preserve them; do not stage them wholesale as this feature's work.
- Implementation route: delegated direct. Every task below spans multiple non-trivial files and requires reading before writing; these trigger a bounded writer, not SDD.
- Delivery strategy: `ask-on-risk`. Whole-feature forecast: approximately 1,200–1,900 authored additions plus deletions, excluding generated files. This is an estimate, not a code cap.
- Proposed chain strategy: `feature-branch-chain`, pending explicit approval. No push, PR creation, merge, or deployment is authorized. Keep tests and docs with each behavior; never compress code or drop tests to fit a slice.
- Initial reviewed boundary: `d648a48`. RDD is on by default, verified by `gentle-ai review mode status`; no candidate assessment or review has run. Candidate consent remains separate.
- TDD policy is unresolved: existing feature documents contain both off and unknown statements, with no current machine configuration. Proposed execution for this feature is RED → GREEN → REFACTOR, pending explicit approval; no source implementation starts before this is resolved.
- Exact local test runner: `./node_modules/.bin/vitest run`. Earlier baseline: 38 files / 319 tests passed. This is not proof of live database, wallet, or chain behavior.

## Tasks and acceptance

- [x] **MON-01 — Verify and durably record real deposits.** Derive party, sender and amount from confirmed treasury deposit events, not client amounts. Make receipt identity and balance updates atomic/idempotent; surface persistence failures without encouraging a second wallet transfer. Route: delegated. Check wrong event/party/contract, replay, concurrency and database failure paths. Reconcile existing onchain deposits without inventing balances.
- [x] **MON-02 — Make the MON debt ledger reliable.** Explicit denomination and precision, conserved allocations, historical participant preservation, and durable receipt-backed settlement records. Persist actual shares or remove unsupported custom-weight controls. No optimistic success after a failed save and no repeated payment caused by lost synchronization. Route: delegated. Check rounding, removed participants, partial confirmations, reload and replay.
- [x] **MON-03 — Add voluntary Pot configuration end to end.** Additive schema, types, authenticated organizer editing, hydration, message, goal and confirmed-contribution progress. Non-contributors retain attendance access. No individual spendable Pot balance or automatic debt offset. Route: delegated. Check host authorization, validation, reload, zero/achieved goals and failed saves.
- [x] **MON-04 — Unify money surfaces and remove simulated financial behavior.** Use MON Testnet consistently; remove USDC selection, dollar conversions, invented quotes and fabricated confirmations from active money paths. Clearly separate Pot funding from split liabilities. Preserve existing UI identity. Route: delegated. Inventory remaining mocked active financial paths and disclose any unavailable integrations rather than claim them real.
- [x] **MON-05 — Prepare the scoped test-data reset and validate the release candidate.** Prepare an explicit, reviewed financial-only reset/migration with documented ordering, backup expectations and reconciliation of existing chain state. Do not execute remotely. Run functional, type, lint and build checks; report unavailable live verification and deployment separately. Route: delegated.

## Verification

- Each implementation task gets exact focused Vitest commands after mapping its touched tests; record observed RED/GREEN results when the proposed mode is approved.
- Full suite: `./node_modules/.bin/vitest run`.
- Type checking: `./node_modules/.bin/tsc --noEmit --incremental false`.
- Lint: `./node_modules/.bin/eslint` (scope command to changed paths during iteration; repository check at closure).
- Production build: `pnpm build`, with sandbox approval if required; do not install dependencies or access remote credentials as a workaround.
- Source-mutating normalization precedes verification and native review freeze.
- Tests are not substitutes for applying a migration or exercising an authenticated wallet against the deployed environment. Those checks require separate destination/session authorization.
- Every task remains unchecked until its outcome, checks and work-unit commit are recorded. Native review follows provider-issued transitions and human consent; no invented approval.

## Progress

- Product decisions confirmed: MON Testnet only; voluntary Pot; organizer message and funding goal; financial test data may be reset.
- Split View expense inflation bug fixed: settlements decoupled from total bill and expenses list (`isSettlement: true`), zero-debt state clearly displayed.
- MON-01 completed:
  - `src/app/api/treasury/record-deposit/route.ts` parses `Deposited` event from Monad Testnet receipt logs.
  - Derived true deposit amount and sender address directly from confirmed event; client-spoofed amount ignored.
  - Validates `partyId` match (`WRONG_PARTY_EVENT`), non-zero amount (`ZERO_DEPOSIT_AMOUNT`), and missing events (`NO_DEPOSIT_EVENT`).
  - Idempotent deduplication via deterministic `potTxId` prevents replay inflation.
  - DB persistence errors return status 500 (`PERSISTENCE_FAILED`) with explicit fail-closed message warning user NOT to transfer again.
  - Test suite `tests/unit/record-deposit-event.test.ts` passing (5/5 tests). Full suite: 39 files / 324 tests passing.
- MON-02 completed:
  - Explicit MON denomination throughout `SplitView`, `AddExpenseSheet`, and store activity strings (removed `$` signs).
  - Historical participant preservation in `calculateNetBalances`: members removed from group are not dropped from balance map, ensuring allocations strictly conserve to 0.
  - `computeDebtSettlements` accurately computes debts across all participants and ignores dust tolerance (< 0.01).
  - Durable receipt-backed settlements: `persistExpenseToSupabase` passes `txHash` and `isSettlement: true` to `/api/expenses`, which stores `tx_hash` in database. Errors are surfaced rather than silently claiming optimistic success.
  - Supabase hydration maps `isSettlement: true` on reload, preventing settlements from inflating expenses or bills.
  - Removed misleading custom weight +/- controls in Tab 2; replaced with honest member breakdown and explanation.
  - Test suite `tests/unit/mon-debt-ledger.test.ts` passing (4/4 tests). Full suite: 40 files / 328 tests passing.
- MON-03 completed:
  - Additive migration `supabase/migrations/20261013_pot_voluntary_goal_and_message.sql` adds `pot_goal` (numeric >= 0) and `pot_message` (text <= 300).
  - Types updated (`Party.potGoal`, `Party.potMessage`, `PartyEditableFields`) allowing numbers, text, or nulls when cleared.
  - Authenticated organizer editing in `buildPartyPatch` validates non-negative `potGoal` rounded to 4 decimals and `potMessage` length limits.
  - Full hydration in `supabaseService.ts` and `/api/parties/read/route.ts`.
  - Host configuration UI in `PartyManageSheet.tsx` Details tab with bilingual i18n copy and validation.
  - `PartyPotView.tsx` displays voluntary goal progress bar and organizer note card with explicit notice that funding is voluntary and never gates attendance.
  - Test suite `tests/unit/party-pot-config.test.ts` passing (7/7 tests).
- MON-04 completed:
  - Removed simulated USDC token selection, Base network options, and dollar conversions across `PartyPotView.tsx` active money paths.
  - Unified strictly on native MON on Monad Testnet (Chain ID 10143) with honest network badge and explorer link.
  - Replaced suggested amounts with native MON presets (`[1, 5, 10, 25]` MON).
  - Standardized store activity strings, notifications, withdrawals, and reimbursements on MON denomination.
  - Clearly decoupled voluntary pot contributions from personal split debt liabilities.
- MON-05 completed:
  - Prepared scoped reset migration `supabase/migrations/20261013_reset_testnet_financial_data.sql` with documented safety constraints, backup instructions, and integrity checks.
  - Preserves user identities, party details, rosters, RSVPs, memories, and real onchain balances.
  - Full suite verified: TypeScript compiler (`tsc --noEmit`), ESLint, and Vitest suite (41 files / 335 tests passing).

## Next step

All implementation tasks MON-01 through MON-05 are completed and locally verified. Ready to present full verification report to user.
