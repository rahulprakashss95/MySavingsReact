import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";
import { elevation, gradientAngle, radius, spacing } from "../utils/tokens";

type HeroTone = "primary" | "amber" | "violet";

type ICard = {
  children: React.ReactNode;
  customStyle?: any;
  /** Ambient shadow instead of the default hairline border — reserve for a
   * card that's genuinely meant to float above the canvas (a hero/stat card),
   * not for every card. See DESIGN.md "The Hairline-First Rule". */
  elevated?: boolean;
  /**
   * Full gradient-wash background for a genuine hero moment (Home Worth/Month
   * cards, Overview heroes) — never a grouped row/list. Content inside should
   * use `colors.onPrimary`-family text, not the default `colors.text`, since
   * the wash runs dark-to-darker in both themes.
   */
  hero?: HeroTone;
};

const HERO_GRADIENT_KEY: Record<HeroTone, keyof ThemeColors> = {
  primary: "gradientPrimary",
  amber: "gradientAmber",
  violet: "gradientViolet",
};

const Card = (props: ICard) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (props.hero) {
    const stops = colors[HERO_GRADIENT_KEY[props.hero]] as unknown as [string, string];
    return (
      <LinearGradient
        colors={stops}
        start={gradientAngle.start}
        end={gradientAngle.end}
        style={[styles.card, styles.cardElevated, props.customStyle]}
      >
        {props.children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        props.elevated ? styles.cardElevated : styles.cardOutlined,
        props.customStyle,
      ]}
    >
      {props.children}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: spacing.base,
      margin: spacing.base,
    },
    cardOutlined: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    cardElevated: {
      ...elevation.ambient,
      shadowColor: colors.shadow,
    },
  });

export default Card;
