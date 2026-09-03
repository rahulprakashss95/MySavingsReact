import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";

/**
 * Manual back chevron for a screen that is the first entry in its own nested
 * Stack (e.g. Settings, pushed onto the signed-in-area Stack but drawing its
 * own header) — native-stack only auto-draws a back button when the *local*
 * stack has history to pop, so a nested Stack's anchor screen never gets one
 * on its own, even though `router.back()` still correctly bubbles up to
 * whichever outer Stack pushed it.
 */
const BackButton = () => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
    >
      <Ionicons
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        size={24}
        color={colors.text}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  icon: {
    padding: 2,
    // Same edge-inset story as MenuButton: native headers already inset
    // headerLeft from the edge; react-native-web's doesn't.
    marginLeft: Platform.OS === "web" ? 12 : 0,
  },
  pressed: {
    opacity: 0.5,
  },
});

export default BackButton;
