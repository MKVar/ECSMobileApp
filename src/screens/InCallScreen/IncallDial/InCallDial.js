import React, {useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {AsYouType} from "libphonenumber-js";
import {RoundButton} from "../../DialpadScreen/DialpadScreen";
import {useCiophoneContext} from "../../../providers/SipUaProvider/store";

const Digits = ({ btnBkg, onDigitPressed }) => {

  return (
      <View style={{ height: 300 }}>
        <View style={styles.actRow}>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="1"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("1");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="2"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("2");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="3"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("3");
                }}
            />
          </View>
        </View>
        <View style={styles.actRow}>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="4"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("4");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="5"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("5");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="6"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("6");
                }}
            />
          </View>
        </View>
        <View style={styles.actRow}>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="7"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("7");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="8"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("8");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="9"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("9");
                }}
            />
          </View>
        </View>
        <View style={styles.actRow}>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="*"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("*");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
                mainText="0"
                backgroundColor={btnBkg}
                onPress={() => {
                  onDigitPressed("0");
                }}
            />
          </View>
          <View style={styles.actButtonContainer}>
            <RoundButton
              mainText="#"
              backgroundColor={btnBkg}
              onPress={() => {
                onDigitPressed("#");
              }}
            />
          </View>
        </View>
      </View>
  );
};

export default function IncallDial({ call, setShowDialpad, reason, isVideoView }) {
  const [cioState, cioDispatch] = useCiophoneContext();
  const [dialVal, setDialVal] = useState("");

  const { makeCall } = cioState;

  // Dial when call is active (multi calls)
  const onDial = (target, isVideoCall) => {
    try {
      // hold the activeCall
      call?.hold();
      makeCall(target, isVideoCall, { isNativeCall: false }, (event, params)=>{});
    } catch (error) {
      console.log("Make call failed");
    }
  };
  const addToDialerText = (toAdd) => {
    setDialVal(`${dialVal}${toAdd}`);
  };

  const backspaceDialerText = () => {
    setDialVal(dialVal.slice(0, dialVal.length - 1));
  };
  const onDigitPressed = (val) => {
    addToDialerText(val);
  };
  const onMakeVideoCall = () => {
    onDial(dialVal, true);
    setShowDialpad(null);
  };
  const onAction = (target) => {
    if (reason === 'dial') {
      onDial(target, false);
    } else if(target !== '') {
      call?.blindTransfer(target);
    }
  };

  const btnBkgrnd = isVideoView ? "rgba(220,220,220,0.4)" : "rgba(10,90,60,0.1)";
  const actionBtn = reason === 'dial' ? 'phone-outline' : 'phone-forward-outline';
  return (
      <>
      <View style={{ flex: 1, marginBottom: 30 }}>
        <InputComponent
          dialerText={dialVal}
          onBackspace={backspaceDialerText}
          transparent={isVideoView}
        />
      </View>
      <View style={{ flex: 1 }} >{/* Input Feedback/etc */}</View>
      <View style={{ flex: 4, paddingHorizontal: 30  }}>
        {/* Numbers (going to change UI entirely, testing DTMF) */}
        <Digits
          onDigitPressed={onDigitPressed}
          btnBkg={btnBkgrnd}
        />
        {/* Hangup button */}
        <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
        >
          <View style={styles.actButtonContainer}>
            {reason === 'dial' &&
              <TouchableOpacity
                  style={styles.videoButton}
                  onPress={onMakeVideoCall}
              >
                  <MaterialCommunityIcons
                      name={"video-outline"}
                      size={44}
                      color="#fff"
                  />
              </TouchableOpacity>
            }
          </View>
          <View style={styles.actButtonContainer}>
            <TouchableOpacity
                style={styles.dialButton}
                onPress={() => {
                    onAction(dialVal);
                    setShowDialpad(false);
                }}
            >
              <MaterialCommunityIcons
                  name={actionBtn}
                  size={44}
                  color="#fff"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.actButtonContainer}>
            <TouchableOpacity
                onPress={() => {
                  setShowDialpad(false);
                }}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: "33%",
                }}
            >
              <MaterialCommunityIcons name={"dialpad"} color={"#333"} size={32} />
              <View style={styles.centerText}>
                <Text style={styles.actText}>Hide</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </>
  );
};

const InputComponent = (props) => {
  const dialerText = props.dialerText;
  let countryPrefix =
    dialerText.indexOf("+") > -1 || dialerText.length < 5 ? "" : "US";

  // TODO: have a default country, or something similar?
  // TODO: countryPrefix to name ("US")
  // TODO: - regex for testing non-numberic
  const outputDialerText = /^[0-9]+$/.test(dialerText)
    ? new AsYouType(countryPrefix).input(dialerText)
    : dialerText;
  // background transparency
  const bkg = props.transparent ? 'rgba(200,200,200,0.2)' : 'rgba(200,200,200,0.5)';
  console.log("Input Bkg %s", bkg)
  return (
      <View style={{ flex: 1 }}>
        <View
            style={{
                justifyContent: "center",
                paddingLeft: 40,
                paddingRight: 40,
                height: 80,
                backgroundColor: bkg,
                flexDirection: "row",
            }}
        >
          <View
            style={{
              justifyContent: "center",
              flex: 4,
            }}
          >
            <View style={{}}>
              <Text style={{ fontSize: 32, fontWeight: "bold" }}>
                {outputDialerText}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: "center"}}>
            <TouchableOpacity
                style={{
                  justifyContent: "center",
                }}
                onPress={props.onBackspace}
            >
              <MaterialCommunityIcons name={"backspace"} color={"#ef5350"} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
};

const callButton = {
  marginTop: 16,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  width: 72,
  height: 72,
  borderRadius: 36,
};
const styles = StyleSheet.create({
  actButtonContainer: {
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    width: "33%",
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
    color: "#333",
    fontSize: 11,
  },
  dialButton: {
    ...callButton,
    borderColor: "#66BB6A",
    backgroundColor: "#66BB6A",
  },
  videoButton: {
    ...callButton,
    borderColor: "#039BE5",
    backgroundColor: "#039BE5",
  },
});
