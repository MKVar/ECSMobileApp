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

import { Screenpops } from "../../../modules/Screenpops";
import { CALL_DIRECTION_INCOMING } from "../../../rn-sip/lib/enums";

import * as Network from "expo-network";
import NetInfo from "@react-native-community/netinfo";

const Stack = createStackNavigator();

export default function Numbers(props) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [expanded, setExpanded] = useState(false);
  const [call, setCall] = useState(null);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const runTest = () => {
    setCall({
      id: "id",
      remoteName: "Name",
      remoteUser: "User",
      _direction: CALL_DIRECTION_INCOMING,
    });
  };

  return (
    <>
      <ListItem.Accordion
        topDivider
        bottomDivider
        content={
          <>
            <ListItem.Content>
              <ListItem.Title>Test Screenpops</ListItem.Title>
            </ListItem.Content>
          </>
        }
        isExpanded={expanded}
        onPress={handleExpand}
      >
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>
              <View>
                <View style={{ paddingBottom: 4 }}>
                  <Text>Uses your user/account screenpop settings</Text>
                </View>
                <View>
                  <Button title="Test" onPress={runTest} />
                </View>
              </View>
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem bottomDivider>
          <ListItem.Content>
            {call ? (
              <Screenpops call={call} onUpdate={(screenpops) => {}} debug />
            ) : null}
          </ListItem.Content>
        </ListItem>
      </ListItem.Accordion>
    </>
  );
}

const styles = StyleSheet.create({});
