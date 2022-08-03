import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";

import {
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { AsYouType } from "libphonenumber-js";
import { useIsFocused, useNavigation } from "@react-navigation/native";

import LottieView from "lottie-react-native";
import {
  Divider,
  Button,
  ThemeProvider,
  Badge,
  ListItem,
  Input,
  Text,
} from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";

import { ModalBottom } from "../../../../modules/ModalBottom";
import {
  contactToName,
  getNumberMask,
  getPhoneNumber,
} from "../../../../utils/contacts";

export default function IosSchema({ contact }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  /*
      phoneNumbers: [{
        "countryCode": "us",
        "id": "C338E45E-5C9F-4772-83FB-87C3DB7E78DC",
        "number": "(815) 201-5242",
        "digits": "8152015242",
        "label": "mobile"
      }]
  */

  // useEffect(() => {
  //   navigation.setOptions({
  //     title: "", //contactToName(contact),
  //     headerRight: () => (
  //       <Button title="Edit" type="clear" onPress={handleGotoEdit} />
  //     ),
  //   });
  // }, [navigation]);

  return (
    <>
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ height: 30 }}></View>
          {/* First Name and Last Name */}
          <Text h3 style={{ textAlign: "center" }}>
            {contact.firstName} {contact.lastName}
          </Text>
          {/* Company */}
          <Text style={{ textAlign: "center" }}>{contact.company}</Text>

          <View style={{ height: 30 }}></View>
          {/* Phone Numbers */}
          <PhoneNumbers numbers={contact.phoneNumbers} />
        </ScrollView>
      </View>
    </>
  );
}

const PhoneNumbers = ({ numbers = [] }) => {
  return (
    <>
      {numbers.map((numData, index) => (
        <PhoneNumber key={index} numData={numData} />
      ))}
      {numbers.length ? <Divider /> : null}
    </>
  );
};

const PhoneNumber = ({ numData }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handlePress = (selected) => {
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        dialerText: selected.number,
      },
    });
    navigation.navigate("DialStack", {
      screen: "Dialpad",
    });
  };
  return (
    <ListItem topDivider onPress={
      () => handlePress(numData)
    }>
      <View style={{ padding: 0 }}>
        <Text>mobile</Text>
      </View>
      <ListItem.Content>
        <ListItem.Title>{numData.number}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 18,
    width: "100%",
  },
});
