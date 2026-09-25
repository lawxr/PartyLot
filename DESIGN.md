# Partylot — DESIGN.md

> **Visual direction:** warm, social, editorial, premium, mobile-first.  
> **Core material:** restrained Liquid Glass over bright cream surfaces and warm party photography.  
> **Primary accent:** `#F0DC00`  
> **Product rule:** Partylot must feel like a real consumer social product, not a crypto app, a dashboard, or a design mockup.

---

# 1. Design Intent

Partylot should feel like a polished iOS-native social product for real-world groups.

The visual language combines:

- warm cream and ivory surfaces
- bright, candid party photography
- bold rounded display typography for moments of personality
- neutral system typography for product UI
- restrained Liquid Glass
- tactile, rounded controls
- soft depth instead of neon/glow
- real people and real group activity as the main visual content

The interface should feel:

- warm
- social
- tactile
- premium
- youthful
- friendly
- intimate
- real

It should **not** feel:

- cyberpunk
- crypto-native
- dark by default
- green neon
- glass everywhere
- AI-generated
- over-designed
- like a fintech dashboard
- like a fake iPhone prototype

---

# 2. Core Visual Principle

## Bright by default, immersive when the party starts

Utility screens such as:

- Home
- Crews
- Profile
- Settings
- Expenses

should use warm, light surfaces.

Immersive screens such as:

- Party Detail
- Games
- Recap
- Media moments

can use edge-to-edge photography, but the photography must remain bright and readable.

Liquid Glass acts as an **interaction material**, not as a background for every card.

---

# 3. Color System

## 3.1 Brand accent

```css
--party-yellow: #F0DC00;
```

This is the defining accent color.

Use for:

- active navigation states
- selected options
- primary CTA
- small notification indicator
- active game selection
- highlighted Party Pot action
- progress accents
- subtle brand moments

Do **not** add a neon glow around it.

### Hover / pressed variants

```css
--party-yellow-hover: #E6D300;
--party-yellow-pressed: #D8C700;
--party-yellow-soft: rgba(240, 220, 0, 0.14);
```

---

## 3.2 Warm surface palette

```css
--bg-primary: #F7F2E8;
--bg-secondary: #F1EADF;
--surface-primary: #FFFDF8;
--surface-secondary: #F8F3EA;

--text-primary: #171512;
--text-secondary: #6F6A62;
--text-tertiary: #999187;

--divider: rgba(35, 30, 22, 0.08);
```

The overall app background should never be pure white.

Use a very subtle warm ivory tone.

---

## 3.3 Photography palette

Photography should naturally bring:

- amber
- honey
- warm brown
- skin tones
- sunset orange
- soft burgundy
- champagne
- warm beige

Avoid letting the product drift into:

- electric green
- cyan
- purple neon
- harsh blue
- crushed black

---

# 4. Photography Direction

Photography is a primary design material.

## Required characteristics

Use:

- bright house parties
- golden-hour rooftops
- warm indoor lighting
- flash photography with visible faces
- birthdays
- dinners
- casual gatherings
- candid laughter
- friends leaning into frame
- natural body language
- subtle film grain
- slight motion blur where appropriate

## Avoid

- very dark nightclub photography
- silhouettes
- people whose faces cannot be identified
- RGB club lighting
- EDM/festival aesthetic
- corporate stock smiles
- obvious AI-generated imagery
- heavy vignette
- excessive black overlays

---

## 4.1 Image overlays

Never darken a photograph more than necessary.

Preferred overlay:

```css
background:
  linear-gradient(
    180deg,
    rgba(20, 14, 8, 0.02) 0%,
    rgba(20, 14, 8, 0.04) 42%,
    rgba(20, 14, 8, 0.38) 78%,
    rgba(20, 14, 8, 0.54) 100%
  );
```

For brighter images:

```css
background:
  linear-gradient(
    180deg,
    rgba(0,0,0,0.00) 25%,
    rgba(0,0,0,0.08) 58%,
    rgba(0,0,0,0.42) 100%
  );
```

Never use a blanket `rgba(0,0,0,.7)` over the entire image.

---

# 5. Typography

## 5.1 Display font

