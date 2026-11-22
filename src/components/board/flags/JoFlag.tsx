// Jordan: black, white, green stripes with a red hoist triangle and a white seven-pointed star.
import { starPoints } from "./shapes";

export default function JoFlag() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="60" height="13.34" fill="#000000" />
      <rect y="13.33" width="60" height="13.34" fill="#FFFFFF" />
      <rect y="26.66" width="60" height="13.34" fill="#007A3D" />
      <polygon points="0,0 34,20 0,40" fill="#CE1126" />
      <polygon points={starPoints(11, 20, 4.6, 2.1, 7)} fill="#FFFFFF" />
    </svg>
  );
}
