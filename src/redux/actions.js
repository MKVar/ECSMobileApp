// import axios from "axios";
import KazooSDK from "../utils/kazoo";

import RNFetchBlob from "rn-fetch-blob";
import { get, set, isEqual } from "lodash";
import { gql } from "@apollo/client";
import { sortBy } from "lodash";

import { store } from "./store";
import apolloClient from "../utils/apolloClient";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import PushNotification, { Importance } from "react-native-push-notification"

import CONFIG from "../../whitelabel_config/config.json";
import { Platform } from "react-native";
import md5 from "md5";

export const moveToFolder = async (vmboxId, msgId, folder) => {
  const state = store.getState();

  let newList = get(
    state.app,
    ["itemlists", "vmboxes", vmboxId, "messages", "list"].join("."),
    []
  );

  newList = newList.map((vm) =>
    vm.id === msgId ? { ...vm, doc: { ...vm.doc, folder } } : vm
  );

  // updates local copy immediately
  store.dispatch({
    type: "SET_ITEMLISTS_COLLECTION",
    payload: {
      path: ["itemlists", "vmboxes", vmboxId, "messages"].join("."),
      data: {
        list: newList,
      },
    },
  });

  //   await state.tmp.KazooSDK.post(`/vmboxes/${vmboxId}/messages/${msgId}`, {
  //     folder,
  //   });

  //   await state.tmp.KazooSDK.syncItemList({
  //     id: vmboxId,
  //     idType: "vmboxes",
  //     listType: "messages",
  //     iterateOverEach: true, // required for fetching transcription!
  //   });
};

// TODO: add an eventemitter for progress?
export const getUriFile = async ({ uri, appendExt, session = "audio" }) => {
  // returns the state.app.files values, or fetches/creates them
  const state = store.getState();
  const fileInfo = state.app.files[uri];
  if (fileInfo) {
    const exist = await RNFetchBlob.fs.exists(fileInfo.localPath);
    if (exist) {
      return fileInfo;
    }
  }

  const configOptions = {
    fileCache: true,
    session, // TODO: dispose of session sometimes
    appendExt,
  };
  const resp = await RNFetchBlob.config(configOptions).fetch("GET", uri);
  let filePath = resp.path();
  let options = {
    type: resp.info().headers["Content-Type"],
    url: filePath, // (Platform.OS === 'android' ? 'file://' + filePath)
  };
  const payload = {
    uri,
    localPath: `${filePath}`, // NOT w/ `file://` in front...
    headers: resp.info().headers,
  };
  store.dispatch({
    type: "FILES_UPDATE",
    payload,
  });
  return payload;
};

const MESSAGE_BOXES_MESSAGES = gql`
  query messages {
    messageboxes {
      id
      owner_ids
      number
      Messages {
        id
        to
        from
        body
        createdAt
      }
    }
  }
`;

export const getMessages = async () => {
  const state = store.getState();
  const dispatch = store.dispatch;

  // console.log("--GETT MESSAGES--");
  dispatch({
    type: "MERGE_APP_STATE",
    payload: {
      conversations: {
        loading: true,
      },
    },
  });

  const result = await apolloClient.query({
    query: MESSAGE_BOXES_MESSAGES,
    fetchPolicy: "no-cache",
  });

  dispatch({
    type: "MERGE_APP_STATE",
    payload: {
      conversations: {
        loading: null,
      },
    },
  });

  const { data } = result;

  let newconversations = [];
  // console.log("data.messageboxes:", data.messageboxes);
  if (data?.messageboxes) {
    for (let msgbox of data.messageboxes) {
      for (let msg of msgbox.Messages) {
        let ourNumber = msgbox.number;
        let otherNumber = msg.to == msgbox.number ? msg.from : msg.to;
        let key = `${msgbox.id}:${ourNumber}:${otherNumber}`; // msgbox.id ?
        let conv = newconversations.find((co) => co.key === key);
        if (!conv) {
          conv = {
            key,
            fromNumber: msgbox.number,
            otherNumber,
            messages: [],
          };
          newconversations.push(conv);
        }
        conv.messages.push({
          _id: msg.id, // for GiftedChat
          text: msg.body,
          user: {
            _id: msg.from,
            // name: "test from1",
            avatar: null,
          },
          ...msg,
        });
      }
    }
    // console.log("conversations:", newconversations);

    // sort conversations and messages
    // // newconversations.sort()
    newconversations.map((conv) => {
      conv.messages = sortBy(conv.messages, ["createdAt"]);
    });

    // dispatch to update state
    dispatch({
      type: "SETATPATH_APP_STATE",
      payload: [
        {
          path: "messageboxes",
          data: data?.messageboxes,
        },
        { path: "conversations.list", data: newconversations },
      ],
    });
  }
};

const CONTACT_LISTS_AND_CONTACTS = gql`
  query contactListAndContacts {
    contactlists {
      id
      name
      Contacts {
        id
        source
        schema
        info
      }
    }
    contacts {
      id
      source
      schema
      info
    }
  }
`;

