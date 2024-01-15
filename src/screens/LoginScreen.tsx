import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { getLoginUser } from "../../database/firebaseQuery";
import Loader from "../components/Loader";
import { Colors } from "../utils/Color";
import { NavigationProp, showToast } from "../utils/Utils";
import Button from "../components/Button";

type Props = {
  navigation: NavigationProp;
};

const LoginScreen = ({ navigation }: Props) => {
  const [username, setUsername] = useState("rahul");
  const [password, setPassword] = useState("rahul@123");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    // setIsLoading(true);
    // getLoginUser(username, password)
    //   .then((data: any) => {
    //     console.log("LoginData", data);
    //     if (data) {
    //       navigation.navigate("Home");
    //     } else {
    //      showErrorToast();
    // }
    //   })
    //   .catch((error) => {
    //     console.log("LoginError", error);
    //      showErrorToast();
    //   })
    //   .finally(() => setIsLoading(false));
    navigation.replace("Home");
  };

  const showErrorToast = () => {
    showToast(
      "error",
      "Login Error",
      "Either username or password is incorrect",
      "bottom"
    );
  };

  return (
    <View style={styles.container}>
      <Loader loading={isLoading} />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button onPress={handleLogin} title="Login" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default LoginScreen;
