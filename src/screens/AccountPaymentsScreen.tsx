import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Text from "../components/Text";
import { updateAccount } from "../../database/query";
import { commitSave, useAppDispatch, useCollectionState } from "../query/hooks";
import Button from "../components/Button";
import DatePicker from "../components/DatePicker";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import ProgressBar from "../components/ProgressBar";
import TextField from "../components/TextField";
import { useTheme } from "../context/ThemeContext";
import { useCountUp } from "../hooks/useCountUp";
import { AccountModel, PaymentEntry } from "../models/AccountModel";
import { LedgerClientModel } from "../models/LedgerModel";
import {
  generateMonthlySchedule,
  loanTotals,
  newEntryId,
  sortEntries,
} from "../utils/loans";
import { isValidAmount } from "../utils/amount";
import { ThemeColors } from "../utils/Color";
import { gradientAngle, radius } from "../utils/tokens";
import { DATE_FORMAT } from "../utils/deposits";
import {
  amountFormat,
  showConfirmationAlert,
  showToast,
} from "../utils/Utils";

type Props = {
  /** The loan whose schedule is being managed. Resolved by the route. */
  account: AccountModel;
};

/**
 * Entries live inside the account document, so every change here rewrites the
 * whole account. State is held locally and pushed on each edit — the list is
 * small, and it keeps the screen responsive.
 */
