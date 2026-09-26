# PartyLot Production Readiness & System Truth

## Executive Summary
This document establishes the single source of truth for the PartyLot codebase state, reconciling previous conflicting reports (`PRODUCTION_READY.md` claims vs `odd/tasks/production-readiness.md`).

**Current Status**: In Stabilization (Stage 4 Completed: Domain Responsibilities Separated for Expenses).
**Release Readiness**: Solid foundation established; feature-based modularity active.

### Current treasury architecture (Monad Testnet)
The Multi-Party PartyTreasury Vault contract is live on Monad Testnet at `0x13ed67e844496095c0f44c914f89e30ef190db2c` (Tx: `0xdcbb28b183c3607ad7717b340dde925344b1c14ae4a3fa4ac1b10057a34bbc99`). All payments operate with native MON, fail closed on RPC/contract reverts, eliminate synthetic fallback hashes, and isolate accounting per gathering.

---

## Automated Verification Baseline (Observed)

| Check | Command | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Lint** | `pnpm lint` | ✅ PASSED | 0 errors, 0 warnings across the entire codebase. |
| **Type Check** | `pnpm exec tsc --noEmit` | ✅ PASSED | 0 TypeScript errors. |
| **Automated Tests** | `pnpm test` | ✅ PASSED | 8 test files, 48 tests passing across unit, treasury, and domain test suites. |
| **Build** | `pnpm build` | ✅ PASSED | Next.js 16.3.6 (Turbopack) successfully compiled 13 routes. |
| **Release Check** | `pnpm release:check` | ✅ PASSED | Full pipeline passed with exit code 0. |

---

## Feature Classification Matrix

### 1. Verified (Stable Baseline, Safety Net & Domain Separation)
- **Domain Decoupling (Stage 4)**:
  - Extracted `src/features/expenses/`:
    - `types.ts`: Domain models (`Expense`, `NetBalance`, `DebtSettlement`).
    - `services/settlements.ts`: Pure algorithmic math (`calculateNetBalances`, `computeDebtSettlements`).
    - `services/expensePersistence.ts`: Dedicated Supabase persistence for expenses.
    - `index.ts`: Clean feature entry point.
  - Legacy bridges maintained for full backward compatibility:
    - `src/services/settlements.ts` forwards directly to `@/features/expenses`.
    - `src/services/supabaseService.ts` delegates `persistExpenseToSupabase` to `@/features/expenses`.
- **Unit & Integration Test Coverage**:
  - `src/features/expenses/__tests__/expenses.test.ts` (3 tests): Feature domain public API.
  - `tests/unit/settlements.test.ts` (11 tests): Mathematical verification of balance and debt resolution.
  - `tests/unit/party.test.ts` (7 tests): Code generation, lookup, and invite formatting.
  - `tests/unit/treasury.test.ts` (7 tests): Pot contribution/spending sums and network status.
  - `tests/unit/session-reset.test.ts` (1 test): Complete data isolation on logout without account data leakage.
  - `src/features/expenses/__tests__/expenses.test.ts` (3 tests): Domain slice services and persistence interfaces.
  - `tests/unit/financial-fail-closed.test.ts` (3 tests): Fail-closed onchain transactions without synthetic successes.
  - `tests/unit/invite-validation-client.test.ts` (7 tests): Fail-closed invite validation and authentication checks.
- **Screen Architecture & Separation of Concerns**:
  - `SplitView` decoupled with `AddExpenseSheet`, `SettleDebtsSheet`, and `SplitOptionsMenu`.
  - `ProfileView` decoupled with `ProfilePeopleModal`, `ProfileAddNightModal`, and `ProfileSettingsModal`.
- **Cross-Account Data Protection**:
  - `usePrivySync.ts` resets store state on identity switches.
  - `resetUserSession` clears all party, financial, and activity caches while retaining device settings.
- **UI & Design System**: Liquid Glass design system normalized, responsive layouts, PWA manifest, and mobile touch gestures.
- **Release Verification Gate**: Single command `pnpm release:check` enforcing zero TypeScript errors, zero ESLint warnings, 39 passing Vitest tests, and Turbopack production compilation.

### 2. Post-Launch Backlog
- **Mainnet Launch**: Strictly pending security audits and live Monad mainnet readiness.
- **Multi-Token Escrow**: Additional stablecoin support beyond Monad testnet USDC.

### 3. Disabled / Out of Scope for Launch
- **Mainnet Transactions**: Strictly scoped to Monad Testnet; no mainnet contracts are active.
- **Fabricated/Mock Receipts**: All onchain actions fail closed; zero synthetic transaction receipts.

---

## Staged Roadmap & Status

1. **Stage 1 (Completed)**: Establish Reality — Reconcile conflicting documentation, eliminate lint errors, and define feature classification.
2. **Stage 2 (Completed)**: Safety Net — Installed Vitest, established unit tests for financial math, party codes, and treasury calculations; verified 4-check automated pipeline (`lint`, `tsc`, `test`, `build`).
3. **Stage 3 (Completed)**: Secure Real Flows — Hardened fail-closed behavior for all onchain transactions, eliminated fake activities, implemented cross-account data isolation on session reset and user switching.
4. **Stage 4 (Completed)**: Separate Responsibilities — Extracted `src/features/expenses/` with modular calculation and persistence services while preserving legacy compatibility bridges.
5. **Stage 5 (Completed)**: Simplify Screens — Decoupled monolithic views (`ProfileView`, `SplitView`) into focused subcomponents (`AddExpenseSheet`, `SettleDebtsSheet`, `SplitOptionsMenu`, `ProfilePeopleModal`, `ProfileAddNightModal`, `ProfileSettingsModal`), reducing view sizes by ~45%.
6. **Stage 6 (Completed)**: Release Gate — Automated verification gate (`pnpm release:check`), updated `.env.example` with complete security guidelines, zero lint warnings, and production readiness sign-off.
