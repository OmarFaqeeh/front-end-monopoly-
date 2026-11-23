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

/** A little house: red roof with a chimney, cream walls, a door and two windows. */
export function HouseIcon() {
  return (
    <svg viewBox="0 0 32 30" className="size-full" aria-hidden="true">
      <rect x="22" y="3" width="4" height="9" fill="#8a4b2d" stroke="#2b1b10" strokeWidth="1" />
      <rect x="5" y="13" width="22" height="15" fill="#f6e6c4" stroke="#2b1b10" strokeWidth="1.2" />
      <path d="M2 14.5 16 3l14 11.5z" fill="#c8402f" stroke="#2b1b10" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="13.5" y="19" width="5" height="9" rx="0.6" fill="#7a4a21" stroke="#2b1b10" strokeWidth="0.8" />
      <rect x="7" y="16.5" width="4.5" height="4.5" fill="#8ecae6" stroke="#2b1b10" strokeWidth="0.8" />
      <rect x="20.5" y="16.5" width="4.5" height="4.5" fill="#8ecae6" stroke="#2b1b10" strokeWidth="0.8" />
    </svg>
  );
}

/** A hotel: a tall building with a banner, rows of windows, a canopy and the entrance. */
export function HotelIcon() {
  return (
    <svg viewBox="0 0 32 36" className="size-full" aria-hidden="true">
      <path d="M16 1v6" stroke="#2b1b10" strokeWidth="1.1" />
      <path d="M16 1.5h7l-2 2 2 2h-7z" fill="#e0a526" stroke="#2b1b10" strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="5" y="7" width="22" height="27" fill="#e9c46a" stroke="#2b1b10" strokeWidth="1.2" />
      <rect x="3" y="5.5" width="26" height="3.5" fill="#8c2f39" stroke="#2b1b10" strokeWidth="1" />
      <g fill="#8ecae6" stroke="#2b1b10" strokeWidth="0.7">
        <rect x="8" y="11.5" width="4" height="4" />
        <rect x="14" y="11.5" width="4" height="4" />
        <rect x="20" y="11.5" width="4" height="4" />
        <rect x="8" y="17.5" width="4" height="4" />
        <rect x="14" y="17.5" width="4" height="4" />
        <rect x="20" y="17.5" width="4" height="4" />
      </g>
      <rect x="11.5" y="25" width="9" height="9" rx="0.8" fill="#7a4a21" stroke="#2b1b10" strokeWidth="0.9" />
      <rect x="9.5" y="23" width="13" height="2.4" fill="#8c2f39" stroke="#2b1b10" strokeWidth="0.8" />
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
