import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, View, FlatList } from "react-native";
import { Text } from "react-native-elements";

import { useDispatch, useSelector } from "react-redux";
import { createStackNavigator } from "@react-navigation/stack";

import { useIsFocused } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_FOLDER } from "../../assets/lottie";

import { cloneDeep } from "lodash";
import {
  Divider,
  Button,
  ThemeProvider,
  ButtonGroup,
} from "react-native-elements";

import { default as HistoryItem } from "./HistoryItem/HistoryItem";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {MaterialCommunityIcons} from "@expo/vector-icons";

const Tab = createMaterialTopTabNavigator();

function CallHistoryByStatus({status}) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const calls = cloneDeep(state.app.localCallHistory || []).reverse();
  const titleText = (status === 'all') ? "Recent Calls" : "Missed Calls";

  let items = calls.filter((call) =>
      (status === 'all') ? call : call.wasMissed
  );
  items = [
    ...items,
  ];
  const renderItem = ({ item, index, separators }) => {
    if (item.id === "title") {
      return (
          <View style={{ paddingLeft: 40, paddingTop: 8, paddingBottom: 8 }}>

            <Text h2>{item.text}</Text>
            <Divider />
          </View>
      );
    }
    return <HistoryItem data={item} index={index} separators={separators} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "transparent", marginTop: 40 }}>
      <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
      />
    </View>
  );
}

export function AllCallsScreen() {
  return (
      <CallHistoryByStatus status={"all"} />
  );
}
function MissedCallsScreen() {
  return (
      <CallHistoryByStatus status={"missed"} />
  );
}

export default function CallHistoryScreen({ navigation, route }) {

  return (
      <CallHistoryByStatus status={"all"} />
  );
      {/*
    <Tab.Navigator
      style = {{
        paddingTop: 36,
      }}
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold'},
        tabBarIndicatorStyle: { backgroundColor: '#ECB22E', height: 2},
      }}
    >
      <Tab.Screen name="All" component={AllCallsScreen} />
      <Tab.Screen name="Missed" component={MissedCallsScreen} />
    </Tab.Navigator>
    <View style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: 22,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ width: 220 }}>
          <ButtonGroup
            onPress={onUpdateTabValue}
            selectedIndex={state.tmp.callHistory_view || 0}
            buttons={["All", "Missed"]}
            //   [
            //   {
            //     element: <Text>All</Text>,
            //   },
            //   {
            //     element: <Text>Missed</Text>,
            //   },
            // ]}
            // containerStyle={{ height: 100 }}
          />
        </View>
      </View>
      <Divider />
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>*/}
}

const styles = StyleSheet.create({});
