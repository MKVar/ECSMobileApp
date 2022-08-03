// import createReducerContext from "react-use/lib/factory/createReducerContext";

// import KazooSDK from "./kazoo";

// const reducer = (state, action) => {
//   console.log("Reducing", action.type);
//   switch (action.type) {
//     case "CLEAR_STATE":
//       return {};
//     case "SET_STATE":
//       return { _v: state._v + 1, ...state, ...action.payload };
//     default:
//       throw new Error();
//   }
// };

// export const [useSharedState, SharedStateProvider] = createReducerContext(
//   reducer,
//   {
//     _v: 1, // temporary
//   }
// );

// export const [useTempState, TempStateProvider] = createReducerContext(reducer, {
//   _v: 1,
//   KazooSDK: new KazooSDK({}),
// });
