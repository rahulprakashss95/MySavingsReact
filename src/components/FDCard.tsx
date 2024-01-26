import { Pressable, Text, View, StyleSheet } from "react-native";
import Card from "./Card";
import { amountFormat } from "../utils/Utils";
import { FixedDepositModel } from "../models/FixedDepositModel";
import { useEffect } from "react";

type IFDCard = {
  fixedDeposit: FixedDepositModel;
  onClickCard: (data: FixedDepositModel) => void;
};

const FDCard = (props: IFDCard) => {
  const { fixedDeposit, onClickCard } = props;

  return (
    <Card>
      <Pressable onPress={() => onClickCard(fixedDeposit)}>
        <Text style={styles.bankName}>
          {fixedDeposit.name} - {fixedDeposit.depositorName}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailsColumn}>
            <Text style={styles.detailsTitle}>Deposited Amount</Text>
            <Text style={styles.amountValue}>
              ₹ {amountFormat(fixedDeposit.amount)}
            </Text>
          </View>
          <View style={styles.detailsColumn}>
            <Text style={styles.detailsTitle}>Interest(%)</Text>
            <Text style={styles.interestValue}>
              {fixedDeposit.interestPercentage}%
            </Text>
          </View>
          <View style={styles.detailsColumn}>
            <Text style={styles.detailsTitle}>Interest(₹)</Text>
            <Text style={styles.interestValue}>
              ₹ {amountFormat(fixedDeposit.interest)}
            </Text>
          </View>
        </View>

        {fixedDeposit.depositedDate || fixedDeposit.maturityDate != "0" ? (
          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.detailsTitle}>Deposited Date</Text>
              <Text style={styles.dateValue}>{fixedDeposit.depositedDate}</Text>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.detailsTitle}>Maturity Date</Text>
              {fixedDeposit.maturityDate != "0" && (
                <Text style={styles.dateValue}>
                  {fixedDeposit.maturityDate}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <></>
        )}
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  bankName: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailsColumn: {
    flexDirection: "column",
  },
  detailsTitle: {
    fontSize: 14,
    color: "grey",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "green",
  },
  interestValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "green",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  dateColumn: {
    flexDirection: "column",
  },
  dateValue: {
    fontSize: 16,
  },
});

export default FDCard;
