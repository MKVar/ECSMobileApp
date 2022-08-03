import React, { useEffect, useState, useRef } from "react";
import RNCallKeep from "react-native-callkeep";
import Constants from "expo-constants";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import { createStackNavigator } from "@react-navigation/stack";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useDispatch, useSelector } from "react-redux";
import { AsYouType } from "libphonenumber-js";

import { useCiophoneContext } from "../../providers/SipUaProvider/store";
import { CALL_DIRECTION_INCOMING } from "../../rn-sip/lib/enums";

import { Screenpops } from "../../modules/Screenpops";

const Stack = createStackNavigator();

export default function IncomingCallScreen({ call }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [cioState, cioDispatch] = useCiophoneContext();
  const { calls, makeCall } = cioState;

  // TODO: pass call_id in screen params!
  // console.log("incoming call screen call:", call?._id);
  const callEventHandler = (event, params) => {
    console.log("incoming call screen event", event);
  };
  const onAccept = (isVideoCall) => {
    console.log("Answering call in-app", call._id);
    call?.accept(true, isVideoCall, { isNativeCall: false }, callEventHandler);
  };
  const onReject = () => {
    console.log("Rejecting the call", call?._id);
    // accepted by the App UI
    call?.reject({ isNativeCall: false });
  };

  useEffect(() => {
    if (!calls.length) {
      // make sure ON this screen!
      // TODO: "useRoute" instead!!!
      console.log("Redirecting to Dialpad cuz no calls");
    }
  }, [calls?.length]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          flex: 2,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ paddingVertical: 10 }}>Display: {call?.remoteName}</Text>
        <Text>User: {call?.remoteUser}</Text>
        <View style={{ width: "100%" }}>
          {/*call && (
            <Screenpops
              call={call}
              onUpdate={(screenpops) => {
                // set the call screenpops
                // call._screenpops = screenpops;
              }}
            />
          )*/}
        </View>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={styles.bottomContainer}>
          <View style={{ flexDirection: "row", marginBottom: "20%" }}>
            <View style={{ width: '33%', justifyContent: 'center', alignItems: 'center'}}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => {
                  onAccept(true);
                }}
              >
                <Icon name={'video-outline'} size={36} color={'#fff'} />
              </TouchableOpacity>
            </View>
            <View
              style={{
                width: "33%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={styles.endButton}
                onPress={() => {
                  onReject();
                }}
              >
                <Icon name={"phone-hangup-outline"} size={36} color="#fff" />
              </TouchableOpacity>
            </View>
            <View
              style={{
                width: "33%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => {
                  onAccept(false);
                }}
              >
                <Icon name={"phone-outline"} size={36} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const actionButton = {
  marginTop: 16,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  width: 80,
  height: 80,
  borderRadius: 40,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingBottom: 60,
  },
  remoteElem: {
    flex: 0,
    marginTop: 10,
    height: "auto",
    padding: 20,
    borderRadius: 10,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
  },
  actButtonContainer: {
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    width: "33%",
    height: 80,
  },
  actRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  centerText: {
    justifyContent: "center",
    alignItems: "center",
  },
  actText: {
    paddingTop: 6,
    color: "rgb(180,210,222)",
  },
  endButton: {
    ...actionButton,
    borderColor: "#e01e5a",
    backgroundColor: "#e01e5a",
  },
  acceptButton: {
    ...actionButton,
    borderColor: "rgb(44,190,150)",
    backgroundColor: "rgb(44,190,150)",
  },
  profileImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    color: "#fff",
    fontSize: 24,
  },
  para: {
    color: "#bebebe",
    fontSize: 20,
  },
  centerText: {
    justifyContent: "center",
    alignItems: "center",
  },
});
