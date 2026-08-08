---
name: AssetDiary
description: A private, family-shared household ledger and asset register — modern, restrained, native-feeling on each platform.
colors:
  primary-light: "#26619c"
  primary-dark: "#5b9bd5"
  background-light: "#F2F2F7"
  background-dark: "#000000"
  surface-light: "#FFFFFF"
  surface-dark: "#1C1C1E"
  border-light: "#E3E3E8"
  border-dark: "#38383A"
  text-light: "#1C1C1E"
  text-dark: "#F2F2F7"
  text-muted-light: "#6C6C70"
  text-muted-dark: "#98989D"
  positive-light: "#1b8a3f"
  positive-dark: "#4caf50"
  negative-light: "#d32f2f"
  negative-dark: "#ef5350"
  accent-blue: "#26619c"
  accent-amber: "#b26a00"
  accent-violet: "#6a3fb5"
typography:
  family: "Plus Jakarta Sans"
  weights: [400, 500, 600, 700, 800]
gradients:
  primary-light: ["#3679b8", "#193f68"]
  primary-dark: ["#7db4e3", "#33638f"]
  amber-light: ["#d99328", "#8a5300"]
  amber-dark: ["#f7c878", "#b57e26"]
  violet-light: ["#8659d1", "#4a2d80"]
  violet-dark: ["#c0abe8", "#6f5aa8"]
rounded:
  chip: "8px"
  control: "12px"
  row: "14px"
  card: "18px"
  sheet: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  button-tonal:
    backgroundColor: "tint(primary, 13%)"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  grouped-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.row}"
    padding: "14px"
---

# Design System: AssetDiary

## Overview

**Creative North Star: "Ledger, Illuminated"**

AssetDiary is read like a well-kept household ledger and used like a native phone settings app: calm, dense with real numbers, and instantly trustworthy — lit with real materials, gradient hero moments, and motion rather than left flat. The 2026-08 pass kept the incumbent system's best instinct — grouped, inset list rows with icon chips (`GroupedRow`, `GroupedList`, `FeatureTile`) — and formalized it into the single vocabulary every screen uses. The follow-up pass documented here (same month) kept that grouped-list skeleton but changed almost everything about how it's *rendered*: a distinct app-wide typeface, gradient-washed hero cards, real native materials (`expo-blur`) and haptics (`expo-haptics`), meaningful entrance/data motion, and a gesture-driven bottom-sheet system replacing every flat `Modal`.

This is still an **Operate**-mode surface, not a marketing one: familiarity earns trust, and boldness is spent deliberately — one true gradient hero moment per screen, not gradient everywhere; a distinctive typeface carrying the whole app rather than a bespoke display face reserved for hero text. The one place the app gets to feel genuinely "native platform, 2026" beyond the shared token system is the chrome each OS actually owns — iOS's real Liquid Glass tab bar (already implemented via `NativeTabs`, untouched by either pass), translucent system materials behind sheets/bottom-sheet backdrops on iOS, tonal surfaces on Android, and clean flat panels + shadow on web.

**Key Characteristics:**
- Grouped, inset lists with icon chips as the default way to show anything — never a bare `<FlatList>` row. Rows/tiles stagger in on mount and fire a light haptic on press.
- Restrained color on ordinary surfaces: brand steel-blue as the one tint, the three fixed accent hues (blue/amber/violet) for category identity — never decoration. The one deliberate exception is **the single hero card per screen** (see Gradients below), which earns a full gradient wash.
- Depth from hairlines + soft ambient shadow on ordinary cards; the hero card and floating elements (FAB, sheets) get a stronger, deliberately more present shadow.
- One shared token system (color, spacing, radius, type, gradients, motion) across iOS/Android/web; platform divergence lives in chrome (nav, materials, motion), not in bespoke per-OS component forks — a deliberate scope decision for a one-person-maintained app, not an oversight.
- One app-wide typeface (Plus Jakarta Sans) carrying both body copy and hero numbers — see Typography.

## Colors

Restrained strategy: one brand tint (steel blue, unchanged — see PRODUCT.md Brand Commitments), a fixed three-hue accent set for category identity, and a neutral scale doing most of the work.

### Primary
- **Steel Blue** (`#26619c` light / `#5b9bd5` dark): primary actions, active tab/segment state, links, the one interactive tint. Unchanged from the incumbent brand color — a confirmed brand commitment, not open for this pass.

### Secondary (category accents — fixed, never cycled)
- **Accent Blue** (`#26619c`/`#5b9bd5`): deposits/accounts.
- **Accent Amber** (`#b26a00`/`#f0b357`): gold/ornaments, interest.
- **Accent Violet** (`#6a3fb5`/`#a98eda`): property.

