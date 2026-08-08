import { useCallback } from "react";
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "../utils/tokens";

/**
 * One shared press-feedback interaction (scale down on press-in, spring back
 * on press-out) for every pressable primitive — Button, Card, FeatureTile,
 * GroupedRow, FAB. Honors the system's reduce-motion setting by holding at
 * scale 1 instead of animating.
 */
export const usePressAnimation = (scaleTo: number = motion.pressScale) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    if (reducedMotion) return;
    scale.value = withTiming(scaleTo, { duration: motion.pressDuration });
  }, [reducedMotion, scale, scaleTo]);

  const onPressOut = useCallback(() => {
    if (reducedMotion) return;
    scale.value = withTiming(1, { duration: motion.pressDuration });
  }, [reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
};
