import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import DatePicker from "../components/DatePicker";

const FixedDepositAddEditScreen = () => {
  const [client, setClient] = useState("DBS");
  const [depositorName, setDepositorName] = useState("Mythili");
  const [amount, setAmount] = useState("550000");
  const [interest, setInterest] = useState("7.21");
  const [interestAmount, setInterestAmount] = useState("3304");
  const [depositedDate, setDepositedDate] = useState(new Date());
  const [maturityDate, setMaturityDate] = useState(new Date());

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
    console.log("Update logic here");
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.label}>Client</Text>
        <View style={styles.pickerContainer}>
          <Picker
            style={styles.picker}
            mode="dropdown"
            selectedValue={client}
            onValueChange={(itemValue, itemIndex) => setClient(itemValue)}
          >
            <Picker.Item label="DBS" value="DBS" />
            <Picker.Item label="Client A" value="clientA" />
            <Picker.Item label="Client B" value="clientB" />
          </Picker>
        </View>

        <Text style={styles.label}>Depositor Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={setDepositorName}
          value={depositorName}
          placeholder="Depositor Name"
        />

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
          onChangeText={setInterest}
          value={interest}
          placeholder="Interest"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Interest Amount</Text>
        <TextInput
          style={styles.input}
          onChangeText={setInterestAmount}
          value={interestAmount}
          placeholder="Interest Amount"
          keyboardType="numeric"
        />

        <DatePicker
          label={"Deposited Date"}
          dateValue={depositedDate}
          onDateChange={onChangeDepositedDate}
        />

        <DatePicker
          label={"Maturity Date"}
          dateValue={depositedDate}
          onDateChange={onChangeMaturityDate}
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 20,
    marginTop: 4, // Adjust spacing as needed
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
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
  button: {
    backgroundColor: "#0066ff",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FixedDepositAddEditScreen;
