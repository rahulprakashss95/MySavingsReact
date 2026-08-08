import moment from "moment";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  addExpense,
  deleteExpense,
  updateExpense,
} from "../../database/query";
import Button from "../components/Button";
import DatePicker from "../components/DatePicker";
import ExpenseTypePicker from "../components/ExpenseTypePicker";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { canEdit, Visibility } from "../models/common";
import { ExpenseModel } from "../models/ExpenseModel";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { isValidAmount } from "../utils/amount";
import { ThemeColors } from "../utils/Color";
import { DATE_FORMAT } from "../utils/deposits";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The expense being edited, or null to create. Resolved by the route. */
  initial: ExpenseModel | null;
};

const ExpenseAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const expense: ExpenseModel | null = initial;
  const pageMode = expense ? "Edit" : "Add";

  const [typeId, setTypeId] = useState(expense?.typeId ?? "");
  const [typeName, setTypeName] = useState(expense?.typeName ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? "");
  // Expenses are nearly always recorded the day they happen.
  const [date, setDate] = useState(expense?.date ?? moment().format(DATE_FORMAT));
  const [comments, setComments] = useState(expense?.comments ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    expense?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(expense!, user?.id);

  const selectType = (id: string, label: string) => {
    setTypeId(id);
    setTypeName(label);
  };

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!typeId) return "Choose a type. Add one first if the list is empty.";
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
      typeId,
      typeName,
      amount: amount.trim(),
      date,
      comments: comments.trim(),
      visibility,
    };

    const save =
      pageMode === "Add"
        ? addExpense(payload)
        : updateExpense(expense!.id, payload);

    dispatch(commitSave("expenses", save))
      .then(() => router.back())
      .catch((saveError) => {
        showToast("error", "Unable to save", String(saveError), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Expense",
      "Are you sure you want to delete this entry?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("expenses", expense!.id, deleteExpense))
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

        <FormSection title="Expense">
          <ExpenseTypePicker
            selectedId={typeId}
            selectedName={typeName}
            onSelect={selectType}
          />

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
            label="Note"
            onChangeText={setComments}
            value={comments}
            placeholder="What was this expense for…"
            multiline
            numberOfLines={4}
          />
        </FormSection>
      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Expense" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Expense"
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

export default ExpenseAddEditScreen;
