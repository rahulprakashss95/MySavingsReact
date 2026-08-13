import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../../../../../src/context/ThemeContext";
import { AccountModel } from "../../../../../../src/models/AccountModel";
import { useCollectionState } from "../../../../../../src/query/hooks";
import AccountPaymentsScreen from "../../../../../../src/screens/AccountPaymentsScreen";

/**
 * Payments belong to an existing loan, so we resolve the full record from the
 * cache by id and hand it to the screen (which seeds its entries from it at
 * mount). Wait for the fetch on a cold deep link; if the id is unknown once
 * loaded, fall back to the accounts list.
 */
export default function AccountPaymentsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const accounts = useCollectionState<AccountModel>("accounts");

  const account = accounts.items.find((a) => a.id === id) ?? null;

  if (!account) {
    if (!accounts.hasLoaded) {
      return (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    return <Redirect href="/assets/accounts" />;
  }

  return <AccountPaymentsScreen account={account} />;
}
