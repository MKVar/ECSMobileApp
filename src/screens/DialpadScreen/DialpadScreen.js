import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import RNCallKeep from "react-native-callkeep";
import { createStackNavigator } from "@react-navigation/stack";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useDispatch, useSelector } from "react-redux";
import { AsYouType } from "libphonenumber-js";

import { useCiophoneContext } from "../../providers/SipUaProvider/store";
import {PhoneContacts} from "../../modules/ContactsList/contactsList";
import {AllCallsScreen} from "../CallHistoryScreen/CallHistoryScreen";
import SlidingUpPanel from "rn-sliding-up-panel";
const Stack = createStackNavigator();

export default function DialpadScreen({ navRef }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const user = state.app.user;
  // when user selects from recent history or contact list
  // set selected number as default
  const selectedNum = state.tmp.dialerText;
  const [dialerText, setDialerText] = useState(selectedNum);

  const [cioState, cioDispatch] = useCiophoneContext();
  const { calls, makeCall } = cioState;
  const handleConnect = async () => {
    // dispatch sip action
    // redux
  };
  const callEventHandler = (event, params) => {
    // call event
    console.log("call event123:", event);
  };
  const onDial = (target, isVideoCall) => {
    // navigation.navigate("ScreenpopWebview", {
    //   // uri: "https://callingio-homepage-api.vercel.app/",
    //   uri: "messages://",
    // });
    console.log("making call", target);
    try {
      // call is initiated from the App
      const outCall = makeCall(target, isVideoCall, { isNativeCall: false }, callEventHandler);
      // RNCallKeep.startCall(outCall._id, outCall.remoteUser, outCall.remoteName, 'number', isVideoCall);
      /*
      navRef.navigate("InCall", {
        callId: outCall._id, hasVideo: isVideoCall
      });
      */
    } catch (error) {
      console.log("Make call failed");
    }
  };
  const addToDialerText = (toAdd) => {
    setDialerText(`${dialerText}${toAdd}`);
  };

  const backspaceDialerText = () => {
    setDialerText(dialerText.slice(0, dialerText.length - 1));
  };

  const onPressWrapper = (val) => () => {
    addToDialerText(val);
  };

  const handleStartCall = () => {
    onDial(dialerText, false);
  };

  const handleVideoCall = () => {
    onDial(dialerText, true);
  };

  const onDragBottom = (value) => {
    console.log(value);
    if (value < 100) {
      // navRef.navigate("CallHistory", {});
    }
  };

  const sliderHt = Dimensions.get('window').height * .7;
  const animatedValue = new Animated.Value(sliderHt); //

  return (
    <>
    <View style={{ height: '100%', backgroundColor: 'rgba(247, 239, 225, 0.6)'}}>
      <AllCallsScreen />
    </View>
    <SlidingUpPanel
      containerStyle={styles.slidingPanel}
      draggableRange={{top: sliderHt, bottom: 50}}
      height={sliderHt}
      animatedValue={animatedValue}
      backdropOpacity={0.4}
      onDragEnd={(value, gestureState) => onDragBottom(value)}
    >

        {/* My Caller ID */}
        {/* TODO: (change for when calling internally/externally??) */}
        {/* - we cant REALLY know the caller id (but we can have a darn good guess...) */}
        {/* <View
          style={{
            flex: 1,
            paddingLeft: 20,
            paddingRight: 20,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16 }}>Calling As:</Text>
          <Text style={{ fontSize: 20 }}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={{ fontSize: 20 }}>{user?.presence_id}</Text>
        </View> */}
        {/* Input (and Input Feedback) */}
        <View style={{ flex: 0.2  }}>
          <View style={{ alignItems: 'center'}}>
            <TouchableOpacity style={{width: '80%', alignItems: 'center'}}>
              <MaterialCommunityIcons name="drag-horizontal" size={36} color="#572a17" />
            </TouchableOpacity>
          </View>
          <InputWithFeedback
              dialerText={dialerText}
          />
        </View>

        <View style={{ flex: 0.8, flexDirection: "row", justifyContent: "center" }}>
          <View style={{ flex: 1, maxWidth: "80%" }}>
            {/* Row 1 */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <RoundButton mainText="1" onPress={onPressWrapper("1")} />
              <RoundButton
                mainText="2"
                onPress={onPressWrapper("2")}
              />
              <RoundButton
                mainText="3"
                onPress={onPressWrapper("3")}
              />
            </View>
            {/* Row 2 */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <RoundButton
                mainText="4"
                onPress={onPressWrapper("4")}
              />
              <RoundButton
                mainText="5"
                onPress={onPressWrapper("5")}
              />
              <RoundButton
                mainText="6"
                onPress={onPressWrapper("6")}
              />
            </View>
            {/* Row 3 */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <RoundButton
                mainText="7"
                onPress={onPressWrapper("7")}
              />
              <RoundButton
                mainText="8"
                onPress={onPressWrapper("8")}
              />
              <RoundButton
                mainText="9"
                onPress={onPressWrapper("9")}
              />
            </View>
            {/* Row 4 */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <RoundButton mainText="*" onPress={onPressWrapper("*")} />
              <RoundButton
                mainText="0"
                subText="+"
                onPress={onPressWrapper("0")}
                onLongPress={onPressWrapper("+")}
              />
              <RoundButton mainText="#" onPress={onPressWrapper("#")} />
            </View>
            {/* Row 5 */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <RoundButton
                mainIcon={
                  <MaterialIcons name="videocam" size={34} color="white" />
                }
                backgroundColor="#039BE5"
                onPress={handleVideoCall}
              />
              <RoundButton
                mainIcon={
                  <MaterialIcons name="local-phone" size={42} color="white" />
                }
                backgroundColor="#66BB6A"
                onPress={handleStartCall}
              />
              <RoundButton
                mainIcon={
                  <MaterialIcons name="backspace" size={28} color="#ef5350" />
                }
                backgroundColor="rgba(0,0,0,0)"
                onPress={backspaceDialerText}
              />
            </View>
          </View>
        </View>
    </SlidingUpPanel>
    </>
  );
}

const InputWithFeedback = (props) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{/* Input Feedback/etc */}</View>
      <View
        style={{
          justifyContent: "flex-start",
          paddingLeft: 40,
          paddingRight: 40,
          height: 80,
          //borderTopWidth: 1,
          //borderTopColor: '#aaa',
          marginHorizontal: 20,
        }}
      >
        <InputComponent
          dialerText={props.dialerText}
        />
      </View>

      {/* <Divider /> */}
    </View>
  );
};

const InputComponent = (props) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const dialerText = props.dialerText;
  let countryPrefix =
    dialerText.indexOf("+") > -1 || dialerText.length < 5 ? "" : "US";

  // TODO: have a default country, or something similar?
  // TODO: countryPrefix to name ("US")
  // TODO: - regex for testing non-numberic
  const outputDialerText = /^[0-9]+$/.test(dialerText)
    ? new AsYouType(countryPrefix).input(dialerText)
    : dialerText;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <View style={{}}>
        {/* <Text style={{ fontSize: 32, fontWeight: "bold", opacity: 0.3 }}>
          {countryPrefix}
        </Text> */}
      </View>
      <View style={{}}>
        <Text style={{ fontSize: 32, fontWeight: "bold" }}>
          {outputDialerText}
        </Text>
      </View>
    </View>
  );
};

const RoundButton = (props) => {
  const {
    mainText,
    mainIcon,
    subText,
    color,
    backgroundColor,
    onPress,
    onLongPress,
  } = props;

  const background = backgroundColor === undefined ? "rgba(10,90,60,0.1)" : backgroundColor;

  return (
    <TouchableOpacity
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View
        style={{
          height: 64,
          width: 64,
          borderRadius: 32,
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          backgroundColor: background,
          color,
        }}
      >
        {mainIcon ? mainIcon : null}
        {mainText?.length ? (
          <Text style={{ fontSize: subText?.length ? 32 : 32 }}>
            {mainText}
          </Text>
        ) : null}
        {subText?.length ? (
          <Text style={{ fontSize: 14, marginTop: -5 }}>{subText}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  slidingPanel: {
    backgroundColor: "rgba(255,255,255, 0.92)",
  }
});

export { RoundButton };
