import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { Platform, StyleSheet, View, Alert, Image } from "react-native";
import MaskedView from "@react-native-community/masked-view";
import { Camera } from "expo-camera";
import Svg, { Path } from "react-native-svg";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Divider, Button, ThemeProvider, Text } from "react-native-elements";

import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BarCodeScanner } from "expo-barcode-scanner";
import { WebView } from "react-native-webview";

import { getUniqueId, getDeviceId, getBaseOs } from "react-native-device-info";

import KazooSDK from "../../utils/kazoo";
import { useSelector, useDispatch } from "react-redux";

import LottieView from "lottie-react-native";
import {
  ANIMATION_LOADING,
  ANIMATION_TWO_ARROW_DOWN,
} from "../../assets/lottie";

import { registerDevice } from "./registration";
import CONFIG from "../../../whitelabel_config/config.json";

import { SvgCorner } from "../../modules/SvgCorner";

const testData = {
  type: "v1",
  data: {
    auth_token:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImI5ZTkyZDI4OTViZTAyZjliZWExZDkwNGU0MjY2YTE0In0.eyJpc3MiOiJrYXpvbyIsImlkZW50aXR5X3NpZyI6Ild6eHZYcHd0ajFHX09XNU1hUWxFN0VrTnRuOFpTa2QzajlXS29hRUx4UFkiLCJhY2NvdW50X2lkIjoiNjAxMTYyYTFkNTdiNjAwMTlhMjNmZmI2ZjFhNzA3YzciLCJvd25lcl9pZCI6ImQ0YWIwZDJiMTVmYTgxOTkyODRkYTFkMjk0M2FmZWM0IiwibWV0aG9kIjoiY2JfdXNlcl9hdXRoIiwiZXhwIjoxNjU2MTEzOTg2fQ.E2TFZZPampX686CnLCrcu6s1libBeczg2rUuCZTRJagJt4KRObAWPr7jXfykYToj_v80igLkWYVPBoRgR39R1H5QghM4x2eFuFmybZVcgLaXioMRMuFk32JqC8NTEPcgqi0ZPE3hvr2qOD2yfCHJx7yFINuioS55OF893oZrG-O7WLcfJh6er8LCB36Rwx9JDnCpSLlc3a0lBJf0KUnmbPm0QlJtqdOfCjGvypw9ZFDlsGt0cZ-5T-BK87ESbb01CiOpD_D5n9i6h00jFziI8fCyrI2Q0ShRMtbfOsafjx3-SVXMs0uAj_b5jFB29A-0ILuDgeVyl1RY3P7q2pyg5Q",
    cio_api_url: CONFIG.api.url, // "http://localhost:4010",
    kazoo_api_url: CONFIG.kazoo.api_url, // "https://sandbox.2600hz.com:8443/v2",
    name: "Adrian Admin",
  },
};

export default function QrScreen({ navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [scannerEnabled, setScannerEnabled] = useState(null);

  const handleScan = async (scanData) => {
    console.log("scanData:", JSON.stringify(scanData, null, 2));
    // return false;
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        loggingIn: true,
        loginFailed: false,
      },
    });
    try {
      const result = await registerDevice(scanData);
      console.log("Login/Register Result:", JSON.stringify(result, null, 2));
      if (result) {
        state.tmp.KazooSDK.account_id = result.account_id;
        state.tmp.KazooSDK.user_id = result.user_id;
        state.tmp.KazooSDK.auth_token = result.auth_token;
        await state.tmp.KazooSDK.updateAccount(); // updating Account in storage
        await state.tmp.KazooSDK.updateUser(); // updating User in storage
        await state.tmp.KazooSDK.updateDevice(result.device_id); // updating Device in storage
        await dispatch({
          type: "SET_APP_STATE",
          payload: { auth: result },
        });
        navigation.reset({
          index: 0,
          routes: [{ name: "MainStack" }],
        });
        // dispatch({
        //   type: "SET_STATE",
        //   payload: {
        //     loggingIn: null,
        //   },
        // });
      } else {
        // login failed
        dispatch({
          type: "SET_TMP_STATE",
          payload: {
            loggingIn: null,
            loginFailed: true,
          },
        });
        // trigger scanner reset
        throw "Login Failed";
      }
    } catch (err) {
      dispatch({
        type: "SET_TMP_STATE",
        payload: {
          loggingIn: null,
          loginFailed: true,
        },
      });
      throw "Login Failed";
    }
  };

  if (false || state.tmp.loggingIn) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View>
          <LottieView
            style={{
              width: 150,
              height: 150,
              // backgroundColor: "#eee",
            }}
            source={ANIMATION_LOADING}
            autoPlay
            loop
          />
        </View>
        <Text h4 h4Style={{ marginBottom: 10 }}>
          Registering...
        </Text>
        <Text>Please wait a moment</Text>
        <View style={{ height: 80 }}></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toptext}>
        {/* <Text h2 style={{ marginBottom: 42 }}>
          Welcome to CallingIO!
        </Text> */}

        <Image
          style={{
            maxWidth: 270,
            maxHeight: 100,
          }}
          source={require("../../../whitelabel_config/login_logo.jpg")}
          resizeMode="contain"
        />
        {/* <Text h2 style={{ marginBottom: 42 }}>
          Welcome to CallingIO!
        </Text> */}
        <Text h4 h4Style={{ fontWeight: "normal" }}>
          Please scan the QR Code{" "}
        </Text>
        <Text h4 h4Style={{ fontWeight: "normal" }}>
          {" "}
          on your computer screen
        </Text>
        {state.loginFailed ? (
          <Text style={{ color: "red" }}>Login Failed! Please try again</Text>
        ) : null}
      </View>
      {/* <Divider style={{}} /> */}
      <View style={styles.scanner}>
        {scannerEnabled ? (
          <ScannerView onScan={handleScan} />
        ) : (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <LottieView
              style={{
                width: 150,
                height: 150,
                // backgroundColor: "#eee",
              }}
              source={ANIMATION_TWO_ARROW_DOWN}
              autoPlay
              loop
            />
            <View style={{ marginTop: 60 }} />
            <Button
              onPress={() => {
                setScannerEnabled(true);
              }}
              title="Enable Camera to Scan"
              type="outline"
              raised
              // titleStyle={{ fontSize: 24, color: "black" }}
            />
          </View>
        )}
      </View>
      {/* <Divider style={{}} /> */}
      <View style={styles.bottomtext}>
        <Button
          onPress={() => {
            alert("Please contact nick@2600hz.com");
          }}
          title="Need Help?"
          type="clear"
          titleStyle={{ fontSize: 14, color: "black" }}
        />
      </View>
    </View>
  );
}

