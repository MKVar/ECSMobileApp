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

import DialStack from "../DialStack/DialStack";
import VoicemailStack from "../VoicemailStack/VoicemailStack";
import CallHistoryScreen from "../CallHistoryScreen/CallHistoryScreen";
import MessagingStack from "../MessagingStack/MessagingStack";
import ContactStack from "../ContactStack/ContactStack";
import SettingStack from "../SettingStack/SettingStack";
import {useCiophoneContext} from "../../providers/SipUaProvider/store";
import DialpadScreen from "../DialpadScreen/DialpadScreen";
import InCallScreen from "../InCallScreen/InCallScreen";
import IncomingCallScreen from "../IncomingCallScreen/IncomingCallScreen";

let AccountKazooSDK;

const Tab = createBottomTabNavigator();

export default function MainTabStack({navigation}) {
  const state = useSelector((s) => s);
  const [cioState, cioDispatch] = useCiophoneContext();
  const { calls, makeCall } = cioState;
  const account = state.app.account;
  const device = state.app.device;

  const CallingScreen = () => {
    if (!account?.realm || !device?.sip || calls === undefined) {
      return null;
    } else if (calls?.length === 0) {
      return (
        <DialpadScreen navRef={navigation} />
      );
    } else {
      if (calls.length === 1 && calls[0].isRinging() === true) {
        const call = calls[0];
        return (
          <IncomingCallScreen call={call} />
        );
      } else {
        return (
          <InCallScreen />
        );
      }
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
    >
      {(account?.realm && device?.sip) &&
      <>
      <Tab.Screen
          name="DialStack"
          component={CallingScreen}
          options={(opts) => ({
            tabBarIcon: ({focused, color, size}) => (
                <MaterialIcons name="dialpad" size={size} color={color}/>
            ),
            tabBarLabel: "Phone",
            tabBarActiveTintColor: "#572a17",
            tabBarVisible: state.tmp.hideTabs ? false : true,
          })}
      />
      <Tab.Screen
        name="CallHistory"
        component={CallHistoryScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
          tabBarActiveTintColor: "#572a17",
          tabBarLabel: "Recent",
        }}
      />
      <Tab.Screen
        name="ContactStack"
        component={ContactStack}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons name="contacts" size={size} color={color} />
          ),
          tabBarActiveTintColor: "#572a17",
          tabBarLabel: "Contacts",
        }}
      />
      <Tab.Screen
        name="VoicemailStack"
        component={VoicemailStack}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="voicemail" size={size} color={color} />
          ),
          tabBarActiveTintColor: "#572a17",
          tabBarLabel: "Voicemails",
        }}
      />
      </>
      }
      <Tab.Screen
        name="SettingStack"
        component={SettingStack}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
          tabBarActiveTintColor: "#572a17",
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

// const ShowWebview = () => {
//   return (
//     <WebView
//       source={{ uri: "https://callingio-homepage-api.vercel.app/" }}
//       style={{ marginTop: 20 }}
//     />
//   );
// };

const styles = StyleSheet.create({});
