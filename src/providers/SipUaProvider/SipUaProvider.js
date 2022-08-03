import React, { useEffect, useState } from "react";
import { SipProvider } from "../../rn-sip"; // '@callingio/react-native-sip';
import { Dispatcher } from "./store";
import { useDispatch, useSelector } from "react-redux";

import CONFIG from "../../../whitelabel_config/config.json";
import { Platform } from "react-native";

const SipUaProvider = (props) => {
  const [config, setConfig] = useState(null);
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const account = state.app.account;
  const device = state.app.device;

  const eventBus = state.tmp.eventBus;
  const push_token = state.tmp.push_token;

  useEffect(() => {
    if (!account?.realm || !device?.sip) {
      console.log(
        "SIP config missing account/device",
        account ? true : false,
        device ? true : false
      );
      return;
    }

    const wss_url = `wss://${CONFIG.kazoo.ws_host}:${CONFIG.kazoo.ws_port}`;
    const newConfig = {
      //socket: 'wss://tokdesk.com:7443',
      socket: wss_url,
      //socket: 'wss://ecs.bsnlpbx.com:5065',
      realm: account?.realm,
      user: device?.sip.username,
      password: device?.sip.password,
      userAgent: 'Tokphone v0.1',
    };
    if (JSON.stringify(newConfig) == JSON.stringify(config)) {
      console.log("Same SIP config, no changes");
      return;
    }
    console.log(newConfig);
    console.log("New SIP Config");
    setConfig(newConfig);
  }, [JSON.stringify(account), JSON.stringify(device)]);

  const getSetting = (key, opts, defaultValueFunc) => {
    return defaultValueFunc();
  };

  if (!config) {
    console.log("No SIP config");
    return null;
  }

  // console.log("Before SipProvider Render", device);

  // wait for VOIP Push Notification token
  // - TODO: do NOT block here!
  //   - simply re-register if we get the Push token later
  if (!push_token) {
    console.log("no voip push token, not registering device");
    return null;
  }

  return (
    <SipProvider
      autoRegister={false} // true by default, see jssip.UA option register
      autoAnswer={false} // automatically answer incoming calls; false by default
      iceRestart={false} // force ICE session to restart on every WebRTC call; false by default
      registerExpires={300}
      sessionTimersExpires={120} // value for Session-Expires header; 120 by default
      maxAllowedCalls={4}
      extraHeaders={{
        // optional sip headers to send
        contact: {
          "app-id": `${CONFIG.bundle_id}${
            Platform.OS === "ios" && __DEV__ ? ".dev" : "" // only use ".dev" suffix for ios
          }`,
          "pn-type": Platform.OS === "android" ? "firebase" : "apple", // NOT "ios"!
          "pn-tok": push_token,
        },
      }}
      iceServers={
        [
          // // optional
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
          // { urls: 'turn:example.com', username: 'foo', credential: '1234' },
        ]
      }
      debug={false} // whether to output events to console; false by default
      getSetting={getSetting}
      onEvent={(name, data) => {
        eventBus.emit(name, data);
      }}
      {...config}
    >
      <Dispatcher />
    </SipProvider>
  );
};

export { SipUaProvider };
