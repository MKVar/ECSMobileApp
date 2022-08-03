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

export default function CallForwarding(props) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  return (
    <>
      <ListItem topDivider bottomDivider>
        <ListItem.Content>
          <ListItem.Title style2={{ fontSize: 20 }}>
            Call Forwarding
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
      <CallForwardingFor type="user" />
      <CallForwardingFor type="device" bottomDivider />
    </>
  );
}

function CallForwardingFor({ type, bottomDivider }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [expanded, setExpanded] = useState(false);
  const [showEditNumberModal, setShowEditNumberModal] = useState(null);

  const handleSwitch = (newValue) => {
    dispatch({
      type: "UPDATE_APP_SETTINGS",
      payload: (state) => ({
        call_forward: {
          ...state.settings.call_forward,
          enable_on_cell: newValue,
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
          call_forward: {
            ...state.app[type].call_forward,
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
      {showEditNumberModal && (
        <EditNumberModal
          type={type}
          onClose={(e) => setShowEditNumberModal(null)}
        />
      )}
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
        {/* <ListItem>
          <ListItem.Content>
            <ListItem.Title>Auto-activate on Cellular</ListItem.Title>
            <ListItem.Subtitle>
              Current Status:{" "}
              <Text
                style={{
                  color: state.tmp.network.type == "wifi" ? "green" : "blue",
                }}
              >
                {state.tmp.network.type}
              </Text>
            </ListItem.Subtitle>
            <ListItem.Subtitle style={{ color: "#888" }}>
              Overrides manual setting below. Potential issues on iOS when app
              is terminated.
            </ListItem.Subtitle>
          </ListItem.Content>
          <Switch
            value={
              get(state, `app.settings.call_forward.${type}.enable_on_cell`)
                ? true
                : false
            }
            onValueChange={handleSwitchAppSetting(
              `call_forward.${type}.enable_on_cell`
            )}
          />
        </ListItem> */}

        {/* <ListItem>
          <ListItem.Content>
            <ListItem.Title
              style={{
                opacity: get(
                  state,
                  `app.settings.call_forward.${type}.enable_on_cell`
                )
                  ? 0.3
                  : 1.0,
              }}
            >
              Activate
            </ListItem.Title>
          </ListItem.Content>
          <Switch
            value={
              get(state, `app.${type}.call_forward.enabled`) ? true : false
            }
            disabled={
              get(state, `app.settings.call_forward.${type}.enable_on_cell`)
                ? true
                : false
            }
            onValueChange={handleSwitchManual(type)}
          />
        </ListItem> */}
        <ListItem.Content
          style={{
            // backgroundColor: "blue",
            alignSelf: "flex-start",
          }}
        >
          <ListItem.Title style={{ marginTop: 4 }}>
            {startCase(type)}
          </ListItem.Title>
          {!expanded &&
          (get(state, `app.${type}.call_forward.enabled`) ||
            get(state, `app.settings.call_forward.${type}.enable_on_cell`)) ? (
            <ListItem.Subtitle style={{ color: "#888", width: 200 }}>
              {get(state, `app.settings.call_forward.${type}.enable_on_cell`)
                ? "Auto-activate on Cellular"
                : get(state, `app.${type}.call_forward.enabled`)
                ? "Manually Active"
                : null}
            </ListItem.Subtitle>
          ) : null}
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
                get(state, `app.${type}.call_forward.enabled`) ? true : false
              }
              disabled={
                get(state, `app.settings.call_forward.${type}.enable_on_cell`)
                  ? true
                  : false
              }
              onValueChange={handleSwitchManual(type)}
            />

            <ListItem.Subtitle
              style={{ alignSelf: "flex-end", opacity: 0.5, marginTop: 8 }}
            >
              Forwarding To
            </ListItem.Subtitle>
            <ListItem.Title style={{ alignSelf: "flex-end" }}>
              {get(state, `app.${type}.call_forward.number`)
                ? new AsYouType("US").input(
                    get(state, `app.${type}.call_forward.number`)
                  )
                : "No Number"}
            </ListItem.Title>
            <ListItem.Title style={{ alignSelf: "flex-end" }}>
              <Button
                title="Edit"
                type="clear"
                onPress={(e) => setShowEditNumberModal(true)}
              />
            </ListItem.Title>
          </View>
          {/* <View style={{ paddingLeft: 8 }}>
                <Button
                  title="Edit"
                  type="clear"
                  onPress={(e) => setShowEditNumberModal(true)}
                />
              </View> */}
          {/* <ListItem.Title
                style={{
                  alignSelf: "flex-end",
                  color: get(state, `app.${type}.call_forward.enabled`)
                    ? "green"
                    : "#777",
                }}
              >
                {get(state, `app.${type}.call_forward.enabled`)
                  ? "Forwarding"
                  : "Not Active"}
              </ListItem.Title>
              {!expanded && get(state, `app.${type}.call_forward.enabled`) ? (
                <ListItem.Title
                  style={{
                    alignSelf: "flex-end",
                  }}
                >
                  {get(state, `app.${type}.call_forward.number`)
                    ? new AsYouType("US").input(
                        get(state, `app.${type}.call_forward.number`)
                      )
                    : "No Number"}
                </ListItem.Title>
              ) : null} */}
        </ListItem.Content>
      </ListItem>
    </>
  );
}

const EditNumberModal = ({ type, onClose }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const otherType = type == "user" ? "device" : "user";

  const thisNum = get(state, `app.${type}.call_forward.number`, "");
  const otherNum = get(state, `app.${otherType}.call_forward.number`, "");

  const [value, setValue] = useState(thisNum);
  const [updateOtherChecked, setUpdateOtherChecked] = useState(
    thisNum == otherNum || !otherNum?.length
  );

  const handleSave = () => {
    const defaults = {
      direct_calls_only: true, // ?
      enabled: false,
      failover: false,
      ignore_early_media: true,
      keep_caller_id: false,
      require_keypress: false,
      substitute: true,
    };
    // TODO: update local value immediately!
    // - also fetch user now
    // type: user/device
    // TODO: deepMerge?
    // set(state.app.settings, key, newValue);
    const thisCF = get(state, `app.${type}.call_forward`, defaults);
    thisCF.number = value;

    dispatch({
      type: "SET_APP_STATE",
      payload: {
        [type]: {
          ...state.app[type],
          call_forward: thisCF,
        },
      },
    });

    if (updateOtherChecked) {
      const otherCF = get(state, `app.${otherType}.call_forward`, defaults);
      otherCF.number = value;
      dispatch({
        type: "SET_APP_STATE",
        payload: {
          [otherType]: {
            ...state.app[otherType],
            call_forward: otherCF,
          },
        },
      });
    }

    onClose();
  };

  return (
    <Modal isVisible>
      <View style={styles.main}>
        <View style={styles.contentTitle}>
          <Text h4 h4Style={{ textAlign: "center" }}>
            Set Forwarding Number
          </Text>
        </View>
        <Divider />
        <View style={styles.content}>
          <Input
            autoFocus
            keyboardType="number-pad"
            value={value}
            onChangeText={(str) => setValue(str)}
            style={{
              textAlign: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.5)",
              borderRadius: 3,
            }}
            errorStyle={{ marginBottom: 0 }}
            inputContainerStyle={{ borderBottomWidth: 0 }}
          />
          <View style={{ opacity: 0.7 }}>
            <Text style={{ textAlign: "center" }}>
              {new AsYouType("US").input(value)}
            </Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <CheckBox
              title={`Also Update ${type === "user" ? "Device" : "User"}`}
              checked={updateOtherChecked}
              onPress={(e) => setUpdateOtherChecked(!updateOtherChecked)}
              // containerStyle={{ backgroundColor: "#fff", borderColor: "#fff" }}
            />
          </View>
        </View>
        <Divider />
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-evenly",
              // backgroundColor: "blue",
              // marginTop: 12,
              // minWidth: 250,
            }}
          >
            <View style={{ padding: 8 }}>
              <Button
                title="Cancel"
                type="clear"
                onPress={onClose}
                titleStyle={{ color: "red" }}
              />
            </View>
            <Divider orientation="vertical" />
            <View style={{ padding: 8 }}>
              <Button
                title="Save"
                type="clear"
                onPress={handleSave}
                titleStyle={{ color: "green" }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  main: {
    backgroundColor: "white",
    justifyContent: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  content: {
    padding: 22,
    justifyContent: "center",
    // alignItems: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  contentTitle: {
    padding: 12,
    // fontSize: 20,
    // marginBottom: 12,
  },
});
