import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Text from "./Text";
import TextInput from "./TextInput";
import BottomSheet from "./BottomSheet";
import { useTheme } from "../context/ThemeContext";
import { COUNTRIES, Country } from "../utils/countryCodes";
import { ThemeColors } from "../utils/Color";

type Props = {
  label?: string;
  /** Dialling code including the plus, e.g. "+91". */
  dialCode: string;
  onChangeDialCode: (dial: string) => void;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

/**
 * A phone field with a dialling-code picker attached to its left. The code and
 * the number are separate values so the number stays a plain number — nothing
 * has to parse a prefix back out of it later.
 *
 * The sheet lists countries rather than bare codes because "+268" means nothing
 * on its own; search matches the name, the code and the ISO letters, so typing
 * either "india", "91" or "in" gets there.
 */
const PhoneInput = ({
  label = "Phone",
  dialCode,
  onChangeDialCode,
  value,
  onChangeText,
  placeholder = "Phone number",
}: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    const needle = trimmed.toLowerCase();
    if (!needle) {
      return COUNTRIES;
    }
    // Strip the plus so "+91" and "91" both match.
    const digits = needle.replace(/^\+/, "");
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase() === needle ||
        country.dial.replace(/^\+/, "").startsWith(digits)
    );
  }, [trimmed]);

  const closeSheet = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (country: Country) => {
    onChangeDialCode(country.dial);
    closeSheet();
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          style={styles.codeButton}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country code, currently ${dialCode}`}
        >
          <Text style={styles.codeText}>{dialCode}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          style={styles.numberInput}
          onChangeText={onChangeText}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
        />
      </View>

      <BottomSheet
        visible={open}
        onClose={closeSheet}
        accessibilityLabel="Choose a country code"
        contentContainerStyle={styles.sheetContent}
      >
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search country or code"
            placeholderTextColor={colors.placeholder}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(country) => country.code}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.countryRow}
              onPress={() => choose(item)}
              accessibilityRole="button"
            >
              <Text style={styles.countryName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.countryDial}>{item.dial}</Text>
              {/* Matched on the dial code, so shared codes (+1, +44) tick
                  every country that uses them — the record only stores the
                  code, so that is honestly all we know. */}
              {item.dial === dialCode && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No matches</Text>
          }
        />
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
    },
    codeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    codeText: {
      fontSize: 16,
      color: colors.text,
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      marginVertical: 8,
      backgroundColor: colors.border,
    },
    numberInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
    },
    sheetContent: {
      paddingHorizontal: 12,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 12,
      height: 46,
      marginBottom: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    list: {
      flexGrow: 0,
    },
    countryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    countryName: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    countryDial: {
      fontSize: 15,
      color: colors.textMuted,
    },
    empty: {
      textAlign: "center",
      color: colors.textMuted,
      paddingVertical: 20,
      fontSize: 14,
    },
  });

export default PhoneInput;
