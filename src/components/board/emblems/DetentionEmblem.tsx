// Detention: a barred window with a padlock.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function DetentionEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="dt-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="0.55" stopColor={P.gold2} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
        <linearGradient id="dt-stone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.greenLight} />
          <stop offset="1" stopColor={P.greenDeep} />
        </linearGradient>
      </defs>
      <path d="M8 58 V26 A24 24 0 0 1 56 26 V58 Z" fill="url(#dt-stone)" />
      <path d="M14 58 V27 A18 18 0 0 1 50 27 V58 Z" fill={P.ink} fillOpacity="0.85" />
      <g stroke={P.sage} strokeWidth="2.4" strokeLinecap="round">
        {[21, 27, 32, 37, 43].map((x) => (
          <line key={x} x1={x} y1="12" x2={x} y2="56" />
        ))}
      </g>
      <line x1="14" y1="30" x2="50" y2="30" stroke={P.sage} strokeWidth="2.4" />
      {/* padlock */}
      <path d="M38 38 V34 A6 6 0 0 1 50 34 V38" fill="none" stroke="url(#dt-gold)" strokeWidth="3" strokeLinecap="round" />
      <rect x="35" y="38" width="18" height="15" rx="3" fill="url(#dt-gold)" stroke={P.goldDark} strokeWidth="0.8" />
      <circle cx="44" cy="45" r="2.2" fill={P.goldDark} />
      <rect x="43.2" y="45" width="1.6" height="4.5" rx="0.8" fill={P.goldDark} />
    </svg>
  );
}
