import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FontAwesome, AntDesign, Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import { Colors } from "../utils/Color";
import { NavigationProp } from "../utils/Utils";

type Props = {
  navigation: NavigationProp;
};

const DepositScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.subContainer}>
        <Pressable onPress={() => navigation.navigate("Clients")}>
          <Card customStyle={styles.card}>
            <AntDesign
              name="file1"
              size={32}
              color={Colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.text}>Clients</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("FixedDepositList")}>
          <Card customStyle={styles.card}>
            <FontAwesome
              name="credit-card"
              size={32}
              color={Colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.text}>Fixed Deposit</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("OverView")}>
          <Card customStyle={styles.card}>
            <Ionicons
              name="laptop-outline"
              size={32}
              color={Colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.text}>Overview</Text>
          </Card>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
  },
  subContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: 150, // fixed width for each card
    height: 150, // fixed height for each card
  },
  icon: {
    width: 40, // Your icon size
    height: 40, // Your icon size
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
  },
});

export default DepositScreen;
