import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { RootStackParamList } from "../navigation/routeTypes";
import { RouteProp } from "@react-navigation/native";
import { Alert, Keyboard, Platform } from "react-native";

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type RouteProps = RouteProp<RootStackParamList>;

export const currentOS = Platform.OS;

const TOAST_VISIBILITY_MS = 3000;
// react-native-toast-message repositions a bottom toast based on the live
// keyboard height (see its useKeyboard hook). If the toast mounts while the
// keyboard is still mid-dismiss, it renders at the keyboard's old height and
// then snaps to the true bottom the instant the hide event lands — the
// "glitches to the bottom" jump. Dismissing first and waiting for the actual
// `keyboardDidHide` event (not a guessed delay — dismiss animation length
// varies by device/OS) avoids mounting into that race.
const KEYBOARD_HIDE_FALLBACK_MS = 400;
// Bumped on every toast so the safety-net timer below only dismisses the toast
// it was scheduled for — a newer toast keeps showing for its own full window.
let toastSeq = 0;

const waitForKeyboardHidden = (): Promise<void> =>
  new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      sub.remove();
      clearTimeout(timer);
      resolve();
    };
    const sub = Keyboard.addListener("keyboardDidHide", finish);
    const timer = setTimeout(finish, KEYBOARD_HIDE_FALLBACK_MS);
  });

const displayToast = (
  type: "success" | "error" | "info",
  text1: string,
  text2: string,
  toastPosition: "top" | "bottom"
) => {
  const seq = ++toastSeq;
  const result = Toast.show({
    type: type,
    text1: text1,
    text2: text2,
    position: toastPosition,
    autoHide: true,
    visibilityTime: TOAST_VISIBILITY_MS,
  });
  // Safety net: the library's internal auto-hide timer has been seen to not
  // fire in some native environments, leaving the toast stuck on screen. Force
  // a dismiss a beat after its window — but only if no newer toast has replaced
  // it, so rapid successive toasts each get their full time.
  setTimeout(() => {
    if (seq === toastSeq) {
      Toast.hide();
    }
  }, TOAST_VISIBILITY_MS + 800);
  return result;
};

export const showToast = (
  type: "success" | "error" | "info",
  text1: string,
  text2: string,
  toastPosition: "top" | "bottom"
) => {
  if (toastPosition === "bottom" && Keyboard.isVisible()) {
    Keyboard.dismiss();
    waitForKeyboardHidden().then(() =>
      displayToast(type, text1, text2, toastPosition)
    );
    return;
  }
  return displayToast(type, text1, text2, toastPosition);
};

export const showConfirmationAlert = (title: string, subTitle: string) => {
  return new Promise<boolean>((resolve) => {
    Platform.OS == "web"
      ? resolve(confirm(subTitle))
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
