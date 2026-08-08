import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Text from "../components/Text";
import { useCollectionState } from "../query/hooks";
import MonthlyEarningsChart from "../components/MonthlyEarningsChart";
import ProgressBar from "../components/ProgressBar";
import { OverviewSkeleton } from "../components/Skeleton";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useCountUp } from "../hooks/useCountUp";
import { hasFeature } from "../models/common";
import { EarningModel, SavingModel } from "../models/LedgerModel";
import { ExpenseModel } from "../models/ExpenseModel";
import { ThemeColors } from "../utils/Color";
import {
  Bucket,
  monthlyByType,
  savingsRate,
  sumAmount,
  totalsBy,
} from "../utils/ledger";
import { gradientAngle, motion } from "../utils/tokens";
import { amountFormat } from "../utils/Utils";

const rupees = (value: number) => `₹ ${amountFormat(Math.round(value))}`;

/** Staggered mount-in for the screen's card blocks below the hero. */
const sectionDelay = (index: number) =>
  Math.min(index * motion.staggerDelay * 2, motion.staggerMaxDelay);

const LedgerOverviewScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Cached, so opening the ledger overview reuses what the earning/saving/
  // expense lists already loaded instead of re-reading the collections.
  const earningState = useCollectionState<EarningModel>("earnings");
  const savingState = useCollectionState<SavingModel>("savings");
  const expenseState = useCollectionState<ExpenseModel>("expenses");
  const earnings = earningState.items;
  const savings = savingState.items;
  const expenses = expenseState.items;

  // Expenses show only for members who hold the Expenses tile.
  const showExpenses = hasFeature(user, "expenses");

  const hasLoaded =
    earningState.hasLoaded && savingState.hasLoaded && expenseState.hasLoaded;
  const isRefreshing =
    earningState.isRefreshing ||
    savingState.isRefreshing ||
    expenseState.isRefreshing;
  const onRefresh = () => {
    earningState.onRefresh();
    savingState.onRefresh();
    expenseState.onRefresh();
  };

  const totalEarned = useMemo(() => sumAmount(earnings), [earnings]);
  const totalSaved = useMemo(() => sumAmount(savings), [savings]);
  const totalSpent = useMemo(() => sumAmount(expenses), [expenses]);
  const rate = savingsRate(totalEarned, totalSaved);
  const animatedEarned = useCountUp(totalEarned);

  const byClient = useMemo(
    () => totalsBy(earnings, (entry) => entry.clientName),
    [earnings]
  );
  // Savings now record a destination account; fall back to the legacy client
  // label for rows written before the account link existed.
  const savingsByAccount = useMemo(
    () => totalsBy(savings, (entry) => entry.accountName || entry.clientName),
    [savings]
  );
  const expensesByType = useMemo(
    () => totalsBy(expenses, (entry) => entry.typeName),
    [expenses]
  );
  // Bounded to the last 12 active months, so the section never grows unbounded
  // the way a per-month list would — older months scroll horizontally.
  const monthlyEarnings = useMemo(() => monthlyByType(earnings), [earnings]);

  /** Bars are scaled against the biggest bucket, not the total — easier to read. */
  const renderBuckets = (buckets: Bucket[], color: string) => {
    const max = Math.max(...buckets.map((bucket) => bucket.total), 1);
    return buckets.map((bucket) => (
      <View key={bucket.label} style={styles.bucket}>
        <View style={styles.bucketTop}>
          <Text style={styles.bucketLabel} numberOfLines={1}>
            {bucket.label}
          </Text>
          <Text style={styles.bucketValue}>{rupees(bucket.total)}</Text>
        </View>
        <View style={styles.barWrap}>
          <ProgressBar progress={bucket.total / max} color={color} />
        </View>
      </View>
    ));
  };

  if (!hasLoaded) {
    return (
      <View style={styles.container}>
        <OverviewSkeleton />
      </View>
    );
  }

  const isEmpty =
    earnings.length === 0 && savings.length === 0 && expenses.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.textMuted}
        />
      }
    >
      <View style={styles.heroCard}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={gradientAngle.start}
          end={gradientAngle.end}
          style={styles.heroTop}
        >
          <Text style={styles.heroLabel}>Total earned</Text>
          <Text style={styles.heroValue}>{rupees(animatedEarned)}</Text>
        </LinearGradient>

        <View style={styles.heroBottom}>
          <View style={styles.heroSplit}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statValue, styles.saved]}>
                {rupees(totalSaved)}
              </Text>
            </View>
            {showExpenses && (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Spent</Text>
                <Text style={[styles.statValue, styles.spent]}>
                  {rupees(totalSpent)}
                </Text>
              </View>
            )}
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Savings rate</Text>
              <Text style={styles.statValue}>{Math.round(rate * 100)}%</Text>
            </View>
          </View>

          <View style={styles.barWrap}>
            <ProgressBar progress={rate} />
          </View>
        </View>
      </View>

      {isEmpty && (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            Nothing recorded yet. Add an earning or a saving and this page fills
            in.
          </Text>
        </View>
      )}

      {monthlyEarnings.months.length > 0 && monthlyEarnings.maxTotal > 0 && (
        <Animated.View
          entering={FadeInDown.delay(sectionDelay(1)).duration(motion.staggerDuration)}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Earnings by month</Text>
          <MonthlyEarningsChart data={monthlyEarnings} />
        </Animated.View>
      )}

      {byClient.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(sectionDelay(2)).duration(motion.staggerDuration)}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Earnings by client</Text>
          {renderBuckets(byClient, colors.chartAmount)}
        </Animated.View>
      )}

      {savingsByAccount.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(sectionDelay(3)).duration(motion.staggerDuration)}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Savings by account</Text>
          {renderBuckets(savingsByAccount, colors.chartInterest)}
        </Animated.View>
      )}

      {showExpenses && expensesByType.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(sectionDelay(4)).duration(motion.staggerDuration)}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>Expenses by type</Text>
          {renderBuckets(expensesByType, colors.chartAmount)}
        </Animated.View>
      )}
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
      paddingBottom: 40,
    },
    // Gradient top zone + flat bottom zone — see AssetOverviewScreen's
    // `HeroCard` for the same split-card pattern and the reasoning.
    heroCard: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.card,
      marginBottom: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
      elevation: 4,
    },
    heroTop: {
      padding: 20,
      paddingBottom: 22,
    },
    heroBottom: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.onPrimary,
      opacity: 0.75,
    },
    heroValue: {
      fontSize: 34,
      fontWeight: "800",
      color: colors.onPrimary,
      marginTop: 8,
      fontVariant: ["tabular-nums"],
    },
    heroSplit: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
      marginBottom: 14,
    },
    stat: {
      flex: 1,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },
    saved: {
      color: colors.positive,
    },
    spent: {
      color: colors.accentAmber,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    barWrap: {
      marginTop: 8,
    },
    bucket: {
      marginBottom: 14,
    },
    bucketTop: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    bucketLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      marginRight: 12,
    },
    bucketValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
  });

export default LedgerOverviewScreen;
