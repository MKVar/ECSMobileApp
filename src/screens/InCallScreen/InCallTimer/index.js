import React, { useEffect, useState } from "react";
import {Text} from "react-native";

const InCallTimer = ({ call, color }) => {
  const [dur, setDur] = useState("");

  useEffect(() => {
      call.registerDurationListener("InCallTimer", onCallTimerUpdate);
  }, [call._id]);

  const onCallTimerUpdate = (callId, mins, secs) => {
    const d = `${('0'+mins).slice(-2)}:${('0'+secs).slice(-2)}`;
    setDur(d);
  };

  const textColor = color === undefined ? '#0C7EAB' : color;
  return (
      <Text style={{ color: textColor }}>{dur}</Text>
  );
};

export default InCallTimer;
