import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";

import {
  Divider,
  Button,
  ThemeProvider,
  ListItem,
  Text,
  Slider,
} from "react-native-elements";

export default function MenuModal({ onClose, children }) {
  return (
    <Modal
      isVisible
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={["up", "left", "right", "down"]}
      style={styles.modal}
    >
      <View style={styles.main}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  main: {
    backgroundColor: "white",
  },
});
