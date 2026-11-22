// Fortune: gold eight-point star medallion on a ring, with two small sparks.
import { starPoints } from "../flags/shapes";
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function FortuneEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="ft-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="0.55" stopColor={P.gold2} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
        <radialGradient id="ft-disc" cx="0.4" cy="0.35" r="0.9">
          <stop offset="0" stopColor={P.greenMid} />
          <stop offset="1" stopColor={P.greenDeep} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill="url(#ft-disc)" stroke="url(#ft-gold)" strokeWidth="3" />
      <circle cx="32" cy="32" r="22" fill="none" stroke={P.gold1} strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="1.5 2.5" />
      <polygon points={starPoints(32, 32, 19, 8.5, 8)} fill="url(#ft-gold)" stroke={P.goldDark} strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={starPoints(32, 32, 9, 4.2, 8, -67.5)} fill={P.greenDeep} fillOpacity="0.55" />
      <circle cx="32" cy="32" r="2.4" fill={P.gold1} />
      {[[54, 11, 4], [11, 53, 3]].map(([x, y, r], i) => (
        <polygon key={i} points={starPoints(x!, y!, r!, r! * 0.32, 4)} fill={P.gold1} />
      ))}
    </svg>
  );
}
