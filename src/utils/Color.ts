export const Colors = {
  primary: "#26619c",
  F7F7F7: "#F7F7F7",
};

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBackground: string;
  placeholder: string;
  positive: string;
  negative: string;
  shadow: string;
  overlay: string;
  /** Accents for tiles/icons. Each is legible on `card` in its own theme. */
  accentBlue: string;
  accentAmber: string;
  accentViolet: string;
  /**
   * Bar fills. One hue per chart (magnitude, not identity) — never cycled.
   * Both pass the six-check palette validator against their own surface.
   */
  chartAmount: string;
  chartInterest: string;
  chartTrack: string;
  /**
   * Categorical series hues, assigned in fixed order and never cycled. Six is
   * the cap — a stacked chart folds anything past five slots into "Other"
   * (chartOther). Validated as a set against `card` in each mode: light worst
   * adjacent CVD ΔE 24.2; dark 10.3 (the floor band, so segments carry a 2px
   * surface gap and every value is direct-labelled in the readout).
   */
  chartSeries: string[];
  chartOther: string;
  /**
   * Gradient stops for hero moments only (Home Worth/Month cards, overview
   * heroes, primary Button/FAB fill) — see DESIGN.md "Gradient hero moments,
   * not gradient everywhere". Never used on grouped rows/lists.
   */
  gradientPrimary: [string, string];
  gradientAmber: [string, string];
  gradientViolet: [string, string];
};

/**
 * Icon-chip background: the accent at ~13% alpha. RN and react-native-web both
 * accept 8-digit #RRGGBBAA.
 */
export const tint = (accent: string) => `${accent}22`;

// Grouped-canvas system: `background` is the neutral screen canvas (iOS
// systemGroupedBackground-style), `card` is the surface that sits on top of
// it, and `inputBackground` is a third, slightly-recessed fill so a field
// reads as a hole in a card rather than another card. See DESIGN.md "The
// Grouped Canvas Rule".
export const LightColors: ThemeColors = {
  primary: "#26619c",
  onPrimary: "#ffffff",
  background: "#F2F2F7",
  card: "#ffffff",
  text: "#1C1C1E",
  textMuted: "#6C6C70",
  border: "#E3E3E8",
  inputBackground: "#F0F1F4",
  placeholder: "#9A9AA0",
  positive: "#1b8a3f",
  negative: "#d32f2f",
  shadow: "#000000",
  overlay: "rgba(255, 255, 255, 0.8)",
  accentBlue: "#26619c",
  accentAmber: "#b26a00",
  accentViolet: "#6a3fb5",
  chartAmount: "#26619c",
  chartInterest: "#b26a00",
  chartTrack: "#eceff2",
  chartSeries: ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948"],
  chartOther: "#898781",
  gradientPrimary: ["#3679b8", "#193f68"],
  gradientAmber: ["#d99328", "#8a5300"],
  gradientViolet: ["#8659d1", "#4a2d80"],
};

export const DarkColors: ThemeColors = {
  primary: "#5b9bd5",
  onPrimary: "#0b1622",
  background: "#000000",
  card: "#1C1C1E",
  text: "#F2F2F7",
  textMuted: "#98989D",
  border: "#38383A",
  inputBackground: "#2C2C2E",
  placeholder: "#6C6C70",
  positive: "#4caf50",
  negative: "#ef5350",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.7)",
  accentBlue: "#5b9bd5",
  accentAmber: "#f0b357",
  accentViolet: "#a98eda",
  chartAmount: "#5090cc",
  chartInterest: "#c08420",
  chartTrack: "#2b2b2e",
  chartSeries: ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767"],
  chartOther: "#9ba1a6",
  gradientPrimary: ["#7db4e3", "#33638f"],
  gradientAmber: ["#f7c878", "#b57e26"],
  gradientViolet: ["#c0abe8", "#6f5aa8"],
};
