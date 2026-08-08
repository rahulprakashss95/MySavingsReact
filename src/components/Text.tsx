import React, { forwardRef } from "react";
import { StyleSheet, Text as RNText, TextProps } from "react-native";
import { fontForWeight } from "../utils/typography";

/**
 * Drop-in replacement for RN's `Text` that resolves the flattened
 * `fontWeight` to the matching Plus Jakarta Sans static font file — Android
 * doesn't synthesize bold for custom fonts, so `fontWeight: "700"` alone
 * would silently render as regular weight there. Every screen imports this
 * instead of `Text` from `"react-native"` (see the app-wide font codemod);
 * the prop API is unchanged.
 */
const Text = forwardRef<RNText, TextProps>(({ style, ...props }, ref) => {
  const flat = StyleSheet.flatten(style) as { fontWeight?: string | number } | undefined;
  const fontFamily = fontForWeight(flat?.fontWeight);
  return <RNText ref={ref} style={[{ fontFamily }, style]} {...props} />;
});

Text.displayName = "Text";

export default Text;
export { Text };
