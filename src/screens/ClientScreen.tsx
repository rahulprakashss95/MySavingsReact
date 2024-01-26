import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import Card from "../components/Card";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { getClients } from "../../database/firebaseQuery";
import Loader from "../components/Loader";
import { ClientModel } from "../models/ClientModel";

type ClientScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  navigation: ClientScreenNavigationProp;
};

const ClientScreen = ({ navigation }: Props) => {
  const [clientList, setClientList] = useState<ClientModel[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // setIsLoading(true);
    // getClients()
    //   .then((data: any) => {
    //     console.log(JSON.stringify(data));
    //     setClientList(data);
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   })
    //   .finally(() => setIsLoading(false));
    setClientList([
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
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <Loader loading={isLoading} />
      <FlatList
        data={clientList}
        keyExtractor={(_, index) => (index + 1).toString()}
        renderItem={(itemData: any) => {
          let client: ClientModel = itemData?.item;
          return (
            <View key={itemData.index + 1}>
              <Card>
                <Text>{client.name}</Text>
                {client.mobile &&
                  client.mobile.map((mobile, index) => {
                    return <Text key={index + 1}>{mobile.value}</Text>;
                  })}
              </Card>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default ClientScreen;
