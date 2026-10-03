# Accessibility Statement for PartyLot

PartyLot is committed to digital accessibility and creating an inclusive user experience for all individuals, regardless of ability or technology used. We strive to meet and exceed [Web Content Accessibility Guidelines (WCAG) 2.1 Level AA](https://www.w3.org/TR/WCAG21/) standards across all views and interactions.

---

## Measures to Support Accessibility

PartyLot implements the following accessibility measures across its design and development:

- **Semantic HTML & ARIA Attributes**: All dialogs, sheets, tab bars, buttons, and navigation elements utilize semantic elements (`<nav>`, `<header>`, `<main>`, `<button>`) and descriptive ARIA roles (`role="tab"`, `aria-selected`, `aria-label`).
- **Full Keyboard Navigation**:
  - Focusable interactive elements have distinct focus rings (`focus-visible:outline-2 focus-visible:outline-[#F0DC00]`).
  - Modal sheets and popups support `Esc` dismissal and keyboard trap management.
- **Color Contrast & Dynamic Theming**:
  - Tailored color palettes with high-contrast text ratios for both Light Mode (`#171512` on `#F7F2E8`) and Dark Mode (`#F5F1E8` on `#12110E`).
  - Visual status badges do not rely solely on color (paired with text labels and icons).
- **Responsive Layouts & Zoom**:
  - Scalable typography and fluid layouts supporting up to 200% browser zoom without content clipping.
  - Touch-friendly tap targets exceeding 44x44px for mobile devices.

---

## Supported Environments

PartyLot is tested and designed to be compatible with:
- Modern desktop and mobile browsers (Chrome, Safari, Firefox, Edge).
- Screen readers including VoiceOver (macOS / iOS) and NVDA (Windows).
- Operating system preferences for `prefers-reduced-motion` and `prefers-color-scheme`.

---

## Known Limitations & Ongoing Improvements

- **Web3 Wallet Popups**: Embedded wallet iframes and external wallet extension interfaces are governed by their respective providers (e.g. Privy, MetaMask).
- **Continuous Audits**: We continually test views using automated scanners and manual keyboard navigation reviews.

---

## Feedback and Contact

We welcome your feedback on the accessibility of PartyLot. If you encounter any barriers or have suggestions for improvement, please let us know:

- Open an issue on GitHub: [https://github.com/lawxr/PartyLot/issues](https://github.com/lawxr/PartyLot/issues)
- Maintainers: Law & Gabriela (PartyLot Team)
