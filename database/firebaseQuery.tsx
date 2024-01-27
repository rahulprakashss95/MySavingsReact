import firebaseDb from "./firebaseDb";
import "firebase/firestore";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  DocumentReference,
  deleteDoc,
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

export const addFixedDeposit = (
  clientId: string,
  depositorName: string,
  amount: string,
  interest: string,
  interestPercentage: string,
  depositedDate: string,
  maturityDate: string
) => {
  return new Promise(async (resolve, reject) => {
    const refId = doc(collection(db, "fixedDeposit")).id;
    setDoc(doc(db, "fixedDeposit", refId), {
      id: refId,
      clientId: clientId,
      depositorName: depositorName,
      amount: amount,
      interest: interest,
      interestPercentage: interestPercentage,
      depositedDate: depositedDate,
      maturityDate: maturityDate,
      canShow: true,
      isCompleted: false,
      loginUserId: "",
    })
      .then(() => {
        resolve("");
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const updateFixedDeposit = (
  refId: string,
  clientId: string,
  depositorName: string,
  amount: string,
  interest: string,
  interestPercentage: string,
  depositedDate: string,
  maturityDate: string
) => {
  return new Promise(async (resolve, reject) => {
    setDoc(doc(db, "fixedDeposit", refId), {
      id: refId,
      clientId: clientId,
      depositorName: depositorName,
      amount: amount,
      interest: interest,
      interestPercentage: interestPercentage,
      depositedDate: depositedDate,
      maturityDate: maturityDate,
      canShow: true,
      isCompleted: false,
      loginUserId: "",
    })
      .then((data) => {
        console.log(data);
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const deleteFixedDeposit = (id: string) => {
  return new Promise(async (resolve, reject) => {
    deleteDoc(doc(db, "fixedDeposit", id))
      .then((querySnapshot) => {
        resolve(querySnapshot);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
