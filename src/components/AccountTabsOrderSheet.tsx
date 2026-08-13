import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import BottomSheet from "./BottomSheet";
import Text from "./Text";
import {
  DEFAULT_ACCOUNT_TAB_ORDER,
  useAccountTabsStore,
} from "../context/AccountTabsContext";
import { useTheme } from "../context/ThemeContext";
import { accountTypeLabel } from "../models/AccountModel";
import { ThemeColors } from "../utils/Color";
import { radius } from "../utils/tokens";

type AccountTabsOrderSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Rearranges the accounts list's tab strip. Up/down controls rather than
 * drag-and-drop, for the same reasons the dashboard layout screen uses them:
 * quicker over a handful of rows, identical on web and phone, and operable by a
 * screen reader without a second accessible path.
 *
 * Every edit lands immediately — the strip behind the sheet reorders as you
 * press — so there is nothing to save and nothing to cancel; the sheet is just
 * closed when the order looks right.
 */
const AccountTabsOrderSheet = ({
  visible,
  onClose,
}: AccountTabsOrderSheetProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const order = useAccountTabsStore((state) => state.order);
  const move = useAccountTabsStore((state) => state.move);
  const reset = useAccountTabsStore((state) => state.reset);

  const isDefault =
    order.length === DEFAULT_ACCOUNT_TAB_ORDER.length &&
    order.every((type, index) => type === DEFAULT_ACCOUNT_TAB_ORDER[index]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel="Rearrange tabs"
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Rearrange tabs</Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.hint}>
          Move the ones you use most to the front. The first tab is the one this
          list opens on.
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {order.map((type, index) => {
            const label = accountTypeLabel(type);
            const isFirst = index === 0;
            const isLast = index === order.length - 1;

            return (
              <View
                key={type}
                style={[styles.row, index > 0 && styles.rowDivider]}
              >
                <Text style={styles.position}>{index + 1}</Text>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {label}
                </Text>

                <View style={styles.moveGroup}>
                  <Pressable
                    onPress={() => move(type, -1)}
                    disabled={isFirst}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${label} left`}
                    accessibilityState={{ disabled: isFirst }}
                    // Arrows are small; a hit slop keeps them thumb-sized.
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.moveButton,
                      pressed && !isFirst && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={20}
                      color={isFirst ? colors.border : colors.text}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => move(type, 1)}
                    disabled={isLast}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${label} right`}
                    accessibilityState={{ disabled: isLast }}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.moveButton,
                      pressed && !isLast && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={isLast ? colors.border : colors.text}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={reset}
          disabled={isDefault}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDefault }}
          style={({ pressed }) => [
            styles.reset,
            pressed && !isDefault && styles.pressed,
          ]}
        >
          <Text style={[styles.resetText, isDefault && styles.resetDisabled]}>
            Reset to Default Order
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      marginBottom: 16,
    },
    // The sheet caps its own height; this keeps the reset button in view when a
    // long list of tabs pushes past that cap.
    list: {
      flexShrink: 1,
    },
    listContent: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.card,
      backgroundColor: colors.inputBackground,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    position: {
      width: 18,
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      fontVariant: ["tabular-nums"],
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    moveGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    moveButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    reset: {
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 4,
    },
    resetText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
    },
    resetDisabled: {
      color: colors.textMuted,
    },
    pressed: {
      opacity: 0.6,
    },
  });

export default AccountTabsOrderSheet;
