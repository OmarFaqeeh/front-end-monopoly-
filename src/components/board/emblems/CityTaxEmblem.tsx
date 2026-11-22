// City tax: a ledger book with a gold coin stack and a small percent mark.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function CityTaxEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="ct-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.brickLight} />
          <stop offset="1" stopColor={P.brick} />
        </linearGradient>
        <linearGradient id="ct-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="0.6" stopColor={P.gold2} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
      </defs>
      {/* ledger */}
      <rect x="6" y="14" width="38" height="44" rx="3" fill="url(#ct-cover)" />
      <rect x="6" y="14" width="6" height="44" rx="2" fill={P.brick} />
      <rect x="15" y="21" width="24" height="8" rx="1.5" fill={P.ivory} />
      <g stroke={P.ivory} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round">
        <line x1="17" y1="38" x2="38" y2="38" />
        <line x1="17" y1="44" x2="34" y2="44" />
        <line x1="17" y1="50" x2="30" y2="50" />
      </g>
      <rect x="6" y="14" width="38" height="44" rx="3" fill="none" stroke="url(#ct-gold)" strokeWidth="1.2" />
      {/* coin stack */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="50" cy={54 - i * 5} rx="9" ry="3.6" fill="url(#ct-gold)" stroke={P.goldDark} strokeWidth="0.5" />
          <path d={`M41 ${54 - i * 5} v2.4 a9 3.6 0 0 0 18 0 v-2.4`} fill={P.gold3} />
        </g>
      ))}
      {/* percent mark */}
      <g fill="none" stroke="url(#ct-gold)" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="46" cy="14" r="3" />
        <circle cx="57" cy="25" r="3" />
        <line x1="58" y1="11" x2="45" y2="28" />
      </g>
    </svg>
  );
}
