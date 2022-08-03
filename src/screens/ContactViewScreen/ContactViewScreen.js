import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { v4 as uuidv4 } from "uuid";
import { AsYouType } from "libphonenumber-js";
import { useIsFocused } from "@react-navigation/native";

import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_BOX } from "../../assets/lottie";
import {
  Divider,
  Button,
  ThemeProvider,
  Badge,
  ListItem,
  Input,
} from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";

import { ModalBottom } from "../../modules/ModalBottom";
import {
  contactToName,
  getNumberMask,
  getPhoneNumber,
} from "../../utils/contacts";

import { DefaultSource } from "./source/DefaultSource";
import { LocalSource } from "./source/LocalSource"; // ie "from my phone"

import { DefaultSchema } from "./schema/DefaultSchema";
import { IosSchema } from "./schema/IosSchema";

export default function ContactViewScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const contacts = state.app.contacts;
  const contacts_local = state.app.contacts_local;

  // this will NOT work with ContactLists!!
  const contact =
    contacts.find((c) => c.id === route.params.contactId) ||
    contacts_local.find((c) => c.id === route.params.contactId);
  // console.log("contact", contact);
  const isFocused = useIsFocused();

  /*
      phoneNumbers: [{
        "countryCode": "us",
        "id": "C338E45E-5C9F-4772-83FB-87C3DB7E78DC",
        "number": "(815) 201-5242",
        "digits": "8152015242",
        "label": "mobile"
      }]
  */

  const handleGotoEdit = () => {
    navigation.navigate("ContactStack", {
      screen: "ContactUpdate",
      params: {
        contact,
      },
    });
  };

  // // focus returning (ie after goBack)
  // // - TODO: isnt there a better/simpler way of handling "run X function on goBack?"
  // const focusRef = useRef();
  // const [returnId] = useState(() => uuidv4());
  // useEffect(() => {
  //   if (isFocused && !focusRef.current) {
  //     // first render
  //     focusRef.current = true;

  //   } else if (isFocused) {
  //     // after go back
  //     // - refetch contact
  //   }
  // }, [isFocused]);

  useEffect(() => {
    navigation.setOptions({
      title: "", //contactToName(contact),
      headerRight: () => {
        switch (contact?.source) {
          case "local":
            return null; // <Button title="No Edit" type="clear" disabled />;
          case null:
          case undefined:
            return (
              <Button title="Edit" type="clear" onPress={handleGotoEdit} />
            );
          default:
            return null; //<Button title="No Edit" type="clear" disabled />
        }
      },
    });
  }, [navigation, contact]);

  // switch (contact?.source) {
  //   case "local":
  //     return <LocalSource contact={contact} />;
  //   case null:
  //   case undefined:
  //     return <DefaultSource contact={contact} />;
  //   default:
  //     console.log("Invalid Source:", contact);
  //     return (
  //       <View>
  //         <Text>Invalid Contact Source</Text>
  //       </View>
  //     );
  // }

  switch (contact?.schema) {
    case "ios":
      return <IosSchema contact={contact} />;
    case "v0.1":
      return <DefaultSchema contact={contact} />;
    default:
      console.log("Invalid Schema:", contact);
      return (
        <View>
          <Text>Invalid Contact Schema: {contact?.schema}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({});
