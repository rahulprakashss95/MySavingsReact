import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Text from "./Text";
import TextInput from "./TextInput";
import BottomSheet from "./BottomSheet";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors, tint } from "../utils/Color";
import { radius, spacing } from "../utils/tokens";

export type Option = { id: string; name: string };

type AddFormHandlers = {
  /** Call once the new record is created; it becomes selected and both layers close. */
  onCreated: (item: Option) => void;
  /** Call to dismiss the add form and return to the list. */
  onCancel: () => void;
};

type Props = {
  label: string;
  placeholder?: string;
  selectedId: string;
  /** Stored name for `selectedId`, so the field stays filled when the option
   * list hasn't loaded or the record belongs to someone else. */
  selectedName?: string;
  options: Option[];
  onSelect: (id: string, name: string) => void;
  /**
   * Whether the sheet offers a search box. Off for short fixed lists (a record
   * type, say), where a search field is one more thing to dismiss and pops the
   * keyboard over the very options you came to read.
   */
  searchable?: boolean;
  /** Label for the add row and the popup title, e.g. "Add Bank". Omit to hide add. */
  addLabel?: string;
  /** Renders the entity's full form inside the add popup. Omit to hide add. */
  renderAddForm?: (handlers: AddFormHandlers) => React.ReactNode;
};

/** First glyph for an option's avatar chip — the initial, or a bullet for a blank name. */
const initialOf = (name: string) => (name?.trim()?.[0] ?? "•").toUpperCase();

/**
 * A tap-to-open bottom sheet lookup field: search or scan a list of options,
 * or use the "Add" row to create a new record in a nested sheet and have it
 * selected on save — all without leaving the current screen.
 */
const SearchableSelect = ({
  label,
  placeholder,
  selectedId,
  selectedName,
  options,
  onSelect,
  searchable = true,
  addLabel,
  renderAddForm,
}: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  // A directory sorts alphabetically because you scan or search it. A fixed
  // short list is authored in a meaningful order (broadest type first, say) and
  // must keep it — which is the same list `searchable` distinguishes.
  const sorted = useMemo(
    () =>
      searchable
        ? [...options].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
        : options,
    [options, searchable]
  );
  const selected = sorted.find((option) => option.id === selectedId);
  const fieldLabel = selected?.name ?? (selectedId ? selectedName ?? "" : "");

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    const needle = trimmed.toLowerCase();
    return needle
      ? sorted.filter((option) => (option.name ?? "").toLowerCase().includes(needle))
      : sorted;
  }, [sorted, trimmed]);

  const closeSheet = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (option: Option) => {
    Haptics.selectionAsync().catch(() => {});
    onSelect(option.id, option.name);
    closeSheet();
  };

  const handleCreated = (item: Option) => {
    setAdding(false);
    onSelect(item.id, item.name);
    closeSheet();
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
      >
        <Text
          style={[styles.fieldText, !fieldLabel && styles.placeholderText]}
          numberOfLines={1}
        >
          {fieldLabel || placeholder || "Select"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={closeSheet}
        accessibilityLabel={label}
        contentContainerStyle={styles.sheetContent}
      >
        {searchable ? (
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${label.toLowerCase()}`}
              placeholderTextColor={colors.placeholder}
              autoFocus
              returnKeyType="done"
            />
            {!!query && (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        ) : (
          <Text style={styles.sheetTitle}>{label}</Text>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(option) => option.id}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  isSelected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => choose(item)}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: tint(colors.primary) },
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.avatarText, isSelected && styles.avatarTextSelected]}
                  >
                    {initialOf(item.name)}
                  </Text>
                </View>
                <Text
                  style={[styles.rowText, isSelected && styles.rowTextSelected]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{trimmed ? "No matches" : "Nothing here yet"}</Text>
          }
        />

        {renderAddForm && (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.rowPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAdding(true);
            }}
            accessibilityRole="button"
          >
            <View style={[styles.avatar, styles.addAvatar]}>
              <Ionicons name="add" size={18} color={colors.primary} />
            </View>
            <Text style={styles.addText}>{addLabel ?? "Add New"}</Text>
          </Pressable>
        )}
      </BottomSheet>

      <BottomSheet
        visible={adding}
        onClose={() => setAdding(false)}
        accessibilityLabel={addLabel}
        maxHeightRatio={0.92}
      >
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{addLabel}</Text>
          <Pressable
            onPress={() => setAdding(false)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderAddForm?.({
            onCreated: handleCreated,
            onCancel: () => setAdding(false),
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.inputBackground,
      borderWidth: 1.5,
      borderColor: "transparent",
      borderRadius: radius.control,
      paddingHorizontal: 12,
      height: 50,
      marginBottom: 18,
    },
    fieldPressed: {
      borderColor: colors.primary,
    },
    fieldText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      marginRight: 8,
    },
    placeholderText: {
      color: colors.placeholder,
    },
    sheetContent: {
      paddingHorizontal: 12,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.control,
      paddingHorizontal: 12,
      height: 46,
      marginBottom: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    // Stands in for the search row when there's nothing to search: without it
    // the sheet opens as a bare list of options with no idea what it's choosing.
    sheetTitle: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      paddingHorizontal: 8,
      paddingTop: 4,
      paddingBottom: 12,
    },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: radius.control,
    },
    rowSelected: {
      backgroundColor: tint(colors.primary),
    },
    rowPressed: {
      opacity: 0.7,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    avatarTextSelected: {
      color: colors.onPrimary,
    },
    addAvatar: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.border,
    },
    rowText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    rowTextSelected: {
      fontWeight: "700",
      color: colors.primary,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: 20,
      fontSize: 14,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: radius.control,
    },
    addText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
    },
    formHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 6,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    formContent: {
      padding: 20,
      paddingBottom: 32,
    },
  });

export default SearchableSelect;
