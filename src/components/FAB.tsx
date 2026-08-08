import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useMemo } from "react";
import { AntDesign } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { usePressAnimation } from "../hooks/usePressAnimation";
import { ThemeColors } from "../utils/Color";
import { elevation, motion } from "../utils/tokens";

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

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? "Add"}
      style={styles.container}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <AntDesign name="plus" size={24} color={colors.onPrimary} />
      </Animated.View>
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
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      ...elevation.ambient,
      shadowColor: colors.shadow,
    },
  });
