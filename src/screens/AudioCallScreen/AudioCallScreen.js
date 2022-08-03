import React, { useEffect, useState, useRef } from "react";
import RNCallKeep from "react-native-callkeep";
import Constants from "expo-constants";
import { StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AsYouType } from "libphonenumber-js";
import { RoundButton } from "../DialpadScreen/DialpadScreen";
import { Screenpops } from "../../modules/Screenpops";
import { useCiophoneContext } from "../../providers/SipUaProvider/store";
import { RTCView } from "react-native-webrtc";
import IncomingModal  from '../InCallScreen/IncomingModal/IncomingModal';
import InCallDtmf from "../InCallScreen/IncallDtmf/InCallDtmf";
import InCallDial from "../InCallScreen/IncallDial/InCallDial";
import InCallTimer from "../InCallScreen/InCallTimer";
import InCallPeer from "../InCallScreen/InCallPeer";

export default function AudioCallScreen({ nav }) {
  const [cioState, cioDispatch] = useCiophoneContext();

  const [dialer, showDialer] = useState(null);
  const [dtmfEntered, setDtmfEntered] = useState("");
  const [dialReason, setDialReason] = useState("");
  const [isSpeakerOn, setSpeakerOn] = useState(false);
  const { calls, makeCall, toggleSpeakerPhone } = cioState;

  // there are no calls in the system
  if (calls.length === 0) {
    return null;
  }

  // find the active call
  // Ideally only ONE active call should be present
  let activeCall = calls.find((c) => c.isMediaActive() === true);
  // if all the calls are inactive, mark last call as ACTIVE
  if (activeCall === undefined) {
    activeCall = calls.find((c) => c.isActive() === true);
    if (activeCall === undefined) {
      activeCall = calls[calls.length - 1];
    }
  }
  // still no active call -- something wrong ??
  if (activeCall === null) {
    console.log("Active call is still NULL");
    return null;
  }
  const onHangup = () => {
    console.log("On Hangup: ", activeCall?._id);
    activeCall?.hangup();
  };
  const onToggleHold = () => {
    activeCall?.toggleHold();
  };
  const onToggleAudioMute = () => {
    activeCall?.toggleAudioMute();
  };
  const onSwitchToVideo = () => {
    activeCall?.offerVideo();
    // onToggleMedia();
  };
  const onToggleSpeaker = () => {
    // Native App should not happen here
    // TODO Remove native logic
    toggleSpeakerPhone();
    setSpeakerOn(!isSpeakerOn);
  };
  const onSwapCalls = () => {
    if (activeCall) {
      // find the inactive call
      const inactive = calls.find((c) => c.isMediaActive() === false);
      // hold the active call
      activeCall?.hold();
      inactive?.unhold();
    }
  };

  // activeCalls
  const activeCalls = calls.filter((c) => c.isRinging() !== true);
  const icCall = calls.find((c) => c.isRinging() === true);

  // - can have other calls that arent currently active... (ie: on hold)
  const butColor = activeCall?.isActive() ? "#666" : "#aeaeae";
  const butDisable = activeCall?.isActive() ? false : true;
  const swapDisable = butDisable || (calls.length < 2);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View style={{ marginTop: 40 }} />
      {activeCalls.length > 1 ? (
        <>
          {calls.map((c, i) => (
            <InCallPeer key={i} call={c} />
          ))}
        </>
      ) : (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            // backgroundColor: "red",
            height: "15%",
          }}
        >
          {activeCall?.remoteName == activeCall?.remoteUser ? (
            <Text h4>{activeCall?.remoteUser}</Text>
          ) : (
            <>
              <Text style={{ paddingVertical: 10, color: '#102030' }}>{activeCall?.remoteName}</Text>
              <Text style={{color: '#102030'}} >{activeCall?.remoteUser}</Text>
            </>
          )}
          {dtmfEntered.length ? (
            <Text h3 ellipsizeMode="middle" numberOfLines={1}>
              {dtmfEntered}
            </Text>
          ) : null}
          <View style={{ paddingVertical: 4 }}>
            <InCallTimer
              call={activeCall}
            />
          </View>
        </View>
      )}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          // backgroundColor: "blue",
        }}
      >
        <View style={styles.bottomContainer}>
          {dialer ? (
            <>
            {dialReason === 'dtmf' ? (
                <InCallDtmf
                  call={activeCall}
                  setShowDtmfpad={showDialer}
                  setDtmfEntered={setDtmfEntered}
                />
              ) : (
                <InCallDial
                  call={activeCall}
                  setShowDialpad={showDialer}
                  reason={dialReason}
                />
              )
            }
            </>
          ) : (
            <>
              <View style={{ width: "100%" }}>
                {/*activeCall && (
                  <Screenpops
                    call={activeCall}
                    onUpdate={(screenpops) => {
                      // set the call screenpops
                      // call._screenpops = screenpops;
                    }}
                  />
                )*/}
              </View>
              <View style={styles.actRow}>
                <View style={styles.actButtonContainer}>
                  <RoundButton
                    onPress={() => {
                        setDialReason("transfer");
                        showDialer(true);
                      }
                    }
                    mainIcon={
                      <MaterialCommunityIcons
                        name={"axis-z-arrow"}
                        color={butColor}
                        size={32}
                      />
                    }

                    />
                  {/*
                  <TouchableOpacity
                      disabled={butDisable}
                      onPress={() => {
                          setDialReason("transfer");
                          showDialer(true);
                        }
                      }
                  >
                    <MaterialCommunityIcons
                        name={"axis-z-arrow"}
                        color={butColor}
                        size={40}
                    />
                    <View style={styles.centerText}>
                      <Text style={styles.actText}>Transfer</Text>
                    </View>
                  </TouchableOpacity>
                  */}
                </View>
                <View style={styles.actButtonContainer}>
                  <RoundButton
                    onPress={() => {
                        setDialReason("dial");
                        showDialer(true);
                      }
                    }
                    mainIcon={
                      <MaterialCommunityIcons
                        name={"plus"}
                        color={butColor}
                        size={32}
                    />
                    }
                  />
                  {/*
                  <TouchableOpacity
                      disabled={butDisable}
                      onPress={() => {
                          setDialReason("dial");
                          showDialer(true);
                        }
                      }
                  >
                    <MaterialCommunityIcons
                        name={"plus"}
                        color={butColor}
                        size={40}
                    />
                    <View style={styles.centerText}>
                      <Text style={styles.actText}>Add</Text>
                    </View>
                  </TouchableOpacity>
                  */}
                </View>
                <View style={styles.actButtonContainer}>
                  <RoundButton
                    onPress={() => onSwapCalls()}
                    mainIcon={
                      <MaterialCommunityIcons
                        name={"swap-vertical-variant"}
                        color={swapDisable ? '#aeaeae' : '#333'}
                        size={32}
                      />
                    }
                  />
                  {/*
                  <TouchableOpacity
                    disabled={swapDisable}
                    onPress={() => onSwapCalls()}
                  >
                    <MaterialCommunityIcons
                      name={"swap-vertical-variant"}
                      color={swapDisable ? '#aeaeae' : '#333'}
                      size={40}
                    />
                    <View style={styles.centerText}>
                      <Text style={styles.actText}>Swap</Text>
                    </View>
                  </TouchableOpacity>
                  */}
                </View>
              </View>
              <View style={styles.actRow}>
                <View style={styles.actButtonContainer}>
                  <RoundButton
                    onPress={() => onSwitchToVideo()}
                    mainIcon={
                      <MaterialCommunityIcons
                        name={"video-outline"}
                        color={butColor}
                        size={32}
                      />
                    }
                  />
                  {/*
                  <TouchableOpacity
                      disabled={butDisable}
                      onPress={() => onSwitchToVideo()}
                  >
                    <MaterialCommunityIcons
                        name={"video-outline"}
                        color={butColor}
                        size={40}
                    />
                    <View style={styles.centerText}>
                      <Text style={styles.actText}>Video</Text>
                    </View>
                  </TouchableOpacity>
                  */}
                </View>
                <View style={styles.actButtonContainer}>
                   <RoundButton
                     onPress={() => {
                       onToggleHold();
                     }}
                     mainIcon={
                     <MaterialCommunityIcons
                       name={
                         activeCall?.isOnLocalHold()
                           ? "play-circle-outline"
                           : "pause-circle-outline"
                       }
                       color={butColor}
                       size={32}
                     />
                     }
                   />
                  {/*
                  <TouchableOpacity
                    disabled={butDisable}
                    onPress={() => {
                      onToggleHold();
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        activeCall?.isOnLocalHold()
                          ? "play-circle-outline"
                          : "pause-circle-outline"
                      }
                      color={butColor}
                      size={40}
                    />
                    <View style={styles.centerText}>
                      <Text style={styles.actText}>
                        {activeCall?.isOnLocalHold() ? "Resume" : "Hold"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  */}
                </View>
                <View style={styles.actButtonContainer}>
                  <RoundButton
                    onPress={() => {
                      onToggleAudioMute();
                    }}
                    mainIcon={
                      <MaterialCommunityIcons
                        name={"volume-mute"}
                        color={activeCall?.isAudioOnMute() ? "red" : butColor}
                        size={32}
                      />
                    }
                  />
                  {/*
                  <TouchableOpacity
                    disabled={butDisable}
                    onPress={() => {
                      onToggleAudioMute();
                    }}
                  >
                    <MaterialCommunityIcons
                      name={"volume-mute"}
                      color={activeCall?.isAudioOnMute() ? "red" : butColor}
                      size={40}
                    />
                    <View style={styles.centerText}>
                      <Text style={styles.actText}>
                        {activeCall?.isAudioOnMute() ? "Unmute" : "Mute"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  */}
                </View>
              </View>
          <View style={styles.actRow}>
            <View style={styles.actButtonContainer} >
              <TouchableOpacity
                  disabled={butDisable}
                  onPress={() => onToggleSpeaker()}
              >
                <MaterialCommunityIcons
                    name={
                      isSpeakerOn
                          ? "volume-off"
                          : "volume-high"
                    }
                    color={isSpeakerOn ? "red" : butColor}
                    size={40}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.actButtonContainer}>
                <TouchableOpacity
                  style={styles.endButton}
                  onPress={() => {
                    onHangup();
                  }}
                >
                  <MaterialCommunityIcons
                    name={"phone-hangup-outline"}
                    size={44}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.actButtonContainer} >
                <TouchableOpacity
                    disabled={butDisable}
                    onPress={() => {
                        setDialReason("dtmf");
                        showDialer(true);
                      }
                    }
                >
                  <MaterialCommunityIcons
                      name={"dialpad"}
                      color={butColor}
                      size={32}
                  />
                </TouchableOpacity>
              </View>
          </View>
          </>
          )}
        </View>
      </View>
      {icCall !== undefined && (
        <IncomingModal call={icCall} />
      )}
    </View>
  );
};

const callButton = {
  marginTop: 16,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  width: 72,
  height: 72,
  borderRadius: 36,
};
const styles = StyleSheet.create({
  bottomContainer: {
    position: "absolute",
    bottom: 0,
  },
  actButtonContainer: {
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    width: "33%",
  },
  actRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  centerText: {
    justifyContent: "center",
    alignItems: "center",
  },
  actText: {
    paddingTop: 6,
    color: "#333",
    fontSize: 11,
  },
  endButton: {
    ...callButton,
    borderColor: "#e01e5a",
    backgroundColor: "#e01e5a",
  },
});
