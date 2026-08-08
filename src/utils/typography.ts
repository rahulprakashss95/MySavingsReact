import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

/** Loaded once via `useFonts` in the root layout. */
export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

/**
 * RN font-weight values used anywhere in the app, mapped to the static font
 * file that actually renders at that weight. Custom (non-system) fonts don't
 * get synthetic bolding on Android, so `fontWeight: "700"` with no matching
 * static file silently renders as regular there — every weight in use must
 * have an entry here.
 */
const WEIGHT_TO_FONT: Record<string, string> = {
  "400": "PlusJakartaSans_400Regular",
  normal: "PlusJakartaSans_400Regular",
  "500": "PlusJakartaSans_500Medium",
  "600": "PlusJakartaSans_600SemiBold",
  "700": "PlusJakartaSans_700Bold",
  bold: "PlusJakartaSans_700Bold",
  "800": "PlusJakartaSans_800ExtraBold",
  "900": "PlusJakartaSans_800ExtraBold",
};

export const fontForWeight = (weight?: string | number | null): string =>
  WEIGHT_TO_FONT[String(weight ?? "400")] ?? WEIGHT_TO_FONT["400"];