### Neutral
- **Grouped Background** (`#F2F2F7` light / `#000000` dark): the screen canvas — iOS's systemGroupedBackground family. Cards/rows sit on this, not on white-on-white. This single change (replacing the old flat `#ffffff`/`#121212` background) is what makes the grouped-list pattern read as intentional rather than accidental.
- **Surface** (`#FFFFFF` light / `#1C1C1E` dark): cards, rows, sheets, inputs.
- **Border** (`#E3E3E8` light / `#38383A` dark): hairlines only — 1px/hairline width, never a heavy 1.5–2px rule.
- **Text** (`#1C1C1E` / `#F2F2F7`) and **Text Muted** (`#6C6C70` / `#98989D`): the only two text colors on any surface besides positive/negative.
- **Positive** (`#1b8a3f`/`#4caf50`) / **Negative** (`#d32f2f`/`#ef5350`): earnings/gains vs. expenses/losses only — never for anything else.

### Named Rules
**The One Tint Rule.** Primary blue appears on interactive elements only (buttons, active states, links, selected rows). It never fills a card, header, or background as decoration.

**The Grouped Canvas Rule.** Every screen's root background is the neutral grouped-background token, not the surface/card color. A card that's the same color as its background isn't a card.

## Typography

**Font:** Plus Jakarta Sans (400/500/600/700/800), app-wide — replaced the platform system font in the 2026-08 "Ledger, Illuminated" pass. Loaded via `useFonts` in `app/_layout.tsx` (splash holds until ready, same pattern as auth/theme restore). Applied through two drop-in wrapper components, `src/components/Text.tsx` and `src/components/TextInput.tsx` — same prop API as RN's `Text`/`TextInput`, but they read the flattened `fontWeight` and resolve the matching *static* font file, since Android doesn't synthesize bold for custom fonts. Every screen imports `Text`/`TextInput` from these wrappers, never from `"react-native"` directly. Numbers (amounts, dates, counts) always use `fontVariant: ["tabular-nums"]`.

**Character:** Plain, confident, dense where the data is dense — a distinct typeface, not a display face; it carries body copy and hero numbers alike rather than being reserved for a handful of marketing-style moments.

### Hierarchy
Fixed pt scale (not fluid — this is Operate, per-device DPI is consistent):
- **Large Title** (700, 32pt/38, -0.4 tracking): the one greeting/hero heading per hub screen (Home, module overview screens).
- **Title** (700, 22pt/28): section/screen titles, sheet titles.
- **Headline** (600, 17pt/22): row values, button labels, card headline numbers.
- **Body** (400, 17pt/22): primary reading text, form input values.
- **Subhead** (400, 15pt/20): row subtitles.
- **Footnote** (400, 13pt/18, `textMuted`): row meta, helper text.
- **Caption** (600, 12pt/16, 0.5 tracking, uppercase, `textMuted`): section headers, row eyebrow labels — the existing `GroupedList` section-header treatment, kept as-is.

### Named Rules
**The Tabular Numbers Rule.** Any amount, balance, date, or count renders with `tabular-nums` so columns of numbers align — already followed in `GroupedRow`; extend it everywhere money or counts appear.

## Layout

Single-column, comfortably padded (16pt screen margin, `base` token) on phone; the same layout simply gains max-width centering (~640pt) on web/tablet rather than reflowing into multi-column — this is a personal ledger, not a dashboard with panes. Section rhythm: 16pt above a group, 10pt between a section header and its group, hairline-separated rows inside one rounded container per group (existing `GroupedList`/`GroupedRow` behavior — kept).

## Elevation & Depth

Hybrid: flat-by-default with hairline borders doing most of the separation (grouped list rows, cards), plus one soft ambient shadow reserved for things that visually float above the canvas — the FAB, sheets/modals mid-transition, and any card explicitly called out as "elevated" (e.g. a hero stat card on Home). Depth is not sprinkled everywhere; a screen with 20 rows should show 20 hairlines, not 20 drop shadows.

### Shadow Vocabulary
- **Ambient** (`shadowOffset: {0,2}`, `shadowOpacity: 0.10`, `shadowRadius: 10`, `elevation: 3`): floating elements only (FAB, hero card, active drag state).
- **Sheet** (`shadowOffset: {0,-2}`, `shadowOpacity: 0.15`, `shadowRadius: 16`): modal/bottom-sheet separation from content behind it.

### Named Rules
**The Hairline-First Rule.** Reach for a 1px border before a shadow. Shadow is for things that float; borders are for things that sit.

