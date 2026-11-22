// Go to detention: a gavel on a block.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function GoToDetentionEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="gd-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.wood} />
          <stop offset="1" stopColor={P.woodDark} />
        </linearGradient>
        <linearGradient id="gd-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
      </defs>
      {/* block */}
      <ellipse cx="32" cy="55" rx="22" ry="5" fill={P.woodDark} />
      <rect x="10" y="46" width="44" height="9" rx="3" fill="url(#gd-wood)" />
      <rect x="10" y="46" width="44" height="3" rx="1.5" fill={P.ivory} fillOpacity="0.2" />
      {/* gavel */}
      <g transform="rotate(-32 32 30)">
        <rect x="30" y="22" width="4.4" height="28" rx="2.2" fill="url(#gd-wood)" />
        <rect x="16" y="10" width="32" height="14" rx="3.5" fill="url(#gd-wood)" stroke={P.woodDark} strokeWidth="0.8" />
        <rect x="14" y="9" width="5" height="16" rx="1.5" fill="url(#gd-gold)" />
        <rect x="45" y="9" width="5" height="16" rx="1.5" fill="url(#gd-gold)" />
      </g>
      <g stroke={P.gold2} strokeWidth="1.6" strokeLinecap="round">
        <line x1="8" y1="40" x2="13" y2="42" />
        <line x1="6" y1="34" x2="12" y2="35" />
      </g>
    </svg>
  );
}
