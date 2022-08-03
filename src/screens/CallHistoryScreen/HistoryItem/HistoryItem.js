import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { Text } from "react-native-elements";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import { createStackNavigator } from "@react-navigation/stack";
import { numberToContact, contactToName } from "../../../utils/contacts";

import { Divider, Button, ThemeProvider } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";

const Stack = createStackNavigator();

export default function HistoryItem({ data, index }) {
  const dispatch = useDispatch();
  const call = data;

  const navigation = useNavigation();

  const getContactName = (num) => {
    let contact = numberToContact(num);
    if (contact) {
      return contactToName(contact);
    }
  };

  // TODO: better way of handling names
  const [contactName, setContactName] = useState(() =>
    getContactName(call?.remoteUser)
  );
  // useEffect(() => {
  // }, []);

  const callTime = DateTime.fromJSDate(new Date(call.startTime));

  let displayTime;
  if (callTime.hasSame(DateTime.local(), "day")) {
    // today: h:mm a
    displayTime = callTime.toFormat("h:mm a");
  } else if (
    callTime.startOf("day") >= DateTime.now().minus({ day: 1 }).startOf("day")
  ) {
    // yesterday: "yesterday"
    displayTime = `Yesterday`;
  } else if (
    callTime.startOf("day") >= DateTime.now().minus({ day: 7 }).startOf("day")
  ) {
    // last 7 days: day of week
    displayTime = callTime.toFormat("EEEE");
  } else {
    // else: month/day
    displayTime = callTime.toFormat("MMM d");
  }

  const getDuration = () => {
    const d = `${('0'+call?.duration.mins).slice(-2)}:${('0'+call?.duration.secs).slice(-2)}`;
    return d;
  };

  const handlePress = () => {
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        dialerText: call.remoteUser,
      },
    });
    navigation.navigate("DialStack", {
      screen: "Dialpad",
    });
    // navigation.navigate("DialStack", {
    //   screen: "IncomingCall",
    // });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        // backgroundColor: index > 1 ? "red" : "blue",
        alignItems: 'center',
        borderBottomWidth: 0,
        borderBottomColor: "rgba(100,100,100,0.1)",
        paddingVertical: 10,
        paddingHorizontal: 16,
      }}
    >

      <View style={{ width: 42,
        justifyContent: 'center',
        alignItems: 'center',
        height: 42,
        backgroundColor: "#80D2DE",
        borderRadius: 8 }}>
        <SimpleLineIcons
          name="user"
          size={24}
          color={"#444"}
        />
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          marginLeft: 15
        }}
      >
        <TouchableWithoutFeedback onPress={handlePress}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={{
                fontWeight: "bold",
                color: call.wasMissed ? "red" : undefined,
                fontSize: 16,
              }}
            >
              {contactName ?? call.remoteName}
            </Text>
            <View
              style={{ flexDirection: "row", paddingVertical: 4 }}
            >
              {call.direction === "incoming" ? (
                <MaterialCommunityIcons
                  name="phone-incoming"
                  size={18}
                  color={call.wasMissed ? "rgba(255,0,0,0.3)" : "rgba(100,100,100,0.6)"}
                />
              ) : (
                <MaterialCommunityIcons
                    name="phone-outgoing"
                    size={18}
                    color="rgba(100,100,100,0.6)"
                />
              )}
              <Text style={{ marginLeft: 6, color: '#888'}}>{callTime.toFormat('HH:mm')}</Text>
            </View>
            {/*!contactName?.length &&
            call.remoteName === call.remoteUser ? null : (
              <Text
                style={{
                  fontSize: 16,
                }}
              >
                {call.remoteUser}
              </Text>
            )*/}
          </View>
        </TouchableWithoutFeedback>
        <View
          style={{ width: 70, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{}}>{displayTime}</Text>
        </View>
        <View
          style={{ width: 40, justifyContent: "center", alignItems: "center" }}
        >
          <Button
            type="clear"
            icon={
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color="rgba(100,100,100,0.8)"
              />
            }
            onPress={(e) =>
              // TODO Call Duration
              alert("AI call analysis is not available, Looks like AI server is not reachable. Please contact " +
                  "tokdesk.com support.")
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