Use a bold, rounded, expressive display font for:

- Partylot wordmark
- major party titles
- game titles when appropriate
- recap moments

The reference image uses a playful heavy rounded style.

Recommended qualities:

- thick strokes
- soft corners
- slightly quirky
- excellent legibility
- not childish

Do not use the display font for every section heading.

---

## 5.2 UI font

Use:

- SF Pro
- Inter
- Geist
- another neutral system-like sans

For:

- navigation
- dates
- locations
- balances
- activity
- metadata
- buttons
- settings
- forms

---

## 5.3 Type hierarchy

### Brand

```css
font-size: 34px;
font-weight: 900;
letter-spacing: -0.04em;
```

### Major party title

```css
font-size: 44px;
font-weight: 900;
line-height: 0.94;
letter-spacing: -0.04em;
```

### Section title

```css
font-size: 22px;
font-weight: 750;
letter-spacing: -0.025em;
```

### Card title

```css
font-size: 16px;
font-weight: 750;
```

### Body

```css
font-size: 15px;
font-weight: 450;
line-height: 1.45;
```

### Metadata

```css
font-size: 12px;
font-weight: 600;
color: var(--text-secondary);
```

---

# 6. Layout System

## Base mobile viewport

Design first for:

```text
390 × 844
430 × 932
```

## Horizontal page padding

```css
padding-inline: 18px;
```

For larger phones:

```css
padding-inline: 20px;
```

## Vertical rhythm

Preferred spacing scale:

```text
4
8
12
16
20
24
32
40
48
```

Avoid arbitrary gaps.

---

# 7. Corner Radius System

The image relies heavily on rounded geometry.

Use a coherent radius hierarchy.

```css
--radius-xs: 10px;
--radius-sm: 14px;
--radius-md: 18px;
--radius-lg: 24px;
--radius-xl: 30px;
--radius-2xl: 36px;
--radius-pill: 999px;
```

Recommended use:

- chips: `999px`
- small buttons: `16–20px`
- cards: `22–28px`
- main party image: `28–32px`
- bottom sheets: `32–36px`
- bottom nav: `26–30px`

---

# 8. Liquid Glass System

Liquid Glass must feel like a material with depth.

It is not just `rgba + blur`.

A convincing surface has:

1. transparency
2. background blur
3. saturation
4. subtle brightness
5. inner highlight
6. faint border
7. soft shadow
8. contextual color absorption
9. optional specular highlight

---

# 9. Glass Levels

Use three levels only.

---

## 9.1 Glass / Light

For:

- small chips
- floating metadata
- photo controls
- compact labels

```css
.glass-light {
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.48),
      rgba(255,255,255,0.28)
    );

  backdrop-filter:
    blur(14px)
    saturate(145%)
    brightness(1.04);

  -webkit-backdrop-filter:
    blur(14px)
    saturate(145%)
    brightness(1.04);

  border:
    1px solid rgba(255,255,255,0.48);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.70),
    0 6px 20px rgba(63,48,27,0.08);
}
```

Transparency target:

```text
55–72% visual transparency
```

---

## 9.2 Glass / Regular

For:

- quick action bar
- floating controls
- Party Pot cards
- selected UI panels

```css
.glass-regular {
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,0.68),
      rgba(255,250,242,0.42)
    );

  backdrop-filter:
    blur(24px)
    saturate(165%)
    brightness(1.05);

  -webkit-backdrop-filter:
    blur(24px)
    saturate(165%)
    brightness(1.05);

  border:
    1px solid rgba(255,255,255,0.64);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.88),
    inset 0 -1px 0 rgba(90,65,35,0.04),
    0 12px 34px rgba(65,48,25,0.11);
}
```

Transparency target:

```text
35–55% visual transparency
```

---

## 9.3 Glass / Strong

For:

- bottom navigation
- bottom sheets
- modal surfaces
- high-priority floating layers

```css
.glass-strong {
  background:
    linear-gradient(
      145deg,
      rgba(255,253,248,0.86),
      rgba(248,239,226,0.68)
    );

  backdrop-filter:
    blur(34px)
    saturate(175%)
    brightness(1.06);

  -webkit-backdrop-filter:
    blur(34px)
    saturate(175%)
    brightness(1.06);

  border:
    1px solid rgba(255,255,255,0.82);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.96),
    inset 0 -1px 0 rgba(84,55,20,0.05),
    0 18px 60px rgba(56,41,22,0.15);
}
```

