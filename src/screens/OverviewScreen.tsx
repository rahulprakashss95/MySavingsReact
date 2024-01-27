import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Card from "../components/Card";
import DoughnutChart from "../components/DoughnutChart";
import { ClientModel } from "../models/ClientModel";
import { amountFormat } from "../utils/Utils";

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

const OverviewScreen = () => {
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

  let fixedDepositData = mergeData(fd, CL);
  let groupedFixedDepositData = fixedDepositData.reduce((r: any, a: any) => {
    r[a.name] = [...(r[a.name] || []), a];
    return r;
  }, {});
  let fixedDepositTotalAmount = 0;
  let fixedDepositTotalInterest = 0;
  for (let data of fixedDepositData) {
    fixedDepositTotalAmount += Number(data.amount);
    fixedDepositTotalInterest += Number(data.interest);
  }

  const randomNum = () => Math.floor(Math.random() * (235 - 52 + 1) + 52);
  const getRandomColor = () =>
    `rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;

  const formChartData = (groupedData: any, groupKey: string) => {
    let chartDataLabel = [];
    let chartDataValue = [];
    for (let key in groupedData) {
      let totalAmount = 0;
      for (let data of groupedData[key]) {
        totalAmount += Number(data[groupKey]);
      }
      chartDataLabel.push(key);
      chartDataValue.push(totalAmount);
    }
    return { label: chartDataLabel, value: chartDataValue };
  };

  let chartData = formChartData(groupedFixedDepositData, "amount");
  let interestChartData = formChartData(groupedFixedDepositData, "interest");

  const formDoughnutChart = (chartDataProps: any) => {
    let bgColor: any = [];
    chartDataProps.value.forEach(() => {
      bgColor.push(getRandomColor());
    });
    return {
      labels: chartDataProps.label,
      datasets: [
        {
          data: chartDataProps.value,
          backgroundColor: bgColor,
          hoverBackgroundColor: bgColor,
        },
      ],
    };
  };

  let amountDoughnutChartData = formDoughnutChart(chartData);
  let interestDoughnutChartData = formDoughnutChart(interestChartData);

  return (
    <ScrollView style={styles.container}>
      <Card customStyle={styles.card}>
        <Text style={styles.amount}>
          ₹ {amountFormat(fixedDepositTotalAmount)}
        </Text>
        <Text style={styles.description}>Fixed Deposit Total Amount</Text>
      </Card>

      <Card customStyle={styles.card}>
        <Text style={styles.amount}>
          ₹ {amountFormat(fixedDepositTotalInterest)}
        </Text>
        <Text style={styles.description}>Fixed Deposit Total Interest</Text>
      </Card>

      <Card customStyle={styles.card}>
        <DoughnutChart chartId="amount" chartData={amountDoughnutChartData} />
      </Card>

      <Card customStyle={styles.card}>
        <DoughnutChart
          chartId="interest"
          chartData={interestDoughnutChartData}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  card: {
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "green",
  },
  description: {
    fontSize: 16,
    color: "#777",
    marginTop: 5,
  },
  // You might need to adjust the chart styles based on your needs
  chart: {
    marginTop: 20,
  },
});

export default OverviewScreen;
