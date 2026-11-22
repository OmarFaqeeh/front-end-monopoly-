// Start: a gold ring with a bold forward arrow (mirrors in RTL).
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function StartEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="st-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="0.55" stopColor={P.gold2} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
        <radialGradient id="st-disc" cx="0.4" cy="0.35" r="0.9">
          <stop offset="0" stopColor={P.greenMid} />
          <stop offset="1" stopColor={P.greenDeep} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#st-disc)" stroke="url(#st-gold)" strokeWidth="4" />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke={P.gold1} strokeOpacity="0.4" strokeWidth="0.8" />
      <g className="rtl:origin-center rtl:-scale-x-100" style={{ transformOrigin: "32px 32px" }}>
        <path d="M14 26 H34 V16 L52 32 L34 48 V38 H14 Z" fill="url(#st-gold)" stroke={P.goldDark} strokeWidth="1" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
