import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  addExpenseType,
  deleteExpenseType,
  updateExpenseType,
} from "../../../database/query";
import { useAuth } from "../../context/AuthContext";
import { canEdit, Visibility } from "../../models/common";
import { ExpenseTypeModel } from "../../models/ExpenseModel";
import { commitDelete, commitSave, useAppDispatch } from "../../query/hooks";
import { showConfirmationAlert, showToast } from "../../utils/Utils";
import Button from "../Button";
import FormSection from "../FormSection";
import Loader from "../Loader";
import ReadOnlyBanner from "../ReadOnlyBanner";
import ReadOnlyGuard from "../ReadOnlyGuard";
import TextField from "../TextField";
import VisibilityToggle from "../VisibilityToggle";

type Props = {
  /** The type being edited, or null/undefined to add a new one. */
  initial?: ExpenseTypeModel | null;
  /** Called with the stored record after a successful save. */
  onSaved: (saved: ExpenseTypeModel) => void;
  /** Called after a successful delete (edit mode only). */
  onDeleted?: () => void;
};

/**
 * The expense-type form (just a name) shared by the full-screen add/edit and
 * the "Add Type" popup on the expense form. Owns its own state and writes; the
 * parent supplies the scroll container.
 */
const ExpenseTypeForm = ({ initial, onSaved, onDeleted }: Props) => {
  const type = initial ?? null;
  const isEdit = !!type;

  const [name, setName] = useState(type?.name ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    type?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const dispatch = useAppDispatch();

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = isEdit && !canEdit(type!, user?.id);

  const handleSave = () => {
    if (!name.trim()) {
      showToast("error", "Incomplete form", "Enter the type's name.", "bottom");
      return;
    }

    setIsLoading(true);
    const payload = { name: name.trim(), visibility };
    const write = isEdit
      ? updateExpenseType(type!.id, payload)
      : addExpenseType(payload);

    dispatch(commitSave("expenseTypes", write))
      .then((saved) => onSaved(saved))
      .catch((error) => {
        showToast("error", "Unable to save", String(error), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Type",
      "Expenses already recorded against this type are kept. Continue?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("expenseTypes", type!.id, deleteExpenseType))
        .then(() => onDeleted?.())
        .catch((error) => {
          showToast("error", "Unable to delete", String(error), "bottom");
        })
        .finally(() => setIsLoading(false));
    });
  };

  return (
    <>
      <Loader loading={isLoading} />

      <ReadOnlyBanner show={readOnly} />

      <ReadOnlyGuard active={readOnly}>
        <FormSection>
          <VisibilityToggle value={visibility} onChange={setVisibility} />
        </FormSection>

        <FormSection title="Expense type">
          <TextField
            label="Name"
            onChangeText={setName}
            value={name}
            placeholder="e.g. Groceries"
            autoCapitalize="words"
          />
        </FormSection>
      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={isEdit ? "Save Changes" : "Add Type"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {isEdit && !readOnly && onDeleted && (
        <Button
          title="Delete Type"
          variant="plain"
          tone="destructive"
          onPress={handleDelete}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    marginTop: 6,
    marginBottom: 10,
  },
});

export default ExpenseTypeForm;
