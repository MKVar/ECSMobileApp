import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { Audio, Video } from "expo-av";
import RNFetchBlob from "rn-fetch-blob";
import CONFIG from "../../../whitelabel_config/config.json";
import { useLazyQuery, useQuery, gql } from "@apollo/client";

import { sortBy } from "lodash";

export default function useMessaging({ navigationRef, navigationReadyRef }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  // // TODO: only fetch once? then get "next" messages, instead of fetching "all" repeatedly!
  // // - this "conversations" should be a graphql query? or not, if we're only fetching messages "since X time"
  // useEffect(() => {
  //   dispatch({
  //     type: "MERGE_APP_STATE",
  //     payload: {
  //       conversations: {
  //         loading,
  //       },
  //     },
  //   });
  // }, [loading]);

  return null;
}

const styles = StyleSheet.create({});
