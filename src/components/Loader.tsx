import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

type ILoader = {
  loading: boolean;
};

const Loader = (props: ILoader) => {
  const { loading } = props;

  if (!loading) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default Loader;
