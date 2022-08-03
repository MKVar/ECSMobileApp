import React, { useEffect, useState, useRef } from "react";
import RNCallKeep from "react-native-callkeep";
import Constants from "expo-constants";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useDispatch, useSelector } from "react-redux";
import { AsYouType } from "libphonenumber-js";
import { RoundButton } from "../DialpadScreen/DialpadScreen";
import { useCiophoneContext } from "../../providers/SipUaProvider/store";
import { Screenpops } from "../../modules/Screenpops";
import AudioCallScreen from "../AudioCallScreen/AudioCallScreen";
import VideoCallScreen from "../VideoCallScreen/VideoCallScreen";
import {set} from "react-native-reanimated";


export default function InCallScreen({ navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const [cioState, cioDispatch] = useCiophoneContext();
  const { calls } = cioState;
  const user = state.app.user;

  // check if calls are present or not
  if (calls.length === 0) {
    return null;
  }
  let activeCall = calls.find((c) => c.isMediaActive() === true);
  if (activeCall === undefined) {
    activeCall = calls[calls.length - 1];
  }

  // TODO:
  // - useEffect to determine if we are NOT in a call (and reset to Dialpad view)
  return (
    <>
    { activeCall._hasLocalVideo === true ? (
        <VideoCallScreen nav={navigation} call={activeCall} />
      ) : (
        <AudioCallScreen
          nav={navigation}
        />
      )
    }
    </>
  );
};

