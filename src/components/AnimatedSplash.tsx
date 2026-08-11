import React, { useEffect } from "react";
import { Image, StyleSheet } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Same file expo-splash-screen paints natively (see app.json), so the handoff
// from the native splash to this layer is a continuation, not a swap.
const LOGO = require("../../assets/splash.png");
// Matches app.json's expo-splash-screen backgroundColor / adaptiveIcon
// backgroundColor — fixed regardless of light/dark, same as the native splash.
const SPLASH_BACKGROUND = "#26619c";

type Props = {
  /** Keeps the splash mounted; going false plays the exit fade then unmounts. */
  visible: boolean;
};

/**
 * JS continuation of the native splash. The native splash is a static image
 * and can't animate; this renders the same logo on the same background the
 * instant it hides, then breathes the logo gently until app state (auth/theme/
 * passcode/fonts) has restored, at which point it fades out to reveal the app.
 */
const AnimatedSplash = ({ visible }: Props) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withTiming(1.06, { duration: 460, easing: Easing.out(Easing.cubic) }),
      withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      exiting={FadeOut.duration(280)}
      style={[StyleSheet.absoluteFill, styles.overlay]}
    >
      <Animated.Image source={LOGO} resizeMode="contain" style={[styles.logo, logoStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  logo: {
    width: 160,
    height: 160,
  },
});

export default AnimatedSplash;
