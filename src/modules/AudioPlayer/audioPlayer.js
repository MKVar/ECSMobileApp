import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { Audio, Video } from "expo-av";
import RNFetchBlob from "rn-fetch-blob";
import CONFIG from "../../../whitelabel_config/config.json";

import { formatDuration } from "../../utils/utils";
import { getUriFile } from "../../redux/actions";

import {
  Divider,
  Button,
  ThemeProvider,
  ListItem,
  Text,
  Slider,
} from "react-native-elements";

export default function AudioPlayer({ uri }) {
  const [state, setState] = useState({});
  const appState = useSelector((s) => s);
  const dispatch = useDispatch();
  const playbackInstance = useRef(null);
  const mounted = useRef(true);

  // console.log("Audio URI:", uri);

  // fetch blob and store locally
  // - delete later?? (via dispose)
  const localUri = appState.app.files[uri]?.localPath;
  const [localValidUri, setLocalValidUri] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      const info = await getUriFile({ uri, appendExt: "mp3" });
      if (!info) {
        // failed loading audio file
        alert("Failed loading audio");
        return;
      }
      const source = { uri: `file://${info.localPath}` };
      const initialStatus = {
        // shouldPlay: playing,
        // rate: this.state.rate,
        // shouldCorrectPitch: this.state.shouldCorrectPitch,
        // volume: this.state.volume,
        // isMuted: this.state.muted,
        // isLooping: this.state.loopingType === LOOPING_TYPE_ONE
        // // // UNCOMMENT THIS TO TEST THE OLD androidImplementation:
        // // androidImplementation: 'MediaPlayer',
      };

      const _onPlaybackStatusUpdate = (status) => {
        if (!mounted) {
          return;
        }
        if (status.isLoaded) {
          // console.log("Loaded123:", status);
          setState({
            isLoaded: status.isLoaded,
            playbackInstancePosition: status.positionMillis,
            playbackInstanceDuration: status.durationMillis,
            shouldPlay: status.shouldPlay,
            isPlaying: status.isPlaying,
            isBuffering: status.isBuffering,
            rate: status.rate,
            muted: status.isMuted,
            volume: status.volume,
            isLooping: status.isLooping,
            shouldCorrectPitch: status.shouldCorrectPitch,
          });
        } else {
          if (status.error) {
            console.log(`FATAL PLAYER ERROR: ${status.error}`);
          }
        }
      };

      const { sound, status } = await Audio.Sound.createAsync(
        source,
        initialStatus,
        _onPlaybackStatusUpdate
      );
      playbackInstance.current = sound;
    })();

    return () => {
      mounted = false;
      playbackInstance.current?.stopAsync().catch();
    };
  }, [uri]);

  const playOnLoad = useRef(null);
  useEffect(() => {
    if (state.isLoaded && !playOnLoad.current) {
      playOnLoad.current = true;
      // playbackInstance.current.playAsync();
    }
  }, [state.isLoaded, playOnLoad.current]);

  const handlePressPlay = () => {
    if (state.isPlaying) {
      playbackInstance.current?.pauseAsync().catch();
    } else {
      playbackInstance.current?.playAsync().catch();
    }
  };

  const handleDrag = (val) => {
    playbackInstance.current?.setPositionAsync(val).catch();
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          width: "100%",
        }}
      >
        <View style={{ flex: 1 }}>
          <View>
            <Slider
              key={state?.playbackInstanceDuration}
              disabled={!state.isLoaded}
              minimumValue={0}
              maximumValue={state?.playbackInstanceDuration}
              value={state?.playbackInstancePosition}
              thumbStyle={{ height: 18, width: 18, backgroundColor: "purple" }}
              onValueChange={handleDrag}
              allowTouchTrack
            />
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{}}>
              <Text>
                {state?.isLoaded
                  ? formatDuration(state?.playbackInstancePosition)
                  : "Loading..."}
              </Text>
            </View>
            <View style={{}}>
              <Text>
                {state?.isLoaded
                  ? formatDuration(state?.playbackInstanceDuration)
                  : ""}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ paddingLeft: 12, marginTop: 4 }}>
          <MaterialCommunityIcons
            name={state.isPlaying ? "pause" : "play"}
            size={32}
            color="rgba(100,100,100,0.8)"
            style={{ opacity: state?.isLoaded ? 1 : 0 }}
            onPress={handlePressPlay}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({});
