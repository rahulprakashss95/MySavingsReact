import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

/**
 * Signed-in area. The tab group lives here as a headerless entry; Profile,
 * Settings and Admin are pushed over it with their own headers.
 */
export default function AppLayout() {
  const { user, isRestoring } = useAuth();
  const { colors } = useTheme();

  // On a cold deep link straight into the signed-in area, wait for the session
  // to restore before deciding — otherwise we bounce to /login and back.
  if (isRestoring) {
    return null;
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        // Without this, iOS's back button shows the *previous* screen's title
        // as text next to the chevron — defaulting to the raw route name
        // "(tabs)" for Profile/Admin, since that group has no title of its own.
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          // `headerShown: false` only hides *this* screen's own header — iOS
          // still reads its `title` for the back button's long-press menu, so
          // without one it falls back to the raw route name "(tabs)". Not a
          // specific tab's name: whichever tab is showing when Profile/Settings
          // gets opened is where "back" actually returns to, and this one
          // title has to stand in for all of them.
          title: "AssetDiary",
        }}
      />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="admin" options={{ title: "Family Admin" }} />
    </Stack>
  );
}
