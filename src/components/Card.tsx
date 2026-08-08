import { View, StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";
import { elevation, radius, spacing } from "../utils/tokens";

type ICard = {
  children: React.ReactNode;
  customStyle?: any;
  /** Ambient shadow instead of the default hairline border — reserve for a
   * card that's genuinely meant to float above the canvas (a hero/stat card),
   * not for every card. See DESIGN.md "The Hairline-First Rule". */
  elevated?: boolean;
};

const Card = (props: ICard) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
