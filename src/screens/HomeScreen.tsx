import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import Card from "../components/Card";
import { Colors } from "../utils/Color";
import { biometricAuthentication } from "../components/BiometricAuthentication";
import { NavigationProp } from "../utils/Utils";

type Props = {
  navigation: NavigationProp;
};

const HomeScreen = ({ navigation }: Props) => {
  useEffect(() => {
    // biometricAuthentication();
  }, []);

  const navigateDeposit = () => {
    navigation.navigate("Deposit");
  };

  const navigateCrypto = () => {
    navigation.navigate("CryptoPortfolio");
  };

  return (
    <View style={styles.container}>
      <View style={styles.subContainer}>
        <Pressable onPress={navigateDeposit}>
          <Card customStyle={styles.card}>
            <FontAwesome
              name="credit-card"
              size={32}
              color={Colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.text}>Deposits</Text>
          </Card>
        </Pressable>

        <Pressable onPress={navigateCrypto}>
          <Card customStyle={styles.card}>
            <FontAwesome
              name="bitcoin"
              size={32}
              color={Colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.text}>Crypto</Text>
          </Card>
        </Pressable>

        <Pressable>
          <Card customStyle={styles.card}>
            <Ionicons
              name="calculator-outline"
              size={32}
              color={Colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.text}>Calculator</Text>
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
    alignItems: "center",
    justifyContent: "center",
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

export default HomeScreen;
