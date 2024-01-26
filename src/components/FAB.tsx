import { StyleSheet, TouchableHighlight, View } from "react-native";
import React from "react";
import { Colors } from "../utils/Color";
import { AntDesign } from "@expo/vector-icons";

type IFAB = {
  onPress: () => void;
};

const FAB = (props: IFAB) => {
  return (
    <TouchableHighlight
      style={styles.container}
      onPress={props.onPress}
      underlayColor="white"
    >
      <View style={styles.button}>
        <AntDesign name="plus" size={24} color="white" />
      </View>
    </TouchableHighlight>
  );
};

export default FAB;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 50,
    width: 60,
    height: 60,
    backgroundColor: Colors.primary,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
