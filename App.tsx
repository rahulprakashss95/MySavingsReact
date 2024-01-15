import LoginScreen from "./src/screens/LoginScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/HomeScreen";
import DepositScreen from "./src/screens/DepositScreen";
import FixedDepositListScreen from "./src/screens/FixedDepositListScreen";
import FixedDepositAddEditScreen from "./src/screens/FixedDepositAddEditScreen";
import OverviewScreen from "./src/screens/OverviewScreen";
import Toast from "react-native-toast-message";
import ClientScreen from "./src/screens/ClientScreen";
// import { Provider } from "react-redux";
// import store from "./src/redux/store";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Deposit: undefined;
  Clients: undefined;
  FixedDepositList: undefined;
  FixedDepositAddEdit: undefined;
  OverView: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const StackList = () => {
    return (
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />
        <Stack.Screen
          name="Deposit"
          component={DepositScreen}
          options={{ title: "Deposits" }}
        />
        <Stack.Screen
          name="Clients"
          component={ClientScreen}
          options={{ title: "Clients" }}
        />
        <Stack.Screen
          name="FixedDepositList"
          component={FixedDepositListScreen}
          options={{ title: "Fixed Deposits" }}
        />
        <Stack.Screen
          name="FixedDepositAddEdit"
          component={FixedDepositAddEditScreen}
          options={{ title: "Fixed Deposit" }}
        />
        <Stack.Screen
          name="OverView"
          component={OverviewScreen}
          options={{ title: "Overview" }}
        />
      </Stack.Navigator>
    );
  };

  return (
    // <Provider store={store}>
    <NavigationContainer>
      <StackList />
      <Toast />
    </NavigationContainer>
    // </Provider>
  );
};

export default App;
