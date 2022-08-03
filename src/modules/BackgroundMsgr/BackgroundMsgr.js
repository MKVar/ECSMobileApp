import React, { useEffect, useRef } from "react";

const onFCMNotification = (data) => {
  console.log("BackgroundMsgr onIncoming message");
  console.log(data);
};

export { onFCMNotification };
