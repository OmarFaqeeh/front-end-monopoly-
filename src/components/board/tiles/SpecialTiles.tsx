// Harbor, utility, tax and card tiles: blurred emblem backdrop, tint glow, sharp emblem, name and chip.
import { emblemFor, glowToken } from "@/components/board/emblems";
import EmblemBackdrop from "@/components/board/EmblemBackdrop";
import { KIND_BACKDROP_STRENGTH, type TileData } from "@/config/boardLayout";
import { formatMoney } from "@/lib/money";
import OwnerPlate, { type TileOwner } from "./OwnerPlate";
import TileFrame, { type EdgeSide } from "./TileFrame";
import { nameStyle } from "./nameFit";

const SCRIM =
  "radial-gradient(ellipse 80% 48% at 50% 22%, color-mix(in srgb, var(--surface-raised) 55%, transparent) 0%, transparent 100%)";

function EmblemTile({ tile, side, name, owner }: { tile: TileData; side: EdgeSide; name: string; owner?: TileOwner }) {
  const emblem = emblemFor(tile);
  if (!emblem) return null;
  const glow = `radial-gradient(circle at 50% 58%, color-mix(in srgb, var(${glowToken(tile)}) 35%, transparent) 0%, transparent 62%)`;
  const amount = tile.price ?? tile.amount;
  const fit = nameStyle(name);

  return (
    <TileFrame
      side={side}
      cellClassName="tile-surface"
      className="is-flat"
      style={{ backgroundImage: `${SCRIM}, ${glow}` }}
      backdrop={<EmblemBackdrop emblem={emblem} side={side} strength={KIND_BACKDROP_STRENGTH[tile.kind] ?? 1} />}
    >
      <div className="flex shrink-0 flex-col items-center px-[4cqw] pt-[6cqw]">
        <span className={`pt-name ${fit.className}`} style={fit.style}>
          {name}
        </span>
        {/* Harbors and utilities: once bought, the owner's plate replaces the price. */}
        {owner ? (
          <OwnerPlate owner={owner} side={side} />
        ) : (
          amount != null && <span className="pt-chip pt-chip-tight">{formatMoney(amount, { suffix: true })}</span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <span className="block" style={{ width: owner ? "44cqw" : "60cqw", height: owner ? "44cqw" : "60cqw" }}>
          {emblem}
        </span>
      </div>
    </TileFrame>
  );
}

export const HarborTile = EmblemTile;
export const UtilityTile = EmblemTile;
export const TaxTile = EmblemTile;
export const CardTile = EmblemTile;
