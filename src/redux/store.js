import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer } from "redux-persist";

import { appReducer, tmpReducer } from "./reducers";

const persistConfig = {
  key: "app",
  storage: AsyncStorage,
  blacklist: [],
  //   whitelist: ["bookmarks"],
};

const rootReducer = combineReducers({
  app: persistReducer(persistConfig, appReducer),
  tmp: tmpReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));
export const persistor = persistStore(store);
