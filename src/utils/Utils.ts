import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { RootStackParamList } from "../../App";
import { RouteProp } from "@react-navigation/native";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type RouteProps = RouteProp<RootStackParamList>;

export const showToast = (
  type: "success" | "error" | "info",
  text1: string,
  text2: string,
  toastPosition: "top" | "bottom"
) => {
  return Toast.show({
    type: type,
    text1: text1,
    text2: text2,
    position: toastPosition,
  });
};

export const amountFormat = (amount: any) => {
  return amount
    ? amount.toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,") + ""
    : "";
};

export let globalClientList = [];
