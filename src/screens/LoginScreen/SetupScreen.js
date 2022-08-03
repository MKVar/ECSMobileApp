import React, { useEffect, useState, useRef } from "react";
import {TouchableOpacity, View, Text, Image, StyleSheet} from "react-native";
import {Input} from "react-native-elements";
import {useDispatch, useSelector} from "react-redux";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import SwipeButton from "rn-swipe-button";

const SwipeIcon = () => {
  return (
    <MaterialCommunityIcons name="chevron-triple-right" size={30} color="#888" />
  );
};

const SetupScreen = ({navigation}) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const [url, setUrl] = useState('https://');

  const isDisabled = () => {
    const domainParts = url.replace("https://", "")
          .replace("https://", "")
          .replace("www.", "")
          .split(".");
    if (domainParts.length >= 3) {
      const domain = `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
      return false;
    }
    return true;
  }

  const onStart = () => {
    // TODO: validate and fetch the data from CRM
    console.log(url);
    dispatch({
      type: "SET_APP_STATE",
      payload: {
        tenantUrl: url,
      },
    });
    navigation.reset({
            index: 0,
            routes: [{name: "Login"}],
        });

  };
  const onSwipeSuccess = () => {
    console.log("Swipe Successfull ..");
  };
  //const btnBkg =  url === '' ? "#fccdb4" : "#f77731";
  const btnBkg = "#fccdb4";

  return (
    <View style={{ justifyContent: "center", height: "100%", marginHorizontal: 20 }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 0.7,
        }}
      >
        <Image
          style={{
            maxWidth: 360,
            maxHeight: 240,
          }}
          source={require("../../../whitelabel_config/5112781.png")}
          resizeMode="contain"
        />
      </View>
      <View
          style={{
              flex: 1,
              alignItems: 'center',
          }}
      >
        <View
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            marginBottom: 10,
            padding: 10,
          }}
        >
          <Image
            style={{
              maxWidth: 42,
              maxHeight: 42,
              marginBottom: 10,
            }}
            source={require("../../../whitelabel_config/klpicon.png")}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: "#222"
            }}
          >
           Lets get started.
          </Text>
          <Text>
            Please provide your tokdesk.com URL, we will setup your app for you. (eg: https://yummy.tokdesk.com)
          </Text>
        </View>
        <View style={{ width: "100%"}}>
          <Input
            autoFocus
            keyboardType="default"
            placeholder={"eg: yummy.tokdesk.com"}
            value={url}
            onChangeText={(str) => setUrl(str)}
            style={{
              borderWidth: 0,
              borderRadius: 0,
              borderBottomWidth: 1,
            }}
            errorStyle={{ marginBottom: 0 }}
            inputContainerStyle={{ borderBottomWidth: 0 }}
          />
        </View>
        <View style={{ width: "100%", alignSelf: 'flex-end', position: 'absolute', bottom: 10}}>
          <SwipeButton
            disabled={ isDisabled() ? true : false }
            disabledRailBackgroundColor={"#ffebe0"}
            disabledThumbIconBackgroundColor={"#ffd996"}
            disabledThumbIconBorderColor={"#ffd996"}
            railBackgroundColor={btnBkg}
            railBorderColor={"transparent"}
            thumbIconComponent={SwipeIcon}
            title={"swipe to start"}
            thumbIconBackgroundColor={"#fdb845"}
            thumbIconBorderColor={"transparent"}
            swipeSuccessThreshold={60}
            railFillBorderColor={"#fdb845"}
            railFillBackgroundColor={btnBkg}
            onSwipeSuccess={onStart}
          />
            {/*
          <TouchableOpacity
          disabled={ url === ""}
          onPress={onStart}
          style={{ flex: 1,
              justifyContent: "center",
              alignItems: "center",
          }}
        >
          <View
            style={{
              height: 64,
              width: 64,
              borderRadius: 32,
              backgroundColor: btnBkg,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
              <MaterialCommunityIcons name="chevron-triple-right" size={42} color="white" />
          </View>
        </TouchableOpacity>
        */}
        </View>


      </View>
    </View>
  );
};

const styles = StyleSheet.create({
});

export default SetupScreen;