### Materials (platform-specific)
- **iOS:** `expo-blur` `BlurView` (now installed and in use) behind the `BottomSheet` primitive's backdrop and any floating toolbar — a real translucent material, never a hand-rolled semi-transparent overlay. The tab bar's own Liquid Glass stays native via `NativeTabs`, untouched.
- **Android:** tonal elevation — a slightly lifted surface tone, no blur.
- **Web:** solid surface, no blur (unsupported/inconsistent); rely on the ambient/sheet shadow instead.

## Gradients

One deliberate hero moment per screen, never decoration on ordinary surfaces — the counterweight to The One Tint Rule, not a repeal of it.

- **Where:** the single headline-total card on a hub/overview screen (Home's Worth card, `AssetOverviewScreen`/`LedgerOverviewScreen`'s hero card), the primary filled `Button`, and the `FAB`. Never a `GroupedRow`, a plain `Card`, or a `FeatureTile` grid tile's background.
- **Tokens:** `colors.gradientPrimary` / `gradientAmber` / `gradientViolet` on `ThemeColors`, each a `[start, end]` hex tuple, paired with `gradientAngle` (`{start:{x:0,y:0}, end:{x:1,y:1}}`) from `src/utils/tokens.ts`. Rendered via `expo-linear-gradient`.
- **The Split-Card Pattern.** A hero card is two zones in one rounded, shadowed, `overflow:"hidden"` container: a gradient **top zone** holding the headline label + number in `colors.onPrimary` (with the label at reduced opacity, not a separate muted token), and a flat `colors.card` **bottom zone** underneath for anything that depends on the accent-hue vocabulary (a composition bar, coloured legend chips) — an accent hue would wash out against a same-family gradient, so accent-coded content always sits on the flat zone, never the gradient one. See `HomeScreen.tsx`'s `WorthCard`, `AssetOverviewScreen.tsx`'s `HeroCard`, or `LedgerOverviewScreen.tsx` for the reference implementation.
- **Icon chips** (`GroupedRow`, `FeatureTile`) get a *much* subtler treatment — not this pattern: a two-stop wash of the row's own accent colour at ~24%→7% alpha (`` `${accent}3d` `` → `` `${accent}12` ``), diagonal, staying inside the existing small icon-chip box. This is polish, not a hero moment.

## Motion

- **Entrance stagger:** grouped-list rows, `FeatureTile` grids, and a hub screen's top-level card blocks fade+slide in (`FadeInDown`) on mount, each roughly 35–70ms after the previous, capped at `motion.staggerMaxDelay` (280ms) so a long list doesn't take seconds to finish appearing. Tokens in `src/utils/tokens.ts`'s `motion` object; `GroupedRow`/`GroupedList` wire this automatically via the `position.index` passed through `GroupedList`'s `renderItem`, `FeatureTile` via an optional `index` prop callers must pass explicitly when mapping a grid.
- **Count-up:** a headline total (Home Worth/Month, an overview hero figure) eases from its previous value to the new one via `src/hooks/useCountUp.ts` (`motion.countUpDuration`, 700ms) whenever the underlying number changes — not on every render, and it respects the OS reduce-motion setting.
- **Haptics:** `expo-haptics` light impact on `Button`/`FAB`/`GroupedRow` press and `DatePicker` open, medium impact on a destructive-tone `Button`, selection haptic on a `SearchableSelect` row choice. Tactile feedback confirms an action landed; it is not decoration, so it's reserved for things that actually did something (a press, a selection) — never a passive state change.
- Existing press-scale feedback (`usePressAnimation`, scale 0.97/0.94, ~150ms) is unchanged and layers underneath the above.

## Shapes

Continuous, generous corners — nothing under 8px. Scale: `chip` 8 (badges, small tags), `control` 12 (inputs, buttons), `row` 14 (grouped list rows — kept from the incumbent system), `card` 18 (cards, tiles, hero surfaces — up from the incumbent 6px), `sheet` 24 (modals/bottom sheets, top corners only), `pill` 999 (FAB, small status chips, segmented controls). Icon chips inside rows/tiles stay squircle-ish at 11–14px radius on a 34–48px box, per the incumbent `GroupedRow`/`FeatureTile` pattern.

## Components

### Buttons
- **Shape:** 12px radius (`control`), fixed 50pt height (was fixed 200pt *width* before — now full-width or content-width, never a fixed narrow box).
- **Primary (filled, primary tone):** `gradientPrimary` fill (diagonal, see Gradients), `on-primary` text, 600 weight, light haptic on press. Used once per screen/section for the one recommended action.
- **Tonal:** `tint(primary)` background (~13% alpha), `primary` text — the default secondary action, used more often than outline.
- **Plain:** no background, `primary` text — tertiary/cancel actions.
- **Destructive:** same three variants, `negative` in place of `primary` — filled destructive stays a *flat* `negative` fill, not a gradient (a gradient delete button reads as an invitation, not a warning), and fires a medium haptic instead of light.
- **States:** every variant gets pressed (scale 0.97 + slight opacity drop, ~150ms), disabled (40% opacity, no press feedback), and loading (spinner replaces label at identical height — kept from incumbent `Button`).

