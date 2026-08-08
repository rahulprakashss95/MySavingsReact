import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  addVehicle,
  deleteVehicle,
  updateVehicle,
} from "../../database/query";
import AttachmentField, { useAttachments } from "../components/AttachmentField";
import Button from "../components/Button";
import DatePicker from "../components/DatePicker";
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
import { VEHICLE_TYPES, VehicleModel } from "../models/AssetModel";
import { ThemeColors } from "../utils/Color";
import { showConfirmationAlert, showToast } from "../utils/Utils";
import { useRouter } from "expo-router";

type Props = {
  /** The vehicle being edited, or null to create. Resolved by the route. */
  initial: VehicleModel | null;
};

const VehicleAddEditScreen = ({ initial }: Props) => {
  const router = useRouter();
  const vehicle = initial;
  const pageMode = vehicle ? "Edit" : "Add";

  const [vehicleType, setVehicleType] = useState(vehicle?.vehicleType ?? "");
  const [name, setName] = useState(vehicle?.name ?? "");
  const [number, setNumber] = useState(vehicle?.number ?? "");
  const [insurer, setInsurer] = useState(vehicle?.insurer ?? "");
  const [policyNumber, setPolicyNumber] = useState(vehicle?.policyNumber ?? "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(
    vehicle?.insuranceExpiry ?? ""
  );
  const [description, setDescription] = useState(vehicle?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    vehicle?.visibility ?? "private"
  );
  const [isLoading, setIsLoading] = useState(false);
  const attachments = useAttachments(vehicle?.attachments);

  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Public records are viewable family-wide but editable only by their owner.
  const readOnly = pageMode === "Edit" && !canEdit(vehicle!, user?.id);

  /** Returns an error message, or null when the form is good to submit. */
  const validationError = () => {
    if (!vehicleType) return "Choose a vehicle type.";
    if (!name.trim()) return "Enter the vehicle's name.";
    if (!number.trim()) return "Enter the registration number.";
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
        vehicleType,
        name: name.trim(),
        number: number.trim(),
        insurer: insurer.trim(),
        policyNumber: policyNumber.trim(),
        insuranceExpiry: insuranceExpiry.trim(),
        description: description.trim(),
        attachments: files,
        visibility,
      };

      const save =
        pageMode === "Add"
          ? addVehicle(payload)
          : updateVehicle(vehicle!.id, payload);

      await dispatch(commitSave("vehicles", save));
      // Only once the row no longer references them: a save that threw above
      // leaves the old row intact, and its files must still be there.
      await attachments.cleanup(files);
      router.back();
    } catch (saveError) {
      showToast("error", "Unable to save", String(saveError), "bottom");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirmationAlert(
      "Delete Vehicle",
      "Are you sure you want to delete this vehicle?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      setIsLoading(true);
      dispatch(commitDelete("vehicles", vehicle!.id, deleteVehicle))
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

      <FormSection title="Vehicle">
        <SearchableSelect
          label="Type"
          placeholder="Select a vehicle type"
          selectedId={vehicleType}
          selectedName={vehicleType}
          options={VEHICLE_TYPES.map((type) => ({ id: type, name: type }))}
          onSelect={(id) => setVehicleType(id)}
        />

        <TextField
          label="Name"
          onChangeText={setName}
          value={name}
          placeholder="e.g. Honda City"
          autoCapitalize="words"
        />

        <TextField
          label="Registration number"
          onChangeText={setNumber}
          value={number}
          placeholder="e.g. TN 01 AB 1234"
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </FormSection>

      <FormSection title="Insurance">
        <TextField
          label="Insurer"
          onChangeText={setInsurer}
          value={insurer}
          placeholder="e.g. ICICI Lombard"
          autoCapitalize="words"
        />

        <TextField
          label="Policy number"
          onChangeText={setPolicyNumber}
          value={policyNumber}
          placeholder="Policy number"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <DatePicker
          label="Insurance expiry"
          dateValue={insuranceExpiry}
          onDateChange={setInsuranceExpiry}
        />
      </FormSection>

      <FormSection>
        <AttachmentField
          drafts={attachments.drafts}
          onChange={attachments.setDrafts}
          readOnly={readOnly}
          module="vehicles"
        />
      </FormSection>

      <FormSection title="Notes">
        <TextField
          label="Description"
          onChangeText={setDescription}
          value={description}
          placeholder="Model year, colour, where the RC is kept…"
          multiline
          numberOfLines={4}
        />
      </FormSection>

      </ReadOnlyGuard>

      {!readOnly && (
        <Button
          title={pageMode === "Add" ? "Add Vehicle" : "Save Changes"}
          onPress={handleSave}
          buttonStyle={styles.primaryButton}
        />
      )}

      {pageMode !== "Add" && !readOnly && (
        <Button
          title="Delete Vehicle"
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

export default VehicleAddEditScreen;
