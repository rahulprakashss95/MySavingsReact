import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Text from "./Text";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { usePressAnimation } from "../hooks/usePressAnimation";
import { ThemeColors } from "../utils/Color";
import { gradientAngle, motion, radius } from "../utils/tokens";

type IFeatureTile = {
  title: string;
  subtitle: string;
  /** A resolved accent colour, e.g. `colors.accentBlue`. */
  accent: string;
  renderIcon: (color: string) => React.ReactNode;
  /** Omit to render a non-interactive, dimmed tile. */
  onPress?: () => void;
  /** Full width row instead of a half-width grid cell. */
  wide?: boolean;
  /** Short status label shown in place of the arrow, e.g. "Soon". */
  badge?: string;
  /** Position in a grid/list — staggers the mount-in animation. Omit for no delay. */
  index?: number;
};

const FeatureTile = (props: IFeatureTile) => {
  const { title, subtitle, accent, renderIcon, onPress, wide, badge } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { onPressIn, onPressOut, animatedStyle } = usePressAnimation();

  const disabled = !onPress;
  const staggerDelay = Math.min(
    (props.index ?? 0) * motion.staggerDelay,
    motion.staggerMaxDelay
  );

  const content = (
    <>
      <LinearGradient
        colors={[`${accent}3d`, `${accent}12`]}
        start={gradientAngle.start}
        end={gradientAngle.end}
        style={[styles.iconChip, wide && styles.wideIconChip]}
      >
        {renderIcon(accent)}
      </LinearGradient>

      {wide ? (
        <View style={styles.wideText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </>
      )}

      {badge ? (
        <Text style={[styles.badge, !wide && styles.gridBadge]}>{badge}</Text>
      ) : (
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.textMuted}
          style={wide ? styles.wideArrow : styles.gridArrow}
        />
      )}
    </>
  );

  if (disabled) {
    return (
      <View
        accessibilityLabel={badge ? `${title}, ${badge}` : title}
        style={[styles.tileBox, wide && styles.wideTileBox]}
      >
        <Animated.View
          entering={FadeInDown.delay(staggerDelay).duration(motion.staggerDuration)}
          style={[styles.tile, wide && styles.wideTile, styles.tileDisabled]}
        >
          {content}
        </Animated.View>
      </View>
    );
  }

  return (
    // Sizing (the `48%` grid width) lives on this outer `Pressable`: it's a
    // row-flow sibling, which — unlike a column-flow child — doesn't stretch
    // to fill by default, so a percentage width on the *inner* animated view
    // would resolve against an undefined parent size and collapse to
    // content-size. The inner view only carries the visual box + `flex: 1`
    // to fill whatever size the Pressable establishes.
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.tileBox, wide && styles.wideTileBox]}
    >
      {/* The mount-in `entering` layout animation and the press-scale
          `animatedStyle` transform can't safely share one node — Reanimated
          warns that a layout animation may clobber a custom `transform`
          style on the same component. So `entering` lives on this outer
          wrapper (no styling of its own beyond stretching to fill the
          Pressable, same as the single-node version used to) and the visual
          box + press transform live on the inner `Animated.View`. */}
      <Animated.View
        entering={FadeInDown.delay(staggerDelay).duration(motion.staggerDuration)}
      >
        <Animated.View
          style={[styles.tile, wide && styles.wideTile, animatedStyle]}
        >
          {content}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Explicit width + the parent's space-between rather than `gap`, which
    // react-native-web 0.18 silently drops.
    tileBox: {
      width: "48%",
    },
    wideTileBox: {
      width: "100%",
    },
    tile: {
      flex: 1,
      minHeight: 158,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 16,
    },
    wideTile: {
      minHeight: 0,
      flexDirection: "row",
      alignItems: "center",
    },
    wideText: {
      flex: 1,
    },
    tileDisabled: {
      opacity: 0.55,
    },
    iconChip: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    wideIconChip: {
      marginBottom: 0,
      marginRight: 14,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 3,
      lineHeight: 18,
    },
    gridArrow: {
      marginTop: "auto",
      alignSelf: "flex-end",
    },
    wideArrow: {
      marginLeft: 12,
    },
    badge: {
      marginLeft: 12,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.textMuted,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      overflow: "hidden",
    },
    gridBadge: {
      marginLeft: 0,
      marginTop: "auto",
      alignSelf: "flex-start",
    },
  });

export default FeatureTile;
