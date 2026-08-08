import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import {
  addOrnament,
  deleteOrnament,
  updateOrnament,
} from "../../database/query";
import Button from "../components/Button";
import DualUnitInput from "../components/DualUnitInput";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import SearchableSelect from "../components/SearchableSelect";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { canEdit, Visibility } from "../models/common";
import {
  DEFAULT_GOLD_KARAT,
  GOLD_KARATS,
  GRAMS_PER_PAWN_LABEL,
  ORNAMENT_TYPES,
  OrnamentModel,
} from "../models/AssetModel";
import { GRAMS_PER_PAWN } from "../utils/assets";
import { ThemeColors } from "../utils/Color";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The ornament being edited, or null to create. Resolved by the route. */
  initial: OrnamentModel | null;
};

const OrnamentAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const ornament = initial;
  const pageMode = ornament ? "Edit" : "Add";

  const [ornamentType, setOrnamentType] = useState(ornament?.ornamentType ?? "");
  const [karat, setKarat] = useState(ornament?.karat ?? DEFAULT_GOLD_KARAT);
  const [name, setName] = useState(ornament?.name ?? "");
  const [count, setCount] = useState(ornament?.count ?? "1");
  const [grams, setGrams] = useState(ornament?.grams ?? "");
  const [description, setDescription] = useState(ornament?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    ornament?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // A public record is visible to the whole family but editable only by its
  // owner; anyone else lands here in view-only mode.
  const readOnly = pageMode === "Edit" && !canEdit(ornament!, user?.id);

  // Only gold is karated. Silver and stones have no purity to record.
  const isGold = ornamentType === "Gold";

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!ornamentType) return "Choose a metal.";
    if (!name.trim()) return "Enter the ornament's name.";
    if (!grams.trim() || Number(grams) <= 0) return "Enter the weight.";
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
      ornamentType,
      // Don't leave a karat on a silver chain if the type was switched.
      karat: isGold ? karat : "",
      name: name.trim(),
      count: count.trim() || "1",
      grams: grams.trim(),
      description: description.trim(),
      visibility,
    };

    const save =
      pageMode === "Add"
        ? addOrnament(payload)
        : updateOrnament(ornament!.id, payload);

    dispatch(commitSave("ornaments", save))
      .then(() => router.back())
      .catch((saveError) => {
        showToast("error", "Unable to save", String(saveError), "bottom");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Ornament",
      "Are you sure you want to delete this ornament?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("ornaments", ornament!.id, deleteOrnament))
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

      <FormSection title="Ornament">
        <SearchableSelect
          label="Metal"
          placeholder="Select a metal"
          selectedId={ornamentType}
          selectedName={ornamentType}
          options={ORNAMENT_TYPES.map((type) => ({ id: type, name: type }))}
          onSelect={(id) => setOrnamentType(id)}
        />

        {isGold && (
          <SearchableSelect
            label="Purity"
            placeholder="Select purity"
            selectedId={karat}
            selectedName={karat}
            options={GOLD_KARATS.map((option) => ({ id: option, name: option }))}
            onSelect={(id) => setKarat(id)}
          />
        )}

        <TextField
          label="Name"
          onChangeText={setName}
          value={name}
          placeholder="e.g. Necklace"
          autoCapitalize="words"
        />

        <TextField
          label="Number of pieces"
          onChangeText={setCount}
          value={count}
          placeholder="1"
          keyboardType="number-pad"
        />

        <DualUnitInput
          label="Weight"
          value={grams}
          onChange={setGrams}
          canonicalUnit="grams"
          derivedUnit="pawn"
          perDerivedUnit={GRAMS_PER_PAWN}
        />
        <Text style={styles.hint}>{GRAMS_PER_PAWN_LABEL}</Text>
      </FormSection>

      <FormSection title="Notes">
        <TextField
          label="Description"
          onChangeText={setDescription}
          value={description}
          placeholder="Purity, where it's kept, who gifted it…"
          multiline
          numberOfLines={4}
        />
      </FormSection>

      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Ornament" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Ornament"
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
    primaryButton: {
      marginTop: 6,
      marginBottom: 10,
    },
  });

export default OrnamentAddEditScreen;
