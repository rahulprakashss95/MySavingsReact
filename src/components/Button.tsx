import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Text from "./Text";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { usePressAnimation } from "../hooks/usePressAnimation";
import { ThemeColors, tint } from "../utils/Color";
import { gradientAngle, radius } from "../utils/tokens";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

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
  // Gradient fill is reserved for the primary filled button — the app's one
  // "hero" action per screen. Destructive stays a flat fill: a gradient
  // delete button would read as an invitation, not a warning.
  const isGradient = variant === "filled" && tone === "primary";

  const variantStyle =
    variant === "tonal"
      ? { backgroundColor: tint(toneColor) }
      : variant === "plain"
      ? { backgroundColor: "transparent" }
      : { backgroundColor: toneColor };

  const labelColor = variant === "filled" ? colors.onPrimary : toneColor;

  const handlePress = () => {
    Haptics.impactAsync(
      tone === "destructive"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    props.onPress();
  };

  const inner = props.loading ? (
    // Rendered at the label's height so the button doesn't resize.
    <ActivityIndicator size="small" color={labelColor} />
  ) : (
    <Text style={[styles.buttonText, { color: labelColor }, props.titleStyle]}>
      {props.title}
    </Text>
  );

  return (
    <Pressable
      onPress={isInteractive ? handlePress : undefined}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={props.title}
      accessibilityState={{ busy: !!props.loading, disabled: !isInteractive }}
    >
      {isGradient ? (
        <AnimatedGradient
          colors={colors.gradientPrimary}
          start={gradientAngle.start}
          end={gradientAngle.end}
          style={[
            styles.button,
            animatedStyle,
            props.buttonStyle,
            !isInteractive && styles.buttonInactive,
          ]}
        >
          {inner}
        </AnimatedGradient>
      ) : (
        <Animated.View
          style={[
            styles.button,
            variantStyle,
            animatedStyle,
            props.buttonStyle,
            !isInteractive && styles.buttonInactive,
          ]}
        >
          {inner}
        </Animated.View>
      )}
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
