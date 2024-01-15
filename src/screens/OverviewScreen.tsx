import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Card from "../components/Card";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend);

const OverviewScreen = () => {
  const chartData = {
    labels: ["Red", "Blue", "Yellow"],
    datasets: [
      {
        label: "My First Dataset",
        data: [300, 50, 100],
        backgroundColor: [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(255, 205, 86)",
        ],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Card customStyle={styles.card}>
        <Text style={styles.amount}>₹ 10,000</Text>
        <Text style={styles.description}>Fixed Deposit Total Amount</Text>
      </Card>

      <Card customStyle={styles.card}>
        <Text style={styles.amount}>₹ 10,000</Text>
        <Text style={styles.description}>Fixed Deposit Total Interest</Text>
      </Card>

      {/* <VictoryPie
        data={chartData}
        colorScale={["tomato", "orange", "gold", "cyan", "navy", "purple"]}
        innerRadius={50}
      /> */}
      {/* <Card> */}
      <Doughnut data={chartData} />
      {/* </Card> */}
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