export const getContacts = async () => {
  const state = store.getState();
  const dispatch = store.dispatch;
 /*
  const result = await apolloClient.query({
    query: CONTACT_LISTS_AND_CONTACTS,
    fetchPolicy: "no-cache",
  });
  const { data } = result;
  // console.log("Got contacts:", data?.contacts?.length);
  dispatch({
    type: "SETATPATH_APP_STATE",
    payload: [
      {
        path: "contactlists",
        data: data?.contactlists,
      },
      { path: "contacts", data: data?.contacts },
    ],
  });
  */
  // Local Contacts too!
  const { status } = await Contacts.requestPermissionsAsync();
  if (status === "granted") {
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Company,
        Contacts.Fields.Emails,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Image,
        Contacts.Fields.ImageAvailable,
      ],
    });

    const contactsWithNumbers = data
      .filter((c) => c.phoneNumbers?.length > 0)
      .map((c) => ({ ...c, schema: "ios", source: "local" }));
    // if (data.length > 0) {
    //   const contact = data[0];
    //   console.log(JSON.stringify(contact, null, 2));
    // }
    // console.log(JSON.stringify(contactsWithNumbers, null, 2));
    dispatch({
      type: "SETATPATH_APP_STATE",
      payload: [{ path: "contacts_local", data: contactsWithNumbers }],
    });
  }
};

// REGULAR Push Notification registration (for messaging, etc)
// - voip registration is handled on the SIP REGISTER (in useCallKeep)
export const registerPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === "granted") {
    console.log("Push Notification Permision Status: granted");
    const pushData = await Notifications.getDevicePushTokenAsync();

    const state = store.getState();
    const dispatch = store.dispatch;

    let device = state.app.device;

    console.log("Push DATA:", pushData);
    // console.log("Device DATA:", JSON.stringify(device, null, 2));

    switch (pushData?.type) {
      case "android":
        // use this for VOIP Push Token also!
        dispatch({
          type: "SET_TMP_STATE",
          payload: {
            push_token: pushData.data,
          },
        });

      case "ios":
        // TODO: register token  w/ server
        // - store in device.push_cio (Token-Type, Token-App, Token-ID, Token-Prod)

        console.log("Registering Push Notification on Device Doc on server");

        // same?
        const newPushCio = {
          "Token-Type": pushData.type,
          "Token-App": CONFIG.bundle_id,
          "Token-ID": pushData.data,
          "Token-Prod": __DEV__ ? false : true,
        };
        /*
        if (isEqual(newPushCio, device.push_cio)) {
          console.log("Push values already set");
        } else {
          await state.tmp.KazooSDK.patch(`/devices/${device.id}`, {
            data: null,
            id: device.id,
            push_cio: newPushCio,
          });
          await state.tmp.KazooSDK.updateDevice(device.id);
        }
        */
        /*
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("New notification:", notification);
          if (notification?.request?.content?.data?.msg)
          getMessages();
        });
        */
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("ciovoip", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        break;

      default:
        break;
    }
  }
};

const SEND_SMS = gql`
  mutation smsSend($to: String!, $from: String!, $body: String!) {
    smsSend(to: $to, from: $from, body: $body) {
      success
      message
      data
    }
  }
`;

export const smsSend = async ({ to, from, body }) => {
  console.log("sending sms:", { to, from, body });
  try {
    const result = await apolloClient.mutate({
      variables: {
        to,
        from,
        body,
      },
      mutation: SEND_SMS,
      fetchPolicy: "no-cache",
    });
  } catch (err) {
    console.error(
      "err:",
      JSON.stringify(err.networkError?.result?.errors, null, 2)
    );
  }
};

const SEND_MMS = gql`
  mutation mmsSend($to: String!, $from: String!, $body: String!) {
    mmsSend(to: $to, from: $from, body: $body) {
      success
      message
      data
    }
  }
`;

export const mmsSend = async ({ to, from, body }) => {
  console.log("sending sms:", { to, from, body });
  try {
    const result = await apolloClient.mutate({
      variables: {
        to,
        from,
        body,
      },
      mutation: SEND_MMS,
      fetchPolicy: "no-cache",
    });
  } catch (err) {
    console.error(
      "graphql err:",
      JSON.stringify(err.networkError?.result?.errors, null, 2),
      JSON.stringify(err, null, 2)
    );
  }
};

// export const getBooks = () => {
//   try {
//     return async (dispatch) => {
//       const response = await axios.get(`${BASE_URL}`);
//       // console.log('DATA ========>', response.data);
//       if (response.data) {
//         dispatch({
//           type: GET_BOOKS,
//           payload: response.data,
//         });
//       } else {
//         console.log("Unable to fetch data from the API BASE URL!");
//       }
//     };
//   } catch (error) {
//     // Add custom logic to handle errors
//     console.log(error);
//   }
// };

// export const addBookmark = (book) => (dispatch) => {
//   dispatch({
//     type: ADD_TO_BOOKMARK_LIST,
//     payload: book,
//   });
// };

// export const removeBookmark = (book) => (dispatch) => {
//   dispatch({
//     type: REMOVE_FROM_BOOKMARK_LIST,
//     payload: book,
//   });
// };

export const authenticate = async (username, password, account_name, credentials = null) => {
  const body = {
    data: {
      credentials: credentials ? credentials : md5(`${username}:${password}`),
      account_name,
    },
  };

  console.log(body);
  const resp = await fetch(`${CONFIG.api.url}/user_auth`, {
    method: "PUT",
    mode: "cors",
    headers: {
          // Authorization: `Bearer ${gh_personal_access_token}`,
          "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let result = await resp.json();
  console.log(result);
  /*
  let kazooApi = new KazooSDK({
    account_id: result.data.account_id,
    auth_token: result.auth_token,
  });
  const accountResp = kazooApi.get("");
  result = await accountResp.json();
  console.log(result);
   */
  return {
    auth_token: result.auth_token,
    account_id: result.data.account_id,
    user_id: result.data.owner_id,
  };

};


