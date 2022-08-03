import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { ListItem } from "react-native-elements";

import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { AsYouType } from "libphonenumber-js";
import { useIsFocused } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_BOX } from "../../assets/lottie";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { GiftedChat } from "react-native-gifted-chat";
import apolloClient from "../../utils/apolloClient";
import { smsSend, mmsSend } from "../../redux/actions";
import { numberToContact, contactToName } from "../../utils/contacts";

import { sortBy } from "lodash";

import * as ImagePicker from "expo-image-picker";
import DocumentPicker from "react-native-document-picker";

const Stack = createStackNavigator();

export default function ChatScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();

  const { conversationKey, from } = route.params;
  const conversation = state.app.conversations.list.find(
    (c) => c.key == conversationKey
  );

  const [messages, setMessages] = useState(() =>
    [...conversation.messages].reverse()
  );

  const navToContact = (contact) => {
    // navigation.navigate("ContactStack", {
    //   screen: "ContactView",
    //   params: {
    //     contactId: contact.id,
    //     source: contact.source,
    //   },
    // });
    navigation.navigate("ContactViewRoot", {
      contactId: contact.id,
      source: contact.source,
    });
  };

  useEffect(() => {
    let title = "Unknown";
    if (conversation?.otherNumber) {
      let contact = numberToContact(conversation?.otherNumber);
      if (contact) {
        title = (
          <Text onPress={() => navToContact(contact)}>
            {contactToName(contact)}
          </Text>
        );
      } else {
        title = new AsYouType().input(conversation?.otherNumber);
      }
    }
    navigation.setOptions({
      title: title,
    });
  }, [conversation?.otherNumber, state.app.contacts, state.app.contacts_local]);

  const onSend = (newMessages) => {
    // add to list of newMessages
    // also push to server
    console.log("newMessages:", newMessages);
    newMessages.map(async (msg) => {
      const smsResp = await smsSend({
        to: conversation.otherNumber,
        from,
        body: msg.text,
      });
      console.log("smsResp:", smsResp);
    });
    setMessages([
      ...messages,
      ...newMessages.map((msg) => ({ ...msg, sent: true })),
    ]);
  };

  const handleChooseMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      // allowsEditing: true,
      // aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      // setImage(result.uri);
      alert("sorry, media not handled yet");
    }
  };

  const handleChooseDocument = async () => {
    // Pick multiple files
    try {
      const results = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.images],
      });
      for (const res of results) {
        console.log(
          res.uri,
          res.type, // mime type
          res.name,
          res.size
        );
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  };

  // console.log("state.app.auth:", state.app.auth);

  if (!conversation) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>Missing Conversation</Text>
      </View>
    );
  }

  // console.log(
  //   "CONVERSATION:",
  //   conversation.fromNumber,
  //   conversation.messages[0]
  // );

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <GiftedChat
        messages={sortBy(messages, ["createdAt"]).reverse()}
        // renderMessageText={({ currentMessage }) => {
        //   console.log("msg:", currentMessage);
        //   return <Text>{currentMessage.body}</Text>;
        // }}
        onSend={(messages) => onSend(messages)}
        user={{
          // _id: state.app.user.id,
          _id: conversation.fromNumber,
          name: `${state.app.user.first_name} ${state.app.user.last_name}`,
          // state.app.auth
        }}
        renderActions={() => (
          <Button
            type="clear"
            icon={<MaterialIcons name="add" size={24} />}
            // onPress={handleChooseDocument}
            onPress={handleChooseMedia}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
