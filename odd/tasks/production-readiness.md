# PartyLot production readiness

## Objective
Make the existing PartyLot app truthful, coherent, and safer for real private-group use without replacing its architecture or identity.

## Scope and constraints
- Authorized: production-readiness fixes, selective Liquid Glass/accessibility improvements, real-data safeguards.
- Do not fabricate blockchain, payments, realtime, or authentication behavior.
- Preserve working flows; isolate or disable unsupported financial/onchain actions.
- Route: delegated direct (audit required 4+ files; implementation spans multiple non-trivial files).
- TDD: unknown; project has no test script. Run lint/build and focused runtime checks where feasible.
- Delivery strategy: ask-on-risk; forecast exceeds one work unit, so commits remain coherent slices.

## Tasks
- [ ] PR-01 — Remove fabricated onchain/financial success paths; show truthful unavailable states. Route: delegated. Trigger: multi-file Web3/store/view changes.
- [ ] PR-02 — Make invite and identity state fail closed outside explicit demo mode; prevent silent mock-state persistence. Route: delegated. Trigger: multi-file data/auth changes.
- [ ] PR-03 — Fix high-impact navigation/accessibility and restrained glass-system gaps. Route: delegated. Trigger: multiple UI files.
- [ ] PR-04 — Verify lint/build and core local flows; document environment-limited checks. Route: delegated. Trigger: execution.

## Acceptance criteria
- Financial/onchain UI never claims success without a confirmed receipt.
- Invites do not succeed on backend validation failure.
- User-facing mock data is visibly isolated from configured production state.
- No profile navigation dead-end; zoom/selection restrictions removed.
- Lint/build results recorded honestly.

## Progress
Audit complete: synthetic transaction receipts, permissive RLS, insecure invite fallback, mocked identity and local persistence were confirmed.

PR-01 implementation is present but remains unchecked pending required verification. Financial action UI entry points are disabled and explain that payments are unavailable; store mutations for contributions, spending, rollover, settlement, and payouts are inert; treasury service calls now fail with a typed unavailable error instead of fabricating receipts. Settlement, game/task rewards, and the shared-experience tip control no longer report payments as successful. The tip control is disabled and no longer closes the modal or triggers confetti.

Implementation commits: `d1b7267` (`fix(finance): disable unconfirmed payment actions`), `8d33b69` (`refactor(finance): retain pot total helpers`), `0b9f91b` (`fix(finance): return typed unavailable action results`), and `9755905` (`fix(finance): disable shared experience tip`).

Checks observed:
- `pnpm lint` — passed.
- `pnpm exec tsc --noEmit` — passed.
- `pnpm exec eslint src/components/ui/SharedExperienceModal.tsx` — passed after disabling the tip action.
- `pnpm exec tsc --noEmit` — passed after the shared-experience tip fix.
- `pnpm build` — failed four attempts in Next.js 16.3.6 Turbopack before compilation, with `Operation not permitted` while creating a process/binding a port. The failure persisted on approved elevated reruns, including after the final safety-typing changes.

## Next step
Resolve or rerun the required build in an environment where Turbopack can create its worker process, then re-check PR-01 before moving forward.
