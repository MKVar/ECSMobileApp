import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { Platform, StyleSheet, Text, View, Alert } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

import { Divider, Button, ThemeProvider } from "react-native-elements";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BarCodeScanner } from "expo-barcode-scanner";
import { WebView } from "react-native-webview";

import { getUniqueId, getDeviceId, getBaseOs } from "react-native-device-info";

import { registerPushNotifications } from "../../redux/actions";
import KazooSDK from "../../utils/kazoo";

import { useSelector, useDispatch } from "react-redux";

import ScreenpopWebviewScreen from "../ScreenpopWebviewScreen/ScreenpopWebviewScreen";
import LoginScreen from "../LoginScreen/LoginScreen";
import SetupScreen from "../LoginScreen/SetupScreen";
import MainStack from "../MainStack/MainStack";

import AsyncStorage from "@react-native-async-storage/async-storage";

import useEffectOnce from "react-use/lib/useEffectOnce";

import { useCiophoneContext } from "../../providers/SipUaProvider/store";
import useCallKeep from "../../providers/SipUaProvider/useCallKeep";
import { useMessaging } from "../../modules/UseMessagingHook";
import ChatScreen from "../ChatScreen/ChatScreen";
import ChatNewScreen from "../ChatNewScreen/ChatNewScreen";
import ContactNewScreen from "../ContactNewScreen/ContactNewScreen";

const Stack = createStackNavigator();

export default function RootStack(props) {
  return <RootStack_Main {...props} />;
}

function RootStack_Main({ navigationRef, navigationReadyRef }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [doneLoading, setDoneLoading] = useState(null);

  // console.log("STATTE:", state);

  // listen for new calls, etc
  // useCalls(navigationRef);
  useCallKeep({ navigationRef, navigationReadyRef });
  useMessaging({ navigationRef, navigationReadyRef });

  // Loading stored information before showing a screen (either MainStack or Login)
  useEffect(() => {
    (async () => {
      try {
        state.tmp.KazooSDK = new KazooSDK({
          // auth_token: state.auth.auth_token,
          // account_id: state.auth.account_id,
          // user_id: state.auth.user_id,
          dispatch,
        });
        // dispatch({
        //   type: "SET_TMP_STATE",
        //   payload: {
        //     doneLoading: true,
        //   },
        // });
        // console.log("INITIALSTATE:", JSON.stringify(state.app.auth, null, 2));
        registerPushNotifications();
        if (state.app.auth) {
          // update tempstate w/ correct values for KazooSDK
          state.tmp.KazooSDK.user_id = state.app.auth.user_id;
          state.tmp.KazooSDK.account_id = state.app.auth.account_id;
          state.tmp.KazooSDK.auth_token = state.app.auth.auth_token;

          // NOT awaiting the following before rending page!
          state.tmp.KazooSDK.updateAccount(); // updating Account in storage
          state.tmp.KazooSDK.updateUser(); // updating User in storage
          state.tmp.KazooSDK.updateDevice(state.app.auth.device_id).then(() => {
            registerPushNotifications();
          }); // updating Device in storage
          state.tmp.KazooSDK.updateVmboxes({
            filter_owner_id: state.app.auth.user_id,
          });
          state.tmp.KazooSDK.getScreenpops();
        }
      } catch (err) {}
      setDoneLoading(true);
    })();
  }, [state.app.auth?.user_id]);

  // Hide splash screen after loading
  useEffect(() => {
    if (doneLoading) {
      setTimeout(async () => {
        // somehow wait for something to be mounted?
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    }
  }, [doneLoading]);

  // // on state update, save to storage
  // useEffect(() => {
  //   if (doneLoading) {
  //     console.log("WRITING STATE", state);
  //     AsyncStorage.setItem("state", JSON.stringify(state)); // inefficient to stringify entire state!
  //   } else {
  //     console.log("NOT writing state");
  //   }
  // }, [state?._v, doneLoading]);
  let initial = "Login";
  if (state.app.tenantUrl === "" ) {
    initial = 'Setup';
  }
  if (!doneLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={state.app.auth ? "MainStack" : initial}
      mode="modal" // might want to change this so only ScreenpopWebview is in a modal stack...
    >
      <Stack.Screen
        name="Setup"
        component={SetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainStack"
        component={MainStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// const useCalls = (navigationRef) => {
//   const state = useSelector((s) => s);
//   const dispatch = useDispatch();

//   const [cioState, cioDispatch] = useCiophoneContext();
//   const { calls, makeCall } = cioState;

//   const onNewIncomingCall = (call) => {
//     // TODO: have a plan for handling calls when another call is already in-progress
//     // - ignore, hold, merge, etc.

//     if (calls?.length > 1) {
//       // TODO: make sure that "calls" is actually a current value, not stale (might need to do store.getState())
//       // call in progress already
//     } else {
//       navigationRef.current?.navigate("DialStack", { screen: "IncomingCall" });
//     }
//     // // alert("New incoming call");
//     // dispatch({
//     //   type: "SET_TMP_STATE",
//     //   payload: {

//     //     loggingIn: null,
//     //     loginFailed: true,
//     //   },
//     // });
//   };

//   useEffect(() => {
//     // alert(1);
//     state.tmp.eventBus.on("new-incoming-call", onNewIncomingCall);
//     return () => {
//       state.tmp.eventBus.off("new-incoming-call", onNewIncomingCall);
//     };
//   }, []);

//   return null;
// };

const styles = StyleSheet.create({});
