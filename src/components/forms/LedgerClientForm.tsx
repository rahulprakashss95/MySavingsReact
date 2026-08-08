import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  addLedgerClient,
  deleteLedgerClient,
  updateLedgerClient,
} from "../../../database/query";
import { useAuth } from "../../context/AuthContext";
import { canEdit, Visibility } from "../../models/common";
import { LedgerClientModel } from "../../models/LedgerModel";
import { commitDelete, commitSave, useAppDispatch } from "../../query/hooks";
import { DEFAULT_DIAL_CODE } from "../../utils/countryCodes";
import { showConfirmationAlert, showToast } from "../../utils/Utils";
import { spacing } from "../../utils/tokens";
import Button from "../Button";
import FormSection from "../FormSection";
import Loader from "../Loader";
import PhoneInput from "../PhoneInput";
import ReadOnlyBanner from "../ReadOnlyBanner";
import ReadOnlyGuard from "../ReadOnlyGuard";
import TextField from "../TextField";
import VisibilityToggle from "../VisibilityToggle";

type Props = {
  /** The contact being edited, or null/undefined to add a new one. */
  initial?: LedgerClientModel | null;
  /** Called with the stored record after a successful save. */
  onSaved: (saved: LedgerClientModel) => void;
  /** Called after a successful delete (edit mode only). */
  onDeleted?: () => void;
};

/**
 * The contact form fields + save/delete, shared by the full-screen add/edit and
 * every "Add Contact" popup — the earning and saving forms, and the account
 * form's counterparty picker. Owns its own state and writes; the parent
 * supplies the scroll container.
 */
const LedgerClientForm = ({ initial, onSaved, onDeleted }: Props) => {
  const client = initial ?? null;
  const isEdit = !!client;

  const [name, setName] = useState(client?.name ?? "");
  const [dialCode, setDialCode] = useState(
    client?.dialCode || DEFAULT_DIAL_CODE
  );
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [description, setDescription] = useState(client?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    client?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const dispatch = useAppDispatch();

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = isEdit && !canEdit(client!, user?.id);

  const handleSave = () => {
    if (!name.trim()) {
      showToast("error", "Incomplete form", "Enter the name.", "bottom");
      return;
    }

    setIsLoading(true);
    const payload = {
      name: name.trim(),
      dialCode,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      description: description.trim(),
      visibility,
    };

    const write = isEdit
      ? updateLedgerClient(client!.id, payload)
      : addLedgerClient(payload);

    dispatch(commitSave("ledgerClients", write))
      .then((saved) => onSaved(saved))
      .catch((error) => {
        showToast("error", "Unable to save", String(error), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Contact",
      "Records already saved against this contact — earnings, savings and accounts — are kept. Continue?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("ledgerClients", client!.id, deleteLedgerClient))
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

        <FormSection title="Contact">
          <TextField
            label="Name"
            onChangeText={setName}
            value={name}
            placeholder="e.g. Acme Corp, HDFC Bank, Ravi"
            autoCapitalize="words"
          />

          <View style={styles.fieldSpacing}>
            <PhoneInput
              dialCode={dialCode}
              onChangeDialCode={setDialCode}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TextField
            label="Email"
            onChangeText={setEmail}
            value={email}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextField
            label="Address"
            onChangeText={setAddress}
            value={address}
            placeholder="Street, city, PIN…"
            multiline
            numberOfLines={3}
          />
        </FormSection>

        <FormSection title="Notes">
          <TextField
            label="Description"
            onChangeText={setDescription}
            value={description}
            placeholder="Anything worth remembering about them…"
            multiline
            numberOfLines={4}
          />
        </FormSection>
      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={isEdit ? "Save Changes" : "Add Contact"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {isEdit && !readOnly && onDeleted && (
        <Button
          title="Delete Contact"
          variant="plain"
          tone="destructive"
          onPress={handleDelete}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fieldSpacing: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    marginTop: 6,
    marginBottom: 10,
  },
});

export default LedgerClientForm;
