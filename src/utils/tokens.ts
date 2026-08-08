/**
 * Radius, spacing, elevation, and motion scale — the rest of the design token
 * system (colors live in `Color.ts`). Values and rationale: DESIGN.md.
 */

export const radius = {
  chip: 8,
  control: 12,
  row: 14,
  card: 18,
  sheet: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Hairline-first: shadow is reserved for things that visually float (FAB,
 * hero cards, sheets mid-transition) — everything else is separated by a
 * hairline border instead. See DESIGN.md "The Hairline-First Rule".
 */
export const elevation = {
  ambient: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/** Press feedback — one authored interaction, reused by every pressable. */
export const motion = {
  pressDuration: 150,
  pressScale: 0.97,
  fabPressScale: 0.94,
} as const;
