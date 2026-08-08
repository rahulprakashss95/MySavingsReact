import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { usePressAnimation } from "../hooks/usePressAnimation";
import { ThemeColors, tint } from "../utils/Color";
import { radius } from "../utils/tokens";

type Variant = "filled" | "tonal" | "plain";
type Tone = "primary" | "destructive";

type IButton = {
  title: string;
  variant?: Variant;
  tone?: Tone;
  buttonStyle?: any;
  titleStyle?: any;
  /** Swaps the label for a spinner and blocks further presses. */
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const Button = (props: IButton) => {
  const { variant = "filled", tone = "primary" } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { onPressIn, onPressOut, animatedStyle } = usePressAnimation();

  const isInteractive = !props.loading && !props.disabled;
  const toneColor = tone === "destructive" ? colors.negative : colors.primary;

  const variantStyle =
    variant === "filled"
      ? { backgroundColor: toneColor }
      : variant === "tonal"
      ? { backgroundColor: tint(toneColor) }
      : { backgroundColor: "transparent" };

  const labelColor = variant === "filled" ? colors.onPrimary : toneColor;

  return (
    <Pressable
      onPress={isInteractive ? props.onPress : undefined}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={props.title}
      accessibilityState={{ busy: !!props.loading, disabled: !isInteractive }}
    >
      <Animated.View
        style={[
          styles.button,
          variantStyle,
          animatedStyle,
          props.buttonStyle,
          !isInteractive && styles.buttonInactive,
        ]}
      >
        {props.loading ? (
          // Rendered at the label's height so the button doesn't resize.
          <ActivityIndicator size="small" color={labelColor} />
        ) : (
          <Text
            style={[styles.buttonText, { color: labelColor }, props.titleStyle]}
          >
            {props.title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.control,
      paddingHorizontal: 20,
    },
    buttonInactive: {
      opacity: 0.4,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center",
    },
  });

export default Button;
