import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { ListItem } from "react-native-elements";

import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Alert,
} from "react-native";

import { useIsFocused } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_BOX } from "../../assets/lottie";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { WebView } from "react-native-webview";

const Stack = createStackNavigator();

export default function ScreenpopWebviewScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [showFullLink, setShowFullLink] = useState(null);
  const [supported, setSupported] = useState(null);

  const uri = route.params?.uri;
  const isHttp = /^https?:\/\//.test(uri);
  // console.log("isHttp:", isHttp);

  useEffect(() => {
    // push to "hideTabs" (prevent race condition?)
    // dispatch({
    //   type: "HIDE_TABS",
    // });

    let active = true;

    (async () => {
      const isSupported = await Linking.canOpenURL(uri);
      setSupported(isSupported);
      if (!active) {
        return;
      }
      navigation.setOptions({
        headerRight: (route) => {
          if (!isSupported || !isHttp) {
            return null;
          }
          return (
            <Button
              onPress={async () => {
                await Linking.openURL(uri);
              }}
              title="Open in Browser"
              type="clear"
            />
          );
        },
      });
    })();

    return () => {
      active = false;
      // dispatch({
      //   type: "HIDE_TABS_UNDO",
      // });
    };
  }, []);

  // TODO: Include Screenpop info?
  if (!isHttp) {
    return (
      <ScrollView
        contentContainerStyle={{
          flex: 1,
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 32, marginBottom: 24 }}>
            Unable to Display
          </Text>

          <TouchableOpacity onPress={() => setShowFullLink(!showFullLink)}>
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 24, marginBottom: 2 }}>
                {showFullLink ? uri : uri.split("://")[0] + "://..."}
              </Text>
              <Text style={{ fontSize: 12, marginBottom: 24 }}>
                Tap to {showFullLink ? "hide" : "show"} full link
              </Text>
            </View>
          </TouchableOpacity>

          {supported ? (
            <Button
              onPress={async () => {
                try {
                  await Linking.openURL(uri);
                } catch (err) {
                  Alert.alert("Unable to open URL");
                }
              }}
              title="Open with Phone"
              type="clear"
            />
          ) : (
            <Text>Link Not Supported for Opening</Text>
          )}
        </View>
      </ScrollView>
    );
  }

  return <WebView source={{ uri }} style={{}} />;
}

const styles = StyleSheet.create({});
