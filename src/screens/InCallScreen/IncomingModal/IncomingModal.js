import React, { useEffect, useState, useRef } from "react";
import { useCiophoneContext } from "../../../providers/SipUaProvider/store";
import {Modal, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function IncomingModal({ call }) {
  const [cioState, cioDispatch] = useCiophoneContext();
  const { calls } = cioState;

  const onReject = () => {
    call?.reject({ isNativeCall: false });
  };
  const onAccept = (isVideoCall) => {
    // hold all active calls
    // ideally only one active call
    calls.forEach((c) => {
      if (c.isMediaActive() == true) {
        c.hold();
      }
    })
    call?.accept(true, isVideoCall, { isNativeCall: false }, (event, p) => {});
  };

  return (
    <Modal transparent={true} >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dae3e6',
        height: 90,
        margin: 10,
        padding: 5,
        borderRadius: 10,
      }}>
        <View style={{ width: '30%' }}>
          <View
              style={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 20,
              }}
          >
              <TouchableOpacity
                  style={styles.icRejectButton}
                  onPress={() => {
                      onReject();
                  }}
              >
                  <MaterialCommunityIcons name={"phone-hangup-outline"} size={24} color={"#fff"} />
              </TouchableOpacity>
          </View>
        </View>
        <View style={{ width: '40%', justifyContent: 'center', alignItems: 'center' }}>
          <View>
            <Text style={styles.title}>{call?.remoteName}</Text>
          </View>
          <View>
            <Text style={styles.para}>{call?.remoteUser}</Text>
          </View>
        </View>
        <View style={{ width: '30%', flexDirection: 'row' }}>
          <View
            style={{
              width: "50%",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <TouchableOpacity
              style={styles.icAcceptButton}
              onPress={() => {
                onAccept(false);
              }}
            >
              <MaterialCommunityIcons name={"phone-hangup-outline"} size={24} color={"#fff"} />
            </TouchableOpacity>
          </View>
          <View
              style={{
                width: "50%",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 20,
              }}
          >
            <TouchableOpacity
              style={styles.icVideoButton}
              onPress={() => {
                onAccept(true);
              }}
            >
              <MaterialCommunityIcons name={"video-outline"} size={24} color={"#fff"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const icButton = {
  marginTop: 8,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  width: 42,
  height: 42,
  borderRadius: 21,
};

const styles = StyleSheet.create({
  icRejectButton: {
    ...icButton,
    borderColor: "#e01e5a",
    backgroundColor: "#e01e5a",
  },
  icAcceptButton: {
    ...icButton,
    borderColor: "rgb(44,190,150)",
    backgroundColor: "rgb(44,190,150)",
  },
  icVideoButton: {
    ...icButton,
    borderColor: "#36c5f0",
    backgroundColor: "#36c5f0",
  },
  profileImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    color: "#333",
    fontSize: 14,
  },
  para: {
    color: "#666",
    fontSize: 13,
  },
});
