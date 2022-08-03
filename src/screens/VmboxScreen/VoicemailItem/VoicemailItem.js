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
import { useSelector, useDispatch } from "react-redux";
import RNFetchBlob from "rn-fetch-blob";
import Share from "react-native-share";

import { SwipeRow } from "react-native-swipe-list-view";

import { getUriFile, moveToFolder } from "../../../redux/actions";
import { epochOffset } from "../../../utils/kazoo";
import { ModalBottom } from "../../../modules/ModalBottom";
import { AsyncPrompt } from "../../../modules/AsyncAlert/AsyncAlert";
import Toast from "react-native-root-toast";

import { get, set, snakeCase } from "lodash";

import {
  Divider,
  Button,
  ThemeProvider,
  ListItem,
  Text,
} from "react-native-elements";

import { formatDuration } from "../../../utils/utils";
import { AudioPlayer } from "../../../modules/AudioPlayer";
import CONFIG from "../../../../whitelabel_config/config.json";
import { useNavigation } from "@react-navigation/native";

export default function VoicemailItem({ data, index, vmbox }) {
  const state = useSelector((s) => s);
  const voicemail = data;

  const [swipeStatus, setSwipeStatus] = useState(null); // open, close
  const [isViewing, setIsViewing] = useState(null);

  const handlePress = async () => {
    // const output = await state.tmp.KazooSDK.get(
    //   `/vmboxes/${vmbox.id}/messages/${voicemail.id}`
    // );
    // console.log("output:", JSON.stringify(output.data, null, 2));
    setIsViewing(isViewing ? null : true);
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
        // swipe left
        moveToFolder(vmbox.id, voicemail.id, swipeLeftFolder);
      } else {
        // swipe right
        moveToFolder(vmbox.id, voicemail.id, swipeRightFolder);
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

  // console.log("voicemail item:", JSON.stringify(voicemail, null, 2));
  if (isViewing) {
    return (
      <ViewingItem setIsViewing={setIsViewing} {...{ data, index, vmbox }} />
    );
  }

  let swipeLeftFolder,
    swipeRightFolder,
    disableRightSwipe,
    disableLeftSwipe,
    openText,
    openBgColor,
    closeText,
    closeBgColor;
  switch (voicemail.doc.folder) {
    case "new":
      // onRowDidOpen = onSwipeMoveToFolder("saved");
      swipeLeftFolder = "saved";
      disableRightSwipe = true;
      openText = "Archive";
      openBgColor = "purple";
      break;
    case "saved":
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

  // console.log("swipeStatus:", swipeStatus);

  const vmTime = DateTime.fromMillis(
    (voicemail.doc.timestamp - epochOffset) * 1000
  );

  let displayTime;
  if (vmTime.hasSame(DateTime.local(), "day")) {
    // today: h:mm a
    displayTime = vmTime.toFormat("h:mm a");
  } else if (
    vmTime.startOf("day") >= DateTime.now().minus({ day: 1 }).startOf("day")
  ) {
    // yesterday: "yesterday"
    displayTime = `Yesterday ${vmTime.toFormat("h:mm a")}`;
  } else if (
    vmTime.startOf("day") >= DateTime.now().minus({ day: 7 }).startOf("day")
  ) {
    // last 7 days: day of week
    displayTime = vmTime.toFormat("EEE");
  } else {
    // else: month/day
    displayTime = vmTime.toFormat("MMM d");
  }

  return (
    <SwipeRow
      onRowDidOpen={onSwipeMoveToFolder({ swipeLeftFolder, swipeRightFolder })}
      // onRowDidClose={onRowDidClose}
      disableRightSwipe={disableRightSwipe} // open
      disableLeftSwipe={disableLeftSwipe} // close
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
          voicemail.doc.folder === "new" ? (
            <Button
              title="Delete"
              icon={{ name: "delete", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "red" }}
            />
          ) : voicemail.doc.folder === "saved" ? (
            <Button
              title="Delete"
              icon={{ name: "delete", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "red" }}
            />
          ) : null
        }
        rightContent={
          voicemail.doc.folder === "new" ? (
            <Button
              title="Archive"
              icon={{ name: "delete", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "purple" }}
              onPress={(e) => moveToFolder(vmbox.id, voicemail.id, "saved")}
            />
          ) : voicemail.doc.folder === "saved" ? (
            <Button
              title="Back to New"
              icon={{ name: "new-releases", color: "white" }}
              buttonStyle={{ minHeight: "100%", backgroundColor: "green" }}
            />
          ) : null
        }
      >
        <ListItem.Content>
          <ListItem.Title>
            {voicemail.doc.caller_id_name ||
              new AsYouType("US").input(voicemail.doc.caller_id_number)}
          </ListItem.Title>
          <ListItem.Title ellipsizeMode="tail" numberOfLines={1}>
            {voicemail.single?.transcription?.text ?? (
              <Text style={{ fontStyle: "italic" }}>No transcription</Text>
            )}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Content>
          <ListItem.Title style={{ alignSelf: "flex-end" }}>
            {displayTime}
          </ListItem.Title>
          <ListItem.Title style={{ alignSelf: "flex-end" }}>
            {formatDuration(voicemail.doc.length)}
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>
    </SwipeRow>
  );
}

const ViewingItem = ({ data, index, vmbox, setIsViewing }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const voicemail = data;
  const navigation = useNavigation();

  const [showMenuModal, setShowMenuModal] = useState(null);

  const callTime = DateTime.fromJSDate(new Date(voicemail.startTime));
  const displayTime = callTime.toFormat("h:mm a");

  let number =
    voicemail.listing.caller_id_number.indexOf("+1") === 0
      ? voicemail.listing.caller_id_number.slice(2)
      : voicemail.listing.caller_id_number;

  const handlePress = async () => {
    setIsViewing(null);
  };

  const handleCallback = () => {
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        dialerText: number,
      },
    });
    navigation.navigate("DialStack", {
      screen: "Dialpad",
    });
  };

  return (
    <>
      {showMenuModal && (
        <MenuModal
          {...{ data, index, vmbox }}
          onClose={(e) => setShowMenuModal(null)}
        />
      )}
      <SwipeRow disableLeftSwipe disableRightSwipe>
        <View />
        <ListItem topDivider>
          <ListItem.Content
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
            }}
          >
            {/* Top */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                // backgroundColor: "red",
                width: "100%",
                padding: 12,
                paddingBottom: 0,
              }}
            >
              <View style={{}}>
                <Text style={{ fontWeight: "bold" }} onPress={handlePress}>
                  {voicemail.doc.caller_id_name ||
                    new AsYouType("US").input(number)}
                </Text>
                <Text style={{ color: "#888", fontSize: 11 }}>
                  {DateTime.fromMillis(
                    (voicemail.doc.timestamp - epochOffset) * 1000
                  ).toFormat("MMM d, hh:mm")}
                  {DateTime.fromMillis(
                    (voicemail.doc.timestamp - epochOffset) * 1000
                  )
                    .toFormat("a")
                    .toLowerCase()}
                </Text>
              </View>
              <View>
                <Button
                  type="clear"
                  icon={
                    <MaterialCommunityIcons
                      name="dots-horizontal"
                      size={24}
                      color="rgba(100,100,100,0.8)"
                    />
                  }
                  onPress={(e) => setShowMenuModal(true)}
                />
              </View>
            </View>
            {/* Audio Player */}
            <View
              style={{ paddingLeft: 12, paddingRight: 12, paddingBottom: 12 }}
            >
              <AudioPlayer
                uri={`${CONFIG.kazoo.api_url}/accounts/${state.app.auth.account_id}/vmboxes/${vmbox.id}/messages/${voicemail.listing?.media_id}/raw?auth_token=${state.app.auth?.auth_token}`}
              />
            </View>
            <Divider style={{ width: "100%" }} />
            {/* Transcription */}
            <View style={{ padding: 12 }}>
              <Text>
                {voicemail.single?.transcription?.text ?? (
                  <Text style={{ fontStyle: "italic" }}>No transcription</Text>
                )}
              </Text>
            </View>
            <Divider style={{ width: "100%" }} />
            {/* Callback */}
            <View style={{ padding: 12 }}>
              <Button
                icon={
                  <MaterialCommunityIcons
                    name="phone-in-talk"
                    size={16}
                    color="rgba(100,100,100,0.8)"
                  />
                }
                title={`Call ${new AsYouType("US").input(number)}`}
                titleStyle={{ fontSize: 14, marginLeft: 8, color: "black" }}
                type="clear"
                onPress={handleCallback}
              />
            </View>
          </ListItem.Content>
        </ListItem>
      </SwipeRow>
    </>
  );
};

