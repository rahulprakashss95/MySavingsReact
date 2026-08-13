import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  addProperty,
  deleteProperty,
  updateProperty,
} from "../../database/query";
import Button from "../components/Button";
import DualUnitInput from "../components/DualUnitInput";
import FormSection from "../components/FormSection";
import Loader from "../components/Loader";
import LinkedLoansSection from "../components/LinkedLoansSection";
import SearchableSelect from "../components/SearchableSelect";
import ReadOnlyBanner from "../components/ReadOnlyBanner";
import ReadOnlyGuard from "../components/ReadOnlyGuard";
import Text from "../components/Text";
import TextField from "../components/TextField";
import VisibilityToggle from "../components/VisibilityToggle";
import PortfolioToggle from "../components/PortfolioToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { commitDelete, commitSave, useAppDispatch } from "../query/hooks";
import { canEdit, includedInPortfolio, Visibility } from "../models/common";
import { CENTS_PER_ACRE_LABEL, PROPERTY_TYPES, PropertyModel } from "../models/AssetModel";
import { CENTS_PER_ACRE, hasArea } from "../utils/assets";
import { ThemeColors } from "../utils/Color";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The property being edited, or null to create. Resolved by the route. */
  initial: PropertyModel | null;
};

const PropertyAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const property: PropertyModel | null = initial;
  const pageMode = property ? "Edit" : "Add";

  const [propertyType, setPropertyType] = useState(property?.propertyType ?? "");
  const [name, setName] = useState(property?.name ?? "");
  const [cents, setCents] = useState(property?.cents ?? "");
  const [description, setDescription] = useState(property?.description ?? "");
  const [totalAmount, setTotalAmount] = useState(property?.totalAmount ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    property?.visibility ?? "private"
  );
  const [includeInPortfolio, setIncludeInPortfolio] = useState(
    property ? includedInPortfolio(property) : true
  );
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(property!, user?.id);

  const showsArea = hasArea(propertyType);

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!propertyType) return "Choose a property type.";
    if (!name.trim()) return "Give the property a name.";
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
      propertyType,
      name: name.trim(),
      // A car has no area. Clear it rather than keeping a stale figure from a
      // type the user switched away from.
      cents: showsArea ? cents.trim() : "",
      description: description.trim(),
      totalAmount: totalAmount.trim(),
      visibility,
      includeInPortfolio,
    };

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
      "Are you sure you want to delete this property?"
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
        <PortfolioToggle
          value={includeInPortfolio}
          onChange={setIncludeInPortfolio}
        />
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

      <FormSection title="Value">
        <TextField
          label="Value"
          prefix="₹"
          onChangeText={setTotalAmount}
          value={totalAmount}
          placeholder="0"
          keyboardType="numeric"
        />
      </FormSection>

      {property && (
        <LinkedLoansSection assetType="Property" assetId={property.id} />
      )}

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
    primaryButton: {
      marginTop: 6,
      marginBottom: 10,
    },
  });

export default PropertyAddEditScreen;
