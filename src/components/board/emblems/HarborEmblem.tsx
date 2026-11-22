// Harbor: sailing dhow with a lateen sail over layered waves, small gold anchor mark at the stern.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function HarborEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="hb-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.ivory} />
          <stop offset="1" stopColor={P.ivoryShade} />
        </linearGradient>
        <linearGradient id="hb-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.wood} />
          <stop offset="1" stopColor={P.woodDark} />
        </linearGradient>
        <linearGradient id="hb-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
      </defs>
      {/* sail */}
      <path d="M31 8 L31 40 L10 40 Z" fill="url(#hb-sail)" stroke="url(#hb-gold)" strokeWidth="1" strokeLinejoin="round" />
      <path d="M34 14 L34 40 L52 40 Z" fill="url(#hb-sail)" fillOpacity="0.92" stroke="url(#hb-gold)" strokeWidth="1" strokeLinejoin="round" />
      <line x1="32.5" y1="7" x2="32.5" y2="42" stroke={P.woodDark} strokeWidth="1.6" strokeLinecap="round" />
      {/* hull */}
      <path d="M8 41 H56 Q52 51 44 51 H20 Q12 51 8 41 Z" fill="url(#hb-hull)" />
      <path d="M8 41 H56" stroke="url(#hb-gold)" strokeWidth="1.6" strokeLinecap="round" />
      {/* anchor mark at the stern */}
      <g stroke="url(#hb-gold)" strokeWidth="1.1" fill="none" strokeLinecap="round">
        <circle cx="48" cy="44" r="1" />
        <line x1="48" y1="45" x2="48" y2="49" />
        <path d="M45.5 47.5 Q48 50.5 50.5 47.5" />
      </g>
      {/* waves */}
      <path d="M0 52 Q8 47 16 52 T32 52 T48 52 T64 52 V64 H0 Z" fill={P.water} fillOpacity="0.85" />
      <path d="M0 57 Q8 52 16 57 T32 57 T48 57 T64 57 V64 H0 Z" fill={P.waterDeep} fillOpacity="0.9" />
      <path d="M0 61 Q8 57 16 61 T32 61 T48 61 T64 61 V64 H0 Z" fill={P.teal} />
    </svg>
  );
}
