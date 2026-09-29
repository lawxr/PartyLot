# PartyLot UI consistency — phases 1 and 2

## Objective
Make the existing PartyLot identity (ivory, yellow, expressive type, photography) consistent and credible. No redesign.

## Problem
Undefined CSS tokens in shared buttons, fictitious actionable content on Home, several parallel glass families, and hardcoded colors/radii in views make the app feel unfinished.

## Scope and constraints
- Authorized: phase 1 (remove mockup signals) and phase 2 (consolidate visual rules).
- Reuse existing tokens in `src/app/globals.css`; do not invent a new visual system.
- Glass reserved for floating navigation and overlays; content uses calm surfaces.
- Out of scope: hierarchy/content pass (phase 3), dark-theme completion, a11y pass (phase 4).
- Branch: `feat/ui-consistency-phase-1-2`. Delivery strategy: `ask-on-risk`.
- TDD: off (no project/session TDD configuration). Runner: `vitest run`. Checks: `pnpm release:check`.

## Tasks
- [x] T1 — Fix `.accent-button` / `.pill-outline` to use defined tokens (`--party-yellow`, `--text-primary`/`--foreground`). Route: inline.
- [x] T2 — Remove Home fictitious hero party and hardcoded `+12` counter; add a useful empty state wired to create/join. Audit visible actions that do nothing. Route: delegated (multi-file).
- [ ] T3 — Consolidate glass classes and replace hardcoded hex colors/radii in views with semantic tokens. Route: delegated (4+ files).

## Acceptance criteria
- A new account understands what to do and never mistakes sample content for real activity.
- The same element type looks and responds the same across views.
- `pnpm release:check` passes.

## Progress / evidence
- Findings verified: `--yellow`/`--ink` undefined (globals.css:417-446); Home fallback hero `p-404` (HomeView.tsx:42).
- T1 executed in commit `eceedc4`: `--party-yellow` & `--on-party-yellow` applied to `.accent-button` and `.pill-outline`.
- T2 executed: Home empty state wired to `create-party` & `join-party`; dynamic member count and fallback implemented; upcoming party deduplicated; unused lint warnings resolved.
