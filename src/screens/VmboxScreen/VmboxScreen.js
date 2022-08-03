import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  StyleSheet,
  Dimensions,
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { get } from "lodash";
import { useIsFocused } from "@react-navigation/native";
import RNFetchBlob from "rn-fetch-blob";

import {
  Divider,
  Button,
  ThemeProvider,
  ListItem,
} from "react-native-elements";
import { SwipeListView } from "react-native-swipe-list-view";

import LottieView from "lottie-react-native";
import {
  ANIMATION_EMPTY_FOLDER,
  ANIMATION_LOADING,
  ANIMATION_CONSTRUCTION,
} from "../../assets/lottie";

import { ModalBottom } from "../../modules/ModalBottom";

import { default as VoicemailItem } from "./VoicemailItem/VoicemailItem";

export default function VmboxScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("new");
  const [chooseFilter, setChooseFilter] = useState(null);

  const isFocused = useIsFocused();

  const vmbox = route.params.vmbox;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // console.log("TMP:", Object.keys(state.tmp));
      // await state.tmp.KazooSDK.syncItemList({
      //   id: vmbox.id,
      //   idType: "vmboxes",
      //   listType: "messages",
      //   iterateOverEach: true, // required for fetching transcription!
      // });
    } catch (err) {
      console.error("Failed syncing vmbox!!:", err);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${vmbox.doc.mailbox}: ${vmbox.doc.name}`,
      headerRight: () => (
        <Button
          title={"Filter"}
          type="clear"
          onPress={(e) => {
            setChooseFilter(true);
            // dispatch({ type: "FILES_CLEAR" });
            // RNFetchBlob.session("audio").dispose().catch();
          }}
        />
      ),
    });
  }, [navigation]);

  const { list, loading, loaded, recentSyncTime } = get(
    state.app,
    `itemlists.vmboxes.${vmbox.id}.messages`,
    { list: [], loading: true, loaded: false, recentSyncTime: 0 }
  );

  const folderNewList = list.filter((vm) => vm.doc.folder === "new");
  const folderSavedList = list.filter((vm) => vm.doc.folder === "saved");
  const folderDeletedList = list.filter((vm) => vm.doc.folder === "deleted");

  const current = {
    list: "",
    name: "",
  };

  switch (currentFilter) {
    case "new":
      current.list = folderNewList;
      current.name = "New";
      break;
    case "saved":
      current.list = folderSavedList;
      current.name = "Archived";
      break;
  }

  // console.log("chooseFilter:", chooseFilter);
  let Modal = chooseFilter ? (
    <ModalBottom onClose={(e) => setChooseFilter(null)}>
      <ListItem
        onPress={() => {
          setCurrentFilter("new");
          setChooseFilter(null);
        }}
      >
        <MaterialIcons
          name="new-releases"
          size={28}
          color="rgba(100,100,100,0.8)"
        />
        <ListItem.Content>
          <ListItem.Title>New</ListItem.Title>
        </ListItem.Content>
      </ListItem>
      <ListItem
        onPress={() => {
          setCurrentFilter("saved");
          setChooseFilter(null);
        }}
      >
        <MaterialCommunityIcons
          name="archive-arrow-down-outline"
          size={28}
          color="rgba(100,100,100,0.8)"
        />
        <ListItem.Content>
          <ListItem.Title>Archived</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    </ModalBottom>
  ) : null;

  if (!vmbox.doc.is_setup) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {Modal}
        <View>
          <LottieView
            key={isFocused} // for re-animating when nav here!
            style={{
              width: 100,
              height: 100,
              // backgroundColor: "#eee",
            }}
            source={ANIMATION_CONSTRUCTION}
            autoPlay
            loop
          />
        </View>
        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <Text h4>Voicemail Box is not setup!</Text>
        </View>
        <View style={{}}>
          <Button
            title="Dial *98 to Setup"
            onPress={(e) => {
              dispatch({
                type: "SET_TMP_STATE",
                payload: {
                  dialerText: "*98",
                },
              });
              navigation.navigate("DialStack", {
                screen: "Dialpad",
              });
            }}
          />
        </View>
        <View style={{ height: 80 }}></View>
      </View>
    );
  }

  if (current.list.length < 1) {
    if (loading) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {Modal}
          <View>
            <LottieView
              key={isFocused} // for re-animating when nav here!
              style={{
                width: 100,
                height: 100,
                // backgroundColor: "#eee",
              }}
              source={ANIMATION_LOADING}
              autoPlay
              loop={false}
            />
          </View>
          <Text h4>Fetching Voicemails</Text>
          <View style={{ height: 80 }}></View>
        </View>
      );
    }
    return (
      <TouchableWithoutFeedback onPress={handleRefresh}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {Modal}
          <View>
            <LottieView
              key={isFocused} // for re-animating when nav here!
              style={{
                width: 100,
                height: 100,
                // backgroundColor: "#eee",
              }}
              source={ANIMATION_EMPTY_FOLDER}
              autoPlay
              loop={false}
            />
          </View>
          <Text h4>No {current.name} Voicemails</Text>
          <View style={{ height: 80 }}></View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // const renderItem = ({ item, index, separators }) => (
  //   <VoicemailItem
  //     data={item}
  //     vmbox={vmbox}
  //     index={index}
  //     separators={separators}
  //   />
  // );
  const renderItem = (data, rowMap) => (
    <VoicemailItem
      data={data.item}
      vmbox={vmbox}
      index={data.index}
      separators={data.separators}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#eee", paddingTop: 24 }}>
      {Modal}
      <SwipeListView
        data={current.list}
        renderItem={(data, rowMap) => (
          <WrappedVoicemailItem
            key={data.index}
            data={data}
            rowMap={rowMap}
            vmbox={vmbox}
          />
        )}
        // renderHiddenItem={() => <></>}
        // keyExtractor={(item) => item.id}
        style={{ overflow: "visible" }}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        // leftOpenValue={75}
        // rightOpenValue={-75}
        // useNativeDriver={false}
      />
    </View>
  );
}

const WrappedVoicemailItem = React.forwardRef(
  ({ data, rowMap, vmbox }, ref) => {
    return (
      <VoicemailItem
        data={data.item}
        vmbox={vmbox}
        index={data.index}
        separators={data.separators}
      />
    );
  }
);

const styles = StyleSheet.create({});
