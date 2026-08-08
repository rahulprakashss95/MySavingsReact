import moment from "moment";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  addSaving,
  deleteSaving,
  updateSaving,
} from "../../database/query";
import Button from "../components/Button";
import DatePicker from "../components/DatePicker";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { canEdit, Visibility } from "../models/common";
import { SavingModel } from "../models/LedgerModel";
import { isValidAmount } from "../utils/amount";
import { ThemeColors } from "../utils/Color";
import { DATE_FORMAT } from "../utils/deposits";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The saving being edited, or null to create. Resolved by the route. */
  initial: SavingModel | null;
};

const SavingAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const saving: SavingModel | null = initial;
  const pageMode = saving ? "Edit" : "Add";

  const [amount, setAmount] = useState(saving?.amount ?? "");
  const [date, setDate] = useState(saving?.date ?? moment().format(DATE_FORMAT));
  const [comments, setComments] = useState(saving?.comments ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    saving?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(saving!, user?.id);

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!isValidAmount(amount)) return "Enter an amount.";
    if (!date) return "Pick a date.";
    return null;
  };

  const handleSave = () => {
    const error = validationError();
    if (error) {
      showToast("error", "Incomplete form", error, "bottom");
      return;
    }

    setIsLoading(true);
    const payload = {
      // Savings are a plain flow now — no client or account link. The fields
      // stay on the shape for older rows, written blank.
      accountId: "",
      accountName: "",
      clientId: "",
      clientName: "",
      amount: amount.trim(),
      date,
      comments: comments.trim(),
      visibility,
    };

    const save =
      pageMode === "Add" ? addSaving(payload) : updateSaving(saving!.id, payload);

    dispatch(commitSave("savings", save))
      .then(() => router.back())
      .catch((saveError) => {
        showToast("error", "Unable to save", String(saveError), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Saving",
      "Are you sure you want to delete this entry?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("savings", saving!.id, deleteSaving))
        .then(() => router.back())
        .catch((deleteError) => {
          showToast("error", "Unable to delete", String(deleteError), "bottom");
        })
        .finally(() => setIsLoading(false));
    });
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

      <FormSection title="Saving">
        <TextField
          label="Amount"
          prefix="₹"
          onChangeText={setAmount}
          value={amount}
          placeholder="0"
          keyboardType="numeric"
        />

        <DatePicker
          label="Date"
          dateValue={date}
          onDateChange={(next: any) => setDate(next || "")}
        />
      </FormSection>

      <FormSection title="Notes">
        <TextField
          label="Comments"
          onChangeText={setComments}
          value={comments}
          placeholder="Where it went, why you set it aside…"
          multiline
          numberOfLines={4}
        />
      </FormSection>

      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Saving" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Saving"
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
    primaryButton: {
      marginTop: 6,
      marginBottom: 10,
    },
  });

export default SavingAddEditScreen;