Transparency target:

```text
18–35% visual transparency
```

This glass is intentionally more milky and warm.

---

# 10. Specular Highlight

Important glass surfaces should have a soft highlight.

Example:

```css
.glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;

  background:
    linear-gradient(
      120deg,
      rgba(255,255,255,0.28) 0%,
      rgba(255,255,255,0.06) 34%,
      rgba(255,255,255,0.00) 58%
    );
}
```

Do not make this look metallic.

Opacity should remain subtle.

---

# 11. Glass Noise

Optional.

Use only on large glass surfaces.

```css
.glass::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0.018;

  background-image:
    url("/textures/noise.png");
}
```

Keep below `0.025` opacity.

---

# 12. Shadows

Avoid generic heavy black shadows.

Use warm shadows.

### Card

```css
box-shadow:
  0 10px 28px rgba(75, 56, 32, 0.08);
```

### Floating glass

```css
box-shadow:
  0 16px 44px rgba(67, 48, 24, 0.13);
```

### Bottom sheet

```css
box-shadow:
  0 -14px 70px rgba(62, 43, 21, 0.16);
```

---

# 13. Screen 1 — Home

The first phone in the reference.

---

## 13.1 Top area

Safe area:

```text
top: 12–18px after native status bar
```

Header layout:

```text
Partylot                    notification
Good evening, Law
```

### Distribution

Left:

- Partylot wordmark
- greeting directly below

Right:

- compact circular glass notification button
- small yellow unread dot

Approximate sizes:

```text
wordmark width: 160–180px
notification: 42 × 42px
```

---

## 13.2 Main party card

Placed approximately:

```text
20px below greeting
```

Full width minus page padding.

Aspect ratio:

```text
~ 1.1 : 1
```

Radius:

```text
26–30px
```

Image:

- warm rooftop / sunset
- clearly visible people
- bright skin tones

### Internal layout

Top left:

```text
Tonight
```

as a yellow pill.

Top right:

heart / save button in glass.

Bottom left:

```text
404 House
Tonight · 9:00 PM · Laureles
```

Below metadata:

avatar stack.

Bottom text area should use an image gradient only in the lower third.

---

## 13.3 Avatar stack

```text
32 × 32px avatars
overlap: 8–10px
border: 2px warm white
```

Last item:

```text
+12
```

in translucent glass.

---

## 13.4 Your Crews

Section starts:

```text
24–30px below hero card
```

Header:

```text
Your crews             See all >
```

Three cards visible horizontally.

Each card:

```text
~ 30% width
height: 165–180px
radius: 18–20px
```

Top ~65%:

photo.

Bottom:

warm white surface.

Contains:

- crew name
- member count
- tiny avatar stack

Do not use glass here.

These are normal content cards.

---

# 14. Bottom Navigation

Visible on Home.

This is one of the strongest Liquid Glass components.

Position:

```css
position: fixed;
left: 16px;
right: 16px;
bottom:
  max(14px, env(safe-area-inset-bottom));
```

Height:

```text
72–78px
```

Radius:

```text
28–32px
```

Use `glass-strong`.

Navigation:

```text
Home
Crews
Tonight
Profile
```

Each item is centered.

Active state:

- yellow circular / pill background
- dark icon
- dark label

Inactive:

- transparent
- gray icon
- gray label

Do not add glow.

---

# 15. Screen 2 — Party Detail

Second phone.

This screen is intentionally more immersive.

---

## 15.1 Photography

Full-bleed image from top to roughly:

```text
58–62% viewport height
```

Photo should remain bright.

No huge black overlay.

---

## 15.2 Top controls

Left:

- back button

Right:

- share
- more

Each:

```text
44 × 44px
```

Use `glass-light`.

Over photography, these should inherit warmth from the background.

---

## 15.3 Main title placement

Title sits inside the lower part of the photo.

Approximate hierarchy:

