import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

function SvgCorner(props: SvgProps) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 13" {...props}>
      <Path d="M0 0v13h13C4 13 0 9 0 0" fill="#fff" />
    </Svg>
  );
}

export default SvgCorner;
