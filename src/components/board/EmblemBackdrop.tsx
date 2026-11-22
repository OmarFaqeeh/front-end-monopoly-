// Blurred, semi-transparent copy of a tile emblem behind its content (same technique as FlagBackdrop).
import type { CSSProperties, ReactNode } from "react";
import type { EdgeSide } from "./tiles/TileFrame";

const TOWARD_INNER: Record<EdgeSide, string> = {
  top: "to bottom",
  bottom: "to top",
  left: "to right",
  right: "to left",
};

export default function EmblemBackdrop({
  emblem,
  side,
  dir,
  strength = 1,
}: {
  emblem: ReactNode;
  side?: EdgeSide;
  /** Explicit fade direction (corners). */
  dir?: string;
  strength?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="flag-backdrop"
      style={
        {
          ["--outer-dir" as string]: dir ?? (side ? TOWARD_INNER[side] : "to bottom"),
          ["--flag-strength" as string]: strength,
        } as CSSProperties
      }
    >
      {emblem}
    </div>
  );
}