```text
404 House

Today · 9:00 PM   •   Medellín

Hosted by Law

avatar stack
```

Title:

```text
44–48px
white
display font
```

---

# 16. Party Quick Actions

This is a key Liquid Glass component.

It floats across the boundary between the photo and content area.

Position:

```text
~20px overlapping bottom edge of image
```

Full width minus 16px margins.

Use `glass-strong`.

Height:

```text
82–92px
```

Radius:

```text
28–32px
```

Contains four equal actions:

```text
Play
Split
Pot
Poll
```

Each is a soft rounded cell.

Selected state:

```text
background: #F0DC00
```

No green.

No glow.

Icon top, label bottom.

---

# 17. Party Pot Summary

Directly below quick actions.

Card:

```text
Party Pot
$186.40
shared by 14 people

[ + Add ]
```

Surface:

light warm cream / subtle glass.

The Add button uses yellow.

Keep money clear and readable.

---

# 18. Live Activity

Below Party Pot.

Section:

```text
Live activity               See all
```

Rows should be extremely clean.

Each row:

```text
avatar | action text | timestamp
```

Example:

```text
Ana added $10 to the pot        2m ago
Sofi won Who's Most Likely      12m ago
Cam joined the party            28m ago
```

No heavy card around each row.

Use separators or whitespace.

---

# 19. Screen 3 — Party Pot Sheet

Third phone.

This is the strongest example of Liquid Glass.

---

## 19.1 Background

Keep the current party screen visible behind.

Apply:

```css
backdrop-filter:
  blur(8px)
  saturate(120%);
```

Add very light darkening:

```css
background:
  rgba(31, 24, 17, 0.08);
```

Do not make the background black.

---

## 19.2 Bottom sheet

Starts around:

```text
42–48% of viewport height
```

Extends to bottom.

Radius:

```text
34px 34px 0 0
```

Use `glass-strong`.

Warm, milky, semi-transparent.

At top:

drag handle.

```text
36 × 5px
```

color:

```text
rgba(80, 68, 55, .25)
```

---

## 19.3 Sheet hierarchy

Top:

circular icon.

Then:

```text
Add to the Party Pot
Help cover drinks, snacks and whatever
makes tonight legendary.
```

Then amount selector:

```text
-     $10     +
```

Amount:

```text
48–56px
font-weight: 800+
```

Minus and plus:

```text
48–52px circular buttons
```

---

## 19.4 Preset amounts

```text
$5
$10
$20
$50
```

Pill buttons.

Selected:

```text
background: #F0DC00
color: #171512
```

Others:

warm translucent background.

---

## 19.5 Payment source

Row:

```text
[icon] USDC · Base
       Fast, low fees           v
```

Important:

This row may contain chain information because it is payment source selection.

Do not expose technical terms beyond what is useful.

---

## 19.6 Primary CTA

```text
Add to pot
```

Full width.

Height:

```text
56–60px
```

Radius:

```text
22–26px
```

Background:

```text
#F0DC00
```

Text:

```text
#171512
```

No gradient required.

A very subtle vertical lighting shift is acceptable.

---

# 20. Screen 4 — Who's Most Likely

Fourth phone.

This screen returns to bright UI.

---

## 20.1 Background

Warm cream.

Optional:

very soft yellow-beige radial ambient gradient.

Example:

```css
background:
  radial-gradient(
    circle at 50% 15%,
    #FFF8DC 0%,
    #F7F2E8 45%,
    #F3ECE1 100%
  );
```

---

## 20.2 Top bar

Left:

back.

Center:

title.

Right:

participant count.

All minimal.

---

## 20.3 Question card

Large card around:

```text
Who's most likely
to dance on a table tonight?
```

Radius:

```text
24–28px
```

Surface:

warm glass / cream.

Small lightning icon centered above question.

Question centered.

---

## 20.4 Participant grid

2 rows × 3 people.

Each person:

```text
avatar
name
```

Avatar:

```text
64–72px
```

Selected person:

yellow ring:

```css
border:
  4px solid #F0DC00;
```

Optional vote badge:

```text
3
```

small yellow circle attached top-right.

Do not use glow.

---

## 20.5 Skip action

Bottom secondary button:

