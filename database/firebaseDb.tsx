import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyD35rVbE07MU7TFQyhuK8BIV0vbE8h194Y",
  authDomain: "my-savings-application.appspot.com",
  databaseURL: "https:/my-savings-application-default-rtdb.firebaseio.com",
  projectId: "my-savings-application",
  storageBucket: "my-savings-application.appspot.com",
  messagingSenderId: "3676553551",
  appId: "1:989185139177:android:367fd8661274d71705ab78",
};

const firebaseDb = initializeApp(firebaseConfig);

export default firebaseDb;
