import React, { useEffect, useCallback, useState, useRef } from "react";

import { StyleSheet, Dimensions, Text, View, Button } from "react-native";

import { randomString } from "../../utils/utils";
import { CALL_DIRECTION_INCOMING } from "../../rn-sip/lib/enums";

import { isArray, isFunction } from "lodash";

import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";

import Carousel, { Pagination } from "react-native-snap-carousel";
import { RenderScreenpop } from "./Render";

const Screenpops = (props) => {
  const { call, onUpdate, defaultScreenpops } = props;

  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const user = state.app.user;
  const allScreenpops = state.app.screenpops.list;

  const carouselRef = useRef();
  const [viewItemWidth, setViewItemWidth] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  // screenpops: [{
  //   id: '', // duplicates ignored
  //   loading: true | false,
  //   loaded: true | false,
  //   response: {}
  // }]
  const [screenpops, setScreenpops] = useState(defaultScreenpops || []);

  useEffect(() => {
    onUpdate && onUpdate([...screenpops]);
  }, [screenpops]);

  const allCallVars = {
    user_id: user.id,
    caller_name: call.remoteName,
    caller_number: call.remoteUser,
  };

  const replaceCallVarsDefault = (url) => {
    Object.keys(allCallVars).map((key) => {
      console.log("url_replace:", url);
      // url = url.replaceAll(`{{${key}}}`, allCallVars[key]);
      url = url.replace(new RegExp(`\{\{${key}\}\}`, "g"), allCallVars[key]);
    });
    return url;
  };

  const onLayout = (event) => {
    var { x, y, width, height } = event.nativeEvent.layout;
    setViewItemWidth(width);
  };

  // fetch screenpop for call
  useEffectOnce(() => {
    // could use a useEffect along w/ a ref, instead of useEffectOnce?
    // - make sure the screenpop gets executed!
    if (call?._direction != CALL_DIRECTION_INCOMING) {
      // TODO: check for "incoming" vs "outgoing" calls here
      console.log("Skipping screenpops for outgoing calls");
      return;
    }

    // determine if a screenpop is needed
    // - check my user, groups I belong to, and screenpop.all_users=true
    const screenpopsToUse = allScreenpops.filter(
      (sp) => sp.doc.screenpop?.active //&& sp.doc.screenpop?.all_users
    );
    // console.log('screenpopsToUse:', screenpopsToUse, allScreenpops);

    // TODO: get user, group (only doing screenpop.all_users currently!)

    // for each screenpop, determine the type, do the thing
    for (let screenpop of screenpopsToUse) {
      processScreenpop(
        screenpop.doc,
        replaceCallVarsDefault,
        allCallVars,
        setScreenpops
      );
    }
  });

  const _renderItem = ({ item, index }) => {
    return <RenderScreenpop screenpop={item} />;
  };

  if (!screenpops.length) {
    return null;
  }

  // // only showing "loaded" screenpops
  // if (!screenpops.find((sp) => sp.loaded)) {
  //   return null;
  // }

  // console.log("viewItemWidth:", viewItemWidth, Dimensions.get("window").width);

  const spList = screenpops; //.filter((sp) => sp.loaded && !sp.error) ?? [];

  return (
    <>
      <View
        style={{
          width: "100%",
          // height: 170,
          // backgroundColor: "blue",
          // paddingTop: 10,
        }}
        onLayout={onLayout}
      >
        <Carousel
          ref={carouselRef}
          data={spList}
          renderItem={_renderItem}
          sliderWidth={viewItemWidth}
          itemWidth={viewItemWidth > 20 ? viewItemWidth - 20 : 1}
          onSnapToItem={(index) => setActiveSlide(index)}
        />
      </View>
      {/* <View style={{ height: 10 }} /> */}
      <View
        style={{
          width: "100%",
          // backgroundColor: "red"
        }}
      >
        <Pagination
          carouselRef={carouselRef}
          dotsLength={spList.length}
          activeDotIndex={activeSlide}
          tappableDots
          // containerStyle={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
          dotStyle={{
            width: 10,
            height: 10,
            borderRadius: 5,
            marginHorizontal: 8,
            // backgroundColor: "rgba(255, 255, 255, 0.92)",
          }}
          inactiveDotStyle={
            {
              // Define styles for inactive dots here
            }
          }
          inactiveDotOpacity={0.4}
          inactiveDotScale={0.6}
        />
        {/* {screenpops
        .filter((sp) => sp.loaded && !sp.error)
        .map((sp, i) => {
          return (
            <View key={i} style={{}}>
              <RenderScreenpop screenpop={sp} />
            </View>
          );
        })} */}
      </View>
    </>
  );
};

export const processScreenpop = async (
  screenpop, // this is the CALLFLOW doc! ...callflow.screenpop.type = 'xyz'
  replaceCallVars,
  allCallVars,
  setScreenpops
) => {
  console.log("processing screenpop:", screenpop);
  switch (screenpop.screenpop.type) {
    case "url":
      let url = screenpop.screenpop.data.url;
      url = replaceCallVars(url);
      const bodyData = allCallVars;
      setScreenpops &&
        setScreenpops((sps) => [
          ...sps,
          {
            id: screenpop.id, // callflow id!
            loading: true,
            loaded: false,
            response: null,
          },
        ]);

      let response, data;
      try {
        console.log("Fetching...");
        response = await fetch(url, {
          method: screenpop.screenpop.data.method ?? "GET", // TODO: more than GET
          headers: {
            "Content-Type": "application/json",
          },
          body:
            screenpop.screenpop.data.method === "POST"
              ? JSON.stringify(bodyData)
              : undefined, // TODO: use for POST
        });
        // console.log("response:", response);
        console.log("Response...");
        data = await response.json();
      } catch (err) {
        console.error("Failed screenpop", err);
        setScreenpops([
          {
            id: randomString(6),
            loading: false,
            loaded: true,
            error: {
              message: `Failed loading screenpop: ${err.toString()} ${response}`,
            },
            response: null,
          },
        ]);
        return;
      }

      //  .then((data) => {
      console.log("Success w/ screenpop data:", typeof setScreenpops); //, data);

      // expecting either an object or an array of objects to be returned
      // - modify "loading" screenpop in-place, and add additional screenpops if an array was returned
      const dataArr = isArray(data) ? [...data] : [data];
      // console.log('dataArr:', dataArr);
      for (let i in dataArr) {
        const spData = dataArr[i];

        // validate screenpop result
        const validated = validateScreenpop(spData);

        // console.log('i:', i);
        // modify existing screenpop data for 1st, add for additional
        setScreenpops &&
          setScreenpops((sps) => {
            return i == 0
              ? [
                  ...sps.map((sp) =>
                    sp.id === screenpop.id
                      ? {
                          id: sp.id,
                          loading: false,
                          loaded: true,
                          error: validated !== true ? validated : false,
                          response: spData,
                        }
                      : sp
                  ),
                ]
              : [
                  ...sps,
                  {
                    id: `${screenpop.id}-${i}`,
                    loading: false,
                    loaded: true,
                    error: validated !== true ? validated : false,
                    response: spData,
                  },
                ];
          });
      }

      //  })
      //  .catch((error) => {
      //    console.error('Error:', error);
      //  });
      break;

    default:
      console.error("unknown screenpop type:", screenpop.screenpop.type);
      break;
  }
};

export const validateScreenpop = (screenpopResponseData) => {
  if (screenpopResponseData?.version !== "1.0") {
    return {
      message: "Invalid Version",
    };
  }
  // return { message: 'Failure test' };
  // TODO: validate schema of response

  return true;
};

export default Screenpops;
