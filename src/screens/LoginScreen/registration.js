import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, Text, View, Alert } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Divider, Button, ThemeProvider } from "react-native-elements";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BarCodeScanner } from "expo-barcode-scanner";
import { WebView } from "react-native-webview";

import { getUniqueId, getDeviceId, getBaseOs } from "react-native-device-info";

import KazooSDK from "../../utils/kazoo";
import { AsyncAlert } from "../../modules/AsyncAlert/AsyncAlert";

import CONFIG from "../../../whitelabel_config/config.json";

let AccountKazooSDK;

export const registerDevice = async (typeAndData) => {
  // Checks data loaded via login
  // - gets the appIdentifier (unique device id) for this iOS/Android device (NOT NECESSARY? trying to prevent re-install or a "new" device being created server-side?)
  // - makes request to cio_api_url to get device info
  //   - submits auth_token and appIdentifier
  // - server creates a new device (or returns existing device info)
  //   - server returns:
  //     - new auth_token for user (a long - lived one ?)
  //     - device document (w/ sip_credentials)

  console.log("trying to register device", typeAndData);

  switch (typeAndData?.type) {
    case "v1":
      //   await AsyncAlert(
      //     "Login",
      //     "Ready to login for user: " + typeAndData.data.name
      //   );
      const userDeviceId = getUniqueId();
      const platformVersion = getDeviceId();

      const body = {
        auth_token: typeAndData.data.auth_token, // just for registering this device on CIO server!
        // user_id: "",
        user_device_id: userDeviceId,
        platform_version: platformVersion,
      };

      // Make API call to CIO for device registration
      // - returns auth_token

      const resp = await fetch(`${CONFIG.api.url}/api/v1/mobileapp/register`, {
        method: "POST",
        mode: "cors",
        headers: {
          // Authorization: `Bearer ${gh_personal_access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const resp_json = await resp.json();

      console.log("resp_json:", resp_json);
      if (!resp_json?.auth_token) {
        console.log("failed login");
        throw "Failed Login";
        return false;
      }
      // alert(JSON.stringify(body, null, 2));

      AccountKazooSDK = new KazooSDK({
        account_id: resp_json.account_id,
        auth_token: resp_json.auth_token,
      });

      const resp2 = await AccountKazooSDK.get("");
      console.log("resp2:", resp2);
      //   alert("Account Name (after register!): " + resp2.data.name);

      return {
        auth_token: resp_json.auth_token,
        account_id: resp_json.account_id,
        user_id: resp_json.user_id,
        device_id: resp_json.device_id,
      };

      break;

    default:
      alert("Invalid type specified for device registration");
      throw "Failed";
  }
};
