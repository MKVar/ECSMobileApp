import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { Text } from "react-native-elements";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import { createStackNavigator } from "@react-navigation/stack";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";

const Stack = createStackNavigator();

export default function HistoryItem({ data, index }) {
  const dispatch = useDispatch();
  const call = data;

  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: "row",
      }}
    >
      <Text>Contact Item</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
