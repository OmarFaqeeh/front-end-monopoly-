// Vault: round vault door in brushed green metal, gold rim, gold spoked wheel, four bolts.
import { EMBLEM_VIEWBOX, P } from "./palette";

export default function VaultEmblem() {
  const bolts = [45, 135, 225, 315].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [32 + 19 * Math.cos(a), 32 + 19 * Math.sin(a)] as const;
  });
  const spokes = Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3);
  return (
    <svg viewBox={EMBLEM_VIEWBOX} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="vt-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.gold1} />
          <stop offset="0.55" stopColor={P.gold2} />
          <stop offset="1" stopColor={P.gold3} />
        </linearGradient>
        <radialGradient id="vt-door" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={P.greenLight} />
          <stop offset="0.5" stopColor={P.greenMid} />
          <stop offset="1" stopColor={P.greenDeep} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#vt-rim)" />
      <circle cx="32" cy="32" r="25" fill="url(#vt-door)" />
      {[21, 17, 13].map((r) => (
        <circle key={r} cx="32" cy="32" r={r} fill="none" stroke={P.ivory} strokeOpacity="0.1" strokeWidth="0.6" />
      ))}
      {bolts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="url(#vt-rim)" stroke={P.goldDark} strokeWidth="0.4" />
      ))}
      <g stroke="url(#vt-rim)" strokeLinecap="round">
        {spokes.map((a, i) => (
          <line key={i} x1={32 + 5 * Math.cos(a)} y1={32 + 5 * Math.sin(a)} x2={32 + 15 * Math.cos(a)} y2={32 + 15 * Math.sin(a)} strokeWidth="2.2" />
        ))}
        <circle cx="32" cy="32" r="10" fill="none" strokeWidth="2.4" />
      </g>
      {spokes.map((a, i) => (
        <circle key={i} cx={32 + 15.5 * Math.cos(a)} cy={32 + 15.5 * Math.sin(a)} r="1.7" fill="url(#vt-rim)" />
      ))}
      <circle cx="32" cy="32" r="4" fill="url(#vt-rim)" stroke={P.goldDark} strokeWidth="0.5" />
    </svg>
  );
}
