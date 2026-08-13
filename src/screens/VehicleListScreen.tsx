import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import AttachmentSection from "../components/AttachmentSection";
import GroupedList from "../components/GroupedList";
import GroupedRow from "../components/GroupedRow";
import Text from "../components/Text";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AccountModel } from "../models/AccountModel";
import { VehicleModel } from "../models/AssetModel";
import { useCollectionState, useOwnerName } from "../query/hooks";
import { groupByOwner } from "../utils/documents";
import { linkedLoansFor } from "../utils/loans";
import { ThemeColors } from "../utils/Color";
import { amountFormat } from "../utils/Utils";
import { useRouter } from "expo-router";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** A recognisable glyph per kind, so a car and a bike read apart at a glance. */
const iconFor = (vehicleType: string): IconName => {
  switch (vehicleType) {
    case "Bike":
    case "Scooter":
      return "bicycle-outline";
    case "Car":
      return "car-outline";
    default:
      return "car-sport-outline";
  }
};

/** "Car · Insured till 12-Jan-2027" — whichever half actually applies. */
const rowMeta = (vehicle: VehicleModel) =>
  [
    vehicle.vehicleType,
    vehicle.insuranceExpiry ? `Insured till ${vehicle.insuranceExpiry}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const VehicleListScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { items, ...list } = useCollectionState<VehicleModel>("vehicles");
  const accountState = useCollectionState<AccountModel>("accounts");
  const nameOf = useOwnerName();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Grouped by owning member, so one person's vehicles stay together.
  const sections = useMemo(
    () => groupByOwner(items, user, nameOf),
    [items, user, nameOf]
  );

  const navigateAddEdit = (data: VehicleModel | null) => {
    router.push(data ? `/assets/vehicles/${data.id}` : "/assets/vehicles/new");
  };

  /** The one number you want at a glance: what's still owed on a linked loan. */
  const renderTrailing = (vehicle: VehicleModel) => {
    const loans = linkedLoansFor(accountState.items, "Vehicle", vehicle.id);
    if (loans.length === 0) {
      return null;
    }
    const remaining = loans.reduce(
      (sum, loan) => sum + (Number(loan.balance) || 0),
      0
    );
    const settled = remaining <= 0;
    return (
      <View style={styles.trailing}>
        <Text style={[styles.trailingValue, settled && styles.settled]}>
          {settled ? "Settled" : `₹ ${amountFormat(remaining)}`}
        </Text>
        {!settled && <Text style={styles.trailingLabel}>left</Text>}
      </View>
    );
  };

  return (
    <GroupedList
      {...list}
      sections={sections}
      keyOf={(item) => item.id}
      noun="vehicle"
      addLabel="Add Vehicle"
      onAdd={() => navigateAddEdit(null)}
      emptyIcon="car-outline"
      emptyTitle="No vehicles yet"
      emptyBody="Tap the + button to record the family's first vehicle."
      renderItem={(item, position) => (
        <GroupedRow
          icon={iconFor(item.vehicleType)}
          accent={colors.accentBlue}
          title={item.name}
          value={item.number || "—"}
          copyValue={item.number || undefined}
          valueLabel={item.number ? "Registration number" : undefined}
          meta={rowMeta(item) || undefined}
          description={item.description}
          trailing={renderTrailing(item)}
          footer={<AttachmentSection attachments={item.attachments} />}
          onPress={() => navigateAddEdit(item)}
          position={position}
        />
      )}
    />
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    trailing: {
      alignItems: "flex-end",
      maxWidth: 120,
    },
    trailingValue: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    settled: {
      color: colors.positive,
    },
    trailingLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
  });

export default VehicleListScreen;
