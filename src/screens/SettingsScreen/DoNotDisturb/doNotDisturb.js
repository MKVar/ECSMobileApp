import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  Button,
  ListItem,
  Switch,
  Text,
  Input,
  Divider,
  CheckBox,
} from "react-native-elements";
import Modal from "react-native-modal";
import {
  StyleSheet,
  SafeAreaView,
  View,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";

import UI from "../../../modules/UI";

import { AsYouType } from "libphonenumber-js";

import { createStackNavigator } from "@react-navigation/stack";

import { set, get, startCase } from "lodash";

import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
import KazooSDK from "../../../utils/kazoo";

import * as Network from "expo-network";
import NetInfo from "@react-native-community/netinfo";

const Stack = createStackNavigator();

export default function DoNotDisturb(props) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  return (
    <>
      <ListItem topDivider bottomDivider>
        <ListItem.Content>
          <ListItem.Title style2={{ fontSize: 20 }}>
            Do Not Disturb
          </ListItem.Title>
        </ListItem.Content>
        {/* <ListItem.Content>
          <ListItem.Title
            style={{
              alignSelf: "flex-end",
            }}
          >
            <Button title="Edit" type="clear" />
          </ListItem.Title>
        </ListItem.Content> */}
      </ListItem>
      <DoNotDisturbFor type="user" />
      <DoNotDisturbFor type="device" bottomDivider />
    </>
  );
}

function DoNotDisturbFor({ type, bottomDivider }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [expanded, setExpanded] = useState(false);
  const [showEditNumberModal, setShowEditNumberModal] = useState(null);

  const handleSwitch = (newValue) => {
    dispatch({
      type: "UPDATE_APP_SETTINGS",
      payload: (state) => ({
        do_not_disturb: {
          ...state.settings.do_not_disturb,
          // enable_on_cell: newValue,
        },
      }),
    });
  };

  const handleSwitchAppSetting = (key) => (newValue) => {
    set(state.app.settings, key, newValue);
    dispatch({
      type: "UPDATE_APP_SETTINGS",
      payload: () => ({ ...state.app.settings }),
    });
  };

  const handleSwitchManual = (type) => (newValue) => {
    // TODO: update local value immediately!
    // - also fetch user now
    // type: user/device
    // TODO: deepMerge?
    // set(state.app.settings, key, newValue);
    dispatch({
      type: "SET_APP_STATE",
      payload: {
        [type]: {
          ...state.app[type],
          do_not_disturb: {
            ...state.app[type].do_not_disturb,
            enabled: newValue,
          },
        },
      },
    });
  };

  const handleExpand = () => {
    setExpanded(!expanded);
    // set(expanded, key, !get(expanded, key));
    // setExpanded({ ...expanded });
  };

  return (
    <>
      <ListItem
        bottomDivider //={bottomDivider}
        containerStyle={
          {
            // alignContent: "flex-start",
            // backgroundColor: "red",
            // justifyContent: "flex-start",
          }
        }
      >
        <ListItem.Content
          style={{
            // backgroundColor: "blue",
            alignSelf: "flex-start",
          }}
        >
          <ListItem.Title style={{ marginTop: 4 }}>
            {startCase(type)}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Content>
          <View
            style={{
              alignSelf: "flex-end",
            }}
          >
            <Switch
              style={{ alignSelf: "flex-end" }}
              value={
                get(state, `app.${type}.do_not_disturb.enabled`) ? true : false
              }
              disabled={
                get(state, `app.settings.do_not_disturb.${type}.enable_on_cell`)
                  ? true
                  : false
              }
              onValueChange={handleSwitchManual(type)}
            />
          </View>
        </ListItem.Content>
      </ListItem>
    </>
  );
}

const styles = StyleSheet.create({});
