# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Members of a single family (or small trusted group) tracking their shared and individual finances and possessions. One or more admins manage membership and module access; other members see only the modules (Assets, Ledger, Documents/Records) they've been granted. Used personally, day-to-day, roughly equally across iPhone, Android, and web/desktop — confirmed with the user.

## Product Purpose

AssetDiary is a private household ledger and asset register. It replaces scattered spreadsheets/notebooks with one place to record what the family owns (bank accounts, gold/ornaments, property, vehicles), what it earns and spends (ledger: earnings, expenses, savings, clients), and its paperwork (bank documents, government documents). Success is a family member being able to answer "what do we have, what did we earn/spend this month, and where's that document" in seconds, on whichever device is at hand.

## Positioning

Not a bank-linked fintech aggregator and not a generic spreadsheet: it's a manually-curated, family-shared record with per-member access control (admin vs. granted-module member) and a lightweight family-recovery flow, purpose-built for personal/household bookkeeping rather than business accounting.

## Operating Context

- Expo/React Native app (expo-router), shipping to iOS, Android, and web from one codebase.
- Passcode/biometric app lock (Face ID / fingerprint) guards entry on device.
- Data syncs via Supabase.
- Six-tab structure: Home, Ledger, Assets, Records, Games (a casual break, open to everyone), Settings.
- iOS uses a real native `UITabBar` (expo-router `NativeTabs`, Liquid Glass on iOS 26) for the bottom tab bar; Android/web use a JS-rendered tab bar. This split is intentional and must be preserved.

## Capabilities and Constraints

- React Native (0.86) + Expo SDK 57, expo-router, Zustand + React Query, Supabase backend.
- Styling today is 100% `StyleSheet.create` driven by a `useTheme()` hook and a light/dark `ThemeColors` token object (`src/utils/Color.ts`) — NativeWind/Tailwind classes are configured but unused in `src/`. New work should keep using this established StyleSheet + token pattern rather than introducing `className`.
- `expo-blur`, `expo-haptics`, `expo-linear-gradient`, `react-native-svg`, and `@expo-google-fonts/plus-jakarta-sans` are installed (added 2026-08 for native materials/haptics/gradients/charts/typography — see DESIGN.md). `react-native-gesture-handler` and `react-native-reanimated` (already present) power the gesture-driven `BottomSheet` primitive.
- Repo-wide `npx eslint "src/**"` is currently broken (ESLint 10.8.1 installed, but only a legacy `.eslintrc.json` exists — no flat `eslint.config.js`) — pre-existing, not introduced by any UI pass. `npx tsc --noEmit` is the reliable verification command until that's fixed.
- Module-based access control (`canSeeModule`) gates tabs and content per member; admins see everything.

## Brand Commitments

- Product name: AssetDiary. Primary brand color today: `#26619c` (steel blue), used as `primary`/tint across light and dark themes.
- The iOS bottom tab bar must remain the native Liquid Glass `NativeTabs` implementation — explicitly requested, not to be replaced with a custom/JS tab bar.

## Evidence on Hand

- Full existing implementation: 43 screens under `src/screens/`, shared components under `src/components/`, theme tokens in `src/utils/Color.ts`, routes under `app/`. This is the incumbent visual system (mixed maturity — some components like `GroupedRow`/`GroupedList`/`FeatureTile` are already fairly refined; others like `Button`/`Card`/`FAB` are dated flat styling from an earlier pass).
- No logo/brand assets beyond `app.json` icon references were reviewed for this pass.

## Product Principles

1. Family data, handled carefully: the redesign changes look, not data, permissions, or navigation structure.
2. Native-feeling on each platform rather than one skin stretched over three OSes — but sharing one token system and one component API so the app stays maintainable by one person.
3. Task-first (Operate mode): the interface should disappear into balancing the books, not perform for attention.
4. Consistency beats novelty: one button, one card, one list-row vocabulary reused everywhere beats bespoke one-off styling per screen.

## Accessibility & Inclusion

Dark mode is a first-class, already-implemented mode (system/light/dark). No other accessibility requirement was raised; standard touch-target and contrast practice applies.