### Cards / Containers
- **Corner Style:** 18px (`card`), up from 6px.
- **Background:** `surface`, sitting on the `background` (grouped) canvas — see The Grouped Canvas Rule.
- **Shadow Strategy:** ambient shadow only when the card is meant to feel elevated (hero/stat cards); otherwise a hairline border, no shadow.
- **Internal Padding:** 16px (`base`).

### Grouped Rows / Lists
- **Style:** unchanged in spirit from the incumbent `GroupedRow`/`GroupedList` — hairline-separated rows sharing one 14px-radius rounded container per section, icon chip + text column + trailing content. This is the canonical way to present any collection; screens still using a bespoke `FlatList` row are migrated to it. Icon chip is a subtle accent-hue gradient wash (see Gradients); rows stagger in on mount and fire a light haptic on press.

### FAB
- **Style:** 60pt circle, `gradientPrimary` fill, `on-primary` icon, Ambient shadow, spring press (scale to 0.94 on press-in), light haptic on press. No glass treatment — glass is reserved for the OS-owned tab bar.

### Inputs / Fields
- **Style:** `inputBackground` fill, 12px radius (`control`), no border at rest.
- **Focus:** 1.5px `primary` border, plus a subtle `primary`-coloured glow shadow (a controlled exception to hairline-first — the glow is soft/low-opacity, not a heavy ring, and only ever on the field that currently has focus).
- **Error:** 1.5px `negative` border + matching subtle glow + footnote-sized helper text below.
- **Date fields:** a calendar glyph trailing the value, selection haptic on open.

### Bottom Sheets
- **`BottomSheet` (`src/components/BottomSheet.tsx`):** the standard primitive for any bottom-anchored picker/sheet-style popup — gesture-driven drag-to-dismiss from a handle, spring open/close, blurred+dimmed backdrop on iOS (flat dim elsewhere). `SearchableSelect` and `MetalRatesModal` are both built on it. A full-screen viewer or a small centered alert-style dialog does **not** need to move onto this — it's for sheets, not every `Modal`.
- **`SearchableSelect`:** rebuilt on `BottomSheet` — sticky search bar with a clear button, icon-chip avatar (initial letter) per row, tonal-highlighted selected row with a checkmark, selection haptic. Same external prop API as before.

### Navigation
- **iOS:** native Liquid Glass `NativeTabs` bottom bar (kept, untouched). Native-stack headers with `headerLargeTitle` on top-level hub screens (Home, module index screens), inline title on detail/edit screens.
- **Android/Web:** JS `Tabs` bottom bar (kept — cannot be native Liquid Glass off-iOS per HIG; styled as a clean tonal/flat bar matching the token system, not an attempt to fake glass). Standard stack header, large custom title rendered in-content on hub screens.

## Do's and Don'ts

### Do:
- **Do** put every screen's root background on the grouped-canvas neutral, and every card/row on `surface`.
- **Do** reuse `GroupedRow`/`GroupedList`/`FeatureTile`'s existing pattern language for any new or migrated list/tile UI.
- **Do** use real `expo-blur` system materials on iOS for anything meant to feel like glass; never a semi-transparent `View` standing in for it.
- **Do** keep the iOS `NativeTabs` Liquid Glass bar exactly as implemented.
- **Do** import `Text`/`TextInput` from `src/components/Text.tsx`/`TextInput.tsx`, never from `"react-native"` directly.
- **Do** use the Split-Card Pattern (see Gradients) for a new hero-total moment, and put any accent-coded content on its flat zone, not its gradient zone.
- **Do** use `BottomSheet` for any new bottom-anchored picker/sheet popup instead of a bare `Modal`.

### Don't:
- **Don't** give any element a fixed narrow width button box (the old 200pt `Button` width) — buttons size to content or container.
- **Don't** stack shadows on every card in a list — hairlines separate rows; shadow is reserved for floating elements.
- **Don't** introduce NativeWind/Tailwind `className` usage — the codebase's established pattern is `StyleSheet.create` + `useTheme()`, and this pass keeps it.
- **Don't** touch data models, Supabase queries, navigation structure/tab order, or access-control logic — this remains a visual pass only.
- **Don't** put a gradient wash on an ordinary `GroupedRow`, `Card`, or `FeatureTile` background — one hero moment per screen, not decoration everywhere.
- **Don't** fire a haptic on a passive state change (a value updating, a screen loading) — only on an action the user actually took.
