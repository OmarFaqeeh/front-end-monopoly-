// Turkey: red field with a white crescent and star.
import { starPoints } from "./shapes";

export default function TrFlag() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="60" height="40" fill="#E30A17" />
      <circle cx="23" cy="20" r="10" fill="#FFFFFF" />
      <circle cx="26" cy="20" r="8" fill="#E30A17" />
      <polygon points={starPoints(35.5, 20, 4.4, 1.8, 5)} fill="#FFFFFF" />
    </svg>
  );
}
