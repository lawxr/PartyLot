# PartyLot UI consistency — Phase 4: Live Interactive Validation and Contrast Polish

## Objective
Validate the application directly in the browser across core user journeys, verifying theme switching (Light / Dark), language toggle (ES / EN), responsiveness, contrast, and interactive feedback.

## Problem
After unifying design tokens, cleaning mockups, and securing party data handling across Phases 1-3, live runtime verification is required to catch any visual regressions, contrast discrepancies in dark mode, or clunky animations across real viewport sizes.

## Scope & Constraints
- Validate core flows: Splash / Onboarding -> Home -> Party Detail -> Split -> Pot -> Profile.
- Check both Light and Dark themes.
- Check both Spanish and English locales.
- Automated release checks: `pnpm release:check`.
- Conventional commits only (no AI attribution, no "Co-Authored-By").

## Tasks
- [x] T1 — Test Splash screen and navigation into Home; verify empty states, hero cards, and language toggle.
- [x] T2 — Test Party Detail, SplitView, and PartyPot in both light and dark mode; verify contrast, modal sheets, and interaction feedback.
- [x] T3 — Fix any contrast, padding, or theme inconsistencies identified during live inspection; run `pnpm release:check`.

## Acceptance Criteria
- No console errors during standard user interactions.
- All interactive controls have clear contrast and visible focus rings.
- Dark mode provides consistent contrast across all views and sheets.

## Progress / Evidence
- Executed headless browser audit (`scripts/audit-phase4.mjs`) testing all primary views (Splash, Home, PartyDetail, Split, PartyPot, and zero-party empty states) in both Light and Dark themes.
- Captured 11 verification screenshots in `playwright-screenshots/phase4`.
- Fixed React 19 image source warning in `src/lib/imageOptimization.ts` to ensure empty strings are never passed to `img.src`.
- Confirmed 0 console errors and clean visual rendering across dark/light modes.
- `pnpm release:check` passed 100% (typecheck, lint, 51/51 vitest tests, Next.js production build).
