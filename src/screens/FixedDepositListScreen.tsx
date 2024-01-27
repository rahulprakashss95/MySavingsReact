import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { getFixedDeposit } from "../../database/firebaseQuery";
import { FixedDepositModel } from "../models/FixedDepositModel";
import { NavigationProp } from "../utils/Utils";
import Loader from "../components/Loader";
import FDCard from "../components/FDCard";
import { ClientModel } from "../models/ClientModel";
import FloatingButton from "../components/FAB";
import moment from "moment";

const CL = [
  {
    id: "3nHxEuNZinwy9w3DbzxY",
    mobile: null,
    name: "HDFC",
    loginUserId: "V4yTbnAuEps1WpBRNeHb",
  },
  {
    mobile: null,
    name: "CUB",
    loginUserId: "hvPqFbtNzE267IGQvLvf",
    id: "DrOFa0co98GOQjTT8qRh",
  },
  {
    mobile: null,
    name: "Cinipriya",
    id: "FDZL7myNAqUHCduJIVjP",
    loginUserId: "hvPqFbtNzE267IGQvLvf",
  },
  {
    mobile: [
      { id: "527", pref: false, value: "+91 99949 47777", type: "mobile" },
    ],
    id: "QwVwQAAajPJ8vHbbSQbK",
    loginUserId: "hvPqFbtNzE267IGQvLvf",
    name: "Cheran Saravanan KBM",
  },
  {
    loginUserId: "hvPqFbtNzE267IGQvLvf",
    mobile: null,
    name: "KVB Capital",
    id: "UEiVaMkk2e5MqI7UTi0n",
  },
  {
    id: "eOhYZkNsxPPTm7nWjiCd",
    name: "Dhanaram",
    mobile: null,
    loginUserId: "hvPqFbtNzE267IGQvLvf",
  },
  {
    id: "eXd7hUUGmuNfzQcuLyDY",
    mobile: null,
    name: "SIB",
    loginUserId: "hvPqFbtNzE267IGQvLvf",
  },
  {
    mobile: null,
    loginUserId: "hvPqFbtNzE267IGQvLvf",
    name: "DBS",
    id: "tDWZk6pzW3inyw0rqdi5",
  },
  {
    loginUserId: "hvPqFbtNzE267IGQvLvf",
    id: "yxY1Rd7maTNOUfLRiIY9",
    mobile: null,
    name: "ICICI",
  },
];

type Props = {
  navigation: NavigationProp;
};

const FixedDepositListScreen = ({ navigation }: Props) => {
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositModel[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      getFDData();
    });

    return unsubscribe;
  }, [navigation]);

  const getFDData = () => {
    setIsLoading(true);
    getFixedDeposit()
      .then((data: any) => {
        let mergedData = mergeData(data, CL);
        const sortedData = sortByMaturityDate(mergedData);
        const updatedData = moveNonMaturityDataToEnd(sortedData);
        setFixedDeposits(updatedData);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => setIsLoading(false));
  };

  const mergeData = (getFixedDepositList: any, clientList: ClientModel[]) => {
    for (let eachData of getFixedDepositList) {
      let fdData: any = eachData;
      let clientData: any = clientList?.filter(
        (data: any) => data.id == eachData.clientId
      );
      if (clientData.length > 0) {
        fdData["name"] = clientData[0].name;
        fdData["mobile"] = clientData[0].mobile;
      }
    }
    return getFixedDepositList;
  };

  const sortByMaturityDate = (listArray: any) => {
    return listArray
      .slice()
      .sort((a: FixedDepositModel, b: FixedDepositModel) => {
        a.maturityDate = a.maturityDate == "" ? 0 : a.maturityDate;
        b.maturityDate = b.maturityDate == "" ? 0 : b.maturityDate;
        const dateA = moment(b.maturityDate, "DD-MMM-YYYY");
        const dateB = moment(a.maturityDate, "DD-MMM-YYYY");

        if (!dateA.isValid()) return 1; // Move invalid dates to the end
        if (!dateB.isValid()) return -1; // Move invalid dates to the end

        return dateB.isBefore(dateA) ? -1 : 1;
      });
  };

  const moveNonMaturityDataToEnd = (listData = []) => {
    let noMaturityData = listData.filter(
      (data: FixedDepositModel, index) => data.maturityDate == ""
    );
    listData = listData.slice(noMaturityData.length, listData.length);
    listData = listData.concat(noMaturityData);
    return listData;
  };

  const navigateFDAddEdit = (data: any) => {
    navigation.navigate("FixedDepositAddEdit", {
      fixedDepositData: data,
    });
  };

  return (
    <View style={styles.container}>
      <Loader loading={isLoading} />
      <FlatList
        contentContainerStyle={{ paddingBottom: 75 }}
        data={fixedDeposits}
        keyExtractor={(_) => Math.random().toString(36).substring(7)}
        renderItem={(itemData: any) => {
          return (
            itemData?.item?.canShow && (
              <View key={itemData.index + 1}>
                <FDCard
                  fixedDeposit={itemData.item}
                  onClickCard={(data) => navigateFDAddEdit(data)}
                />
              </View>
            )
          );
        }}
      />
      <FloatingButton onPress={() => navigateFDAddEdit(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default FixedDepositListScreen;
