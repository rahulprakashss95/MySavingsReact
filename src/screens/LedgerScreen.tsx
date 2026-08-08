import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../components/Text";
import FeatureTile from "../components/FeatureTile";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { hasFeature } from "../models/common";
import { ThemeColors } from "../utils/Color";

const LedgerScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Each tile gates on its own feature key.
  const show = (feature: Parameters<typeof hasFeature>[1]) =>
    hasFeature(user, feature);
  const cashflow = show("earnings") || show("savings") || show("expenses");

  // Tiles are gated individually rather than mapped from an array, but the
  // stagger should still read top-to-bottom across whichever ones are
  // visible — so hand out indices in source order as each one renders.
  let tileIndex = -1;
  const nextTileIndex = () => {
    tileIndex += 1;
    return tileIndex;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* <Text style={styles.lede}>
        Money in, money out, and what you keep.
      </Text> */}

      {cashflow && <Text style={styles.sectionTitle}>Cashflow</Text>}

      <View style={styles.grid}>
        {show("earnings") && (
          <FeatureTile
            index={nextTileIndex()}
            title="Earnings"
            subtitle="Salary & incentives"
            accent={colors.accentBlue}
            renderIcon={(color) => (
              <Ionicons name="trending-up-outline" size={24} color={color} />
            )}
            onPress={() => router.push("/ledger/earnings")}
          />
        )}
        {show("expenses") && (
          <FeatureTile
            index={nextTileIndex()}
            title="Expenses"
            subtitle="What you spend"
            accent={colors.accentAmber}
            renderIcon={(color) => (
              <Ionicons name="receipt-outline" size={24} color={color} />
            )}
            onPress={() => router.push("/ledger/expenses")}
          />
        )}
        {show("savings") && (
          <FeatureTile
            index={nextTileIndex()}
            title="Savings"
            subtitle="What you set aside"
            accent={colors.positive}
            renderIcon={(color) => (
              <Ionicons name="wallet-outline" size={24} color={color} />
            )}
            onPress={() => router.push("/ledger/savings")}
          />
        )}
      </View>

      {show("setup") && (
        <View style={styles.tileSpacing}>
          <FeatureTile
            index={nextTileIndex()}
            wide
            title="Setup"
            subtitle="Earning types, contacts & expense types"
            accent={colors.accentViolet}
            renderIcon={(color) => (
              <Ionicons name="options-outline" size={24} color={color} />
            )}
            onPress={() => router.push("/ledger/setup")}
          />
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Insights</Text>

      <FeatureTile
        index={nextTileIndex()}
        wide
        title="Overview"
        subtitle="Totals, rate & monthly trend"
        accent={colors.accentBlue}
        renderIcon={(color) => (
          <Ionicons name="stats-chart-outline" size={24} color={color} />
        )}
        onPress={() => router.push("/ledger/overview")}
      />
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    lede: {
      fontSize: 16,
      color: colors.textMuted,
      lineHeight: 23,
      marginTop: 4,
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      marginBottom: 12,
    },
    sectionSpacing: {
      marginTop: 28,
    },
    tileSpacing: {
      marginTop: 14,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      // Cashflow has three tiles, so the third wraps to a second row — this is
      // the gap between the rows (columnGap comes free from space-between).
      rowGap: 14,
    },
  });

export default LedgerScreen;
