import * as React from "react";
import type { ColorValue } from "react-native";
import Svg, { type SvgProps, Path, Rect } from "react-native-svg";

const BASE_SIZE = 16;

type Props = SvgProps & { size?: number; outline?: ColorValue };

export function Kiln({ size = BASE_SIZE, outline }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect y="0.00390625" width="32" height="32" rx="8" fill="#FBFBFB" />
      <Path
        d="M15.2991 11.3666C15.4097 11.2539 15.5619 11.1851 15.7309 11.1851C15.8999 11.1851 16.05 11.2519 16.1585 11.3624L18.8409 14.0448C19.0578 14.2617 19.4103 14.2617 19.6272 14.0448L21.761 11.911C21.978 11.694 21.978 11.3415 21.761 11.1246L17.2911 6.64842C16.4318 5.78907 15.0363 5.78907 14.177 6.64842L9.70079 11.1246C9.48385 11.3415 9.48385 11.694 9.70079 11.911L11.8346 14.0448C12.0515 14.2617 12.404 14.2617 12.6209 14.0448L15.2991 11.3666Z"
        fill="#FF6521"
      />
      <Path
        d="M24.6873 14.0467L23.7174 13.0768C23.5005 12.8598 23.148 12.8598 22.9311 13.0768L16.1584 19.8494C16.0499 19.9579 15.8977 20.0267 15.7308 20.0267C15.564 20.0267 15.4138 19.96 15.3032 19.8515L8.53262 13.0768C8.31569 12.8598 7.96319 12.8598 7.74626 13.0768L6.77635 14.0467C5.917 14.906 5.917 16.3014 6.77635 17.1608L14.1748 24.5592C15.0341 25.4186 16.4296 25.4186 17.2889 24.5592L24.6873 17.1608C25.5467 16.3014 25.5467 14.906 24.6873 14.0467Z"
        fill="#202020"
      />
      <Rect
        x="0.5"
        y="0.503906"
        width="31"
        height="31"
        rx="7.5"
        stroke={outline}
        stroke-opacity={0.1}
      />
    </Svg>
  );
}
export default Kiln;
