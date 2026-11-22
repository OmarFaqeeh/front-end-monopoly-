// Oasis: a palm tree beside a small spring.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function OasisEmblem() {
  const fronds = [-150, -115, -80, -45, -10, 25].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const x = 28 + 20 * Math.cos(a);
    const y = 18 + 14 * Math.sin(a) + 6;
    return `M28 18 Q${(28 + x) / 2} ${Math.min(18, y) - 8} ${x} ${y}`;
  });
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="os-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.greenLight} />
          <stop offset="1" stopColor={P.green} />
        </linearGradient>
        <linearGradient id="os-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.wood} />
          <stop offset="1" stopColor={P.woodDark} />
        </linearGradient>
        <linearGradient id="os-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="1" stopColor={P.gold2} />
        </linearGradient>
      </defs>
      <path d="M0 52 Q20 44 36 50 T64 48 V64 H0 Z" fill="url(#os-sand)" />
      <path d="M26 54 Q30 40 28 20 L31 20 Q33 40 30 54 Z" fill="url(#os-trunk)" />
      <g fill="none" stroke="url(#os-leaf)" strokeWidth="4.2" strokeLinecap="round">
        {fronds.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <circle cx="26.5" cy="21" r="2" fill={P.woodDark} />
      <circle cx="30.5" cy="21.5" r="2" fill={P.woodDark} />
      {/* spring */}
      <ellipse cx="47" cy="53" rx="12" ry="4.6" fill={P.tealLight} />
      <ellipse cx="47" cy="53" rx="12" ry="4.6" fill="none" stroke={P.teal} strokeWidth="1" />
      <ellipse cx="47" cy="53" rx="6" ry="2" fill="none" stroke={P.ivory} strokeOpacity="0.7" strokeWidth="0.8" />
    </svg>
  );
}
