import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";
import { radius, spacing } from "../utils/tokens";

type ITextField = TextInputProps & {
  label?: string;
  /** Footnote helper shown below the field; replaced by `error` when present. */
  helperText?: string;
  /** Switches the border to `negative` and shows this message below the field. */
  error?: string;
  /** Inline glyph inside the field, e.g. "₹" on an amount input. */
  prefix?: string;
  /** Inline glyph after the value, e.g. "% p.a." on a rate input. */
  suffix?: string;
  containerStyle?: any;
};

/**
 * The label + input + error/helper trio every add/edit screen previously
 * hand-rolled as its own `label`/`input` `StyleSheet` block. One field per
 * `<TextField>`, stacked inside a `FormSection` (or any `Card`).
 */
const TextField = ({
  label,
  helperText,
  error,
  prefix,
  suffix,
  containerStyle,
  style,
  onFocus,
  onBlur,
  multiline,
  ...inputProps
}: ITextField) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputRow,
          multiline && styles.multiline,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {!!prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, !!prefix && styles.inputWithPrefix, style]}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : undefined}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {!!suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!error && !!helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.sm,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: "transparent",
      backgroundColor: colors.inputBackground,
      borderRadius: radius.control,
      paddingHorizontal: spacing.md,
    },
    prefix: {
      fontSize: 16,
      color: colors.textMuted,
    },
    suffix: {
      fontSize: 15,
      color: colors.textMuted,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
    },
    inputWithPrefix: {
      paddingLeft: spacing.sm,
    },
    inputFocused: {
      borderColor: colors.primary,
    },
    inputError: {
      borderColor: colors.negative,
    },
    multiline: {
      minHeight: 96,
      alignItems: "flex-start",
      paddingVertical: spacing.xs,
    },
    errorText: {
      fontSize: 13,
      color: colors.negative,
      marginTop: spacing.xs,
    },
    helperText: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  });

export default TextField;
