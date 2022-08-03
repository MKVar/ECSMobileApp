import React from "react";

import { Text as RnText, StyleSheet } from "react-native";
// import { Text as RneText } from "react-native-elements";

const Text = (props) => {
  const variant = props.variant;
  const style = variant ? styles[variant] : null;
  return <RnText {...props} style={[style, props.style]} />;
};

const styles = StyleSheet.create({
  listTitle: {
    fontSize: 18,
  },
});

export default Text;
