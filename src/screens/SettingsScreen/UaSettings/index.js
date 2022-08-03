import {ListItem, Button, Text, Divider, Input, CheckBox, Switch} from "react-native-elements";
import React, {useState} from "react";
import {StyleSheet, View} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {get} from "lodash";
import Modal from "react-native-modal";
import {AsYouType} from "libphonenumber-js";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";

export default function UaSettings(props) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const [showEditModal, setEditModal] = useState(null);
  let r = "Not set";
  if (state.app?.account) {
      r = state.app?.account?.realm;
  }
  let u = "Not set";
  let p = "Not set";
  if (state.app?.device?.sip) {
    console.log(state.app.device);
    u = state.app.device.sip.user;
    p = "******";
  }

  if (state.app?.user) {
    console.log(state.app.user);
  }

  const handleAppSwitch = () => {
    const { useNativeApp } = state.app;
    dispatch({
      type: "SET_APP_STATE",
      payload: {
        useNativeApp: !useNativeApp,
      },
    });
  };

  return (
    <>
      {showEditModal && (
        <EditSettingsModal
          onClose={(e) => setEditModal(null)}
        />
      )}
      <ListItem topDivider bottomDivider>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <SimpleLineIcons name={"call-in"} size={24} color={"#3F0F3F"}/>
          <Text style={{ marginLeft: 15, fontSize: 18}}>{state.app?.user?.caller_id.internal.number}</Text>
          <Text style={{marginLeft: 10}}>(Internal Caller Id)</Text>
        </View>
        <ListItem.Content>
          <ListItem.Title style2={{ fontSize: 20 }}>
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>
      <ListItem>
        <ListItem.Content>
          <ListItem.Title>
            Use Native UI
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
                get(state, `app.useNativeApp`) ? true : false
              }
              onValueChange={handleAppSwitch}
            />
          </View>
        </ListItem.Content>
      </ListItem>
    </>
  );
};

const EditSettingsModal = ({ onClose }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  let r = null;
  if (state.app?.account) {
     r = state.app?.account?.realm;
  }
  let u = null;
  let p = null;
  if (state.app?.device) {
    u = state.app.device.sip.user;
    p = state.app.device.sip.password;
  }

  const [realm, setRealm] = useState(r);
  const [user, setUser] = useState(u);
  const [pswd, setPswd] = useState(p);

  const handleSave = () => {
    console.log("Handle Save");
    // realm
    dispatch({
      type: "SET_APP_STATE",
      payload: {
        account: {
          realm: realm,
        },
      },
    });
    // user
    dispatch({
      type: "SET_APP_STATE",
      payload: {
        device: {
          sip: {
              user: user,
              password: pswd
          },
        },
      },
    });

    onClose();
  };

  return (
    <Modal isVisible>
      <View style={styles.main}>
        <View style={styles.contentTitle}>
          <Text h4 h4Style={{ textAlign: "center" }}>
            Edit UA Settings
          </Text>
        </View>
        <Divider />
        <View style={styles.content}>
          <Input
            autoFocus
            keyboardType="default"
            placeholder={"User"}
            value={user}
            onChangeText={(str) => setUser(str)}
            style={{
              textAlign: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.5)",
              borderRadius: 3,
            }}
            errorStyle={{ marginBottom: 0 }}
            inputContainerStyle={{ borderBottomWidth: 0 }}
          />
          <Input
            autoFocus
            keyboardType="default"
            value={pswd}
            onChangeText={(str) => setPswd(str)}
            placeholder={"Password"}
            secureTextEntry
            style={{
              textAlign: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.5)",
              borderRadius: 3,
            }}
            errorStyle={{ marginBottom: 0 }}
            inputContainerStyle={{ borderBottomWidth: 0 }}
          />
            <Input
                autoFocus
                keyboardType="default"
                value={realm}
                onChangeText={(str) => setRealm(str)}
                placeholder={"Account Realm"}
                style={{
                    textAlign: "center",
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.5)",
                    borderRadius: 3,
                }}
                errorStyle={{ marginBottom: 0 }}
                inputContainerStyle={{ borderBottomWidth: 0 }}
            />
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

