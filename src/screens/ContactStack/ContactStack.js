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

import ContactsScreen from "../ContactsScreen/ContactsScreen";
import ContactViewScreen from "../ContactViewScreen/ContactViewScreen";
import ContactUpdateScreen from "../ContactUpdateScreen/ContactUpdateScreen";

const Stack = createStackNavigator();

export default function MainStack() {
  const state = useSelector((s) => s);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ContactView"
        component={ContactViewScreen}
        options={{ headerBackTitleVisible: false }}
      />
      <Stack.Screen
        name="ContactUpdate"
        component={ContactUpdateScreen}
        options={{ headerBackTitleVisible: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
