import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Text, SearchBar } from "react-native-elements";

import { useDispatch, useSelector } from "react-redux";

import { useIsFocused } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_FOLDER, ANIMATION_HELLO } from "../../assets/lottie";

import * as Contacts from "expo-contacts";
import { AlphabetList } from "react-native-section-alphabet-list";

import { cloneDeep } from "lodash";

import {
  Divider,
  Button,
  ThemeProvider,
  ButtonGroup,
} from "react-native-elements";

import { ContactsList } from "../../modules/ContactsList";

import { getContacts } from "../../redux/actions";

export default function ContactsScreen({ navigation, route }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();

  const [searchIsFocused, setSearchIsFocused] = useState(null);
  const [searchText, setSearchText] = useState("");

  const contacts = state.app.contacts;

  useEffect(() => {
    getContacts();
  }, [isFocused]);

  const handleViewContact = (contact) => {
    // console.log("contact:", contact);
    navigation.navigate("ContactStack", {
      screen: "ContactView",
      params: {
        contactId: contact.id,
        source: contact.source,
      },
    });
  };

  // TODO: pass in "viewState" to keep consistent!

  return (
    <>
      <View style={{ height: 22 }}></View>
      <ContactsList />
    </>
  );
}

const styles = StyleSheet.create({});
