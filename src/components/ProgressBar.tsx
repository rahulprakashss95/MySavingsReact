import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { motion } from "../utils/tokens";

type IProgressBar = {
  /** 0–1. Clamped, so a rounding error can't overflow the track. */
  progress: number;
  color?: string;
};

const ProgressBar = ({ progress, color }: IProgressBar) => {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(progress, 1));
  const width = useSharedValue(0);

  // Fills in from empty on mount, and eases toward the new value whenever the
  // underlying figure changes — matches the app's stagger/count-up timing
  // rather than snapping the bar straight to its target width.
  useEffect(() => {
    width.value = withTiming(clamped, {
      duration: motion.staggerDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
      style={[styles.track, { backgroundColor: colors.chartTrack }]}
    >
      <Animated.View
        style={[
          styles.fill,
          animatedStyle,
          { backgroundColor: color ?? colors.positive },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

export default ProgressBar;
