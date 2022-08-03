import React from "react";
import {Text, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import InCallTimer from "../InCallTimer";

const InCallPeer = ({ call }) => {
  const fontColor = call?.isMediaActive() ? '#121214' : '#606570';
  const bkg = call?.isMediaActive() ? 'rgba(120,90,60,0.08)' : 'rgba(120,90,60, 0.01)';
  const brdr = call?.isMediaActive() ? '#888' : '#bbb';

  let mediaIcon = 'phone-in-talk';
  if (call?.hasLocalVideo()) {
    mediaIcon = 'video-outline';
    if (!call?.isMediaActive()) {
      mediaIcon = 'video-off-outline';
    }
  } else if (call?.isMediaActive() === false) {
    mediaIcon = 'phone-paused'
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      color: fontColor,
      borderRadius: 10,
      borderWidth: 1,
      marginHorizontal: 10,
      marginVertical: 4,
      borderColor: brdr,
      backgroundColor: bkg
    }} >
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <MaterialCommunityIcons name={mediaIcon} size={30} color={fontColor}/>
      </View>
      <View style={{ flex: 2, paddingVertical: 14 }}>
        <View>
          <Text style={{ fontSize: 14, color: fontColor }}>
            {call?.remoteName}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, color: fontColor }} >
            {call?.remoteUser}
          </Text>
        </View>
      </View>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{ fontSize: 14, color: fontColor }}>
          {call?.getDisposition()}
        </Text>
        <View style={{ paddingVertical: 4 }}>
          <InCallTimer call={call}  />
        </View>
      </View>
    </View>
  );
};

export default InCallPeer;
