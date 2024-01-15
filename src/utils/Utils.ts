import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { RootStackParamList } from "../../App";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export const sortByMaturityDate = (listArray: any) => {
  return listArray.sort((a: any, b: any) => {
    a.maturityDate = a.maturityDate == "" ? 0 : a.maturityDate;
    b.maturityDate = b.maturityDate == "" ? 0 : b.maturityDate;
    return <any>new Date(a.maturityDate) - <any>new Date(b.maturityDate);
  });
};

export const moveNonMaturityDataToEnd = (listData = []) => {
  let noMaturityData = listData.filter(
    (data: any, index) => data.maturityDate == 0
  );
  listData = listData.slice(noMaturityData.length, listData.length);
  listData = listData.concat(noMaturityData);
  return listData;
};

export let globalClientList = [];
