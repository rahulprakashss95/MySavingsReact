import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

/**
 * Header avatar that opens the signed-in member's profile. Shows the member's
 * profile picture, or their initial when they haven't set one — see `Avatar`.
 */
const ProfileButton = () => {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push("/profile")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open your profile"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Avatar user={user} size={32} fontSize={14} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    // Mirrors MenuButton's inset on the other side, so the two sit level. Not
    // on iOS, though — same reason as MenuButton: a one-sided margin stretches
    // iOS 26's Liquid Glass pill (sized to this view's bounding box) into an
    // ellipse instead of a circle, and iOS's own header chrome already insets
    // headerRight from the edge.
    marginRight: Platform.OS === "ios" ? 0 : 12,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default ProfileButton;
