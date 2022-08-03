import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { Button, ListItem, Switch, Text } from "react-native-elements";

import { StyleSheet, SafeAreaView, View, ScrollView } from "react-native";

import UI from "../../modules/UI";

import { AsYouType } from "libphonenumber-js";

import { createStackNavigator } from "@react-navigation/stack";

import { set, get } from "lodash";

import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
import KazooSDK from "../../utils/kazoo";

import { CallForwarding } from "./CallForwarding";
import { DoNotDisturb } from "./DoNotDisturb";
import { Numbers } from "./Numbers";
import { TestScreenpops } from "./TestScreenpops";
import { Logout } from "./Logout";
import UaSettings  from "./UaSettings";

import * as Network from "expo-network";
import NetInfo from "@react-native-community/netinfo";

const Stack = createStackNavigator();

export default function SettingsScreen({ navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [expanded, setExpanded] = useState({
    numbers: false,
    call_forward: {
      user: false,
      device: false,
    },
  });

  useEffect(() => {
    // Background fetch info: https://rossbulat.medium.com/react-native-background-task-management-in-ios-d0f05ae53cc5
    // - more info for iOS (voip apps): https://stackoverflow.com/a/10533041

    // {
    //   type: NetworkStateType.CELLULAR,
    //   isConnected: true,
    //   isInternetReachable: true,
    // }
    // console.log("Getting Network status");
    // Network.getNetworkStateAsync().then((data) => console.log("DATA:", data));
    // Subscribe
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      console.log("Network Connection type", networkState.type);
      console.log("Is connected?", networkState.isConnected);
      dispatch({
        type: "SET_TMP_STATE",
        payload: { network: networkState },
      });
      // TODO: save to server (depending on status of local elements "enable_on_cell" )
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ height: 10 }} />
        <UaSettings />
        <View style={{ height: 10 }} />
        <CallForwarding />
        <View style={{ height: 10 }} />
        <DoNotDisturb />
        {/* <ListItem.Accordion
          topDivider
          bottomDivider
          content={
            <>
              <ListItem.Content>
                <ListItem.Title>User and Account Phone Numbers</ListItem.Title>
              </ListItem.Content>
            </>
          }
          isExpanded={expanded.numbers}
          onPress={handleExpand("numbers")}
        >
          <ListItem>
            <ListItem.Content>
              <ListItem.Title>Test</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </ListItem.Accordion> */}
        <View style={{ height: 10 }} />

        <Logout />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
