import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useState } from "react";
import moment from "moment";

type IDatePicker = {
  label: string;
  dateValue: string;
  onDateChange: (date: any) => void;
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DatePicker = (props: IDatePicker) => {
  const { label, dateValue, onDateChange } = props;
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parseDateString = (dateString: string) => {
    if (dateString) {
      const [day, monthStr, year] = dateString?.split("-");
      const monthIndex = months.indexOf(monthStr);
      // Ensure the format is correct before creating the Date object
      if (day && monthIndex !== -1 && year) {
        return new Date(Number(year), monthIndex, Number(day));
      } else {
        console.error("Invalid date string format");
        return new Date(); // Return a default date if parsing fails
      }
    }
  };

  function convertDateFormat(dateString: string) {
    const inputDate = new Date(dateString);
    const formattedDate = moment(inputDate).format("DD-MMM-YYYY");

    return formattedDate;
  }

  const handleConfirm = (date: any) => {
    console.log(convertDateFormat(date));
    setShowDatePicker(false);
    onDateChange(convertDateFormat(date));
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.dateInput}
      >
        <Text style={styles.dateText}>{dateValue}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        date={parseDateString(dateValue)}
        isVisible={showDatePicker}
        mode="date"
        display={Platform.OS == "ios" ? "inline" : "spinner"}
        onConfirm={handleConfirm}
        onCancel={() => {
          setTimeout(() => {
            setShowDatePicker(false);
          }, 0);
        }}
      />
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
