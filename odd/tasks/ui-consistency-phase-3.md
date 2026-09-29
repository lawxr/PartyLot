# PartyLot UI consistency — Phase 3: Hierarchy and Content Polish

## Objective
Establish a clean visual hierarchy, eliminate lingering mockup signals, and guarantee safe, honest empty states across the key user journeys (Splash -> Home -> Party Detail -> Split & Pot).

## Problem
Several views (`PartyDetailView`, `SplitView`, `PollsView`, `RecapView`) assume `parties[0]` always exists, causing unhandled runtime errors if no party is selected or available. Furthermore, `PartyDetailView` still contains lingering mockup leaks: hardcoded `p-404`/`party_hackathon_demo` ID filters, hardcoded "Medellín" and "Law" host fallbacks, hardcoded stock photo fallbacks in albums, and hardcoded player counts.

## Scope & Constraints
- Keep the existing party brand identity intact (warm ivory, yellow accents, candid photography, dark mode surfaces).
- Code, comments, commits, and artifacts in English.
- Conventional commits only (no AI attribution, no "Co-Authored-By").
- Automated checks: `pnpm release:check`.

## Tasks
- [x] T1 — Refactor `PartyDetailView.tsx`: safe null-party handling, remove `p-404`/`party_hackathon_demo` mockup filters, replace hardcoded host/location with dynamic party data, and provide honest album empty state.
- [x] T2 — Refactor `SplitView.tsx`: safe null-party handling, remove lingering `'404 House'` fallbacks and hardcoded 14-attendee fallback.
- [x] T3 — Refactor `PollsView.tsx`, `RecapView.tsx`, and `TopNav.tsx`: safe party null checks and dark mode navigation tokens. Run `pnpm release:check`.

## Acceptance Criteria
- Navigating to any view with 0 parties or an unselected party renders a helpful empty state without crashing.
- No view displays hardcoded demo IDs (`p-404`, `party_hackathon_demo`), fake host data, or fake album photos for newly created parties.
- All release checks (`pnpm release:check`: typecheck, linter, vitest, next build) pass.

## Progress / Evidence
- T1: Removed hardcoded demo filters (`party_hackathon_demo`, `p-404`) in `PartyDetailView.tsx`. Replaced hardcoded "Medellín" with dynamic `party.location`, dynamic host name & avatar, dynamic players count, and an honest empty album state with call-to-action.
- T2: Added safe `!party` fallback in `SplitView.tsx`, eliminated `'404 House'` strings, and fixed attendee count fallback.
- T3: Secured `PollsView.tsx` and `RecapView.tsx` against undefined parties, removed hardcoded 'Law' fallback from night awards, and added dark mode navigation styling to `TopNav.tsx`.
- Automated checks: `tsc --noEmit`, `eslint`, `vitest run` (51/51 passing), and `next build` succeeded cleanly.
