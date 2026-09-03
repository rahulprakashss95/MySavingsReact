import { Stack } from "expo-router";
import BackButton from "../../../src/components/BackButton";
import { useTheme } from "../../../src/context/ThemeContext";

/**
 * Settings is pushed onto the signed-in-area Stack (see `app/(app)/_layout`),
 * not nested under a tab, so it isn't a tab root — but it's *this* nested
 * Stack, not that outer one, that draws its header, and `index` is the first
 * entry in this Stack's own history. Native-stack only auto-renders a back
 * button when the local stack can go back, so `index` needs one set
 * explicitly (`BackButton`, below) even though `router.back()` already
 * bubbles up to the outer Stack correctly on its own.
 *
 * The anchor here is separate: without it, arriving via a deep link — Home
 * links straight to `settings/dashboard` — makes the pushed screen the only
 * entry in this stack, so *it* renders with no way back either. The anchor
 * puts `index` beneath every deep link from the start, which is what gives
 * `dashboard`/`passcode` their own back buttons for free.
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
        // No text next to the back chevron on passcode/dashboard either.
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerLeft: () => <BackButton />,
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen name="passcode" options={{ title: "App Passcode" }} />
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
    </Stack>
  );
}
