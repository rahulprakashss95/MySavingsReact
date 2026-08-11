import { Stack } from "expo-router";
import MenuButton from "../../../../src/components/MenuButton";
import ProfileButton from "../../../../src/components/ProfileButton";
import { useTheme } from "../../../../src/context/ThemeContext";

/**
 * Anchors the stack to its index. Without this, arriving from another tab — Home
 * links straight to `settings/dashboard` — makes the pushed screen the only
 * entry in this stack, so it renders with no back button. It only looked right
 * on a second visit, once Settings itself had been opened and left a screen
 * underneath. The anchor puts `index` beneath every deep link from the start.
 */
export const unstable_settings = { anchor: "index" };

export default function SettingsStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerRight: () => <ProfileButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerLeft: () => <MenuButton />,
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen name="passcode" options={{ title: "App Passcode" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
    </Stack>
  );
}
