import React, { useEffect, useRef } from "react";
import RNCallKeep from "react-native-callkeep";
import { CONSTANTS as RNCallKeepConstants } from "react-native-callkeep";
import VoipPushNotification from "react-native-voip-push-notification";
import { v4 as uuidv4 } from "uuid";
import { useSelector, useDispatch } from "react-redux";
import { Platform, AppState } from "react-native";
import { AsyncAlert } from "../../modules/AsyncAlert/AsyncAlert";
import * as Notifications from 'expo-notifications';
import PushNotification from "react-native-push-notification";
import BackgroundTimer from 'react-native-background-timer';

import {
  CALL_STATUS_RINGING,
  CALL_STATUS_IDLE,
  CALL_DIRECTION_INCOMING,
  CALL_DIRECTION_OUTGOING,
  CALL_STATUS_TERMINATING,
} from "../../rn-sip/lib/enums";
import { useCiophoneContext } from "./store";

let currentCall;
let calls;
// let answered = {}; // to prevent duplicate onAnswerCallAction
let displayedCalls = {};
let wasPushkit = {};
let registerSip, unregisterSip, ua;
let isConnected, reConnect;
let makeSipCall;
let eventBus;
let regTimer = null;

const useCallKeep = ({ navigationRef, navigationReadyRef }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [cioState, cioDispatch] = useCiophoneContext();
  const stateRef = useRef();
  stateRef.current = state.app.useNativeApp;

  const {
    calls: cioCalls,
    makeCall,
    isConnected: cioIsConnected,
    reConnect: cioReconnect,
    isRegistered,
    registerSip: cioRegisterSip,
    unregisterSip: cioUnregisterSip,
  } = cioState;
  calls = cioCalls;
  isConnected = cioIsConnected;
  reConnect = cioReconnect;
  registerSip = cioRegisterSip;
  unregisterSip = cioUnregisterSip;
  makeSipCall = makeCall;
  eventBus = state.tmp.eventBus;

  console.log("Native UI: ", state.app.useNativeApp);
  // const onceRun = useRef(null);
  // const onceRun2 = useRef(null);
  useEffect(() => {
    if (regTimer) {
      console.log("Clean the existing timer");
      BackgroundTimer.clearInterval(regTimer);
      regTimer = null;
    }
    regTimer = BackgroundTimer.setInterval(() => {
      console.log("background timer expired");
      if (isConnected !== undefined) {
        if (isConnected()) {
          // register SIP
          console.log("Connected, register SIP");
          registerSip();
        } else {
          // reconnect
          console.log("Not connected, re-connect");
          reConnect();
        }
      }
    }, 1000 * 120) // send 30 secs before expiry
  }, []);

  const init = async () => {
    // webrtc has already been initialized?
    // - TODO: handle de-init!
    await initializeVoipPushNotifications();
    await initializeWebRtc();
    await initializeCallKeep();

    await initializePushNotifications();
    // dispatch({ ready: true });
  };


  const initializeVoipPushNotifications = async () => {
    // ===== Step 1: subscribe `register` event =====
    // --- this.onVoipPushNotificationRegistered
    VoipPushNotification.addEventListener("register", (token) => {
      // --- send token to your apn provider server (ie, in the SIP REGISTER request)
      onVoipPushNotificationRegistered("register", token);
    });

    // ===== Step 2: subscribe `notification` event =====
    // - unnecessary? already handled by onIncomingCallDisplayed below
    VoipPushNotification.addEventListener("notification", (notification) => {
      onVoipPushNotificationReceived("notification", notification);
    });

    // ===== Step 3: subscribe `didLoadWithEvents` event =====
    VoipPushNotification.addEventListener("didLoadWithEvents", (events) => {
      // --- this will fire when there are events occured before js bridge initialized
      // --- use this event to execute your event handler manually by event type

      if (!events || !Array.isArray(events) || events.length < 1) {
        return;
      }
      for (let voipPushEvent of events) {
        let { name, data } = voipPushEvent;
        if (
          name ===
          VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent
        ) {
          onVoipPushNotificationRegistered("didLoadWithEvents", data);
        } else if (
          name ===
          VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent
        ) {
          onVoipPushNotificationReceived("didLoadWithEvents", data);
        }
      }
    });

    // // ===== Step 4: register =====
    // // --- it will be no-op if you have subscribed before (like in native side)
    // // --- but will fire `register` event if we have latest cached voip token ( it may be empty if no token at all )
    // VoipPushNotification.registerVoipToken(); // --- register token
  };
  // remote push notification
  const onRemoteNotification = async (notification) => {
    const { data, foreground } = notification;
    console.log('New Remote Push Notification: ', notification);
    if (data?.event === 'call') {
      // re-connect & register
      console.log("UA reconnect and register");
      // application is not in foreground
      if (!foreground) {
        if (isConnected() === true) {
          console.log("UA Connection is still active");
          // registration not required
        } else {
          console.log("UA Connection is not active");
          // Registration happens in connected event handler
          reConnect();
        }
      }
    } else if (data?.event === 'message') {
      console.log("Calling Fetch messages");
      await getMessages();
    }
  };
  // notification action
  const onNotificationAction = async (response) => {
    console.log("On Notification Action response:", response);
    const { actionIdentifier, notification } = response;
    const content = notification?.request?.content;
    // incoming call
    if (content?.categoryIdentifier === 'cioiccat') {
      const callId = content?.data?.callId;
      const call = calls.find((c) => c._id === callId);
      if (actionIdentifier === 'accept') {
        call?.accept(true, false, {isNativeCall: false}, (event, params) => {
        });
        navigationRef.current?.navigate("DialStack", {screen: "InCall", params: {callId},});
      } else if (actionIdentifier === 'reject') {
        call?.reject({isNativeCall: false});
        navigationRef.current?.navigate("CallHistory", {});
      } else if (actionIdentifier === 'startvid') {
        call?.accept(true, true, {isNativeCall: false}, (event, params) => {
        });
        navigationRef.current?.navigate("DialStack", {screen: "InCall", params: {callId},});
      } else {
        // console.log("No actions selected");
        navigationRef.current?.navigate("DialStack", {
          screen: "IncomingCall",
          params: {callId},
        });
      }
    }
    await Notifications.dismissNotificationAsync(notification?.request?.identifier);
  };

  const initializePushNotifications = async () => {
    // always shows the notification when it is received
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    // register listener
    Notifications.addNotificationResponseReceivedListener(onNotificationAction);
    // create Incoming call notification category
    await Notifications.setNotificationCategoryAsync('cioiccat',
        [
          {identifier: 'accept', buttonTitle: 'Accept Call'},
          {identifier: 'reject', buttonTitle: 'Reject Call'},
          {identifier: 'startvid', buttonTitle: 'Video Call'}
        ]
    );
    PushNotification.configure({
      onNotification: onRemoteNotification,
      popInitialNotification: true,
      requestPermissions: true,
    })
  };

  const initializeWebRtc = async () => {
    // await Wazo.Phone.connect({ audio: true, video: true });

    eventBus.on("ua.connected", (eua) => {
      ua = eua;
      // alert("ua.connected");
      registerSip();
    });
    eventBus.on("ua.registrationFailed", (eua) => {
      // TODO: check the error code
      console.log("Registration Failed -- try re-connecting");
      reConnect();
    });
  };

  // TODO: does this need to happen in AppDelegate.m instead of here, because of VOIP Push Notifications?
  const initializeCallKeep = async () => {
    try {
      // Android logic
      const options = {
        ios: {
          appName: "CallingIO",
        },
        android: {
          alertTitle: "Permissions required",
          alertDescription:
            "This application needs to access your phone accounts",
          cancelButton: "Cancel",
          okButton: "OK",
          selfManaged: false,
        },
      };
      await RNCallKeep.setup(options);
      RNCallKeep.setAvailable(true);
    } catch (err) {
      console.error("initializeCallKeep error:", err);
    }

    // Add RNCallKit Events
    RNCallKeep.addEventListener("didReceiveStartCallAction", onStartCallAction);
    RNCallKeep.addEventListener("answerCall", onAnswerCallAction);
    RNCallKeep.addEventListener("endCall", onEndCallAction);
    RNCallKeep.addEventListener(
      "didDisplayIncomingCall",
      onIncomingCallDisplayed
    );
    RNCallKeep.addEventListener("didToggleHoldCallAction", onToggleHold);
    RNCallKeep.addEventListener(
      "didPerformSetMutedCallAction",
      onToggleAudioMute
    );
    RNCallKeep.addEventListener("didPerformDTMFAction", onDTMF);

    // listen for a new INCOMING call started
    eventBus.on("call.ring", ({ call }) => {
      const callId = call?._id;
      const calleeName = call?.remoteName;
      const calleeUser = call?.remoteUser;

      const appState = AppState.currentState;
      // change this to local notification if inactive/background
      // NOTE: Currently App UI is used to display incoming call
      // another option is config based
      if (stateRef.current) {
        RNCallKeep.displayIncomingCall(
          callId,
          calleeName,
          calleeUser,
          "number",
          false
        );
      } else {
        // if app is in the background
        if (appState.match(/inactive|background/)) {
          Notifications.scheduleNotificationAsync({
            identifier: `cioic${calleeUser}`,
            content: {
              title: 'New Incoming Call',
              subtitle: `${calleeUser}`,
              body: `Incoming call from ${calleeName}`,
              autoDismiss: true,
              sound: true,
              categoryIdentifier: 'cioiccat',
              data: { callId },
            },
            trigger: null,
          });
          call._appParams = { nid: `cioic${calleeUser}` };
        } else {
          // App is in foreground
          // check if already call is in progress
          // console.log("New Incoming Call: ", calls.length);
          const activeCalls = calls.filter((c) => c.isActive() === true);
          // if there are no existing calls in the system
          if (activeCalls.length === 0) {
            navigationRef.current?.navigate("DialStack", {
              screen: "IncomingCall",
              params: {callId},
            });
          }
        }
      }
    });
    eventBus.on("call.connected", ({ call }) => {
      // Android only
      console.log("RNKeep Set current call active");
      // Notify Call-Keep
      // this might be a native app initiated call
      if (call?._appParams?.isNativeCall === true) {
        RNCallKeep.setCurrentCallActive(call?._id);
      }
    });
    eventBus.on("call.terminated", ({ call, callId, originator, reason }) => {
      console.log("inside useCallKeep call.terminated", originator, reason);
      let statusCode = RNCallKeepConstants.END_CALL_REASONS.REMOTE_ENDED;
      switch (reason) {
        case "Failed":
          statusCode = RNCallKeepConstants.END_CALL_REASONS.FAILED;
          break;
        case "No Answer":
          statusCode = RNCallKeepConstants.END_CALL_REASONS.UNANSWERED;
          break;
        case "Declined":
          statusCode = RNCallKeepConstants.END_CALL_REASONS.DECLINED_ELSEWHERE;
          break;
      }
      // self initiated, already handled

      // re-register to handle a Push invite?
      if (originator === "remote") {
        if (reason === "Canceled") {
          // reregister (triggers new INVITE, that we auto-accept)
          // todo: check "isRinging??"
          console.log(
            're-register cuz "remote: Canceled" (expecting recently-accepted Push!) TODO: FIX THIS!! Should only run in some instances!!'
          );
          //ua.register();
        }
        // ??
        if (reason === "Failed") {
          console.log("ERROR: Remote failed, try to reregister?");
          // ua.register();
        }
      }

      const isMissedCall = ((call?._direction === CALL_DIRECTION_INCOMING) && !call?._hasAnswered);
      // Add to state.app.localCallHistory
      // Avoid duplicates
      dispatch({
        type: "CALL_HISTORY_ADD",
        payload: {
          id: call._id,
          direction:
            call._direction === CALL_DIRECTION_OUTGOING
              ? "outgoing"
              : "incoming",
          remoteName: call.remoteName,
          remoteUser: call.remoteUser,
          startTime: call.startTime || new Date().toString(),
          endTime: call.endTime || new Date().toString(),
          duration: { mins: call._durMin, secs: call?._durSec },
          endType: call._endType,
          errorReason: call._errorReason,
          wasMissed: isMissedCall,
          additionalInfo: call._appParams,
          screenpops: call._screenpops || [], // _screenpos is not present in SipCall
          notes: call._notes || { type: "text", data: "" }, // markdown?
        },
      });

      // inform call-keep, maybe native app initiated call
      // TODO: add app param for Native App initiated call
      if (call?._appParams?.isNativeCall === true) {
        if (originator === "local") {
          if (reason === "Failed") {
            RNCallKeep.reportEndCallWithUUID(callId, statusCode);
          }
        } else {
          // call end notification frm the system/remote
          RNCallKeep.reportEndCallWithUUID(callId, statusCode);
        }
      }
      // remove delivered notification
      if (call?._appParams?.nid) {
        Notifications.dismissNotificationAsync(call?._appParams?.nid);
      }
      const nonIdleCalls = calls.filter(
        (call) => call.getCallStatus() !== CALL_STATUS_IDLE
      );
      // no more active calls in VoIP App
      if (nonIdleCalls?.length === 0) {
        navigationRef.current?.navigate("CallHistory", {});
      }
    });
  };

  const onVoipPushNotificationRegistered = (source, token) => {
    // this happens on app launch?
    console.log("onVoipPushNotificationRegistered:", source, token);
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        push_token: token,
      },
    });
  };

  const onVoipPushNotificationReceived = (source, data) => {
    // we're just using this for reporting; we use "onIncomingCallDisplayed" instead to handle call answer/end
    console.log("onVoipPushNotificationReceived:", source, data);
  };

  //   const getLocalStream = () =>
  //     mediaDevices.getUserMedia({
  //       audio: true,
  //       video: {
  //         mandatory: {
  //           minWidth: 500,
  //           minHeight: 300,
  //           minFrameRate: 30,
  //         },
  //         facingMode: "user",
  //       },
  //     });

  //   const displayLocalVideo = () => {
  //     getLocalStream().then((stream) => {
  //       dispatch({ localStreamURL: stream.toURL() });
  //     });
  //   };

  const onAnswerCallAction = ({ callUUID }) => {
    console.log("onAnswerCallAction:", callUUID);
    // called when the user answer the incoming call by pressing an "answer" button
    // - either App UI, or via Phone UI!!
    //   - "app ui" might have already handled the "Accept" and "navigation"...(we do NOT handle it there anymore!!)
    const call = calls.find((call) => call._id === callUUID);
    if (call?.isRinging()) {
      console.log("Answering call now!!");
      call.accept(true, false, {isNativeCall: true}, (event, params) => {
        // console.log("call event log:", event, params);
      });
      // answer call initiated by native UI, so App navigation will not work
      // navigationRef.current?.navigate("DialStack", {
      //  screen: "InCall",
      //  params: { callId: call._id },
      // });
    }
    // // On Android display the app when answering a video call
    // if (!isIOS && currentSession.cameraEnabled) {
    //   RNCallKeep.backToForeground();
    // }
  };

  const onIncomingCallDisplayed = ({
    callUUID,
    handle,
    fromPushKit,
    payload,
  }) => {
    // Incoming call displayed (used for pushkit on iOS)
    // - displayed in header/display
    if (displayedCalls[callUUID]) {
      return;
    }
    displayedCalls[callUUID] = true;

    console.log(
      "onIncomingCallDisplayed",
      handle,
      callUUID,
      "fromPushKit?:",
      fromPushKit ? true : false,
      payload
    );
    /*
      pushkit payload example: 
      {
        aps: {
          alert: { "loc-args": [Array], "loc-key": "IC_SIL" },
          "call-id": "19fc7d5b-0dbf-47fe-ae83-76b3dce213d5",
          sound: "ring.caf",
        },
        "call-id": "19fc7d5b-0dbf-47fe-ae83-76b3dce213d5",
        "caller-id-name": "Bob Eh",
        "caller-id-number": "103",
        proxy: "sip:192.81.135.31:7000;transport=udp",
        "registration-token": "d3c98ce3-f156-4968-a953-ff4c46f7aeb3",
        utc_unix_timestamp_ms: "1624413849832",
      }
    */
    if (fromPushKit) {
      // setTimeout(async () => {
      //   await AsyncAlert(
      //     "Incoming via Push  - Not Working",
      //     "Accepting calls via a Push Notification is not handled yet (needs re-register and accept INVITE)"
      //   );
      //   RNCallKeep.endCall(callUUID);
      //   navigationRef.current?.navigate("DialStack", { screen: "Dialpad" });
      // }, 2000);

      // // see if call exists already!
      // const call = calls.find(c=>c._id ==callUUID)
      // if (call) {
      //   console.log('Acceping call immediately')
      //   call.accept(true, false);
      //   navigationRef.current?.navigate("DialStack", {
      //     screen: "InCall",
      //   }); // TODO: pass "waiting for PushKit data"
      //   return;
      // }

      // // wait for REGISTER, then accept call automatically
      // wasPushkit[callUUID] = true;
      // if (typeof isRegistered == "function" && isRegistered()) {
      //   // already registered, accept the new call
      // } else {
      //   // wait for register and new incoming call

      //   eventBus.on("new-incoming-call", ({ call, ua }) => {});
      // }

      function navToIncoming() {
        if (
          navigationReadyRef.current &&
          navigationRef.current &&
          navigationRef.current.getRootState()
        ) {
          navigationRef.current?.navigate("DialStack", {
            screen: "IncomingCall",
            params: { callId: callUUID },
          }); // TODO: pass "waiting for PushKit data"
        } else {
          // app has NOT mounted yet
          // - TODO: add to a queue instead of a setTimeout!
          setTimeout(navToIncoming, 100);
        }
      }
      navToIncoming();
    }
  };

  const onStartCallAction = ({ handle, callUUID }) => {
    console.log("----onStartCallAction-------", handle, callUUID);
    // We're trying to initiate an outgoing call from native app
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        dialerText: handle,
      },
    });
    // Currently only Audio call is supported from native telephony app
    const outCall = makeSipCall(handle, false, { isNativeCall: true, callId: callUUID }, (event, params) => {});
    // TODO: If the call is originated from Native app then Notification will be required
    //navigationRef.current?.navigate("DialStack", {
    //  screen: "InCall",
    //  params: { callId: outCall?._id, hasVideo: false },
    //}); // TODO: pass "waiting for PushKit data"
    // if got here, then likely a Push handler?
    // - or maybe that does NOT happen here...
  };

  const onToggleHold = ({ hold, callUUID }) => {
    console.log("onToggleHold in useCallKeep");
    const call = calls.find((call) => call._id === callUUID);
    // only for native UI initiated calls
    call?.toggleHold();
  };

  const onEndCallAction = ({ callUUID }) => {
    // ie "ignore" if hasnt been answered yet (versus "hangup"!)
    console.log("onEndCallAction in useCallKeep");
    const call = calls.find((call) => call._id === callUUID);
    if (call === undefined) {
      console.log("CALL Not found");
      return;
    }
    console.log(call?._callStatus);
    // call is already ended by app
    if (
      call?.getCallStatus() === CALL_STATUS_IDLE ||
      call?.getCallStatus() === CALL_STATUS_TERMINATING
    ) {
      console.log("Call is already terminated, duplicate");
      return;
    }
    if (call?._appParams?.isNativeCall === true) {
      if (call?.isRinging()) {
        call?.reject();
      } else {
        call?.hangup();
      }
    }
    // console.log('===========', navigationRef.current?.state.routeName);
    const nonIdleCalls = calls.filter(
      (call) => call.getCallStatus() !== CALL_STATUS_IDLE
    );
    // no more active calls in VoIP App
    if (nonIdleCalls?.length === 0) {
      navigationRef.current?.navigate("CallHistory", {});
    }
  };
  const onToggleAudioMute = ({ mute, callUUID }) => {
    // Called when the system or the user mutes a call
    console.log("onToggleAudioMute in useCallKeep");
    const call = calls.find((call) => call._id === callUUID);
    call?.toggleAudioMute();
  };
  const onDTMF = ({ digits, callUUID }) => {
    console.log("onDTMF in useCallKeep: ", digits, callUUID);
    const call = calls.find((call) => call._id === callUUID);
    // TODO: Fix jsSIP issue for native app (only first digit is send)
    call?.sendDTMF(digits);
  };

  useEffect(() => {
    init();
  }, []);

  //   const isVideo = currentSession && currentSession.cameraEnabled;

  return [];
};

export default useCallKeep;
