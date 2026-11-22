// Morocco: red field with a green five-pointed star outline.
import { pentagramPath } from "./shapes";

export default function MaFlag() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="60" height="40" fill="#C1272D" />
      <path d={pentagramPath(30, 21, 10)} fill="none" stroke="#006233" strokeWidth="1.8" strokeLinejoin="miter" />
    </svg>
  );
}
