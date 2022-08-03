import React from "react";
import { Alert } from "react-native";

export const AsyncAlert = async (title, message) =>
  new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: "OK",
          onPress: () => {
            resolve();
          },
        },
      ],
      { cancelable: false }
    );
  });

export const AsyncPrompt = async (
  title,
  message,
  defaultValue,
  type = "plain-text",
  keyboardTypes
) =>
  new Promise((resolve) => {
    Alert.prompt(
      title,
      message,
      [
        {
          text: "Cancel",
          onPress: () => {
            resolve(null);
          },
        },
        {
          text: "OK",
          onPress: (text) => {
            resolve(text);
          },
        },
      ],
      type,
      defaultValue,
      keyboardTypes
    );
  });
