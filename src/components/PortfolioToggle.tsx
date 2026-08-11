import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Switch, View } from "react-native";
import Text from "./Text";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
};

/**
 * Per-record portfolio inclusion, shown at the top of every create/edit
 * screen that feeds net worth (accounts, ornaments, properties). Off doesn't
 * hide the record — it stays in its list and in "Needs attention" — it's
 * just left out of the Home and Overview totals. Defaults on, so nothing
 * changes for existing data until a member switches one off.
 */
const PortfolioToggle = ({ value, onChange }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Ionicons
        name="pie-chart-outline"
        size={20}
        color={value ? colors.primary : colors.textMuted}
      />
      <View style={styles.text}>
        <Text style={styles.label}>Include in portfolio</Text>
        <Text style={styles.hint}>
          {value
            ? "Counted in your net worth."
            : "Kept here, but left out of your net worth."}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    text: { flex: 1 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text },
    hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });

export default PortfolioToggle;
