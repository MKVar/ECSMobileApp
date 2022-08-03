import React, { useEffect, useState, useRef } from "react";
import RNCallKeep from "react-native-callkeep";
import Constants from "expo-constants";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AsYouType } from "libphonenumber-js";
import { RoundButton } from "../DialpadScreen/DialpadScreen";
import { useCiophoneContext } from "../../providers/SipUaProvider/store";
import { RTCView } from "react-native-webrtc";
import IncomingModal from "../InCallScreen/IncomingModal/IncomingModal";
import InCallDial from "../InCallScreen/IncallDial/InCallDial";
import InCallDtmf from "../InCallScreen/IncallDtmf/InCallDtmf";


export default function VideoCallScreen(props) {
    const { nav, call } = props;
    const [cioState, cioDispatch] = useCiophoneContext();
    const [dialer, showDialer] = useState(null);
    const [dialReason, setDialReason] = useState("");
    const [dtmfEntered, setDtmfEntered] = useState("");
    const { calls, toggleVideoCamera } = cioState;

    const onHangup = () => {
      console.log("On Hangup: ", call?._id);
      call?.hangup();
      // App initiated call
      // this should not happen, on safer side
      if (call?._appParams?.isNativeCall === true) {
        RNCallKeep.endCall(call?._id);
      }
    };
    const onToggleHold = () => {
      call?.toggleHold();
    };
    const onToggleAudioMute = () => {
      call?.toggleAudioMute();
    };
    const onToggleVideoMute = () => {
      call?.toggleVideoMute();
    };
    const onToggleVideoCamera = () => {
      toggleVideoCamera();
    };
    // add local video
    const onStartLocalVideo = () => {
      call?.offerVideo();
    };
    const onSwapCalls = () => {
      // find the inactive call
      const inactive = calls.find((c) => c.isMediaActive() === false);
      // hold the active call
      call?.hold();
      inactive?.unhold();
    };
    // activeCalls
    const activeCalls = calls.filter((c) => c.isActive() === true);
    let icCall = undefined;
    if (activeCalls.length > 0) {
      icCall = calls.find((c) => c.isRinging() === true);
    }
    // input & output streams
    const outStream = call?.getOutputMediaStream();
    const inStream  = call?.getInputMediaStream();

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={styles.videoContainer} >
            <View style={styles.remoteVideos}>
                { (outStream !== null) &&
                <RTCView
                    streamURL={outStream.toURL()}
                    zOrder={20}
                    objectFit={"cover"}
                    style={styles.remoteVideo}
                />
                }
            </View>
           <View style={styles.localVideos}>
              { (inStream !== null) &&
                  <RTCView
                      streamURL={inStream.toURL()}
                      zOrder={25}
                      objectFit={"cover"}
                      style={styles.localVideo}
                  />
              }
           </View>
           {dialer ?
             (
               <View style={{
                   zIndex: 30,
                   position: "absolute",
                   bottom: 0,
                   backgroundColor: 'rgba(255,255,255,.01'
               }} >
                 {dialReason === 'dtmf' ? (
                   <InCallDtmf
                     call={call}
                     setShowDtmfpad={showDialer}
                     setDtmfEntered={setDtmfEntered}
                     isVideoView={true}
                   />
                 ) : (
                   <InCallDial
                    call={call}
                    setShowDialpad={showDialer}
                    reason={'dial'}
                    isVideoView={true}
                   />
                  )}
               </View>
             ) : (
           <View
             style={{
               position: "absolute",
               bottom:0,
               width: '100%',
               height: '36%',
               marginBottom: 10,
             }}
          >
            <View style={styles.actionRow}>
              <View style={styles.actionContainer}>
              </View>
              <View style={styles.actionContainer}>
                { calls.length > 1 &&
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onSwapCalls()}
                  >
                    <MaterialCommunityIcons
                      name={"swap-vertical-variant"}
                      color={'#bdbdbd'}
                      size={32}
                    />
                  </TouchableOpacity>
                }
              </View>
              <View style={styles.actionContainer}>
              </View>

            </View>
            <View style={styles.actionRow}>
              <View style={{ width: '33%', alignItems: 'center', justifyContent: 'center'}} >
                  {inStream ? (
                      <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                              onToggleVideoCamera();
                          }}
                      >
                          <MaterialCommunityIcons
                              name={'rotate-3d-variant'}
                              size={32}
                              color={"#bdbdbd"}
                          />
                      </TouchableOpacity>
                  ) : (
                      <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                              onStartLocalVideo();
                          }}
                      >
                          <MaterialCommunityIcons
                              name={'video-outline'}
                              size={32}
                              color={"#bdbdbd"}
                          />
                      </TouchableOpacity>

                  )}
              </View>
              <View style={styles.actionContainer}>
                  <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                          onToggleAudioMute();
                      }}
                  >
                      <MaterialCommunityIcons
                          name={
                              call.isAudioOnMute()
                                  ? "microphone-outline"
                                  : "microphone-off"
                          }
                          color={call.isAudioOnMute() ? "red" : "#bdbdbd"}
                          size={36}
                      />
                  </TouchableOpacity>
              </View>
              <View style={styles.actionContainer} >
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        onToggleHold();
                    }}
                >
                    <MaterialCommunityIcons
                        name={
                            call?.isOnLocalHold()
                                ? "play-circle-outline"
                                : "pause-circle-outline"
                        }
                        size={36}
                        color={"#bdbdbd"}
                    />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.actionRow}>
              <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    disabled={inStream === false}
                    onPress={() => {
                        onToggleVideoMute();
                    }}
                >
                    <MaterialCommunityIcons
                        name={
                            call?.isVideoOnMute()
                                ? "video-outline"
                                : "video-off"
                        }
                        color={call?.isVideoOnMute() ? "red" : "#bdbdbd"}
                        size={32}
                    />
                </TouchableOpacity>
              </View>
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.endButton}
                  onPress={() => {
                    onHangup();
                  }}
                >
                  <MaterialCommunityIcons
                    name={"phone-hangup-outline"}
                    size={36}
                    color={"#eee"}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.actionContainer} >
                  <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setDialReason('dtmf');
                        showDialer(true);
                      }}
                  >
                      <MaterialCommunityIcons
                          name={"dialpad"}
                          size={36}
                          color={"#bdbdbd"}
                      />
                  </TouchableOpacity>
              </View>
            </View>
          </View>
               )}
        </View>
        {icCall !== undefined && (
          <IncomingModal call={icCall} />
         )}
      </View>
    );

};

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  videos: {
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
  },
  localVideos: {
    // height: 100,
    // marginBottom: 10,
    position: 'absolute',
    top: 80,
    right: 40,
    height: '20%',
    width: '30%',
    borderRadius: 3,
    borderColor: '#777',
    zIndex: 1001,
  },
  remoteVideos: {
    height: '100%',
  },
  localVideo: {
    backgroundColor: 'rgba(25, 25, 25, 0.4)',
    height: '100%',
  },
  remoteVideo: {
    backgroundColor: 'rgba(25,25,25,0.4)',
    height: '100%',
    width: '100%',
  },
  endButton: {
    marginTop: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 72,
    borderColor: "#e01e5a",
    backgroundColor: "rgba(224,30,90,0.6)",
    borderRadius: 36,
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '33%',
  },
  actionRow: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButton: {
    marginTop: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderColor: "rgba(242, 232,222, 0.05)",
    backgroundColor: "rgba(242,232,222,0.05)",
    borderRadius: 36,
  },
});