const AccountPaymentsScreen = ({ account }: Props) => {
  const [entries, setEntries] = useState<PaymentEntry[]>(account.entries ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const [showGenerate, setShowGenerate] = useState(false);
  const [genAmount, setGenAmount] = useState("");
  const [genMonths, setGenMonths] = useState("");
  const [genStartDate, setGenStartDate] = useState(
    moment().format(DATE_FORMAT)
  );

  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const contactState = useCollectionState<LedgerClientModel>("ledgerClients");
  const counterparty = contactState.items.find((c) => c.id === account.contactId);

  const totals = loanTotals({ principal: account.principal, entries });
  const sorted = useMemo(() => sortEntries(entries), [entries]);
  // The one hero moment on this screen — same gradient-top/flat-bottom split
  // card as the Overview screen's headline, so "what's still owed" reads as
  // this screen's one big number rather than another card among cards.
  const animatedRemaining = useCountUp(totals.remaining);

  /** Writes the new set, rolling back the local state if the write fails. */
  const persist = (next: PaymentEntry[], failureTitle: string) => {
    const previous = entries;
    setEntries(next);
    setIsLoading(true);

    const { id, ...input } = { ...account, entries: next };
    dispatch(commitSave("accounts", updateAccount(account.id, input)))
      .catch((error) => {
        setEntries(previous);
        showToast("error", failureTitle, String(error), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleAdd = () => {
    if (!isValidAmount(amount)) {
      showToast("error", "Missing amount", "Enter an amount.", "bottom");
      return;
    }
    if (!date) {
      showToast("error", "Missing date", "Pick a date.", "bottom");
      return;
    }

    const entry: PaymentEntry = {
      id: newEntryId(),
      label: label.trim(),
      date,
      amount: amount.trim(),
      paid: false,
    };

    persist([...entries, entry], "Unable to add");
    setAmount("");
    setLabel("");
    setDate("");
  };

  const handleGenerate = () => {
    if (!isValidAmount(genAmount)) {
      showToast("error", "Missing amount", "Enter the monthly amount.", "bottom");
      return;
    }
    if (Number(genMonths) <= 0) {
      showToast("error", "Missing months", "Enter the number of months.", "bottom");
      return;
    }

    const generated = generateMonthlySchedule({
      amount: genAmount.trim(),
      months: Number(genMonths),
      startDate: genStartDate,
    });

    persist([...entries, ...generated], "Unable to generate");
    setShowGenerate(false);
    setGenAmount("");
    setGenMonths("");
  };

  const togglePaid = (entry: PaymentEntry) => {
    persist(
      entries.map((candidate) =>
        candidate.id === entry.id
          ? { ...candidate, paid: !candidate.paid }
          : candidate
      ),
      "Unable to update"
    );
  };

  const handleDelete = (entry: PaymentEntry) => {
    showConfirmationAlert(
      "Delete Payment",
      "Are you sure? This cannot be undone."
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      persist(
        entries.filter((candidate) => candidate.id !== entry.id),
        "Unable to delete"
      );
    });
  };

  const renderEntry = (entry: PaymentEntry) => (
    <View key={entry.id} style={styles.entry}>
      <Pressable
        onPress={() => togglePaid(entry)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: entry.paid }}
        accessibilityLabel={`${entry.label || entry.date}, ${
          entry.paid ? "paid" : "unpaid"
        }`}
        style={({ pressed }) => [
          styles.checkbox,
          entry.paid && styles.checkboxChecked,
          pressed && styles.pressed,
        ]}
      >
        {entry.paid && (
          <Ionicons name="checkmark" size={15} color={colors.onPrimary} />
        )}
      </Pressable>

      <View style={styles.entryText}>
        <Text style={[styles.entryAmount, entry.paid && styles.entryPaid]}>
          ₹ {amountFormat(entry.amount)}
        </Text>
        <Text style={styles.entryMeta}>
          {entry.label ? `${entry.label} · ` : ""}
          {entry.date || "No date"}
        </Text>
      </View>

      <Pressable
        onPress={() => handleDelete(entry)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Delete entry"
        style={({ pressed }) => [styles.trash, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.negative} />
      </Pressable>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Loader loading={isLoading} />

      <View style={styles.heroCard}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={gradientAngle.start}
          end={gradientAngle.end}
          style={styles.heroTop}
        >
          <Text style={styles.loanName}>{counterparty?.name || "Loan"}</Text>
          {!!account.interestPercentage && (
            <Text style={styles.rate}>{account.interestPercentage}% p.a.</Text>
          )}

          <Text style={styles.remaining}>
            ₹ {amountFormat(Math.round(animatedRemaining))}
          </Text>
          <Text style={styles.remainingLabel}>
            remaining of ₹ {amountFormat(totals.total)}
          </Text>
        </LinearGradient>

        <View style={styles.heroBottom}>
          <ProgressBar progress={totals.progress} />

          <View style={styles.totalsRow}>
            <Text style={styles.totalsPaid}>
              ₹ {amountFormat(totals.paid)} paid
            </Text>
            {totals.entryCount > 0 && (
              <Text style={styles.totalsCount}>
                {totals.paidCount} of {totals.entryCount} payments
              </Text>
            )}
          </View>
        </View>
      </View>

      <FormSection title="Payments">
        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>
            No payments yet. Add each one below, then tick it off as you pay.
          </Text>
        ) : (
          sorted.map(renderEntry)
        )}
      </FormSection>

      <FormSection title="Add a payment">
        <TextField
          label="Amount"
          prefix="₹"
          onChangeText={setAmount}
          value={amount}
          placeholder="0"
          keyboardType="numeric"
        />

        <DatePicker label="Date" dateValue={date} onDateChange={(next: any) => setDate(next || "")} />

        <TextField
          label="Label (optional)"
          onChangeText={setLabel}
          value={label}
          placeholder="e.g. EMI 4, Floor finish"
        />

        <Button title="Add Payment" onPress={handleAdd} />
      </FormSection>

      <FormSection title="Generate a schedule">
        {showGenerate ? (
          <>
            <TextField
              label="Amount per month"
              prefix="₹"
              onChangeText={setGenAmount}
              value={genAmount}
              placeholder="0"
              keyboardType="numeric"
            />
            <TextField
              label="Number of months"
              suffix="months"
              onChangeText={setGenMonths}
              value={genMonths}
              placeholder="e.g. 12"
              keyboardType="number-pad"
            />
            <DatePicker
              label="First payment date"
              dateValue={genStartDate}
              onDateChange={(next: any) => setGenStartDate(next || genStartDate)}
            />
            <Text style={styles.hint}>
              Creates one unpaid entry per month, spaced from the start date.
              Every row is still editable afterward, so this also works as a
              starting point for a monthly amount that varies.
            </Text>
            <Button title="Generate" onPress={handleGenerate} />
          </>
        ) : (
          <Button
            title="Generate a monthly schedule"
            variant="tonal"
            onPress={() => setShowGenerate(true)}
          />
        )}
      </FormSection>
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
    // Headline — gradient top zone + flat bottom zone, same split-card
    // pattern as the Overview screen's hero (see AssetOverviewScreen).
    heroCard: {
      borderRadius: radius.card,
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
      paddingTop: 16,
      paddingBottom: 20,
    },
    loanName: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.onPrimary,
    },
    rate: {
      fontSize: 13,
      color: colors.onPrimary,
      opacity: 0.75,
      marginTop: 2,
    },
    remaining: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.onPrimary,
      marginTop: 16,
      fontVariant: ["tabular-nums"],
    },
    remainingLabel: {
      fontSize: 13,
      color: colors.onPrimary,
      opacity: 0.75,
      marginTop: 2,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    totalsPaid: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.positive,
      fontVariant: ["tabular-nums"],
    },
    totalsCount: {
      fontSize: 13,
      color: colors.textMuted,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      marginBottom: 12,
    },
    entry: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radius.chip,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    checkboxChecked: {
      backgroundColor: colors.positive,
      borderColor: colors.positive,
    },
    entryText: {
      flex: 1,
    },
    entryAmount: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    entryPaid: {
      color: colors.textMuted,
      textDecorationLine: "line-through",
    },
    entryMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    trash: {
      padding: 6,
    },
    pressed: {
      opacity: 0.6,
    },
  });

export default AccountPaymentsScreen;