```text
Skip for now
```

White / glass surface.

No yellow unless selected.

---

## 20.6 Progress

Bottom:

```text
● ● ○ ○ ○ ○ ○ ○       3 / 10
```

Active dots:

```text
#F0DC00
```

Inactive:

```text
rgba(100,90,75,.12)
```

---

# 21. Buttons

## Primary

```css
.button-primary {
  background: #F0DC00;
  color: #171512;
  border-radius: 22px;
  min-height: 54px;
  font-weight: 750;
  border: none;
}
```

Pressed:

```css
transform: scale(.975);
background: #D8C700;
```

---

## Secondary glass

Use `glass-light` or `glass-regular`.

Do not add yellow outline unless required by state.

---

# 22. Motion

Motion should feel springy and native.

## Button

```text
press:
scale 1 → .97 → 1
duration ~160ms
```

## Bottom sheet

```text
translateY(100%) → 0
spring
```

## Tab selection

Yellow active surface should move / morph softly.

## Party cards

Very small image scale:

```text
1 → 1.015
```

on press/hover.

No excessive parallax.

---

# 23. Touch Behavior

Minimum hit target:

```text
44 × 44px
```

Buttons should never rely on tiny icons alone.

Safe areas:

```css
padding-top:
  env(safe-area-inset-top);

padding-bottom:
  env(safe-area-inset-bottom);
```

---

# 24. What Must Not Be Recreated from the Marketing Mockup

The image is a visual reference, not literal app chrome.

Do NOT recreate:

- fake physical iPhone bezel
- Dynamic Island as HTML
- fake battery / cellular icons
- fake device shadow
- fake phone framing

The real product uses the browser / PWA viewport.

---

# 25. Component Inventory

Recommended reusable components:

```text
AppShell
TopBar
BottomNavigation

PartyHero
PartyCard
CrewCard
AvatarStack

GlassSurface
GlassButton
GlassChip
GlassToolbar
GlassBottomSheet

PartyQuickActions
PartyPotCard
ActivityList
ActivityRow

AmountSelector
PaymentSourceRow

GameQuestionCard
ParticipantGrid
ParticipantAvatar
ProgressDots
```

---

# 26. Glass Implementation Rule

Before applying glass to a component, ask:

> Is this component floating, transient, contextual, or layered over content?

If yes:

glass is appropriate.

If no:

prefer a normal warm surface.

Examples:

### Glass

- bottom nav
- quick action bar
- photo controls
- modal sheet
- floating chip
- context toolbar

### Not glass

- basic crew card
- settings row
- ordinary expense
- activity list
- form section
- static profile information

---

# 27. Contrast

Glass must never reduce readability.

For glass on photography:

```text
minimum text contrast:
WCAG AA where possible
```

If necessary:

- increase glass opacity
- add local background scrim
- increase text weight

Do not solve contrast by darkening the entire photograph.

---

# 28. Brand Balance

The yellow `#F0DC00` should appear enough to create recognition, but not dominate the app.

Approximate visual ratio:

```text
75% warm neutrals
15% photography-driven color
10% brand yellow
```

In most screens, only one or two major yellow elements should be visible at a time.

---

# 29. Final Look

Partylot should visually read as:

```text
warm editorial photography
+
bright premium consumer UI
+
soft creamy Liquid Glass
+
bold social identity
+
#F0DC00 accent
+
native-feeling mobile interactions
```

Not:

```text
dark crypto app
+
green neon
+
glass everywhere
+
fake dashboard stats
+
device mockup UI
```

---

# 30. Final Quality Check

Before shipping any screen, confirm:

- photography is bright enough
- faces are visible
- no green/lime accent remains
- yellow is exactly or very close to `#F0DC00`
- glass is contextually justified
- glass transparency is not too high
- text remains readable
- no neon glow exists
- spacing follows the system
- corner radii are consistent
- bottom sheets feel native
- navigation respects safe areas
- no fake iPhone chrome exists
- product looks usable, not conceptual
- actions feel like a real consumer app

---

# North Star

> **Partylot should feel like a warm, premium social app that happens to use sophisticated infrastructure underneath — never like a technology demo trying to prove how sophisticated it is.**
