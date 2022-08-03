// import fetch from "node-fetch";
import base64 from "base-64";
import CONFIG from "../../whitelabel_config/config.json";
import md5 from 'md5';
import { store } from "../redux/store";

import { set, get } from "lodash";

const KAZOO_API_URL = CONFIG.kazoo.api_url;
export const epochOffset = 62167219200;

class KazooSDK {
  constructor({ account_id, auth_token, user_id, dispatch }) {
    this.account_id = account_id;
    this.user_id = user_id;
    this.auth_token = auth_token;
    this.dispatch = dispatch;
  }

  buildUrlWithPrefix(resourceUrl, params) {
    // console.log(
    //   "AccountID:",
    //   this.account_id,
    //   `${KAZOO_API_URL}/accounts/${this.account_id}${resourceUrl}`
    // );
    let url;
    if (params?.root) {
      url = `${KAZOO_API_URL}${resourceUrl}`;
    } else {
      url = `${KAZOO_API_URL}/accounts/${this.account_id}${resourceUrl}`;
    }
    if (params?.queryParams) {
      let result = "";
      Object.keys(params.queryParams).forEach((key) => {
        const val = params.queryParams[key];
        if (val !== undefined) {
          result += `${key}=${params.queryParams[key]}&`;
        }
      });
      url = url + "?" + result.substr(0, result.length - 1);
    }
    console.log("url:", url);
    return url;
  }

  getDefaultHeaders(headerParams = {}) {
    let headers = new Headers();
    if (headerParams.basicAuth) {
      headers.append(
        "Authorization",
        "Basic " +
          base64.encode(headerParams.account_id + ":" + headerParams.md5token)
      );
    } else if (headerParams.auth === null || headerParams.auth === false) {
      // no auth!
    } else {
      // headers.append("Authorization", `Bearer ${this.auth_token}`);
      headers.append("X-AUTH-TOKEN", `${this.auth_token}`);
      // // default to basic auth using MAIN_ACCOUNT credentials (ie the Super Admin account)
      // headers.append(
      //   "Authorization",
      //   "Basic " +
      //     base64.encode(
      //       MAIN_ACCOUNT_ID +
      //         ":" +
      //         MAIN_ACCOUNT_AUTH_TOKEN
      //     )
      // );
    }
    headers.append("Content-Type", "application/json");
    return headers;
  }

  async get(url, params) {
    const response = await fetch(this.buildUrlWithPrefix(url, params), {
      method: "GET",
      headers: this.getDefaultHeaders(params?.headerParams),
      cache: "no-cache", // 412 Precondition Failed
    });
    const response_json = await response.json();
    return response_json;
  }

  async put(url, body, params) {
    const response = await fetch(this.buildUrlWithPrefix(url, params), {
      method: "PUT",
      headers: this.getDefaultHeaders(params?.headerParams),
      body: JSON.stringify({
        data: body,
      }),
    });
    const response_json = await response.json();
    return response_json;
  }

  async patch(url, body, params) {
    const response = await fetch(this.buildUrlWithPrefix(url, params), {
      method: "PATCH",
      headers: this.getDefaultHeaders(params?.headerParams),
      body: JSON.stringify({
        data: body,
      }),
    });
    const response_json = await response.json();
    return response_json;
  }

  async post(url, body, params) {
    const response = await fetch(this.buildUrlWithPrefix(url, params), {
      method: "POST",
      headers: this.getDefaultHeaders(params?.headerParams),
      body: JSON.stringify({
        data: body,
      }),
    });
    const response_json = await response.json();
    return response_json;
  }

  // User-specific functions
  // - for fetching data as a user (NOT as an admin!)
  async updateAccount() {
    // const account_id = state.auth.account_id;

    const result = await this.get(`/`); // TODO: handle errors!
    console.log("setting state of account", this.account_id); //, result.data);
    await this.dispatch({
      type: "SET_APP_STATE",
      payload: {
        account: result.data,
      },
    });
  }

