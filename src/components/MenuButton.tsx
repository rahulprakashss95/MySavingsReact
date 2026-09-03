import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useDrawer } from "../context/DrawerContext";

/** Header hamburger that opens the app-wide SideDrawer. */
const MenuButton = () => {
  const { colors } = useTheme();
  const { open } = useDrawer();

  return (
    <Pressable
      onPress={open}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
    >
      <Ionicons name="menu" size={26} color={colors.text} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  icon: {
    padding: 2,
    // The native-stack header already insets `headerLeft` from the edge on
    // Android/iOS, so no left margin is needed there. react-native-web's header
    // gives it none, so the icon would sit flush against the edge — add it back
    // on web only. The right margin is the gap before the title — but on iOS,
    // an asymmetric margin (right only, none on the left) makes this view's
    // bounding box wider than it is tall, and iOS 26's Liquid Glass header
    // wraps custom headerLeft views in a pill sized to that box, so a lopsided
    // box stretches an intended circle into an ellipse. iOS's own chrome
    // already spaces the button from the title, so it doesn't need the margin.
    marginLeft: Platform.OS === "web" ? 12 : 0,
    marginRight: Platform.OS === "ios" ? 0 : 16,
  },
  pressed: {
    opacity: 0.5,
  },
});

export default MenuButton;
