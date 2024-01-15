import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

type IDatePicker = {
  label: string;
  dateValue: Date;
  onDateChange: (date: any) => void;
};

const DatePicker = (props: IDatePicker) => {
  const { label, dateValue, onDateChange } = props;

  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: dateValue,
      onChange(event, date) {
        onDateChange(date);
      },
      mode: "date",
      display: "spinner",
    });
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => openDatePicker()}
        style={styles.dateInput}
      >
        <Text style={styles.dateText}>{dateValue.toLocaleDateString()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
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

export default DatePicker;
