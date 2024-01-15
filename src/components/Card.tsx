import { View, StyleSheet } from "react-native";

type ICard = {
  children: React.ReactNode;
  customStyle?: any;
};

const Card = (props: ICard) => {
  return <View style={[styles.card, props.customStyle]}>{props.children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    margin: 16,
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default Card;
