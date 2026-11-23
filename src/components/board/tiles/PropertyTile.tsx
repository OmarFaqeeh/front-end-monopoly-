// Property tile. Layers, back to front: surface, blurred flag backdrop, legibility scrim (background of
// the content box), then price chip (outer edge), name, sharp flag badge and the group color strip (inner edge).
import FlagBackdrop from "@/components/board/FlagBackdrop";
import type { TileData } from "@/config/boardLayout";
import { formatMoney } from "@/lib/money";
import { nameStyle } from "./nameFit";
import OwnerPlate, { type TileOwner } from "./OwnerPlate";
import TileFrame, { type EdgeSide } from "./TileFrame";

const SCRIM =
  "radial-gradient(ellipse 80% 55% at 50% 46%, color-mix(in srgb, var(--surface-raised) 55%, transparent) 0%, transparent 100%)";

/** owner: once the tile is bought the price is replaced by a plate in the owner's color with their picture. */
export default function PropertyTile({ tile, side, name, owner }: { tile: TileData; side: EdgeSide; name: string; owner?: TileOwner }) {
  const fit = nameStyle(name);

  return (
    <TileFrame
      side={side}
      cellClassName="tile-surface"
      className="is-flat"
      style={{ backgroundImage: SCRIM }}
      backdrop={tile.flag ? <FlagBackdrop flag={tile.flag} side={side} strength={tile.backdropStrength} /> : null}
    >
      {owner ? (
        <OwnerPlate owner={owner} side={side} />
      ) : (
        <span className="pt-chip">{formatMoney(tile.price ?? 0, { suffix: true })}</span>
      )}

      <div className="flex min-h-0 flex-1 items-center justify-center px-[4cqw]">
        <span className={`pt-name ${fit.className}`} style={fit.style}>
          {name}
        </span>
      </div>

      <div className="shrink-0" style={{ height: "6cqw", backgroundColor: `var(--group-${tile.group})` }} />
    </TileFrame>
  );
}
