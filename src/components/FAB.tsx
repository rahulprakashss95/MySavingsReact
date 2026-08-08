import { Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { useMemo } from "react";
import { AntDesign } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { usePressAnimation } from "../hooks/usePressAnimation";
import { ThemeColors } from "../utils/Color";
import { elevation, gradientAngle, motion } from "../utils/tokens";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type IFAB = {
  onPress: () => void;
  accessibilityLabel?: string;
};

const FAB = (props: IFAB) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { onPressIn, onPressOut, animatedStyle } = usePressAnimation(
    motion.fabPressScale
  );

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    props.onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? "Add"}
      style={styles.container}
    >
      <AnimatedGradient
        colors={colors.gradientPrimary}
        start={gradientAngle.start}
        end={gradientAngle.end}
        style={[styles.button, animatedStyle]}
      >
        <AntDesign name="plus" size={24} color={colors.onPrimary} />
      </AnimatedGradient>
    </Pressable>
  );
};

export default FAB;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 16,
      right: 16,
    },
    button: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      ...elevation.ambient,
      shadowColor: colors.shadow,
    },
  });
