import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  StyleSheet,
  Dimensions,
  View,
  Clipboard,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { DateTime } from "luxon";
import { AsYouType } from "libphonenumber-js";
import parsePhoneNumber from "libphonenumber-js";
import { useSelector, useDispatch } from "react-redux";
import RNFetchBlob from "rn-fetch-blob";
import Share from "react-native-share";

import { SwipeRow } from "react-native-swipe-list-view";

import { getUriFile, moveToFolder } from "../../../redux/actions";
import { epochOffset } from "../../../utils/kazoo";
import { ModalBottom } from "../../../modules/ModalBottom";
import { AsyncPrompt } from "../../../modules/AsyncAlert/AsyncAlert";
import Toast from "react-native-root-toast";

import { prettySimpleDateTime } from "../../../utils/utils";
import { numberToContact, contactToName } from "../../../utils/contacts";

import { get, set, snakeCase } from "lodash";

import {
  Divider,
  Button,
  ThemeProvider,
  ListItem,
  Text,
  Badge,
} from "react-native-elements";

import { formatDuration } from "../../../utils/utils";
import { AudioPlayer } from "../../../modules/AudioPlayer";
import CONFIG from "../../../../whitelabel_config/config.json";
import { useNavigation } from "@react-navigation/native";

export default function ConversationItem({ data, index }) {
  const state = useSelector((s) => s);
  const conversation = data;

  const [swipeStatus, setSwipeStatus] = useState(null); // open, close
  const [isViewing, setIsViewing] = useState(null);
  const [nameForOtherNumber, setNameForOtherNumber] = useState(null); // TODO: use reselect and a worker!
  useEffect(() => {
    if (conversation?.otherNumber?.length) {
      // Returns in the following order:
      // - my callingio list
      // - part of any shared lists
      // - local phone
      // -"fuzzy" matching for each of the previous (strip out "+1" and other checks)
      //   - [exact, remove_plus, ten_digit]
      // console.log("otherNumber:", conversation.otherNumber);

      let contact = numberToContact(conversation.otherNumber);
      if (contact) {
        let name = contactToName(contact);
        if (name?.length) {
          setNameForOtherNumber(name);
        }
      }

      // const checkNumber = (num) => {
      //   let findSchemaDefaultFunc = (c) =>
      //     c.info?.phoneNumbers?.find((n) => n.digits == num);
      //   let inRemoteList, inRemoteMine, inLocal;
      //   try {
      //     let found1 = state.app.contactlists?.find((cl) =>
      //       cl.Contacts.find(findSchemaDefaultFunc)
      //     );
      //     if (found1) {
      //       inRemoteList = found1?.contacts?.find(findSchemaDefaultFunc);
      //     }
      //   } catch (err) {
      //     console.error('Failed "remoteList"', err);
      //   }
      //   try {
      //     inRemoteMine = state.app.contacts?.find(findSchemaDefaultFunc);
      //   } catch (err) {
      //     console.error('Failed "mine"', err);
      //   }
      //   try {
      //     inLocal = state.app.contacts_local?.find((c) =>
      //       c.phoneNumbers?.find((n) => n.number == num)
      //     );
      //   } catch (err) {}
      //   return [
      //     inRemoteList,
      //     inRemoteMine,
      //     inLocal ? { ...inLocal, schema: "local" } : null,
      //   ];
      // };

      // const showName = (obj) => {
      //   switch (obj.schema) {
      //     case "v0.1":
      //       return obj.info?.firstName?.length
      //         ? `${obj.info?.firstName}${
      //             obj.info.lastName?.length ? ` ${obj.info.lastName}` : ""
      //           }`
      //         : obj.info?.lastName;
      //     case "local":
      //       // for local phone numbers
      //       return obj.name;
      //     default:
      //       console.error("Invalid showName schema");
      //   }
      // };

      // // exact match
      // let result = checkNumber(conversation.otherNumber);
      // let idx;
      // if ((idx = result.findIndex((n) => n)) > -1) {
      //   console.log("Match exact:", idx, result[idx]);
      //   setNameForOtherNumber(showName(result[idx]));
      //   // setContactForOtherNumber()
      //   return;
      // }

      // // remove_plus
      // if (conversation.otherNumber.indexOf("+") == 0) {
      //   result = checkNumber(conversation.otherNumber.toString().slice(1));
      //   if ((idx = result.findIndex((n) => n)) > -1) {
      //     console.log("Match remove_plus:", idx, result[idx]);
      //     setNameForOtherNumber(showName(result[idx]));
      //     // setContactForOtherNumber()
      //     return;
      //   }

      //   // ten_digit (no country code)
      //   if (conversation.otherNumber.length >= 10) {
      //     result = checkNumber(conversation.otherNumber.toString().slice(-10));
      //     if ((idx = result.findIndex((n) => n)) > -1) {
      //       // console.log("Match ten_digt:", idx, result[idx]);
      //       setNameForOtherNumber(showName(result[idx]));
      //       // setContactForOtherNumber()
      //       return;
      //     }
      //   }
      // } else {
      //   // didnt have a plus
      //   // - check ten_digit (no country code)
      //   if (conversation.otherNumber.length >= 10) {
      //     result = checkNumber(conversation.otherNumber.toString().slice(-10));
      //     if ((idx = result.findIndex((n) => n)) > -1) {
      //       // console.log("Match ten_digit:", idx, result[idx]);
      //       setNameForOtherNumber(showName(result[idx]));
      //       // setContactForOtherNumber()
      //       return;
      //     }
      //   }
      // }

      // console.log("Did NOT find a match for:", conversation?.otherNumber);

      // console.log("other:", inRemoteList, inRemoteMine, inLocal);
    }
  }, [conversation?.otherNumber, state.app.contacts, state.app.contacts_local]);

  const navigation = useNavigation();

  const handlePress = async () => {
    // const output = await state.tmp.KazooSDK.get(
    //   `/vmboxes/${vmbox.id}/messages/${voicemail.id}`
    // );
    // console.log("output:", JSON.stringify(output.data, null, 2));
    // setIsViewing(isViewing ? null : true);
    // TODO: navigate to chat
    // NavigationPreloadManager.
    navigation.navigate("Chat", {
      conversationKey: conversation.key,
      from: conversation.fromNumber,
    });
  };

  const onSwipeValueChange = (swipeData) => {
    const { key, value } = swipeData;
    // console.log("value:", value);
    setSwipeStatus(value < 0 ? "open" : "close");
  };

  const onSwipeMoveToFolder = ({ swipeLeftFolder, swipeRightFolder }) => (
    swipeValue
  ) => {
    // console.log("move to folder:", folder);
    if (swipeValue !== undefined) {
      if (swipeValue < 0) {
        // // swipe left
        // moveToFolder(vmbox.id, voicemail.id, swipeLeftFolder);
      } else {
        // // swipe right
        // moveToFolder(vmbox.id, voicemail.id, swipeRightFolder);
      }
    }
    // const { key, value } = swipeData;
    // console.log("val", value);
    // if (value < -Dimensions.get("window").width) {
    //   // alert(1);
    //   console.log(Date.now());
    //   // const newData = [...listData];
    //   // const prevIndex = listData.findIndex((item) => item.key === key);
    //   // newData.splice(prevIndex, 1);
    //   // setListData(newData);
    //   // animationIsRunning.current = false;
    // }
  };

  let swipeLeftFolder,
    swipeRightFolder,
    disableRightSwipe,
    disableLeftSwipe,
    openText,
    openBgColor,
    closeText,
    closeBgColor;
  switch (conversation) {
    case "new":
      // onRowDidOpen = onSwipeMoveToFolder("saved");
      swipeLeftFolder = "saved";
      disableRightSwipe = true;
      openText = "Archive";
      openBgColor = "purple";
      break;
    default:
      // onRowDidOpen = onSwipeMoveToFolder("new");
      // onRowDidClose = onSwipeMoveToFolder("deleted");
      swipeLeftFolder = "new";
      swipeRightFolder = "deleted";
      openText = "Back to New";
      openBgColor = "green";
      closeText = "Delete";
      closeBgColor = "red";
      text = "Back to New";
      break;
  }

  const msgTime = DateTime.fromMillis(
    (conversation.doc?.timestamp - epochOffset) * 1000
  );

  let lastMessage = " ";
  let lastMessageObj;
  if (conversation.messages?.length) {
    lastMessageObj = conversation.messages[conversation.messages.length - 1];
    if (lastMessageObj) {
      if (lastMessageObj.from === conversation.fromNumber) {
        lastMessage = `> ${lastMessageObj?.body}`;
      } else {
        lastMessage = lastMessageObj?.body;
      }
    }
    // TODO: determine if was sent/received
  }

  let multipleMessageboxes = state.app.messageboxes?.length > 1 ? true : false;

  let newMessage = true;

  return (
    <SwipeRow
      onRowDidOpen={onSwipeMoveToFolder({ swipeLeftFolder, swipeRightFolder })}
      // onRowDidClose={onRowDidClose}
      // disableRightSwipe={disableRightSwipe} // open
      // disableLeftSwipe={disableLeftSwipe} // close
      disableRightSwipe
      disableLeftSwipe
      directionalDistanceChangeThreshold={3}
      friction={12}
      onSwipeValueChange={onSwipeValueChange}
      swipeToOpenPercent={25}
      swipeToClosePercent={25}
      rightOpenValue={-Dimensions.get("window").width}
      leftOpenValue={Dimensions.get("window").width}
    >
      <View
        style={[
          styles.rowBack,
          ,
          {
            backgroundColor:
              swipeStatus === "open" ? openBgColor : closeBgColor,
          },
        ]}
      >
        {swipeStatus === "open" ? (
          <View style={[styles.backRightBtn, { backgroundColor: openBgColor }]}>
            <Text style={styles.backTextWhite}>{openText}</Text>
          </View>
        ) : (
          <View style={[styles.backLeftBtn, { backgroundColor: closeBgColor }]}>
            <Text style={styles.backTextWhite}>{closeText}</Text>
          </View>
        )}
      </View>
      <ListItem
        Component={TouchableWithoutFeedback}
        topDivider
        onPress={handlePress}
        leftContent={
          conversation?.folder === "new" ? (
            <Button
              title="Delete"
              icon={{ name: "delete", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "red" }}
            />
          ) : conversation?.folder === "saved" ? (
            <Button
              title="Delete"
              icon={{ name: "delete", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "red" }}
            />
          ) : null
        }
        rightContent={
          conversation?.folder === "new" ? (
            <Button
              title="Archive"
              icon={{ name: "delete", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "purple" }}
            />
          ) : conversation?.folder === "saved" ? (
            <Button
              title="Back to New"
              icon={{ name: "new-releases", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "green" }}
            />
          ) : null
        }
      >
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: newMessage ? 1 : 0,
          }}
        >
          <Badge status="primary" />
        </View>
        <View style={{ flex: 1 }}>
          <ListItem.Title style={{ fontWeight: "bold", marginBottom: 4 }}>
            {nameForOtherNumber?.length
              ? nameForOtherNumber
              : conversation?.otherNumber
              ? new AsYouType("US").input(conversation?.otherNumber.slice(2))
              : "Unknown"}
          </ListItem.Title>
          <ListItem.Subtitle>{lastMessage}</ListItem.Subtitle>
          {true || multipleMessageboxes ? (
            <ListItem.Subtitle style={{ opacity: 0.4, marginTop: 8 }}>
              {conversation.fromNumber}
            </ListItem.Subtitle>
          ) : null}
        </View>
        <View
          style={{
            height: "100%",
            justifyContent: "flex-start",
            width: 80,
          }}
        >
          <ListItem.Subtitle style={{ alignSelf: "flex-end", opacity: 0.5 }}>
            {lastMessageObj
              ? prettySimpleDateTime(lastMessageObj.createdAt)
              : " "}
          </ListItem.Subtitle>
        </View>
        <ListItem.Chevron
          style={{
            height: "100%",
            justifyContent: "flex-start",
          }}
        />
      </ListItem>
    </SwipeRow>
  );
}

const styles = StyleSheet.create({
  rowBack: {
    alignItems: "center",
    // backgroundColor: "purple",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 15,
  },
  backRightBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    right: 0,
    width: 100,
  },
  backLeftBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    width: 100,
  },
  backTextWhite: {
    color: "#FFF",
  },
});
