// Desalination plant: a water drop over a wave, two small pipes and a gauge.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function DesalinationEmblem() {
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="ds-drop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.tealLight} />
          <stop offset="1" stopColor={P.teal} />
        </linearGradient>
        <linearGradient id="ds-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
      </defs>
      {/* pipes */}
      <rect x="6" y="30" width="7" height="24" rx="1.5" fill={P.greenMid} />
      <rect x="4.5" y="28" width="10" height="4" rx="1" fill="url(#ds-gold)" />
      <rect x="51" y="38" width="7" height="16" rx="1.5" fill={P.greenMid} />
      <rect x="49.5" y="36" width="10" height="4" rx="1" fill="url(#ds-gold)" />
      {/* drop */}
      <path d="M32 7 C32 7 18 23 18 33 A14 14 0 0 0 46 33 C46 23 32 7 32 7 Z" fill="url(#ds-drop)" stroke={P.ivory} strokeOpacity="0.5" strokeWidth="0.8" />
      <path d="M25 31 Q25 38 30 40" fill="none" stroke={P.ivory} strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      {/* gauge */}
      <circle cx="52" cy="22" r="8" fill={P.ivory} stroke="url(#ds-gold)" strokeWidth="2" />
      <path d="M46.5 25 A6 6 0 0 1 57.5 25" fill="none" stroke={P.ivoryShade} strokeWidth="1.2" />
      <line x1="52" y1="22" x2="55.5" y2="18.5" stroke={P.brick} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="52" cy="22" r="1.3" fill={P.ink} />
      {/* wave */}
      <path d="M0 50 Q8 45 16 50 T32 50 T48 50 T64 50 V64 H0 Z" fill={P.water} fillOpacity="0.9" />
      <path d="M0 56 Q8 51 16 56 T32 56 T48 56 T64 56 V64 H0 Z" fill={P.teal} />
    </svg>
  );
}
