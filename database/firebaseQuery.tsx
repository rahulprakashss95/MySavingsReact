import firebaseDb from "./firebaseDb";
import "firebase/firestore";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const db = getFirestore(firebaseDb);

export const getLoginUser = (username: string, password: string) => {
  return new Promise(async (resolve, reject) => {
    const q = query(
      collection(db, "loginUsers"),
      where("username", "==", username),
      where("password", "==", password)
    );
    getDocs(q)
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          resolve(doc.data());
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const getClients = () => {
  return new Promise(async (resolve, reject) => {
    const q = query(collection(db, "clients"));
    getDocs(q)
      .then((querySnapshot) => {
        const clientList: any = [];
        querySnapshot.forEach((doc) => {
          clientList.push(doc.data());
        });
        resolve(clientList);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const getFixedDeposit = () => {
  return new Promise(async (resolve, reject) => {
    const q = query(collection(db, "fixedDeposit"));
    getDocs(q)
      .then((querySnapshot) => {
        const fixedDepositList: any = [];
        querySnapshot.forEach((doc) => {
          fixedDepositList.push(doc.data());
        });
        resolve(fixedDepositList);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
