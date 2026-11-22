"use client";
// Building markers drawn on a tile: an overlay outside the tile's rotated content, so the houses stay upright.
// They sit along the inner edge.
import type { CSSProperties } from "react";
import type { EdgeSide } from "@/components/board/tiles/TileFrame";

const MARK_POS: Record<EdgeSide, CSSProperties> = {
  top: { bottom: "3%", left: 0, right: 0, flexDirection: "row" },
  bottom: { top: "3%", left: 0, right: 0, flexDirection: "row" },
  left: { right: "3%", top: 0, bottom: 0, flexDirection: "column" },
  right: { left: "3%", top: 0, bottom: 0, flexDirection: "column" },
};

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-full drop-shadow-sm" aria-hidden="true">
      <path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" fill="var(--success)" stroke="var(--surface-raised)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg viewBox="0 0 32 24" className="size-full drop-shadow-sm" aria-hidden="true">
      <path d="M3 22V9l6-4 4 3 4-5 6 4 6-2v17z" fill="var(--accent-strong)" stroke="var(--surface-raised)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 12h3v3H9zm6 0h3v3h-3zm6 0h3v3h-3zM9 17h3v5H9zm12 0h3v5h-3z" fill="var(--surface-raised)" opacity="0.85" />
    </svg>
  );
}

/** Up to 4 small houses, or one gold hotel (level 5). */
export function BuildingMarkers({ side, level, label }: { side: EdgeSide; level: number; label: string }) {
  if (level <= 0) return null;
  const hotel = level >= 5;
  return (
    <span
      className="pointer-events-none absolute z-10 flex items-center justify-center gap-[0.2em]"
      data-buildings={hotel ? "hotel" : String(level)}
      role="img"
      aria-label={label}
      style={MARK_POS[side]}
    >
      {hotel ? (
        <span style={{ width: "calc(var(--b) * 0.022)", height: "calc(var(--b) * 0.017)" }}>
          <HotelIcon />
        </span>
      ) : (
        Array.from({ length: level }, (_, i) => (
          <span key={i} style={{ width: "calc(var(--b) * 0.0125)", height: "calc(var(--b) * 0.0125)" }}>
            <HouseIcon />
          </span>
        ))
      )}
    </span>
  );
}
