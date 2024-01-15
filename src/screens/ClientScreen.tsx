import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from "react-native";
import Card from "../components/Card";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { getClients } from "../../database/firebaseQuery";
import {
  globalClientList,
  moveNonMaturityDataToEnd,
  sortByMaturityDate,
} from "../utils/Utils";
import Loader from "../components/Loader";
import FDCard from "../components/FDCard";
import { ClientModel } from "../models/ClientModel";

type ClientScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  navigation: ClientScreenNavigationProp;
};

const ClientScreen = ({ navigation }: Props) => {
  const [clientList, setClientList] = useState<ClientModel[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getClients()
      .then((data: any) => {
        setClientList(data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => setIsLoading(false));
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
