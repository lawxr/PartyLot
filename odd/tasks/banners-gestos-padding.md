# Banners, Gestos, and Padding Fixes

## Objective
Fix padding errors on buttons, enable mobile gestures for app-like feel, and implement random pastel banners for new users.

## Tasks

- [x] Add explicit `p-0` padding to all circular floating buttons (share, notification, create)
- [x] Create PWA manifest for app-like mobile experience
- [x] Add mobile gesture optimization CSS (touch-action, overscroll-behavior, tap-highlight)
- [x] Update ProfileView to support gradient banners with conditional rendering
- [x] Create pastel gradient utility with 20 preset gradients
- [x] Export getRandomPastelBanner function for user creation flow
- [x] Verify build completes successfully

## Verification
- Build: ✅ Passed (no TypeScript errors, compiled successfully)
- All floating buttons now have explicit `p-0` padding
- PWA manifest generated at /manifest.webmanifest
- Mobile gestures enabled via globals.css
- New users will receive random pastel gradient banners

## Files Modified
- src/components/views/PartyDetailView.tsx (3 buttons with p-0)
- src/components/views/HomeView.tsx (2 buttons with p-0)
- src/app/manifest.ts (created)
- src/app/globals.css (mobile gesture styles)
- src/components/views/ProfileView.tsx (gradient support)
- src/lib/pastelBanners.ts (created)

## Next Steps
- Test on mobile devices to verify gesture feel
- Create icon-192.png and icon-512.png if missing
- Test PWA "Add to Home Screen" functionality
