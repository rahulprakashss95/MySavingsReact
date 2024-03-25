import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { RootStackParamList } from "../../App";
import { RouteProp } from "@react-navigation/native";
import { Alert, Platform } from "react-native";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type RouteProps = RouteProp<RootStackParamList>;

export const currentOS = Platform.OS;

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

export const showConfirmationAlert = (title: string, subTitle: string) => {
  return new Promise(async (resolve, reject) => {
    Platform.OS == "web"
      ? resolve(confirm("Are you sure you want to delete?"))
      : Alert.alert(
          title,
          subTitle,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                resolve(false);
              },
            },
            {
              text: "OK",
              onPress: () => {
                resolve(true);
              },
            },
          ],
          { cancelable: false }
        );
  });
};

export const amountFormat = (amount: any) => {
  return amount
    ? amount.toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,") + ""
    : "";
};

export let globalClientList = [];
