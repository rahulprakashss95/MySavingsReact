import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MenuButton from "../../../../src/components/MenuButton";
import ProfileButton from "../../../../src/components/ProfileButton";
import { useTheme } from "../../../../src/context/ThemeContext";

/**
 * The Accounts screen carries an extra header action — a shortcut into the
 * institutions directory — alongside the usual profile button.
 */
function AccountsHeaderRight() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Pressable
        onPress={() => router.push("/assets/accounts/institutions")}
        accessibilityRole="button"
        accessibilityLabel="Contacts"
        hitSlop={8}
        style={{ padding: 6 }}
      >
        <Ionicons name="business-outline" size={22} color={colors.text} />
      </Pressable>
      <ProfileButton />
    </View>
  );
}

/** Keeps `index` under deep links from other tabs — see the Settings stack. */
export const unstable_settings = { anchor: "index" };

export default function AssetsStack() {
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
          title: "Assets",
          headerLeft: () => <MenuButton />,
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen name="ornaments/index" options={{ title: "Ornaments" }} />
      <Stack.Screen name="ornaments/[id]" options={{ title: "Ornament" }} />
      <Stack.Screen name="properties/index" options={{ title: "Properties" }} />
      <Stack.Screen
        name="properties/[id]/index"
        options={{ title: "Property" }}
      />
      <Stack.Screen name="vehicles/index" options={{ title: "Vehicles" }} />
      <Stack.Screen name="vehicles/[id]" options={{ title: "Vehicle" }} />
      <Stack.Screen
        name="accounts/index"
        options={{
          // Shorter than the tile's "Cash, Deposits & Dues": a nav bar with a
          // back button and an action on the right has no room for the full name.
          title: "Cash & Dues",
          headerRight: () => <AccountsHeaderRight />,
        }}
      />
      {/* Title is set per-mode (Add/Edit Holding) inside the route. */}
      <Stack.Screen name="accounts/[id]/index" />
      <Stack.Screen
        name="accounts/[id]/payments"
        options={{ title: "Loan Schedule" }}
      />
      <Stack.Screen
        name="accounts/institutions/index"
        options={{ title: "Contacts" }}
      />
      <Stack.Screen
        name="accounts/institutions/[id]"
        options={{ title: "Contact" }}
      />
      <Stack.Screen name="overview" options={{ title: "Overview" }} />
    </Stack>
  );
}
