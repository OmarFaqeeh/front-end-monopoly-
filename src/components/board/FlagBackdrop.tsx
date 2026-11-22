// Soft, blurred, semi-transparent flag behind a property tile (one extra DOM layer, static blur).
// Lives in the grid cell, outside the rotated content box, so it is never rotated or mirrored.
import type { CSSProperties } from "react";
import type { FlagCode } from "@/config/boardLayout";
import type { EdgeSide } from "./tiles/TileFrame";
import { FLAGS } from "./flags";

/** Direction pointing from the OUTER edge of the tile toward its inner edge (mask fades along it). */
const FADE_TOWARD_INNER: Record<EdgeSide, string> = {
  top: "to bottom",
  bottom: "to top",
  left: "to right",
  right: "to left",
};

export default function FlagBackdrop({
  flag,
  side,
  strength = 1,
}: {
  flag: FlagCode;
  side: EdgeSide;
  strength?: number;
}) {
  const Flag = FLAGS[flag];
  return (
    <div
      aria-hidden="true"
      className="flag-backdrop"
      style={{ ["--outer-dir" as string]: FADE_TOWARD_INNER[side], ["--flag-strength" as string]: strength } as CSSProperties}
    >
      <Flag />
    </div>
  );
}
