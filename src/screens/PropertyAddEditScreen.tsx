import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Text from "../components/Text";
import {
  addProperty,
  deleteProperty,
  updateProperty,
} from "../../database/query";
import Button from "../components/Button";
import DualUnitInput from "../components/DualUnitInput";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import SearchableSelect from "../components/SearchableSelect";
import ProgressBar from "../components/ProgressBar";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { canEdit, Visibility } from "../models/common";
import {
  CENTS_PER_ACRE_LABEL,
  PaymentMode,
  PROPERTY_TYPES,
  PropertyModel,
} from "../models/AssetModel";
import { CENTS_PER_ACRE, hasArea, paymentTotals } from "../utils/assets";
import { isValidAmount } from "../utils/amount";
import { ThemeColors, tint } from "../utils/Color";
import { radius } from "../utils/tokens";
import { amountFormat, showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The property being edited, or null to create. Resolved by the route. */
  initial: PropertyModel | null;
};

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "full", label: "Paid in Full" },
  { value: "installments", label: "Installments" },
  { value: "loan", label: "Loan" },
];

const PropertyAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const property: PropertyModel | null = initial;
  const pageMode = property ? "Edit" : "Add";

  const [propertyType, setPropertyType] = useState(property?.propertyType ?? "");
  const [name, setName] = useState(property?.name ?? "");
  const [cents, setCents] = useState(property?.cents ?? "");
  const [description, setDescription] = useState(property?.description ?? "");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    property?.paymentMode ?? "full"
  );
  const [totalAmount, setTotalAmount] = useState(property?.totalAmount ?? "");
  const [lender, setLender] = useState(property?.lender ?? "");
  const [interestRate, setInterestRate] = useState(property?.interestRate ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    property?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(property!, user?.id);

  // Entries are owned by the payments screen; this form never edits them, it
  // only carries them through the save so setDoc doesn't wipe them.
  const entries = property?.entries ?? [];
  const showsArea = hasArea(propertyType);
  const totals = paymentTotals({ totalAmount, entries });

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!propertyType) return "Choose a property type.";
    if (!name.trim()) return "Give the property a name.";
    if (paymentMode !== "full" && !isValidAmount(totalAmount)) {
      return paymentMode === "loan"
        ? "Enter the loan amount."
        : "Enter the total amount.";
    }
    if (paymentMode === "loan" && !lender.trim()) return "Enter the lender.";
    return null;
  };

  const buildPayload = () => ({
    propertyType,
    name: name.trim(),
    // A car has no area. Clear it rather than keeping a stale figure from a
    // type the user switched away from.
    cents: showsArea ? cents.trim() : "",
    description: description.trim(),
    paymentMode,
    totalAmount: totalAmount.trim(),
    lender: paymentMode === "loan" ? lender.trim() : "",
    interestRate: paymentMode === "loan" ? interestRate.trim() : "",
    entries,
    visibility,
  });

  const handleSave = () => {
    const error = validationError();
    if (error) {
      showToast("error", "Incomplete form", error, "bottom");
      return;
    }

    setIsLoading(true);
    const payload = buildPayload();

    const save =
      pageMode === "Add"
        ? addProperty(payload)
        : updateProperty(property!.id, payload);

    dispatch(commitSave("properties", save))
      .then(() => router.back())
      .catch((saveError) => {
        showToast("error", "Unable to save", String(saveError), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Property",
      "This deletes the property and its payment history. Are you sure?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("properties", property!.id, deleteProperty))
        .then(() => router.back())
        .catch((deleteError) => {
          showToast("error", "Unable to delete", String(deleteError), "bottom");
        })
        .finally(() => setIsLoading(false));
    });
  };

  /**
   * Commits the form before handing off. The payments screen rewrites the whole
   * property document, so any unsaved edit sitting in this form would otherwise
   * be silently resurrected — or lost — on the next entry it writes.
   */
  const managePayments = () => {
    const error = validationError();
    if (error) {
      showToast("error", "Incomplete form", error, "bottom");
      return;
    }

    setIsLoading(true);
    const payload = buildPayload();
    dispatch(commitSave("properties", updateProperty(property!.id, payload)))
      .then(() => {
        // The save above committed the payload to the cache, so the payments
        // route can resolve the property by id.
        router.push(`/assets/properties/${property!.id}/payments`);
      })
      .catch((saveError) => {
        showToast("error", "Unable to save", String(saveError), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Loader loading={isLoading} />

      <ReadOnlyBanner show={readOnly} />

      <ReadOnlyGuard active={readOnly}>
      <FormSection>
        <VisibilityToggle value={visibility} onChange={setVisibility} />
      </FormSection>

      <FormSection title="Property">
        <SearchableSelect
          label="Type"
          placeholder="Select a property type"
          selectedId={propertyType}
          selectedName={propertyType}
          options={PROPERTY_TYPES.map((type) => ({ id: type, name: type }))}
          onSelect={(id) => setPropertyType(id)}
        />

        <TextField
          label="Name"
          onChangeText={setName}
          value={name}
          placeholder="e.g. Chennai flat"
          autoCapitalize="words"
        />

        {showsArea && (
          <>
            <DualUnitInput
              label="Area"
              value={cents}
              onChange={setCents}
              canonicalUnit="cents"
              derivedUnit="acres"
              perDerivedUnit={CENTS_PER_ACRE}
            />
            <Text style={styles.hint}>{CENTS_PER_ACRE_LABEL}</Text>
          </>
        )}
      </FormSection>

      <FormSection title="Payment">
        <SearchableSelect
          label="How was it paid?"
          placeholder="Select a payment mode"
          selectedId={paymentMode}
          selectedName={
            PAYMENT_MODES.find((mode) => mode.value === paymentMode)?.label
          }
          options={PAYMENT_MODES.map((mode) => ({
            id: mode.value,
            name: mode.label,
          }))}
          onSelect={(id) => setPaymentMode(id as PaymentMode)}
        />

        <TextField
          label={paymentMode === "loan" ? "Loan amount" : "Total amount"}
          prefix="₹"
          onChangeText={setTotalAmount}
          value={totalAmount}
          placeholder="0"
          keyboardType="numeric"
        />

        {paymentMode === "loan" && (
          <>
            <TextField
              label="Lender"
              onChangeText={setLender}
              value={lender}
              placeholder="e.g. HDFC Bank"
              autoCapitalize="words"
            />

            <TextField
              label="Interest rate"
              suffix="% p.a."
              onChangeText={setInterestRate}
              value={interestRate}
              placeholder="0.0"
              keyboardType="decimal-pad"
            />
          </>
        )}

        {paymentMode !== "full" && (
          <>
            {pageMode === "Add" ? (
              <Text style={styles.hint}>
                Save the property first, then add its{" "}
                {paymentMode === "loan" ? "payments" : "installments"}.
              </Text>
            ) : (
              <>
                <ProgressBar progress={totals.progress} />
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsPaid}>
                    ₹ {amountFormat(totals.paid)} paid
                  </Text>
                  <Text style={styles.totalsRemaining}>
                    ₹ {amountFormat(totals.remaining)} left
                  </Text>
                </View>

                <Pressable
                  onPress={managePayments}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.manageButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.manageText}>
                    {paymentMode === "loan"
                      ? "Manage payments"
                      : "Manage installments"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </Pressable>
              </>
            )}
          </>
        )}
      </FormSection>

      <FormSection title="Notes">
        <TextField
          label="Description"
          onChangeText={setDescription}
          value={description}
          placeholder="Survey number, registration details, anything worth noting…"
          multiline
          numberOfLines={4}
        />
      </FormSection>

      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Property" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Property"
          variant="plain"
          tone="destructive"
          onPress={handleDelete}
        />
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
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: -8,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    totalsPaid: {
      fontSize: 13,
      color: colors.positive,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    totalsRemaining: {
      fontSize: 13,
      color: colors.textMuted,
      fontVariant: ["tabular-nums"],
    },
    manageButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tint(colors.primary),
      borderRadius: radius.control,
      paddingVertical: 14,
      marginTop: 16,
    },
    manageText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
      marginRight: 6,
    },
    primaryButton: {
      marginTop: 6,
      marginBottom: 10,
    },
    pressed: {
      opacity: 0.6,
    },
  });

export default PropertyAddEditScreen;
