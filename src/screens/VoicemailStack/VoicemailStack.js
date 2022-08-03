import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Button as RNButton,
} from "react-native";

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

import LoginScreen from "../LoginScreen/LoginScreen";

import AsyncStorage from "@react-native-async-storage/async-storage";

import useEffectOnce from "react-use/lib/useEffectOnce";

import VmboxesScreen from "../VmboxesScreen/VmboxesScreen";
import VmboxScreen from "../VmboxScreen/VmboxScreen";

let AccountKazooSDK;

const Stack = createStackNavigator();

export default function VoicemailStack() {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  let initialRouteName;
  if (state.app.vmboxes?.list?.length === 1) {
    // navigation.navigate("Vmbox", { vmbox: state.app.vmboxes[0] });
    initialRouteName = "Vmbox";
  }

  useEffect(() => {
    (async () => {
      // await state.tmp.KazooSDK.updateVmboxes({
      //   filter_owner_id: state.app.auth.user_id,
      // });
    })();
  }, []);

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name="Vmboxes"
        component={VmboxesScreen}
        options={{ title: "Voicemail Boxes" }}
      />
      <Stack.Screen
        name="Vmbox"
        component={VmboxScreen}
        initialParams={{
          vmbox:
            state.app.vmboxes?.list?.length === 1
              ? state.app.vmboxes.list[0]
              : null,
        }}
        options={({ route }) => ({
          headerBackTitleVisible: false,
          headerTitleAlign: "left",
          title: "",
          // animationEnabled: state.app.vmboxes.length > 1 ? true : false,

          // headerTitle: ({ route }) => {
          //   return (
          //     <View style={{ flexDirection: "row" }}>
          //       <View>
          //         <Text>{route.params.vmbox?.doc?.mailbox}</Text>
          //       </View>
          //       <View>
          //         <Text>{route.params.vmbox?.doc?.name}</Text>
          //       </View>
          //     </View>
          //   );
          // },
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
