import { Stack } from "expo-router";
import MenuButton from "../../../../src/components/MenuButton";
import ProfileButton from "../../../../src/components/ProfileButton";
import { useTheme } from "../../../../src/context/ThemeContext";

export default function HomeStack() {
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
          title: "Home",
          headerLeft: () => <MenuButton />,
          // Large titles reserve extra header height everywhere in this app
          // (see the other tab stacks) — off app-wide for a tighter header.
          // Home also has its own "Good morning" greeting doing the title's job.
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
