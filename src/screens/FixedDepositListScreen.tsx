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

type Props = {
  navigation: NavigationProp;
};

const FixedDepositListScreen = ({ navigation }: Props) => {
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositModel[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fd = [
      {
        amount: "600000",
        canShow: true,
        clientId: "eXd7hUUGmuNfzQcuLyDY",
        depositedDate: "11-Jan-2024",
        depositorName: "Mythili",
        id: "4m7Gj4PehGOHl63z4i3V",
        interest: "3700",
        interestPercentage: "7.4",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "14-Feb-2025",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "eOhYZkNsxPPTm7nWjiCd",
        depositedDate: "",
        depositorName: "Mythili",
        id: "5GbJkHb58aDQxvBuuYjO",
        interest: "5000",
        interestPercentage: "12",
        isCompleted: true,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "",
      },
      {
        amount: "664614",
        canShow: true,
        clientId: "tDWZk6pzW3inyw0rqdi5",
        depositedDate: "28-Nov-2021",
        depositorName: "Mythili",
        id: "AGAEMRBQs3kHTpHKT3Tu",
        interest: "3129",
        interestPercentage: "5.65",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "28-Nov-2024",
      },
      {
        amount: "400000",
        canShow: true,
        clientId: "DrOFa0co98GOQjTT8qRh",
        depositedDate: "15-Nov-2022",
        depositorName: "Mythili",
        id: "BwlbcBZZpa9LDl9WwFRq",
        interest: "2366",
        interestPercentage: "7.1",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "15-Nov-2024",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "tDWZk6pzW3inyw0rqdi5",
        depositedDate: "07-Aug-2023",
        depositorName: "Mythili",
        id: "N8ZRjoUbDhA8G0oKq5UH",
        interest: "3104",
        interestPercentage: "7.45",
        isCompleted: false,
        loginUserId: "V4yTbnAuEps1WpBRNeHb",
        maturityDate: "09-Feb-2026",
      },
      {
        amount: "200000",
        canShow: true,
        clientId: "UEiVaMkk2e5MqI7UTi0n",
        depositedDate: "",
        depositorName: "Mythili",
        id: "Tg5mak9I8otFjLeR82Zn",
        interest: "1660",
        interestPercentage: "9.96",
        isCompleted: true,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "",
      },
      {
        amount: "250000",
        canShow: true,
        clientId: "eXd7hUUGmuNfzQcuLyDY",
        depositedDate: "08-Oct-2021",
        depositorName: "Mythili",
        id: "YCeAFvOtbNXMszj4Jui2",
        interest: "1145",
        interestPercentage: "5.5",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "08-Oct-2024",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "eXd7hUUGmuNfzQcuLyDY",
        depositedDate: "05-Jan-2024",
        depositorName: "Mythili",
        id: "YTT4dTsRzkQtzlySR1LK",
        interest: "3083",
        interestPercentage: "7.4",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "08-Feb-2025",
      },
      {
        amount: "150000",
        canShow: true,
        clientId: "3nHxEuNZinwy9w3DbzxY",
        depositedDate: "11-Sep-2023",
        depositorName: "Rahul",
        id: "bYz7GwNLy71JRL4Bknm7",
        interest: "875",
        interestPercentage: "7",
        isCompleted: false,
        loginUserId: "V4yTbnAuEps1WpBRNeHb",
        maturityDate: "11-Sep-2028",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "DrOFa0co98GOQjTT8qRh",
        depositedDate: "21-Aug-2023",
        depositorName: "Mythili",
        id: "gN40v9BFdwwdydeBFr1V",
        interest: "2916",
        interestPercentage: "7",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "24-Sep-2024",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "eOhYZkNsxPPTm7nWjiCd",
        depositedDate: "05-Sep-2022",
        depositorName: "Mythili",
        id: "iG7DMHe8TBYDrJmfZThv",
        interest: "5000",
        interestPercentage: "12",
        isCompleted: false,
        loginUserId: "V4yTbnAuEps1WpBRNeHb",
        maturityDate: "",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "DrOFa0co98GOQjTT8qRh",
        depositedDate: "07-Sep-2023",
        depositorName: "Mythili",
        id: "oTYDUYDSP8Umg3FnCL5b",
        interest: "2916",
        interestPercentage: "7",
        isCompleted: true,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "11-Oct-2024",
      },
      {
        amount: "500000",
        canShow: true,
        clientId: "DrOFa0co98GOQjTT8qRh",
        depositedDate: "14-Dec-2023",
        depositorName: "Mythili",
        id: "qtmYwBkMPECjToQyNmaQ",
        interest: "2916",
        interestPercentage: "7",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "17-Jan-2025",
      },
      {
        amount: "550000",
        canShow: true,
        clientId: "tDWZk6pzW3inyw0rqdi5",
        depositedDate: "12-Feb-2023",
        depositorName: "Mythili",
        id: "v9XaLzTWhnBqjb7Qs6fG",
        interest: "3304",
        interestPercentage: "7.21",
        isCompleted: false,
        loginUserId: "hvPqFbtNzE267IGQvLvf",
        maturityDate: "12-Aug-2024",
      },
    ];
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

    let mergedData = mergeData(fd, CL);
    const sortedData = sortByMaturityDate(mergedData);
    const updatedData = moveNonMaturityDataToEnd(sortedData);
    setFixedDeposits(updatedData);

    // setIsLoading(true);
    // getFixedDeposit()
    //   .then((data: any) => {
    //     console.log(data);
    //     setFixedDeposits(data);
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   })
    //   .finally(() => setIsLoading(false));
  }, []);

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
    navigation.navigate("FixedDepositAddEdit", { fixedDepositData: data });
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