  // User-specific functions
  // - for fetching data as a user (NOT as an admin!)
  async updateUser() {
    // const user_id = state.auth.user_id;

    const result = await this.get(`/users/${this.user_id}`); // TODO: handle errors!
    console.log("setting state of user", this.user_id);
    console.log(result.data);
    await this.dispatch({
      type: "SET_APP_STATE",
      payload: {
        user: result.data,
      },
    });
  }
  // fetch user devices
  async fetchDevices() {
    const result = await this.get(`/users/${this.user_id}/devices`);
    console.log(result.data);
    const devices = result.data;
    const softPhones = devices.filter((d) => d.device_type === 'softphone');
    console.log(softPhones);
    return softPhones;
  }

  // User-specific functions
  // - for fetching data as a user (NOT as an admin!)
  async updateDevice(device_id) {
    // const user_id = state.auth.user_id;

    const result = await this.get(`/devices/${device_id}`); // TODO: handle errors!
    console.log("setting state of DEVICE", device_id);
    await this.dispatch({
      type: "SET_APP_STATE",
      payload: {
        device: result.data,
      },
    });
  }

  async updateVmboxes(extraParams) {
    // const user_id = state.app.auth.user_id;
    // console.log("Updating vmboxes");

    const vmboxesArr = await this.syncCollection({
      collectionKey: "vmboxes",
      extraParams,
    });

    const promises = [];
    for (let vmbox of vmboxesArr) {
      promises.push(
        this.syncItemList({
          id: vmbox.id,
          idType: "vmboxes",
          listType: "messages",
          iterateOverEach: true, // required for fetching transcription!
        })
      );
    }

    await Promise.all(promises);

    return vmboxesArr;
  }

  async getScreenpops(state, extraParams) {
    // const user_id = state.app.auth.user_id;
    const screenpopsArr = await this.syncCollection({
      collectionKey: "screenpops",
      collectionRemotePath: "callflows",
      extraParams: {
        ...extraParams,
        filter_type: "screenpop",
      },
    });

    // await this.dispatch({
    //   type: "SET_APP_STATE",
    //   payload: {
    //     screenpops: {
    //       list: screenpopsArr,
    //     },
    //   },
    // });
    // const screenpopsArr = callflowsArr.filter();
    // console.log("====screenpopsArr:=======", screenpopsArr);
    return screenpopsArr;
  }

  async syncCollection(props) {
    let {
      collectionKey,
      collectionRemotePath,
      fullSync = false, // forcing true for now
      extraParams = {},
      extraSync = {},
    } = props;
    collectionRemotePath = collectionRemotePath || collectionKey;

    const state = store.getState();

    await this.dispatch({
      type: "SET_APP_STATE",
      payload: {
        [collectionKey]: {
          loading: true,
          loaded: state.app[collectionKey]?.loaded,
          list: state.app[collectionKey]?.list || [],
        },
      },
    });

    const link = `/${collectionRemotePath}`;

    const promises = [];

    // TODO: handle syncing! currently not doing that, fetching full each time
    const result = await this.newGetListingAndFull(link, {
      ...extraParams,
      // modified_from: recentSyncTime,
    });

    // result.results
    // result.timestamp.
    updatedResults = result.results;
    timestamp = result.timestamp;

    await this.dispatch({
      type: "SET_APP_STATE",
      payload: {
        [collectionKey]: {
          loading: false,
          loaded: true,
          list: result.results,
        },
      },
    });

    return result.results;
  }

