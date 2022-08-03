import React, { useEffect, useState, useRef } from "react";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from "react-native-webrtc";
import * as Sentry from "sentry-expo";
import { LogBox } from "react-native";

// import Constants from "expo-constants";
import { StyleSheet, Text, View, Alert } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Divider, Button, ThemeProvider } from "react-native-elements";

import useEffectOnce from "react-use/lib/useEffectOnce";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";

import { CiophoneProvider, SipUaProvider } from "./providers";

import RootStack from "./screens/RootStack/RootStack";

// unimodules IS installed (without the full changes to AppDelegate.m/h...?)
import { Constants } from "react-native-unimodules";
// console.log("systemfont:", Constants.systemFonts);

// In theory you don't have to install `react-native-root-siblings` because it's a dep of root-toast
// But you can install it explicitly if your editor complains about it.
// - this is a requirement of react-native-root-toast
import { RootSiblingParent } from "react-native-root-siblings";
import "react-native-get-random-values"; // required before using uuidv4!
import { ApolloProvider } from "@apollo/client";
import apolloClient from "./utils/apolloClient";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: __DEV__ ? true : false, // Sentry will try to print out useful debugging information if something goes wrong with sending an event. Set this to `false` in production.
});

// Access any @sentry/react-native exports via:
// Sentry.Native.*

SplashScreen.preventAutoHideAsync()
  .then(() => {
    try {
      // SplashScreen.hideAsync();
    } catch (err) {
      console.error("hidesplasherror1");
    }
  })
  .catch(() => {});

export default function App() {
  registerGlobals();
  // disable SIP timer warning
  LogBox.ignoreLogs(["Setting a timer for a long period of time"]);

  const navigationRef = React.useRef(null);
  const navigationReadyRef = React.createRef();

  // useEffect(() => {
  //   setTimeout(async () => {
  //     // somehow wait for something to be mounted?
  //     SplashScreen.hideAsync().catch(() => {});
  //   }, 1000);
  // }, []);

  return (
    <>
      <RootSiblingParent>
        <>
          <ApolloProvider client={apolloClient}>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => {
                    navigationReadyRef.current = true;
                  }}
                >
                  <ThemeProvider>
                    <CiophoneProvider>
                      <SipUaProvider />
                      <RootStack
                        navigationRef={navigationRef}
                        navigationReadyRef={navigationReadyRef}
                      />
                    </CiophoneProvider>
                  </ThemeProvider>
                </NavigationContainer>
              </PersistGate>
            </Provider>
            <StatusBar style="auto" />
          </ApolloProvider>
        </>
      </RootSiblingParent>
    </>
  );
}

const styles = StyleSheet.create({});
