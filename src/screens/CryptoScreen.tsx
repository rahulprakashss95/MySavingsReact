import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Button,
  TouchableWithoutFeedback,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import InAppBrowser from "react-native-inappbrowser-reborn";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

import { AntDesign } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

const CryptoPortfolioPage = () => {
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const platform = Platform.OS;
  const [tokens, setTokens] = useState<any>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isINR, setIsINR] = useState(false);

  const swipeableRefs = useRef<Array<Swipeable | null>>([]);

  useEffect(() => {
    fetchTokensFromStorage();
  }, []);

  useEffect(() => {
    setPortfolioTotal(getPortfolioValue(null));
  }, [isINR]);

  // Fetch tokens from local storage
  const fetchTokensFromStorage = async () => {
    try {
      const tokensFromStorage = await AsyncStorage.getItem("tokens");
      if (tokensFromStorage !== null) {
        let tokensData: any = [];
        tokensData = JSON.parse(tokensFromStorage);
        console.log(tokensData);
        let updatedTokensData: any = [];
        tokensData.map(async (data: any, index: any) => {
          data["isApiLoaded"] = false;
          let calculatedData = await calculateValue(data);
          data.isApiLoaded = true;
          updatedTokensData.push(calculatedData);
          if (tokensData.every((item: any) => item.isApiLoaded)) {
            setTokenList(updatedTokensData);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching tokens from storage: ", error);
    }
  };

  const calculateValue = async (tokenDetails: any) => {
    try {
      const response = await axios.get(
        `https://api.dexscreener.io/latest/dex/tokens/${tokenDetails.address}`
      );
      const tokenData = response?.data?.pairs[0]; // Ensure response conforms to TokenData interface
      tokenDetails = {
        ...tokenDetails,
        value: (tokenData.priceUsd * tokenDetails.amount).toFixed(2),
        tokenData: tokenData,
      };
      console.log(tokenDetails);
      return tokenDetails;
    } catch (error) {
      console.error("Error fetching token data: ", error);
    }
  };

  // Handle edit token
  const editToken = (index: any) => {
    setSelectedTokenIndex(index);
    setTokenAddress(tokens[index].address);
    setTokenAmount(String(tokens[index].amount));
    if (swipeableRefs.current[index]) {
      swipeableRefs.current[index]?.close();
    }
    setModalVisible(true);
  };

  // Delete token from list and update storage
  const deleteToken = async (index: any) => {
    try {
      const updatedTokens = [...tokens];
      updatedTokens.splice(index, 1);
      setTokenList(updatedTokens);
      await AsyncStorage.setItem("tokens", JSON.stringify(updatedTokens));
      if (swipeableRefs.current[index]) {
        swipeableRefs.current[index]?.close();
      }
    } catch (error) {
      console.error("Error deleting token: ", error);
    }
  };

  // Save token to local storage and update state
  const saveToken = async () => {
    if (tokenAddress && tokenAmount) {
      try {
        const newToken = {
          address: tokenAddress,
          amount: parseFloat(tokenAmount),
        };
        let calculatedData = await calculateValue(newToken);
        let updatedTokens = [...tokens];
        if (selectedTokenIndex !== null && selectedTokenIndex !== undefined) {
          // Update existing token
          updatedTokens[selectedTokenIndex] = calculatedData;
        } else {
          // Add new token
          updatedTokens = [...updatedTokens, calculatedData];
        }
        setTokenList(updatedTokens);
        await AsyncStorage.setItem("tokens", JSON.stringify(updatedTokens));
        closeModal();
      } catch (error) {
        console.error("Error saving token: ", error);
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTokenAddress("");
    setTokenAmount("");
    setSelectedTokenIndex(null);
  };

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTokensFromStorage().then(() => setRefreshing(false));
  }, []);

  const refresh = () => {
    setRefreshing(true);
    fetchTokensFromStorage().then(() => setRefreshing(false));
  };

  const getPortfolioValue = (tokensData: any) => {
    let total = 0;
    let tokenData = tokensData ? tokensData : tokens;
    tokenData.map((token: any) => {
      total += token?.value ? parseFloat(token?.value) : 0;
      console.log(token?.value, "---", total);
    });
    return parseFloat(isINR ? (total * 83).toFixed(2) : total.toFixed(2));
  };

  const setTokenList = (tokensList: any) => {
    const orderedTokensList = tokensList.sort((a: any, b: any) => {
      return parseFloat(b?.value) - parseFloat(a?.value); // Descending order
    });
    setTokens(orderedTokensList);
    setPortfolioTotal(getPortfolioValue(orderedTokensList));
  };

  const formattedValue = (value: any) => {
    return value?.toLocaleString("en-US", {
      style: "currency",
      currency: isINR ? "INR" : "USD",
    });
  };

  const openInAppBrowser = async (url: string) => {
    // if (platform === "web") {
    window.open(url, "_blank");
    // } else {
    //   try {
    //     if (InAppBrowser) {
    //       await InAppBrowser.open(url, {
    //         // InAppBrowser options
    //         // For example:
    //         // iOS options
    //         dismissButtonStyle: "cancel",
    //         preferredBarTintColor: "#0a0a0a",
    //         preferredControlTintColor: "white",
    //         readerMode: false,
    //         animated: true,
    //         modalPresentationStyle: "fullScreen",
    //         modalTransitionStyle: "coverVertical",
    //         modalEnabled: true,
    //         enableBarCollapsing: false,
    //         // Android options
    //         showTitle: true,
    //         toolbarColor: "#0a0a0a",
    //         secondaryToolbarColor: "black",
    //         enableUrlBarHiding: true,
    //         enableDefaultShare: true,
    //         forceCloseOnRedirection: false,
    //       });
    //     }
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }
  };

  // Render token item with swipe-to-delete functionality
  const renderTokenItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <Swipeable
        ref={(ref) => {
          swipeableRefs.current[index] = ref;
        }}
        renderRightActions={() => (
          <>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteToken(index)}
            >
              <AntDesign name="delete" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => editToken(index)}
            >
              <FontAwesome name="edit" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
        // renderLeftActions={() => (
        //   <>
        //     <TouchableOpacity
        //       style={styles.chartButton}
        //       onPress={() => {
        //         if (swipeableRefs.current[index]) {
        //           swipeableRefs.current[index]?.close();
        //         }
        //         openInAppBrowser(item?.tokenData?.url);
        //       }}
        //     >
        //       <AntDesign name="linechart" size={24} color="white" />
        //     </TouchableOpacity>
        //   </>
        // )}
      >
        <View style={styles.tokenContainer}>
          <Image
            source={{ uri: item?.tokenData?.info?.imageUrl }}
            style={styles.image}
          />
          <View style={styles.detailsContainer}>
            <Text style={styles.currencyText}>
              {item?.tokenData?.baseToken?.symbol}
            </Text>
            <View style={styles.percentageContainer}>
              <Text style={styles.amountText}>
                ${item?.tokenData?.priceUsd}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color:
                    item?.tokenData?.priceChange?.h24 > 0 ? "green" : "red",
                }}
              >
                {item?.tokenData?.priceChange?.h24}%
              </Text>
            </View>
          </View>
          <View style={styles.endContainer}>
            <Text style={styles.miniAmountText}>{item?.amount}</Text>
            <Text style={styles.totalText}>${formattedValue(item?.value)}</Text>
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={styles.viewHeight}>
        <View style={styles.refreshIcon}>
          <TouchableOpacity onPress={() => refresh()}>
            <MaterialIcons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsINR(!isINR)}>
            <Text style={styles.total}>{formattedValue(portfolioTotal)}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={tokens}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderTokenItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            closeModal();
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Enter Token Address"
                onChangeText={setTokenAddress}
                value={tokenAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Token Amount"
                onChangeText={setTokenAmount}
                keyboardType="numeric"
                value={tokenAmount}
              />
              <View style={styles.modalButtonContainer}>
                <View style={styles.modalButton}>
                  <Button title="Cancel" onPress={closeModal} />
                </View>
                <View style={styles.modalButton}>
                  <Button title="Save" onPress={saveToken} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 16,
    paddingRight: 16,
  },
  viewHeight: {
    height: "100%",
  },
  refreshIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    maxHeight: 200,
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  total: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  tokenContainer: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#000", // Adjust the color to match your design
    padding: 10, // Adjust the padding as needed
    alignItems: "center",
    gap: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  currencyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  percentageContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  amountText: {
    color: "#808080",
    fontSize: 14,
    fontWeight: "500",
  },
  endContainer: {
    alignItems: "flex-end",
  },
  miniAmountText: {
    color: "#fff",
    fontSize: 16,
  },
  totalText: {
    color: "#808080",
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007bff",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: "100%",
    paddingTop: 32,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  modalButtonContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 4,
  },
  modalButton: {
    width: "50%",
  },
  chartButton: {
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteButton: {
    backgroundColor: "#ff6347",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  editButton: {
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
});

export default CryptoPortfolioPage;
