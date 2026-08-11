/**
 * Curated accent presets for Settings > Theme Color. Each preset overrides only
 * the "one interactive tint" (primary / onPrimary / gradientPrimary) — the
 * category accents (blue/amber/violet) and every neutral/semantic color stay
 * fixed per DESIGN.md, so switching accents never touches category identity or
 * chart contrast.
 */
export type AccentKey = "blue" | "teal" | "indigo" | "rose" | "orange";

export type AccentOverride = {
  primary: string;
  onPrimary: string;
  gradientPrimary: [string, string];
};

export type AccentPreset = {
  key: AccentKey;
  label: string;
  /** Swatch shown in the picker — the light-mode primary. */
  swatch: string;
  light: AccentOverride;
  dark: AccentOverride;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    key: "blue",
    label: "Steel Blue",
    swatch: "#26619c",
    light: { primary: "#26619c", onPrimary: "#ffffff", gradientPrimary: ["#3679b8", "#193f68"] },
    dark: { primary: "#5b9bd5", onPrimary: "#0b1622", gradientPrimary: ["#7db4e3", "#33638f"] },
  },
  {
    key: "teal",
    label: "Teal",
    swatch: "#0f7a6c",
    light: { primary: "#0f7a6c", onPrimary: "#ffffff", gradientPrimary: ["#1a9484", "#0b4a40"] },
    dark: { primary: "#4fd6c4", onPrimary: "#04231d", gradientPrimary: ["#8ee8da", "#2a8977"] },
  },
  {
    key: "indigo",
    label: "Indigo",
    swatch: "#4650c9",
    light: { primary: "#4650c9", onPrimary: "#ffffff", gradientPrimary: ["#5c63dd", "#2b2f85"] },
    dark: { primary: "#a7aef2", onPrimary: "#171a44", gradientPrimary: ["#c3c9f7", "#5b62c4"] },
  },
  {
    key: "rose",
    label: "Rose",
    swatch: "#b5305c",
    light: { primary: "#b5305c", onPrimary: "#ffffff", gradientPrimary: ["#d1527a", "#7a1f3d"] },
    dark: { primary: "#f28fac", onPrimary: "#3a0f1f", gradientPrimary: ["#f7b0c6", "#c25980"] },
  },
  {
    key: "orange",
    label: "Orange",
    swatch: "#b8560a",
    light: { primary: "#b8560a", onPrimary: "#ffffff", gradientPrimary: ["#d97a2e", "#8a3c05"] },
    dark: { primary: "#f0a866", onPrimary: "#3a1e04", gradientPrimary: ["#f7c896", "#c2822e"] },
  },
];

export const DEFAULT_ACCENT: AccentKey = "blue";

export const isAccentKey = (value: unknown): value is AccentKey =>
  ACCENT_PRESETS.some((preset) => preset.key === value);

export const getAccentPreset = (key: AccentKey): AccentPreset =>
  ACCENT_PRESETS.find((preset) => preset.key === key) ?? ACCENT_PRESETS[0];