const MenuModal = ({ data, vmbox, onClose }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const voicemail = data;

  const handleMoveToArchive = async () => {
    await moveToFolder(vmbox.id, voicemail.id, "saved");
    onClose();
  };
  const handleMoveToNew = async () => {
    await moveToFolder(vmbox.id, voicemail.id, "new");
    onClose();
  };
  const handleMoveToDelete = async () => {
    await moveToFolder(vmbox.id, voicemail.id, "deleted");
    onClose();
  };
  const handleCopyNumber = async () => {
    Clipboard.setString(voicemail.doc.caller_id_number);
    onClose();

    Toast.show(`Copied "${voicemail.doc.caller_id_number}"`, {
      duration: 1000,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
    });
  };
  const handleCopyTranscript = async () => {
    Clipboard.setString(voicemail.single.transcription.text);
    onClose();

    Toast.show(
      <Text style={{ color: "white" }} ellipsizeMode="middle" numberOfLines={1}>
        Copied "
        {voicemail.single?.transcription?.text?.length > 40
          ? voicemail.single?.transcription?.text + "..."
          : voicemail.single?.transcription?.text}
        "
      </Text>,
      {
        duration: 1000,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
      }
    );
  };
  const handleShareAudio = async (rename) => {
    //

    const uri = `${CONFIG.kazoo.api_url}/accounts/${state.app.auth.account_id}/vmboxes/${vmbox.id}/messages/${voicemail.listing?.media_id}/raw?auth_token=${state.app.auth?.auth_token}`;
    const info = await getUriFile({ uri, appendExt: "mp3" });

    // console.log("voicemail", JSON.stringify(voicemail.doc, null, 2));
    let filename =
      !voicemail.doc.caller_id_name ||
      voicemail.doc.caller_id_name == voicemail.doc.caller_id_number ||
      true
        ? voicemail.doc.caller_id_number
        : `${voicemail.doc.caller_id_name}-${voicemail.doc.caller_id_number}`;
    filename = snakeCase(
      `vm-${filename}-${DateTime.fromMillis(
        (voicemail.doc.timestamp - epochOffset) * 1000
      ).toFormat("MMM-dd-HHmm")}`
    ); //.replace(/_/g, "-");
    if (true || rename) {
      filename = await AsyncPrompt(
        "Filename to Share",
        "Do not include the extension",
        filename
      );
      if (!filename) {
        return false;
      }
      filename = snakeCase(filename);
    }

    let newFilepath = RNFetchBlob.fs.dirs.CacheDir + `/${filename}.mp3`;

    await RNFetchBlob.fs.cp(info.localPath, newFilepath);
    try {
      let options = {
        type: info.headers["Content-Type"],
        url: `file://${newFilepath}`, // (Platform.OS === 'android' ? 'file://' + filePath)
      };
      await Share.open(options);
    } catch (err) {}
    await RNFetchBlob.fs.unlink(newFilepath);
    onClose();
  };

  return (
    <ModalBottom onClose={onClose}>
      <ListItem onPress={handleCopyNumber}>
        <MaterialCommunityIcons
          name="content-copy"
          size={28}
          color="rgba(100,100,100,0.8)"
        />
        <ListItem.Content>
          <ListItem.Title>Copy Number</ListItem.Title>
        </ListItem.Content>
      </ListItem>

      {voicemail.single.transcription?.text ? (
        <ListItem onPress={handleCopyTranscript}>
          <MaterialCommunityIcons
            name="content-copy"
            size={28}
            color="rgba(100,100,100,0.8)"
          />
          <ListItem.Content>
            <ListItem.Title>Copy Transcript</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ) : null}
      <ListItem onPress={handleShareAudio}>
        <MaterialCommunityIcons
          name="download"
          size={28}
          color="rgba(100,100,100,0.8)"
        />
        <ListItem.Content>
          <ListItem.Title>Share Audio</ListItem.Title>
        </ListItem.Content>
      </ListItem>

      {voicemail.doc.folder == "new" ? (
        <ListItem onPress={handleMoveToArchive}>
          <MaterialCommunityIcons
            name="archive-arrow-down-outline"
            size={28}
            color="rgba(100,100,100,0.8)"
          />
          <ListItem.Content>
            <ListItem.Title>Archive</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ) : null}
      {voicemail.doc.folder == "saved" ? (
        <ListItem onPress={handleMoveToNew}>
          <MaterialIcons
            name="new-releases"
            size={28}
            color="rgba(100,100,100,0.8)"
          />
          <ListItem.Content>
            <ListItem.Title>Move to New</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ) : null}
      {voicemail.doc.folder == "saved" ? (
        <ListItem onPress={handleMoveToDelete}>
          <MaterialCommunityIcons
            name="delete"
            size={28}
            color="rgba(255,0,0,0.6)"
          />
          <ListItem.Content>
            <ListItem.Title style={{ color: "red" }}>Delete</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      ) : null}
    </ModalBottom>
  );
};

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
