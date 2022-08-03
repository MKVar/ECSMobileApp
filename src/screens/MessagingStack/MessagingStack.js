import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, Text, View, Alert } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Divider, Button, ThemeProvider } from "react-native-elements";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BarCodeScanner } from "expo-barcode-scanner";
import { WebView } from "react-native-webview";

import { getUniqueId, getDeviceId, getBaseOs } from "react-native-device-info";

import KazooSDK from "../../utils/kazoo";

import { useSelector, useDispatch } from "react-redux";

import useEffectOnce from "react-use/lib/useEffectOnce";

import MessagingScreen from "../MessagingScreen/MessagingScreen";
import ChatScreen from "../ChatScreen/ChatScreen";

import { getMessages } from "../../redux/actions";

const Stack = createStackNavigator();

export default function MessagingStack() {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  useEffect(() => {
    getMessages();
  }, []);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Messaging"
        component={MessagingScreen}
        options={{ title: "Messaging" }}
      />
      {/* <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ title: "Chat" }}
      /> */}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
