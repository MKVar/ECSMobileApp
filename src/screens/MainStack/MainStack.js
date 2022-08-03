import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, Text, View, Alert } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Divider, Button, ThemeProvider } from "react-native-elements";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BarCodeScanner } from "expo-barcode-scanner";
import { WebView } from "react-native-webview";

import { useDispatch, useSelector } from "react-redux";
import { getUniqueId, getDeviceId, getBaseOs } from "react-native-device-info";

import KazooSDK from "../../utils/kazoo";

import MainTabStack from "../MainTabStack/MainTabStack";
import ChatScreen from "../ChatScreen/ChatScreen";
import ContactViewScreen from "../ContactViewScreen/ContactViewScreen";

const Stack = createStackNavigator();


export default function MainStack() {
  const state = useSelector((s) => s);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabStack"
        component={MainTabStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ContactViewRoot"
        component={ContactViewScreen}
        options={{ headerBackTitleVisible: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
