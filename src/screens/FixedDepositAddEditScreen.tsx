import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DatePicker from "../components/DatePicker";
import { RouteProps } from "../utils/Utils";
import { FixedDepositModel } from "../models/FixedDepositModel";
import { Colors } from "../utils/Color";
import Button from "../components/Button";

const clientList = [
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
  route: RouteProps;
};

const FixedDepositAddEditScreen = ({ route }: Props) => {
  const { fixedDepositData } = route.params || {};
  const pageType = fixedDepositData ? "Edit" : "Add";
  const fixedDeposit: FixedDepositModel = fixedDepositData || null;
  const depositorList = ["Rahul", "Mythili"];
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [amount, setAmount] = useState("");
  const [interestPercentage, setInterestPercentage] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [depositedDate, setDepositedDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  useEffect(() => {
    if (fixedDeposit) {
      setClientId(fixedDeposit.clientId);
      setClientName(
        clientList.filter((client) => client.id == fixedDeposit.clientId)[0]
          .name
      );
      setDepositorName(fixedDeposit.depositorName);
      setAmount(fixedDeposit.amount);
      setInterestPercentage(fixedDeposit.interestPercentage);
      setInterestAmount(fixedDeposit.interest);
      setDepositedDate(fixedDeposit.depositedDate);
      setMaturityDate(fixedDeposit.maturityDate);
    }
  }, []);

  const calculateInterestAmount = () => {
    const calculatedInterest = Math.floor(
      ((Number(amount) / 12) * Number(interestPercentage)) / 100
    ).toString();
    setInterestAmount(calculatedInterest);
  };

  const onChangeDepositedDate = (selectedDate: any) => {
    const currentDate = selectedDate || depositedDate;
    setDepositedDate(currentDate);
  };

  const onChangeMaturityDate = (selectedDate: any) => {
    const currentDate = selectedDate || maturityDate;
    setMaturityDate(currentDate);
  };

  // Add your update logic here
  const handleUpdate = () => {
    console.log(
      clientName,
      clientId,
      depositorName,
      amount,
      interestAmount,
      interestPercentage,
      depositedDate,
      maturityDate
    );
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.label}>Client</Text>
        <View style={styles.pickerContainer}>
          <Picker
            style={styles.picker}
            mode="dialog"
            selectedValue={clientId}
            onValueChange={(itemValue, itemIndex) => {
              setClientId(itemValue);
              setClientName(
                clientList.filter((client) => client.id == itemValue)[0].name
              );
            }}
          >
            {clientList.map((client, index) => {
              return (
                <Picker.Item
                  key={client.id}
                  label={client.name}
                  value={client.id}
                />
              );
            })}
          </Picker>
        </View>

        <Text style={styles.label}>Depositor Name</Text>
        <View style={styles.pickerContainer}>
          <Picker
            style={styles.picker}
            mode="dropdown"
            selectedValue={depositorName}
            onValueChange={(itemValue, itemIndex) =>
              setDepositorName(itemValue)
            }
          >
            {depositorList.map((depositor, index) => {
              return (
                <Picker.Item
                  key={index + 1}
                  label={depositor}
                  value={depositor}
                />
              );
            })}
          </Picker>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          onChangeText={setAmount}
          value={amount}
          placeholder="Amount"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Interest(%)</Text>
        <TextInput
          style={styles.input}
          onChangeText={setInterestPercentage}
          value={interestPercentage}
          placeholder="Interest"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Interest Amount</Text>
        <View style={styles.buttonInputContainer}>
          <TextInput
            style={[styles.input, { width: "75%" }]}
            onChangeText={setInterestAmount}
            value={interestAmount}
            placeholder="Interest Amount"
            keyboardType="numeric"
          />
          <Button
            title="Calculate"
            buttonStyle={{ width: "auto" }}
            onPress={calculateInterestAmount}
          />
        </View>

        <DatePicker
          label={"Deposited Date"}
          dateValue={depositedDate}
          onDateChange={onChangeDepositedDate}
        />

        <DatePicker
          label={"Maturity Date"}
          dateValue={maturityDate}
          onDateChange={onChangeMaturityDate}
        />

        <View style={{ justifyContent: "center", flexDirection: "row" }}>
          <Button
            title={pageType == "Add" ? "Add" : "Update"}
            onPress={handleUpdate}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 0,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 20,
    marginTop: 4, // Adjust spacing as needed
  },
  picker: {
    height: 50,
    borderWidth: 0,
    backgroundColor: Colors.F7F7F7,
    paddingHorizontal: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonInputContainer: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
  },
});

export default FixedDepositAddEditScreen;
