import { StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import Card from "./Card";
import { ThemeColors } from "../utils/Color";
import { spacing } from "../utils/tokens";

type IFormSection = {
  /** Section heading, e.g. "Vehicle", "Insurance" — omit for an untitled group. */
  title?: string;
  children: React.ReactNode;
  style?: any;
};

/**
 * One logical group of fields inside an add/edit form — a `Card` with an
 * optional heading. Replaces the `<View style={styles.card}>` +
 * `sectionTitle` block every `*AddEditScreen` previously duplicated.
 */
const FormSection = ({ title, children, style }: IFormSection) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card customStyle={[styles.card, style]}>
      {!!title && <Text style={styles.title}>{title}</Text>}
      <View>{children}</View>
    </Card>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // The parent screen already supplies the horizontal screen gutter
    // (every FormSection call site pads its scroll container) — Card's own
    // marginHorizontal would double it, so it's zeroed here.
    card: {
      marginHorizontal: 0,
    },
    title: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textMuted,
      marginBottom: spacing.base,
    },
  });

export default FormSection;
