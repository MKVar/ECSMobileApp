import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { ListItem } from "react-native-elements";

import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

import { useIsFocused } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_BOX } from "../../assets/lottie";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";

const Stack = createStackNavigator();

export default function VmboxesScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (state.app.vmboxes?.length === 1) {
      // navigation.navigate("Vmbox", { vmbox: state.app.vmboxes[0] });
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Vmbox",
            params: { vmbox: state.app.vmboxes[0] },
            animationEnabled: false,
            options: {
              animationEnabled: false,
            },
          },
        ],
      });
    }
  }, []);

  const onPressWrapper = (vmbox) => () => {
    navigation.navigate("Vmbox", { vmbox });
  };

  if (!state.app.vmboxes?.list.length) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View>
          <LottieView
            key={isFocused} // for re-animating when nav here!
            style={{
              width: 200,
              height: 200,
              // backgroundColor: "#eee",
            }}
            source={ANIMATION_EMPTY_BOX}
            autoPlay
            loop={false}
          />
        </View>
        <Text>No Voicemail Boxes</Text>
        <View style={{ height: 80 }}></View>
      </View>
    );
  }

  return (
    <View>
      <View style={{ height: 20 }}></View>

      {state.app.vmboxes?.list?.map((vmbox, i) => (
        <ListItem
          key={i}
          topDivider
          bottomDivider
          onPress={onPressWrapper(vmbox)}
        >
          <ListItem.Content>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View>
                <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                  {vmbox.doc.mailbox}
                </Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text>{vmbox.doc.name}</Text>
              </View>
            </View>
            {/* <ListItem.Subtitle>{vmbox.doc.owner_id}</ListItem.Subtitle> */}
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({});
