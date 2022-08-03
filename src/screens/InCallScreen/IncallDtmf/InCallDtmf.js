import React from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {RoundButton} from "../../DialpadScreen/DialpadScreen";

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

export default function InCallDtmf({ call, setShowDtmfpad, setDtmfEntered, isVideoView }) {

  const onDigitPressed = (digit) => {
    console.log(digit);
    setDtmfEntered((vals) => `${vals}${digit}`);
    call?.sendDTMF(digit);
  };
  //hangup
  const onHangup = () => {
    call?.hangup();
  };

  const btnBkgrnd = isVideoView ? "rgba(220,220,220,0.4)" : "rgba(10,90,60,0.1)";

  return (
    <View style={{ paddingHorizontal: 30 }}>
      {/* Numbers (going to change UI entirely, testing DTMF) */}
      <Digits onDigitPressed={onDigitPressed} btnBkg={btnBkgrnd} />
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

        </View>
        <View style={styles.actButtonContainer}>
          <TouchableOpacity
            style={styles.endButton}
            onPress={onHangup}
          >
            <MaterialCommunityIcons
              name={"phone-hangup-outline"}
              size={44}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.actButtonContainer}>
          <TouchableOpacity
            onPress={() => {
              setShowDtmfpad(false);
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
  endButton: {
    ...callButton,
    borderColor: "#e01e5a",
    backgroundColor: "#e01e5a",
  },
});
