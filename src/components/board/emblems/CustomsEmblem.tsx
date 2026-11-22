// Customs duty: a wooden crate with a round seal stamp.
import { starPoints } from "../flags/shapes";
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function CustomsEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="cu-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.wood} />
          <stop offset="1" stopColor={P.woodDark} />
        </linearGradient>
        <linearGradient id="cu-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="46" height="42" rx="2.5" fill="url(#cu-wood)" stroke={P.woodDark} strokeWidth="1.2" />
      <g stroke={P.woodDark} strokeWidth="1" strokeOpacity="0.7">
        <line x1="6" y1="28" x2="52" y2="28" />
        <line x1="6" y1="42" x2="52" y2="42" />
      </g>
      <rect x="10" y="14" width="6" height="42" fill={P.woodDark} fillOpacity="0.5" />
      <rect x="42" y="14" width="6" height="42" fill={P.woodDark} fillOpacity="0.5" />
      <g stroke={P.woodDark} strokeWidth="2.4" strokeLinecap="round">
        <line x1="14" y1="19" x2="44" y2="51" />
        <line x1="44" y1="19" x2="14" y2="51" />
      </g>
      {[[10, 18], [48, 18], [10, 52], [48, 52]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="url(#cu-gold)" />
      ))}
      {/* seal stamp */}
      <circle cx="46" cy="44" r="12.5" fill={P.brick} stroke="url(#cu-gold)" strokeWidth="2.2" />
      <circle cx="46" cy="44" r="8.5" fill="none" stroke={P.gold1} strokeOpacity="0.7" strokeWidth="0.8" />
      <polygon points={starPoints(46, 44, 5.6, 2.4, 5)} fill={P.gold1} />
    </svg>
  );
}
