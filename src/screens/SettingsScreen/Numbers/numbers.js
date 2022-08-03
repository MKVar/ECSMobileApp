import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import { Button, ListItem, Switch, Text } from "react-native-elements";

import { StyleSheet, SafeAreaView, View, ScrollView } from "react-native";

import UI from "../../../modules/UI";

import { AsYouType } from "libphonenumber-js";

import { createStackNavigator } from "@react-navigation/stack";

import { set, get } from "lodash";

import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";
import KazooSDK from "../../../utils/kazoo";

import * as Network from "expo-network";
import NetInfo from "@react-native-community/netinfo";

const Stack = createStackNavigator();

export default function Numbers(props) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  if (!state.app.user) {
    return null;
  }

  return (
    <>
      <ListItem.Accordion
        topDivider
        bottomDivider
        content={
          <>
            <ListItem.Content>
              <ListItem.Title>User and Account Phone Numbers</ListItem.Title>
            </ListItem.Content>
          </>
        }
        isExpanded={expanded}
        onPress={handleExpand}
      >
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>
              Depending on your account call handling settings, you may be able
              to receive calls at the following numbers:
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem>
          <ListItem.Content>
            <ListItem.Subtitle style={{ width: 200 }}>
              User Presence ID:
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Content>
            <ListItem.Subtitle
              style={{
                alignSelf: "flex-end",
                fontWeight: "bold",
              }}
            >
              {state.app.user.presence_id}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        <ListItem>
          <ListItem.Content>
            <ListItem.Subtitle style={{ width: 200 }}>
              User Call Handling:
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Content>
            <ListItem.Subtitle
              style={{
                alignSelf: "flex-end",
              }}
            >
              None
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Subtitle style={{ width: 200 }}>
              Account Call Handling:
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Content>
            <ListItem.Subtitle
              style={{
                alignSelf: "flex-end",
              }}
            >
              None
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      </ListItem.Accordion>
    </>
  );
}

// function CallForwardingFor({ type }) {
//   const state = useSelector((s) => s);
//   const dispatch = useDispatch();

//   const [expanded, setExpanded] = useState(false);

//   const handleSwitch = (newValue) => {
//     dispatch({
//       type: "UPDATE_APP_SETTINGS",
//       payload: (state) => ({
//         call_forward: {
//           ...state.settings.call_forward,
//           enable_on_cell: newValue,
//         },
//       }),
//     });
//   };

//   const handleSwitchAppSetting = (key) => (newValue) => {
//     set(state.app.settings, key, newValue);
//     dispatch({
//       type: "UPDATE_APP_SETTINGS",
//       payload: () => ({ ...state.app.settings }),
//     });
//   };

//   const handleSwitchManual = (type) => (newValue) => {
//     // TODO: update local value immediately!
//     // - also fetch user now
//     // type: user/device
//     // TODO: deepMerge?
//     // set(state.app.settings, key, newValue);
//     dispatch({
//       type: "SET_APP_STATE",
//       payload: {
//         [type]: {
//           ...state.app[type],
//           call_forward: {
//             ...state.app[type].call_forward,
//             enabled: newValue,
//           },
//         },
//       },
//     });
//   };

//   const handleExpand = () => {
//     setExpanded(true);
//     // set(expanded, key, !get(expanded, key));
//     // setExpanded({ ...expanded });
//   };

//   return (
//     <>
//       <ListItem.Accordion
//         content={
//           <>
//             <ListItem.Content>
//               <ListItem.Title>{type}</ListItem.Title>
//               {!expanded &&
//               (get(state, `app.${type}.call_forward.enabled`) ||
//                 get(
//                   state,
//                   `app.settings.call_forward.${type}.enable_on_cell`
//                 )) ? (
//                 <ListItem.Subtitle style={{ color: "#888", width: 200 }}>
//                   {get(
//                     state,
//                     `app.settings.call_forward.${type}.enable_on_cell`
//                   )
//                     ? "Auto-enable on Cellular"
//                     : get(state, `app.${type}.call_forward.enabled`)
//                     ? "Manually Enabled"
//                     : null}
//                 </ListItem.Subtitle>
//               ) : null}
//             </ListItem.Content>
//             <ListItem.Content>
//               <ListItem.Title
//                 style={{
//                   alignSelf: "flex-end",
//                   color: get(state, `app.${type}.call_forward.enabled`)
//                     ? "green"
//                     : "#777",
//                 }}
//               >
//                 {get(state, `app.${type}.call_forward.enabled`)
//                   ? "Forwarding"
//                   : "Not Active"}
//               </ListItem.Title>
//               {!expanded && get(state, `app.${type}.call_forward.enabled`) ? (
//                 <ListItem.Title
//                   style={{
//                     alignSelf: "flex-end",
//                   }}
//                 >
//                   {get(state, `app.${type}.call_forward.number`)
//                     ? new AsYouType("US").input(
//                         get(state, `app.${type}.call_forward.number`)
//                       )
//                     : "No Number"}
//                 </ListItem.Title>
//               ) : null}
//             </ListItem.Content>
//           </>
//         }
//         isExpanded={expanded}
//         onPress={handleExpand}
//       >
//         <ListItem>
//           <ListItem.Content>
//             <ListItem.Title>Auto-Enable on Cellular</ListItem.Title>
//             <ListItem.Subtitle style={{ color: "#888" }}>
//               Overrides manual setting below
//             </ListItem.Subtitle>
//             <ListItem.Subtitle>
//               Currently:{" "}
//               <Text
//                 style={{
//                   color: state.tmp.network.type == "wifi" ? "green" : "blue",
//                 }}
//               >
//                 {state.tmp.network.type}
//               </Text>
//             </ListItem.Subtitle>
//           </ListItem.Content>
//           <Switch
//             value={
//               get(state, `app.settings.call_forward.${type}.enable_on_cell`)
//                 ? true
//                 : false
//             }
//             onValueChange={handleSwitchAppSetting(
//               `call_forward.${type}.enable_on_cell`
//             )}
//           />
//         </ListItem>

//         <ListItem>
//           <ListItem.Content>
//             <ListItem.Title
//               style={{
//                 opacity: get(
//                   state,
//                   `app.settings.call_forward.${type}.enable_on_cell`
//                 )
//                   ? 0.3
//                   : 1.0,
//               }}
//             >
//               Manually Enable
//             </ListItem.Title>
//           </ListItem.Content>
//           <Switch
//             value={
//               get(state, `app.${type}.call_forward.enabled`) ? true : false
//             }
//             disabled={
//               get(state, `app.settings.call_forward.${type}.enable_on_cell`)
//                 ? true
//                 : false
//             }
//             onValueChange={handleSwitchManual(type)}
//           />
//         </ListItem>
//         <ListItem bottomDivider>
//           <ListItem.Content>
//             <ListItem.Title>Forward To:</ListItem.Title>
//             <ListItem.Subtitle style={{ opacity: 0.5 }}>
//               Phone number that will receive calls
//             </ListItem.Subtitle>
//           </ListItem.Content>
//           <ListItem.Content>
//             <ListItem.Title style={{ alignSelf: "flex-end" }}>
//               {get(state, `app.${type}.call_forward.number`)
//                 ? new AsYouType("US").input(
//                     get(state, `app.${type}.call_forward.number`)
//                   )
//                 : "No Number"}
//             </ListItem.Title>
//           </ListItem.Content>
//         </ListItem>
//       </ListItem.Accordion>
//     </>
//   );
// }

const styles = StyleSheet.create({});
