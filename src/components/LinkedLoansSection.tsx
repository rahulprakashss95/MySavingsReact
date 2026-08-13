import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Text from "./Text";
import FormSection from "./FormSection";
import { useTheme } from "../context/ThemeContext";
import { useCollectionState } from "../query/hooks";
import { AccountModel, LinkedAssetType } from "../models/AccountModel";
import { LedgerClientModel } from "../models/LedgerModel";
import { accountInstitution } from "../utils/deposits";
import { isLoanSettled, linkedLoansFor } from "../utils/loans";
import { ThemeColors } from "../utils/Color";
import { amountFormat } from "../utils/Utils";

type Props = {
  assetType: LinkedAssetType;
  /** Blank while the record is still being created — nothing can link to it yet. */
  assetId: string;
};

/**
 * Read-only: a Property/Vehicle doesn't store the link itself (see
 * `linkedLoansFor`), so there's nothing here to edit — only somewhere to jump
 * from. Renders nothing when no loan points at this record.
 */
const LinkedLoansSection = ({ assetType, assetId }: Props) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const accountState = useCollectionState<AccountModel>("accounts");
  const contactState = useCollectionState<LedgerClientModel>("ledgerClients");
  const loans = linkedLoansFor(accountState.items, assetType, assetId);

  if (loans.length === 0) {
    return null;
  }

  return (
    <FormSection title="Linked loan">
      {loans.map((loan) => {
        const settled = isLoanSettled(loan);
        return (
          <Pressable
            key={loan.id}
            onPress={() => router.push(`/assets/accounts/${loan.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text style={styles.name}>
                {accountInstitution(loan, contactState.items)}
              </Text>
              <Text style={[styles.status, settled && styles.settled]}>
                {settled ? "Settled" : `₹ ${amountFormat(loan.balance)} left`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        );
      })}
    </FormSection>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    pressed: {
      opacity: 0.6,
    },
    rowText: {
      flex: 1,
    },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    status: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
      fontVariant: ["tabular-nums"],
    },
    settled: {
      color: colors.positive,
    },
  });

export default LinkedLoansSection;