const Scanner = (props) => {
  const { onScan } = props;

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      // const { status } = await BarCodeScanner.requestPermissionsAsync();
      const { status } = await Camera.requestPermissionsAsync();
      // console.log("barcode scanner status:", status);
      setHasPermission(status === "granted" ? true : false);
    })();
  }, []);

  const handleBarcodeDataStr = async (str) => {
    try {
      const jsonData = JSON.parse(str);
      await onScan(jsonData);
    } catch (err) {
      console.error(err);
      alert("Failed reading type of QR code, please try again");
      setScanned(false);
    }
  };

  const scanRef = useRef(null);
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    // alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    if (!scanRef.current) {
      scanRef.current = true;
      handleBarcodeDataStr(data);
      // scanRef.current = false;
    }
  };

  const handleRequestTestData = () => {
    Alert.prompt(
      "Barcode Data",
      "Paste the JSON string",
      (data) => {
        if (data) {
          handleBarcodeDataStr(data);
        }
      },
      "plain-text",
      JSON.stringify(testData)
    );
  };

  if (false || hasPermission === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View>
          <LottieView
            style={{
              width: 150,
              height: 150,
              // backgroundColor: "#eee",
            }}
            source={ANIMATION_LOADING}
            autoPlay
            loop
          />
        </View>
        <Text style={{ marginBottom: 10 }}>Requesting camera permission</Text>
        <View style={{ height: 80 }}></View>
      </View>
    );
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <>
      <Camera
        style={{ flex: 1 }}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
        onBarCodeScanned={handleBarCodeScanned}
      >
        <View
          style={{
            flex: 1,
            width: 13,
            height: 13,
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ rotate: "90deg" }],
          }}
        >
          <SvgCorner />
        </View>
        <View
          style={{
            flex: 1,
            width: 13,
            height: 13,
            position: "absolute",
            bottom: 0,
            left: 0,
            // transform: [{ rotate: "90deg" }],
          }}
        >
          <SvgCorner />
        </View>
        <View
          style={{
            flex: 1,
            width: 13,
            height: 13,
            position: "absolute",
            top: 0,
            right: 0,
            transform: [{ rotate: "180deg" }],
          }}
        >
          <SvgCorner />
        </View>
        <View
          style={{
            flex: 1,
            width: 13,
            height: 13,
            position: "absolute",
            bottom: 0,
            right: 0,
            transform: [{ rotate: "-90deg" }],
          }}
        >
          <SvgCorner />
        </View>
      </Camera>

      {/* <BarCodeScanner
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      /> */}
      {/* {scanned && (
        <Button
          title={"Tap to Scan Again"}
          onPress={() => {
            setScanned(false);
            scanRef.current = false;
          }}
          style={{ marginTop: 100, marginLeft: 50, marginRight: 50 }}
        />
      )} */}
      {/* {__DEV__ ? (
        <Button
          title={"Test Scan"}
          onPress={handleRequestTestData}
          style={{ marginTop: 100, marginLeft: 50, marginRight: 50 }}
        />
      ) : (
        <></>
      )} */}
    </>
  );
};

const ScannerView = ({ onScan }) => {
  return Platform.OS == "ios" ? (
    <MaskedView
      style={{ flex: 1, flexDirection: "row", height: "100%" }}
      maskElement={<View style={styles.scannerMask} />}
    >
      <Scanner onScan={onScan} />
    </MaskedView>
  ) : (
    <View style={{ flex: 1, flexDirection: "row", height: "100%" }}>
      <Scanner onScan={onScan} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    // alignItems: "center",
    // justifyContent: "center",
  },
  toptext: {
    paddingTop: 40,
    height: 220,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  scanner: {
    flexShrink: 0,
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  bottomtext: {
    height: 80,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerMask: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "red",
  },
  webview: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "black",
  },
});
