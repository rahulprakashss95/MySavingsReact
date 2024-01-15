import * as LocalAuthentication from "expo-local-authentication";
import { showToast } from "../utils/Utils";

const checkBiometrics = async () => {
  try {
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error(error);
  }
};

export const biometricAuthentication = async () => {
  LocalAuthentication.supportedAuthenticationTypesAsync().then((data: any) => {
    if (data.length > 0) {
      LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate using your biometrics",
      })
        .then((isSuccess) => {
          if (isSuccess) {
            console.log("Biometric authentication successful");
          } else {
            console.log("Biometric authentication failed");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      showToast(
        "error",
        "Authentication",
        "Biometric Authentication not supported",
        "bottom"
      );
    }
  });
};
