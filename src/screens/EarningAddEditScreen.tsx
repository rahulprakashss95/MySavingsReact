import moment from "moment";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  addEarning,
  deleteEarning,
  updateEarning,
} from "../../database/query";
import Button from "../components/Button";
import DatePicker from "../components/DatePicker";
import LedgerClientPicker from "../components/LedgerClientPicker";
import EarningTypePicker from "../components/EarningTypePicker";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { useTheme } from "../context/ThemeContext";
import { canEdit, Visibility } from "../models/common";
import { EarningModel } from "../models/LedgerModel";
import { isValidAmount } from "../utils/amount";
import { ThemeColors } from "../utils/Color";
import { DATE_FORMAT } from "../utils/deposits";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The earning being edited, or null to create. Resolved by the route. */
  initial: EarningModel | null;
};

const EarningAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const earning: EarningModel | null = initial;
  const pageMode = earning ? "Edit" : "Add";

  const [clientId, setClientId] = useState(earning?.clientId ?? "");
  const [clientName, setClientName] = useState(earning?.clientName ?? "");
  const [type, setType] = useState(earning?.type ?? "");
  const [amount, setAmount] = useState(earning?.amount ?? "");
  // Money is nearly always recorded the day it lands, so today is a fair default.
  const [date, setDate] = useState(
    earning?.date ?? moment().format(DATE_FORMAT)
  );
  const [comments, setComments] = useState(earning?.comments ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    earning?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(earning!, user?.id);

  const selectClient = (id: string, label: string) => {
    setClientId(id);
    setClientName(label);
  };

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!clientId) return "Choose a client. Add one first if the list is empty.";
    if (!type) return "Choose an earning type.";
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
      clientId,
      clientName,
      type,
      amount: amount.trim(),
      date,
      comments: comments.trim(),
      visibility,
    };

    const save =
      pageMode === "Add"
        ? addEarning(payload)
        : updateEarning(earning!.id, payload);

    dispatch(commitSave("earnings", save))
      .then(() => router.back())
      .catch((saveError) => {
        showToast("error", "Unable to save", String(saveError), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Earning",
      "Are you sure you want to delete this entry?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("earnings", earning!.id, deleteEarning))
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

      <FormSection title="Earning">
        <LedgerClientPicker
          selectedId={clientId}
          selectedName={clientName}
          onSelect={selectClient}
        />

        <EarningTypePicker selectedName={type} onSelect={setType} />

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
          placeholder="Anything worth remembering about this payment…"
          multiline
          numberOfLines={4}
        />
      </FormSection>

      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Earning" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Earning"
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

export default EarningAddEditScreen;
