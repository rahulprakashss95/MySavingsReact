import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  addGovernmentDocument,
  deleteGovernmentDocument,
  updateGovernmentDocument,
} from "../../database/query";
import AttachmentField, { useAttachments } from "../components/AttachmentField";
import Button from "../components/Button";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import SearchableSelect from "../components/SearchableSelect";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { canEdit, Visibility } from "../models/common";
import {
  GOVERNMENT_DOCUMENT_TYPES,
  GovernmentDocumentModel,
} from "../models/DocumentModel";
import { ThemeColors } from "../utils/Color";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The document being edited, or null to create. Resolved by the route. */
  initial: GovernmentDocumentModel | null;
};

const GovernmentDocumentAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const document = initial;
  const pageMode = document ? "Edit" : "Add";

  const [documentType, setDocumentType] = useState(document?.documentType ?? "");
  const [documentNumber, setDocumentNumber] = useState(
    document?.documentNumber ?? ""
  );
  const [description, setDescription] = useState(document?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    document?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);
  const attachments = useAttachments(document?.attachments);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(document!, user?.id);

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!documentType) return "Choose a document type.";
    if (!documentNumber.trim()) return "Enter the document number.";
    return null;
  };

  const handleSave = async () => {
    const error = validationError();
    if (error) {
      showToast("error", "Incomplete form", error, "bottom");
      return;
    }

    setIsLoading(true);
    try {
      // Files first: if an upload fails the record is left untouched, rather
      // than saved pointing at a scan that never made it to the bucket.
      const files = await attachments.commit();

      const payload = {
        documentType,
        documentNumber: documentNumber.trim(),
        description: description.trim(),
        attachments: files,
        visibility,
      };

      const save =
        pageMode === "Add"
          ? addGovernmentDocument(payload)
          : updateGovernmentDocument(document!.id, payload);

      await dispatch(commitSave("governmentDocuments", save));
      // Only once the row no longer references them: a save that threw above
      // leaves the old row intact, and its files must still be there.
      await attachments.cleanup(files);
      router.back();
    } catch (error) {
      showToast("error", "Unable to save", String(error), "bottom");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Document",
      "Are you sure you want to delete this document?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(
        commitDelete("governmentDocuments", document!.id, deleteGovernmentDocument)
      )
        .then(() => router.back())
        .catch((error) => {
          showToast("error", "Unable to delete", String(error), "bottom");
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

      <FormSection title="Document">
        <SearchableSelect
          label="Type"
          placeholder="Select a document type"
          selectedId={documentType}
          selectedName={documentType}
          options={GOVERNMENT_DOCUMENT_TYPES.map((type) => ({
            id: type,
            name: type,
          }))}
          onSelect={(id) => setDocumentType(id)}
        />

        <TextField
          label="Number"
          onChangeText={setDocumentNumber}
          value={documentNumber}
          placeholder="Document number"
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </FormSection>

      <FormSection>
        <AttachmentField
          drafts={attachments.drafts}
          onChange={attachments.setDrafts}
          readOnly={readOnly}
          module="governmentDocuments"
        />
      </FormSection>

      <FormSection title="Notes">
        <TextField
          label="Description"
          onChangeText={setDescription}
          value={description}
          placeholder="Anything worth remembering — issue date, where it's kept…"
          multiline
          numberOfLines={4}
        />
      </FormSection>

      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Document" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Document"
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

export default GovernmentDocumentAddEditScreen;
