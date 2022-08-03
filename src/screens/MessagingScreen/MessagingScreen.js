import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Text } from "react-native-elements";

import { useDispatch, useSelector } from "react-redux";
import { createStackNavigator } from "@react-navigation/stack";

import { useIsFocused } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import {
  ANIMATION_EMPTY_FOLDER,
  ANIMATION_LOADING,
  ANIMATION_STRESSED,
} from "../../assets/lottie";

import { cloneDeep } from "lodash";

import {
  Divider,
  Button,
  ThemeProvider,
  ButtonGroup,
} from "react-native-elements";

import { getMessages } from "../../redux/actions";

import { default as ConversationItem } from "./ConversationItem/ConversationItem";

const Stack = createStackNavigator();

export default function MessagingScreen({ navigation, route }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      getMessages();
    }
  }, [isFocused]);

  // merge our local version of conversations w/ the remote messages
  // - we manage "read" status locally, per conversations
  const { loading, list: conversations = [] } = state.app.conversations || {};

  React.useLayoutEffect(() => {
    navigation.setOptions({
      // title: `${vmbox.doc.mailbox}: ${vmbox.doc.name}`,
      title: "",
      headerRight: () => (
        <Button
          title={"New"}
          type="clear"
          onPress={(e) => {
            navigation.navigate("ChatNew", {
              // conversationKey: "new",
            });
            // setChooseFilter(true);
            // // dispatch({ type: "FILES_CLEAR" });
            // // RNFetchBlob.session("audio").dispose().catch();
          }}
        />
      ),
    });
  }, [navigation]);

  const handleRefresh = async () => {
    // setIsRefreshing(true);
    // try {
    //   await state.tmp.KazooSDK.syncItemList({
    //     id: vmbox.id,
    //     idType: "vmboxes",
    //     listType: "messages",
    //     iterateOverEach: true, // required for fetching transcription!
    //   });
    // } catch (err) {
    //   console.error("Failed syncing vmbox!!:", err);
    // }
    // setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  if (!state.app.messageboxes?.length) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* {Modal} */}
        <View>
          <LottieView
            key={isFocused} // for re-animating when nav here!
            style={{
              width: 150,
              height: 150,
              backgroundColor: "rgba(0,0,0,0)",
            }}
            source={ANIMATION_STRESSED}
            autoPlay
            loop={true}
          />
        </View>
        <Text h4>Sorry, you're not setup for</Text>
        <Text h4>sending or receiving SMS or MMS</Text>
        <Text h4 h4Style={{ marginTop: 12 }}>
          Contact your Admin or Support
        </Text>
        <Text h4>for additional information</Text>
        <View style={{ height: 80 }}></View>
      </View>
    );
  }

  if (conversations.length < 1) {
    if (loading) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {/* {Modal} */}
          <View>
            <LottieView
              key={isFocused} // for re-animating when nav here!
              style={{
                width: 100,
                height: 100,
                // backgroundColor: "#eee",
              }}
              source={ANIMATION_LOADING}
              autoPlay
              loop={false}
            />
          </View>
          <Text h4>Fetching Conversations</Text>
          <View style={{ height: 80 }}></View>
        </View>
      );
    }
    return (
      <TouchableWithoutFeedback onPress={handleRefresh}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {/* {Modal} */}
          <View>
            <LottieView
              key={isFocused} // for re-animating when nav here!
              style={{
                width: 100,
                height: 100,
                // backgroundColor: "#eee",
              }}
              source={ANIMATION_EMPTY_FOLDER}
              autoPlay
              loop={false}
            />
          </View>
          <Text h4>No Conversations</Text>
          <View style={{ height: 80 }}></View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  const renderItem = ({ item, index, separators }) => (
    <ConversationItem data={item} index={index} separators={separators} />
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
