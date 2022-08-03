import { getFontScaleSync } from "react-native-device-info";
import { set, get, merge, cloneDeep } from "lodash";

import { EventEmitter } from "events";
const eventEmitter = new EventEmitter();

// import {
//   GET_app,
//   ADD_TO_BOOKMARK_LIST,
//   REMOVE_FROM_BOOKMARK_LIST,
// } from "./actions";

const initialStateApp = {
  auth: null,
  localCallHistory: [],
  files: {}, // uri => localPath
  user: null,
  device: null,
  tenantUrl: "",
  useNativeApp: false,
  itemlists: {
    // [id.idType.listType]: {list: []}
  },

  // vmboxes: null,
  screenpops: {
    list: [], // loading, loaded
  },

  // app-level settings (perhaps temporary?)
  // - should store in device, on-server?
  settings: {
    call_forward: {
      user: {
        enable_on_cell: false,
      },
      device: {
        enable_on_cell: false,
      },
    },
  },
};

export function appReducer(state = initialStateApp, action) {
  switch (action.type) {
    case "FILES_UPDATE":
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.uri]: action.payload, // localPath, headers...
        },
      };
    case "FILES_CLEAR":
      return {
        ...state,
        files: {},
      };
    case "CALL_HISTORY_ADD":
      // check if present or not
      const { localCallHistory } = state;
      const index = localCallHistory.findIndex(
        (ch) => ch.id === action.payload.id
      );
      if (index > -1) {
        // TODO: modify if required
        return { ...state };
      } else {
        return {
          ...state,
          localCallHistory: [...state.localCallHistory, action.payload],
        };
      }

    case "SET_APP_STATE":
      return { ...state, ...action.payload };

    case "SETATPATH_APP_STATE":
      for (let payload of action.payload) {
        set(state, payload.path, payload.data);
      }
      return { ...state };

    case "MERGE_APP_STATE":
      return merge(cloneDeep(state), action.payload);

    case "UPDATE_APP_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload(state),
        },
      };
    case "SET_ITEMLISTS_COLLECTION":
      const currentAtPath = get(state, action.payload.path, {});
      set(state, action.payload.path, {
        ...currentAtPath,
        ...action.payload.data,
      });
      return { ...state };

    // case "SET_ITEMLISTS_COLLECTION_ITEM":
    //   // also handles remove?
    //   const currentAtPath2 = get(state, action.payload.path, {});
    //   set(state, action.payload.path, {
    //     ...currentAtPath2,
    //     ...action.payload.data,
    //   });
    //   return { ...state };

    case "LOGOUT":
      const { tenantUrl, useNativeApp } = state;
      return { ...initialStateApp, tenantUrl, useNativeApp };
    default:
      return state;
  }
}

const initialStateTmp = {
  hideTabs: 0,
  eventBus: eventEmitter,
  dialerText: "",
  loggingIn: false,
  loginError: false,
  network: {},
  tenantUrl: "",
  useNativeApp: false,
};

export function tmpReducer(state = initialStateTmp, action) {
  switch (action.type) {
    case "SET_TMP_STATE":
      return { ...state, ...action.payload };
    case "HIDE_TABS":
      return { ...state, hideTabs: state.hideTabs + 1 };
    case "HIDE_TABS_UNDO":
      return { ...state, hideTabs: state.hideTabs - 1 };
    case "LOGOUT":
      return { ...initialStateTmp };
    default:
      return state;
  }
}

// export default appReducer;
