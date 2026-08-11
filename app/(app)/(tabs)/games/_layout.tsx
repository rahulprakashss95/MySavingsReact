import { Stack } from "expo-router";
import MenuButton from "../../../../src/components/MenuButton";
import ProfileButton from "../../../../src/components/ProfileButton";
import { useTheme } from "../../../../src/context/ThemeContext";

export default function GamesStack() {
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
          title: "Games",
          headerLeft: () => <MenuButton />,
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen name="2048" options={{ title: "2048" }} />
      <Stack.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
    </Stack>
  );
}
