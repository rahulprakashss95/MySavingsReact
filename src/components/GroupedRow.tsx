import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Text from "./Text";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";
import { gradientAngle, motion, radius, spacing } from "../utils/tokens";
import CopyButton from "./CopyButton";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Where the row sits in its group, so the card's corners land right. */
export type RowPosition = {
  isFirst: boolean;
  isLast: boolean;
  /** Position within the section — staggers the mount-in animation. */
  index?: number;
};

type IGroupedRow = {
  icon: IconName;
  /** A resolved accent colour, e.g. `colors.accentBlue`. */
  accent: string;
  /** Small uppercase label above the value. Omit for no label. */
  title?: string;
  /** The row's headline — a number, a name, whatever it is you came to read. */
  value: string;
  /** Pass with `valueLabel` to put a copy button beside the value. */
  copyValue?: string;
  valueLabel?: string;
  /** Quiet line under the value, e.g. a holder's name. */
  subtitle?: string;
  /** Secondary line, e.g. an IFSC code or a weight. */
  meta?: string;
  /** Pass to give `meta` its own copy button. */
  metaCopyValue?: string;
  metaLabel?: string;
  description?: string;
  /** Right-aligned status, e.g. "Paid 3/12". Replaces the copy button. */
  trailing?: React.ReactNode;
  /** Full-width content under the row, e.g. an attachment panel. Indented to
   * the text column rather than the card edge, so it sits under the value and
   * not under the icon gutter. Rendered outside the icon/text/trailing row so
   * that however tall it grows, it can't drag those out of alignment. */
  footer?: React.ReactNode;
  onPress: () => void;
  position: RowPosition;
};

/**
 * One item inside a group's card. Rows share a single rounded container rather
 * than each carrying its own shadow, so a list of six items across three groups
 * reads as three objects, not eighteen.
 */
const GroupedRow = (props: IGroupedRow) => {
  const { icon, accent, title, value, meta, description, onPress } = props;
  const { isFirst, isLast, index } = props.position;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const showsCopy = !!props.copyValue && !!props.valueLabel;
  const staggerDelay = Math.min((index ?? 0) * motion.staggerDelay, motion.staggerMaxDelay);

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(staggerDelay).duration(motion.staggerDuration)}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={[title, value].filter(Boolean).join(", ")}
      style={({ pressed }: { pressed: boolean }) => [
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
    >
      {/* Inset hairline between siblings, aligned to the text rather than the
          card edge — the icon column reads as a gutter. */}
      {!isFirst && <View style={styles.separator} />}

      <View style={[styles.body, !!props.footer && styles.bodyWithFooter]}>
        <LinearGradient
          colors={[`${accent}3d`, `${accent}12`]}
          start={gradientAngle.start}
          end={gradientAngle.end}
          style={styles.iconChip}
        >
          <Ionicons name={icon} size={18} color={accent} />
        </LinearGradient>

        <View style={styles.text}>
          {!!title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}

          <Text style={styles.value} numberOfLines={1}>
            {value || "—"}
          </Text>

          {!!props.subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {props.subtitle}
            </Text>
          )}

          {!!meta && (
            <View style={styles.metaRow}>
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
              {!!props.metaCopyValue && (
                <CopyButton
                  value={props.metaCopyValue}
                  label={props.metaLabel ?? "Value"}
                  size={13}
                />
              )}
            </View>
          )}

          {!!description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>

        {props.trailing}

        {!props.trailing && showsCopy && (
          <CopyButton value={props.copyValue!} label={props.valueLabel!} />
        )}
      </View>

      {!!props.footer && <View style={styles.footer}>{props.footer}</View>}
    </AnimatedPressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.base,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    rowFirst: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopLeftRadius: radius.row,
      borderTopRightRadius: radius.row,
    },
    rowLast: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomLeftRadius: radius.row,
      borderBottomRightRadius: radius.row,
      marginBottom: spacing.xl + spacing.xs,
    },
    rowPressed: {
      backgroundColor: colors.inputBackground,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 62,
    },
    body: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    // The footer owns the gap below it, so the row doesn't pad twice.
    bodyWithFooter: {
      paddingBottom: 0,
    },
    // 62 = card padding (14) + icon chip (34) + its gutter (14), the same
    // alignment the separator uses, so the footer lines up under the value.
    footer: {
      marginLeft: 62,
      marginRight: 14,
      paddingBottom: 14,
    },
    iconChip: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    text: {
      flex: 1,
      marginRight: 10,
    },
    title: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    value: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
      marginTop: 3,
      letterSpacing: 0.3,
      fontVariant: ["tabular-nums"],
    },
    subtitle: {
      fontSize: 13,
      color: colors.text,
      marginTop: 4,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    meta: {
      fontSize: 12,
      color: colors.textMuted,
      marginRight: 8,
      letterSpacing: 0.3,
    },
    description: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 5,
      lineHeight: 17,
    },
  });

export default GroupedRow;
