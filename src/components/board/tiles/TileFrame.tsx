// Shared frame for non-corner tiles. Content is laid out as a portrait tile (outer edge first);
// left and right column tiles rotate it, bottom row tiles reverse it so the text stays upright.
import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

export type EdgeSide = "top" | "right" | "bottom" | "left";

export default function TileFrame({
  side,
  className,
  style,
  cellClassName,
  backdrop,
  children,
}: {
  side: EdgeSide;
  className?: string;
  style?: CSSProperties;
  /** Extra classes on the grid cell (outside the rotated portrait box). */
  cellClassName?: string;
  /** Rendered in the cell, behind the content, and never rotated. */
  backdrop?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={clsx("tile-cell size-full", cellClassName)}>
      {backdrop}
      <div
        className={clsx(
          "tile-portrait",
          side === "bottom" && "is-bottom",
          side === "left" && "is-rot-left",
          side === "right" && "is-rot-right",
          className,
        )}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}

/** Price/amount chip at the outer edge of a tile. */
export function PriceChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="mx-auto mt-[7cqw] shrink-0 rounded-[0.5em] bg-surface-sunken px-[0.6em] py-[0.15em] font-bold text-ink-muted"
      style={{ fontSize: "calc(var(--b) * 0.0105)" }}
    >
      {children}
    </span>
  );
}

/** Tile name, centered, up to two lines. */
export function TileName({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx("line-clamp-2 px-[6cqw] text-center leading-[1.15] font-semibold text-ink", className)}
      style={{ fontSize: "calc(var(--b) * 0.0125)" }}
    >
      {children}
    </span>
  );
}
