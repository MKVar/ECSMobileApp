import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, Text, View, Alert, Linking } from "react-native";

import { NavigationContainer, StackActions } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Divider, Button, ThemeProvider } from "react-native-elements";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BarCodeScanner } from "expo-barcode-scanner";
import { WebView } from "react-native-webview";

import { getUniqueId, getDeviceId, getBaseOs } from "react-native-device-info";

import KazooSDK from "../../utils/kazoo";
import { useCiophoneContext } from "../../providers/SipUaProvider/store";

import { useSelector, useDispatch } from "react-redux";

import DialpadScreen from "../DialpadScreen/DialpadScreen";
import InCallScreen from "../InCallScreen/InCallScreen";
import IncomingCallScreen from "../IncomingCallScreen/IncomingCallScreen";
import ScreenpopWebviewScreen from "../ScreenpopWebviewScreen/ScreenpopWebviewScreen";
import * as WebBrowser from "expo-web-browser";

import AsyncStorage from "@react-native-async-storage/async-storage";

import useEffectOnce from "react-use/lib/useEffectOnce";

let AccountKazooSDK;

const Stack = createStackNavigator();

export default function DialStack() {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const allScreenpops = state.app.screenpops.list;
  // console.log("-----all screenpops:---", allScreenpops);

  return (
    <Stack.Navigator initialRouteName={"Dialpad"}>
      <Stack.Screen
        name="Dialpad"
        component={DialpadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InCall"
        component={InCallScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IncomingCall"
        component={IncomingCallScreen}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="ScreenpopWebview"
        component={ScreenpopWebviewScreen}
        options={{
          title: "",
          headerBackTitleVisible: false,
        }}
      /> */}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
