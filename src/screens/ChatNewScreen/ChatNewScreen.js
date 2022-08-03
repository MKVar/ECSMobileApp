import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { ListItem } from "react-native-elements";

import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { AsYouType } from "libphonenumber-js";
import { useIsFocused } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_BOX } from "../../assets/lottie";

import { Divider, Button, ThemeProvider, Badge } from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
// import { Picker } from "@react-native-picker/picker";
import { GiftedChat } from "react-native-gifted-chat";

import { ContactsList } from "../../modules/ContactsList";
import { ModalBottom } from "../../modules/ModalBottom";
import {
  contactToName,
  numberToConversationFormat,
} from "../../utils/contacts";
import { smsSend, mmsSend } from "../../redux/actions";

import { sortBy } from "lodash";

const Stack = createStackNavigator();

export default function ChatNewScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const isFocused = useIsFocused();

  const messageboxes = state.app.messageboxes || [];
  const numbers = messageboxes.map((mb) => mb.number).filter((n) => n?.length);
  // console.log("numbers:", numbers);

  const [showContacts, setShowContacts] = useState(null);
  const [showToNumberSelector, setShowToNumberSelector] = useState(null);
  const [toContactChooser, setToContactChooser] = useState(null);
  const [toContactChooserNumbers, setToContactChooserNumbers] = useState(null);
  const [showFromNumberSelector, setShowFromNumberSelector] = useState(null);
  const [fromNumberSelected, setFromNumberSelected] = useState(
    numbers?.length ? numbers[0] : null
  );
  const [toContactSelected, setToContactSelected] = useState(null);
  const [toNumberSelected, setToNumberSelected] = useState(null);
  const [chooseNumber, setChooseNumber] = useState(null);
  const [text, onChangeText] = useState("");
  const [conversationKey, setConversationKey] = useState();

  const conversation = state.app.conversations.list.find(
    (c) => c.key == conversationKey
  );

  const handleChooseContact = (contact) => {
    // get the number for them
    // - show multiple if multiple exist
    // - normalizes numbers for selection! (should have a separate Modal manager for each schema??)
    let numbers = [];
    switch (contact.schema) {
      case "ios":
        for (let num of contact.phoneNumbers) {
          numbers.push(num);
        }
        break;
      case "v0.1":
        for (let num of contact.info.phoneNumbers) {
          numbers.push(num);
        }
        break;
      default:
        console.error("invalid schema for contact:", contact);
        break;
    }

    if (numbers.length === 0) {
      alert("No numbers for selected Contact");
    } else if (numbers.length === 1) {
      setToContactSelected(contact);
      setToNumberSelected(numberToConversationFormat(numbers[0].digits));
      setShowContacts(null);
    } else {
      setToContactChooser(contact);
      setShowToNumberSelector(true);
      setToContactChooserNumbers(numbers);
    }
  };

  const onSend = (messages) => {
    // reset navigation to correct collectionKey
  };

  let Modal = showFromNumberSelector ? (
    <ModalBottom onClose={(e) => setShowFromNumberSelector(null)}>
      {numbers.map((number) => (
        <ListItem
          key={number}
          onPress={() => {
            setFromNumberSelected(number);
            setShowFromNumberSelector(null);
          }}
        >
          <MaterialCommunityIcons
            name="pound"
            size={20}
            color="rgba(100,100,100,0.8)"
          />
          <ListItem.Content>
            <ListItem.Title>{number}</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ))}
    </ModalBottom>
  ) : null;

  Modal =
    Modal ||
    (showToNumberSelector ? (
      <ModalBottom onClose={(e) => setShowToNumberSelector(null)}>
        {toContactChooserNumbers.map((number) => (
          <ListItem
            key={number?.digits}
            onPress={() => {
              setToNumberSelected(numberToConversationFormat(number?.digits));
              setToContactSelected(toContactChooser);
              setShowToNumberSelector(null);
              setShowContacts(null);
            }}
          >
            <MaterialCommunityIcons
              name="pound"
              size={20}
              color="rgba(100,100,100,0.8)"
            />
            <ListItem.Content>
              <ListItem.Title>{number?.digits}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </ModalBottom>
    ) : null);

  return (
    <>
      {Modal}
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <View style={{ padding: 12, width: 70 }}>
            <Text>From:</Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Badge
              status="success"
              value={fromNumberSelected}
              badgeStyle={{ height: 30 }}
              textStyle={{ fontSize: 20, lineHeight: 30 }}
              onPress={() => {
                setShowFromNumberSelector(true);
              }}
            />
          </View>
          {/* TODO: add more */}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <View style={{ padding: 12, width: 70 }}>
            <Text>To:</Text>
          </View>
          <View style={{ flex: 1, paddingRight: 12, alignItems: "flex-start" }}>
            {toNumberSelected ? (
              <Badge
                status="success"
                value={
                  toContactSelected
                    ? `${contactToName(
                        toContactSelected
                      )} (${toNumberSelected})`
                    : toNumberSelected
                }
                badgeStyle={{ height: 30 }}
                textStyle={{ fontSize: 20, lineHeight: 30 }}
                onPress={() => {
                  onChangeText(toNumberSelected);
                  setToNumberSelected(null);
                }}
              />
            ) : (
              <TextInput
                style={{
                  borderWidth: 0,
                  fontSize: 16,
                  height: 24,
                  backgroundColor: "#eee",
                  minWidth: "100%",
                }}
                onChangeText={onChangeText}
                value={text}
                onFocus={() => setShowContacts(true)}
                onBlur={() => setShowContacts(null)}
              />
            )}
          </View>
          {/* TODO: add more */}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {showContacts ? (
            <ContactsList
              onPressContact={handleChooseContact}
              hideSearch
              hideNewButton
            />
          ) : (
            <ChatViewer
              fromNumber={fromNumberSelected}
              otherNumber={toNumberSelected}
            />
          )}
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const ChatViewer = ({ fromNumber, otherNumber }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const from = fromNumber;

  // find FIRST conversation that matches (COULD be multiple! in theory...)
  const conversation = state.app.conversations.list.find(
    (c) => c.fromNumber == fromNumber && c.otherNumber == otherNumber
  ) || { fromNumber, otherNumber, messages: [] };

  const [messages, setMessages] = useState(() =>
    [...conversation.messages].reverse()
  );

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

    // TODO: go "back" (away from New Message Screen) and then navigate to the conversation
    // - reset, then navigate?
    // - let the parent handle it?
    // - do different things depending on if the Conversation already exists?
  };

  // console.log("state.app.auth:", state.app.auth);

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
      />
    </View>
  );
};

const styles = StyleSheet.create({});
