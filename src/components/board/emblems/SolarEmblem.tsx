// Solar grid: a gold sun rising over a tilted solar panel grid.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function SolarEmblem() {
  const rays = Array.from({ length: 9 }, (_, i) => Math.PI + (i * Math.PI) / 8);
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="sl-sun" cx="0.5" cy="0.6" r="0.7">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="0.6" stopColor={P.gold2} />
          <stop offset="1" stopColor={P.gold3} />
        </radialGradient>
        <linearGradient id="sl-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.teal} />
          <stop offset="1" stopColor={P.waterDeep} />
        </linearGradient>
      </defs>
      <g stroke={P.gold2} strokeWidth="2.2" strokeLinecap="round">
        {rays.map((a, i) => (
          <line key={i} x1={32 + 15 * Math.cos(a)} y1={34 + 15 * Math.sin(a)} x2={32 + 21 * Math.cos(a)} y2={34 + 21 * Math.sin(a)} />
        ))}
      </g>
      <path d="M17 34 A15 15 0 0 1 47 34 Z" fill="url(#sl-sun)" />
      <polygon points="6,58 58,58 50,38 14,38" fill="url(#sl-panel)" stroke={P.gold2} strokeWidth="1.2" strokeLinejoin="round" />
      <g stroke={P.ivory} strokeOpacity="0.55" strokeWidth="0.8">
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={`v${t}`} x1={14 - 8 * t + 0} y1={38 + 20 * t} x2={50 + 8 * t} y2={38 + 20 * t} />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <line key={`h${t}`} x1={14 + 36 * t} y1="38" x2={6 + 52 * t} y2="58" />
        ))}
      </g>
      <line x1="32" y1="58" x2="32" y2="62" stroke={P.gold3} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
