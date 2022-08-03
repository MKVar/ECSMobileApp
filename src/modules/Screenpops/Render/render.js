import React, { useEffect, useCallback, useState, useRef } from "react";

import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { Card, Button, Icon } from "react-native-elements";

const RenderScreenpop = (props) => {
  const { screenpop, debug } = props;

  const navigation = useNavigation();

  if (screenpop.error) {
    if (debug) {
      return (
        <View height={120} style={{ border: "1px solid red" }}>
          <Text>Failed loading screenpop</Text>
          <Text>{screenpop.error.message}</Text>
        </View>
      );
    }
    // failed getting screenpop
    return (
      <View height={120} style={{ border: "1px solid red" }}>
        <Text>Failed loading screenpop</Text>
        <Text>Please contact your admin, or support</Text>
      </View>
    );
  }

  if (screenpop.loading) {
    return (
      <View alignItems="center" justifyContent="center">
        <Text>Loading screenpop...</Text>
      </View>
    );
  }

  if (screenpop.error !== false) {
    return (
      <View alignItems="center" justifyContent="center">
        <Text>Error with screenpop</Text>
      </View>
    );
  }

  const version = screenpop.response.version;
  const data = screenpop.response.data;

  const handleShowLink = () => {
    // TODO: validate link somehow?
    navigation.navigate("ScreenpopWebview", {
      uri: data.link.href,
    });
  };

  return (
    <View
      // height={150}
      style={{
        paddingTop: 10,
        paddingBottom: 10,
      }}
    >
      <View
        // height={150}
        style={{
          borderWidth: 1,
          borderColor: "#eee",
          borderRadius: 4,
          backgroundColor: "white",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.5,
          shadowRadius: 5,
          elevation: 4,
          paddingTop: 8,
        }}
      >
        <Card.Title>{data.title}</Card.Title>
        <Card.Divider />
        <View style={{ padding: 8 }}>
          <Text>{data.body}</Text>

          {data.link ? (
            <Button
              title={data.link.text}
              type="clear"
              // href={data.link.href}
              // rel="noopener"
              // target="_blank"
              onPress={handleShowLink}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default RenderScreenpop;
