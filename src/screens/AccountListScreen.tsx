import React, { useMemo, useState } from "react";
import { View, StyleSheet, FlatList, ScrollView, Pressable, RefreshControl } from "react-native";
import Text from "../components/Text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors, tint } from "../utils/Color";
import { radius } from "../utils/tokens";
import {
  commitSave,
  useAppDispatch,
  useCollectionState,
  useOwnerName,
} from "../query/hooks";
import {
  AccountModel,
  AccountType,
  accountTypeLabel,
  isLiability,
  isLoanAccount,
  isMaturingAccount,
  normalizeAccountType,
} from "../models/AccountModel";
import { canEdit } from "../models/common";
import { LedgerClientModel } from "../models/LedgerModel";
import { PropertyModel, VehicleModel } from "../models/AssetModel";
import { amountFormat, showToast } from "../utils/Utils";
import {
  accountInstitution,
  rdMonthly,
  rdWithPayment,
  sortByMaturity,
} from "../utils/deposits";
import { updateAccount } from "../../database/query";
import { useAuth } from "../context/AuthContext";
import { useAccountTabsStore } from "../context/AccountTabsContext";
import { DepositListSkeleton } from "../components/Skeleton";
import AccountCard from "../components/AccountCard";
import AccountTabsOrderSheet from "../components/AccountTabsOrderSheet";
import FloatingButton from "../components/FAB";
import { useRouter } from "expo-router";
import { useCountUp } from "../hooks/useCountUp";

const AccountListScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // The tab strip's order is a saved preference — see `AccountTabsContext`.
  const tabOrder = useAccountTabsStore((state) => state.order);
  const tabs = useMemo(
    () => tabOrder.map((type) => ({ type, label: accountTypeLabel(type) })),
    [tabOrder]
  );
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  // Opens on whichever tab has been put first. Read once: reordering while the
  // list is open must not yank the reader off the tab they are reading.
  const [activeType, setActiveType] = useState<AccountType>(() => tabOrder[0]);

  // Both served from the store — fetched once, not on every focus. Contacts
  // resolve the counterparty label; accounts carry their own name and balance.
  const accounts = useCollectionState<AccountModel>("accounts");
  const contacts = useCollectionState<LedgerClientModel>("ledgerClients");
  // Only needed to resolve a linked Loan's "Linked to <name>" line — never
  // gates the loader, so the accounts list isn't held up by these fetching.
  const properties = useCollectionState<PropertyModel>("properties");
  const vehicles = useCollectionState<VehicleModel>("vehicles");
  const nameOf = useOwnerName();

  const linkedAssetName = (account: AccountModel) => {
    if (!account.linkedAssetId) return "";
    const source =
      account.linkedAssetType === "Property" ? properties.items : vehicles.items;
    return source.find((item) => item.id === account.linkedAssetId)?.name ?? "";
  };

  const hasLoaded = accounts.hasLoaded && contacts.hasLoaded;
  const isRefreshing = accounts.isRefreshing || contacts.isRefreshing;
  const onRefresh = () => {
    accounts.onRefresh();
    contacts.onRefresh();
  };

  // The active tab's accounts: deposits sort by soonest maturity and loans by
  // soonest due date (both live in `maturityDate`), the rest by largest balance.
  const visible = useMemo(() => {
    const matches = accounts.items.filter(
      (a) => normalizeAccountType(a.accountType) === activeType
    );
    return isMaturingAccount(activeType) || isLoanAccount(activeType)
      ? sortByMaturity(matches)
      : [...matches].sort(
          (a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0)
        );
  }, [accounts.items, activeType]);

  const subtotal = useMemo(
    () => visible.reduce((sum, a) => sum + (Number(a.balance) || 0), 0),
    [visible]
  );
  // Eases between tabs' totals, not just changes within one — switching from
  // Cash to Fixed Deposit reads as a count rather than a jump-cut.
  const animatedSubtotal = useCountUp(subtotal);

  const navigateAddEdit = (data: AccountModel | null) => {
    router.push(
      data
        ? `/assets/accounts/${data.id}`
        : `/assets/accounts/new?type=${encodeURIComponent(activeType)}`
    );
  };

  // Marking an RD instalment paid rewrites its payments array and the balance
  // (paid so far), then upserts — the cache updates in place, no refetch.
  const handleToggleInstalment = (
    account: AccountModel,
    index: number,
    paid: boolean
  ) => {
    const payments = rdWithPayment(account, index, paid);
    const balance = String(payments.filter(Boolean).length * rdMonthly(account));
    dispatch(
      commitSave("accounts", updateAccount(account.id, { ...account, payments, balance }))
    ).catch((err) =>
      showToast("error", "Unable to update", String(err), "bottom")
    );
  };

  // The reorder button is pinned outside the scroller: it belongs to the strip
  // as a whole, so scrolling to the last tab to reach it would be backwards.
  const renderTabs = () => (
    <View style={styles.tabRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabBar}
      >
        {tabs.map(({ type, label }) => {
          const active = type === activeType;
          return (
            <Pressable
              key={type}
              onPress={() => setActiveType(type)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={() => setIsReorderOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Rearrange tabs"
        hitSlop={8}
        style={({ pressed }) => [styles.reorder, pressed && styles.pressed]}
      >
        <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );

  // A tab holds exactly one type, so the subtotal never mixes directions — it
  // just needs saying which way this one points.
  const owes = isLiability(activeType);
  let directionNote = "";
  if (isLoanAccount(activeType)) {
    directionNote = owes ? "you owe" : "owed to you";
  }

  const renderSummary = () => {
    if (!visible.length) {
      return null;
    }
    return (
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {visible.length} {visible.length === 1 ? "entry" : "entries"}
          {directionNote ? ` · ${directionNote}` : ""}
        </Text>
        <Text style={[styles.summaryValue, owes && styles.summaryOwed]}>
          ₹ {amountFormat(Math.round(animatedSubtotal))}
        </Text>
      </View>
    );
  };

  const activeLabel = accountTypeLabel(activeType);

  const renderEmpty = () => {
    if (!hasLoaded) {
      return null;
    }
    // "No lent out yet" doesn't parse — the loan labels are past participles,
    // so they take "Nothing" rather than "No <thing>".
    const title = isLoanAccount(activeType)
      ? `Nothing ${activeLabel.toLowerCase()} yet`
      : `No ${activeLabel.toLowerCase()} yet`;
    return (
      <View style={styles.empty}>
        <Ionicons name="wallet-outline" size={44} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>
          Tap the + button to add {activeType === "Cash" ? "cash" : "one"}.
        </Text>
      </View>
    );
  };

  const reorderSheet = (
    <AccountTabsOrderSheet
      visible={isReorderOpen}
      onClose={() => setIsReorderOpen(false)}
    />
  );

  if (!hasLoaded) {
    return (
      <View style={styles.container}>
        {renderTabs()}
        <View style={styles.listContent}>
          <DepositListSkeleton />
        </View>
        {reorderSheet}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabs()}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={visible}
        keyExtractor={(item, index) => item.id ?? String(index)}
        ListHeaderComponent={renderSummary}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
          />
        }
        renderItem={({ item }) => (
          <AccountCard
            account={item}
            institution={accountInstitution(item, contacts.items)}
            ownerName={nameOf(item.ownerId)}
            linkedAssetName={linkedAssetName(item)}
            onClickCard={navigateAddEdit}
            editable={canEdit(item, user?.id)}
            onToggleInstalment={handleToggleInstalment}
          />
        )}
      />
      <FloatingButton
        accessibilityLabel={`Add ${activeLabel}`}
        onPress={() => navigateAddEdit(null)}
      />
      {reorderSheet}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    // A horizontal ScrollView otherwise stretches to fill the row's height and
    // claims no width of its own — take the space left by the pinned button.
    tabScroll: {
      flex: 1,
    },
    // Sits outside the scroller, so it keeps the strip's height without the
    // pill styling: it isn't a tab and must not read as one.
    reorder: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      backgroundColor: colors.inputBackground,
    },
    pressed: {
      opacity: 0.6,
    },
    tabBar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      gap: 8,
    },
    tab: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 14,
      height: 36,
      justifyContent: "center",
    },
    tabActive: {
      borderColor: colors.primary,
      backgroundColor: tint(colors.primary),
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    tabTextActive: {
      color: colors.primary,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingTop: 14,
      paddingBottom: 90,
      // Fill the list's height so the empty state can center itself; items still
      // sit at the top (default flex-start).
      flexGrow: 1,
      // Keep the cards in a centered column instead of stretching edge-to-edge
      // on wide (web) screens — horizontally centered, still top-aligned.
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
    },
    summary: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 14,
    },
    summaryLabel: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
    },
    summaryValue: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    // Money owed reads in the negative colour so a debt total can't be mistaken
    // for one more pile of money at a glance.
    summaryOwed: {
      color: colors.negative,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      paddingBottom: 60,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
      marginTop: 14,
      textAlign: "center",
    },
    emptyBody: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 20,
    },
  });

export default AccountListScreen;
