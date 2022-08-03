import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { Button, ListItem, Switch, Text } from "react-native-elements";

import { StyleSheet, SafeAreaView, View, ScrollView } from "react-native";

import UI from "../../../modules/UI";

import { AsYouType } from "libphonenumber-js";

import { createStackNavigator } from "@react-navigation/stack";

import { set, get } from "lodash";

import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
import KazooSDK from "../../../utils/kazoo";

import * as Network from "expo-network";
import NetInfo from "@react-native-community/netinfo";
import { useNavigation } from "@react-navigation/native";

const Stack = createStackNavigator();

export default function Logout(props) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const navigation = useNavigation();

  const handleLogout = async () => {
    await dispatch({ type: "LOGOUT" });
    state.tmp.KazooSDK = new KazooSDK({
      dispatch,
    });
    // TODO: have a better way of resetting that is less error-prone

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <>
      <ListItem topDivider bottomDivider>
        <Button
          title="Logout"
          onPress={handleLogout}
          buttonStyle={{ backgroundColor: "red" }}
        />
      </ListItem>
    </>
  );
}

const styles = StyleSheet.create({});
