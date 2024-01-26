import { TouchableHighlight, View, Text, StyleSheet } from "react-native";
import { Colors } from "../utils/Color";

type IButton = {
  title: string;
  buttonStyle?: any;
  onPress: () => void;
};

const Button = (props: IButton) => {
  return (
    <TouchableHighlight onPress={props.onPress} underlayColor="white">
      <View style={[styles.button, props.buttonStyle]}>
        <Text style={styles.buttonText}>{props.title}</Text>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: "center",
  },
  button: {
    width: 200,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  buttonText: {
    textAlign: "center",
    padding: 16,
    color: "white",
  },
});

export default Button;