  async syncItemList(props) {
    let {
      id,
      idType,
      listType,
      iterateOverEach = false,
      fullSync = true,
      extraParams = {},
      extraListingParams = {},
      extraFullParams = {},
    } = props;

    // this does a FULL sync every time!

    const state = store.getState();

    // // console.log('state.lists:', state.lists);
    let collectionData = get(
      state.app.itemlists,
      [idType, id, listType].join("."),
      {}
    );

    let { list = [], recentSyncTime = 0 } = collectionData;

    // set loading status
    this.dispatch({
      type: "SET_ITEMLISTS_COLLECTION",
      payload: {
        path: ["itemlists", idType, id, listType].join("."),
        data: {
          list,
          loading: true,
        },
      },
    });

    if (fullSync) {
      // reset entire list if fullSync=true
      list = [];
      recentSyncTime = 0;
    }

    const link = `/${[idType, id, listType].join("/")}`;

    const result = await this.newGetListingAndFull(link, {
      ...extraParams,
      // modified_from: recentSyncTime,
    });
    let finalResults = result.results;

    if (iterateOverEach) {
      // TODO: pool/limit to 5 at a time (prevent too many requests at once!)
      let promises = [];
      for (let item of result.results) {
        promises.push(
          this.get(`${link}/${item.id}`).then((r) => ({
            ...item,
            single: r.data,
          }))
        );
      }
      finalResults = await Promise.all(promises);
    }

    const timestamp = result.timestamp;

    const timestampSyncTime =
      Math.round(new Date(timestamp).getTime() / 1000) + epochOffset;

    const dispatchData = {
      //   type: dispatchType,
      type: "SET_ITEMLISTS_COLLECTION",
      payload: {
        path: ["itemlists", idType, id, listType].join("."),
        data: {
          list: finalResults,
          loading: false,
          loaded: true,
          recentSyncTime: timestampSyncTime,
          // loading,
          // loaded
        },
      },
    };

    // console.log("Finished syncing itemlist!", dispatchData);

    this.dispatch(dispatchData);

    return result;
  }

  async paginate(link, params = {}, expectNumbersResult) {
    let results = [];
    let timestamp = false;

    const continuePaginating = async (start_key) => {
      const resp = await this.get(link, {
        // paramsSerializer: function (params) {
        //   let result = "";
        //   Object.keys(params).forEach((key) => {
        //     const val = params[key];
        //     if (val !== undefined) {
        //       result += `${key}=${params[key]}&`;
        //     }
        //   });
        //   return result.substr(0, result.length - 1);
        // },
        queryParams: {
          // paginate: 'false',
          ...params,
          start_key,
        },
      });
      if (resp.error) {
        throw `API Error: ${resp.error} ${resp.message}`;
      }
      // console.log("resp:", resp);
      // try {
      if (expectNumbersResult) {
        // for phone numbers api only
        let numberResults = Object.keys(resp.data.numbers).map((ptn) => ({
          id: ptn,
          data: resp.data.numbers[ptn],
        }));
        results = [...results, ...numberResults];
      } else {
        // this is for everything except the phone_numbers API
        results = [...results, ...resp.data];
      }
      // } catch (err) {
      //   console.error("Bad iterable thing:", link, err);
      //   throw err;
      // }
      if (timestamp === false) {
        timestamp = resp.data.timestamp;
      }
      if (resp.data.next_start_key) {
        // await sleep(2 * 1000); // waiting 1 second(s) between pagination requests
        await continuePaginating(resp.data.next_start_key);
      }
    };

    await continuePaginating(undefined);

    return { results, timestamp };
  }

  async newGetListingAndFull(
    link,
    params = {},
    listingParams = {},
    fullParams = {}
  ) {
    // paginate listing

    const promises = [];

    // const { results: listings } = await this.paginate(link, params);
    promises.push(this.paginate(link, { ...params, ...listingParams }));

    // paginate full_docs
    // const { results: full_docs } = await this.paginate(link, {
    //   ...params,
    //   full_docs: true,
    // });
    promises.push(
      this.paginate(link, {
        ...params,
        ...fullParams,
        full_docs: true,
      })
    );

    const [
      { results: listings, timestamp },
      { results: full_docs },
    ] = await Promise.all(promises);

    // console.log('result:', result);

    // merge "full" for now
    // - eventually get rid of the "listing" entirely
    // const result = listings.map((u) => ({
    //   ...u,
    //   full: full_docs.find((u2) => u2.id === u.id || u2._id === u.id),
    // }));
    const results = full_docs.map((doc) => ({
      id: doc.id || doc._id || doc.media_id, // some docs have it different! such as "vmboxes" doc does NOT have an "id" but DOES have "_id" and "messages" only has a "media_id"
      doc,
      listing: listings.find((listingDoc) => {
        if (listingDoc.id) {
          return listingDoc.id === doc.id || listingDoc.id === doc._id;
        } else if (listingDoc.media_id) {
          return listingDoc.media_id === doc.media_id;
        }
      }),
    }));

    return { results, timestamp };
  }
}

export default KazooSDK;
