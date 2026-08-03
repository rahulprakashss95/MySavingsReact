import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NavigationProp, showConfirmationAlert } from "../utils/Utils";

type IHeaderActions = {
  navigation: NavigationProp;
};

export const confirmSignOut = async (signOut: () => Promise<void>) => {
  const confirmed = await showConfirmationAlert(
    "Log Out",
    "Are you sure you want to log out?"
  );
  if (confirmed) {
    await signOut();
  }
};

const HeaderActions = ({ navigation }: IHeaderActions) => {
  const { signOut } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => navigation.navigate("Settings")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
      >
        <Ionicons name="settings-outline" size={22} color={colors.text} />
      </Pressable>

      <Pressable
        onPress={() => confirmSignOut(signOut)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Log Out"
        style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
      >
        <Ionicons name="log-out-outline" size={24} color={colors.text} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    padding: 2,
    // marginLeft rather than container `gap`: react-native-web 0.18 drops gap.
    marginLeft: 16,
  },
  pressed: {
    opacity: 0.5,
  },
});

export default HeaderActions;
