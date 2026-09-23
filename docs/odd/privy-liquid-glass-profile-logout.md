# ODD: Privy Liquid Glass and Profile Logout

## Goal

Align Privy's native authentication UI with PartyLot's liquid-glass visual language and remove the duplicate logout action from the profile.

## Tasks

- [x] Configure Privy with a dark custom theme, PartyLot accent color, and rounded surfaces.
- [x] Override Privy's portal CSS variables from the global body styles.
- [x] Keep the account-security logout action and remove the duplicate standalone profile action.
- [ ] Validate the native Privy modal visually in a configured local environment.

## Notes

The existing `PrivyAuthModal` is PartyLot-owned and already uses liquid-glass classes. The provider-level appearance and CSS variables cover Privy's native portal UI as well.
