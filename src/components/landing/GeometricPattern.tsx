// Original, very faint eight-pointed-star lattice (inline SVG pattern) with edges faded by a mask.
const TILE = 72;

/** Points of an eight-pointed star centered on (cx, cy). */
function star(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 16 }, (_, k) => {
    const a = ((k * 22.5 - 90) * Math.PI) / 180;
    const r = k % 2 === 0 ? outer : inner;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

const FADE = "radial-gradient(ellipse at center, black 25%, transparent 75%)";

export default function GeometricPattern({ id, className }: { id: string; className?: string }) {
  const pid = `star-lattice-${id}`;
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 size-full text-ink opacity-[0.05] ${className ?? ""}`}
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <defs>
        <pattern id={pid} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <polygon points={star(TILE / 2, TILE / 2, 20, 9)} />
            <polygon points={star(0, 0, 20, 9)} />
            <polygon points={star(TILE, 0, 20, 9)} />
            <polygon points={star(0, TILE, 20, 9)} />
            <polygon points={star(TILE, TILE, 20, 9)} />
            <line x1="20" y1="20" x2="26" y2="26" />
            <line x1="52" y1="20" x2="46" y2="26" />
            <line x1="20" y1="52" x2="26" y2="46" />
            <line x1="52" y1="52" x2="46" y2="46" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}
