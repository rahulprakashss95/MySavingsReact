import React, { forwardRef } from "react";
import { StyleSheet, TextInput as RNTextInput, TextInputProps } from "react-native";
import { fontForWeight } from "../utils/typography";

/** Same rationale as `Text.tsx` — resolves `fontWeight` to a static font file. */
const TextInput = forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => {
  const flat = StyleSheet.flatten(style) as { fontWeight?: string | number } | undefined;
  const fontFamily = fontForWeight(flat?.fontWeight);
  return <RNTextInput ref={ref} style={[{ fontFamily }, style]} {...props} />;
});

TextInput.displayName = "TextInput";

export default TextInput;
export { TextInput };
