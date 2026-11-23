// Shown instead of the price once a tile is bought: a larger rectangle filled with the owner's color, with the owner's
// picture once in the middle. It sits where the price was (outer edge), clear of the tile name. On the side tiles the
// content is rotated, so the picture is turned back to stay upright.
// Buildings are shown on the same plate, big and clear: one house with its count ("3×"), or one hotel.
import CharacterToken from "@/components/room/CharacterToken";
import { HotelIcon, HouseIcon } from "@/components/game/TileMarks";
import type { EdgeSide } from "./TileFrame";

export interface TileOwner {
  characterId: string | null;
  /** The owner's color (hex from the character manifest). */
  color: string;
  /** Accessible label, e.g. "Owned by Sara". */
  label: string;
  /** Building level on the tile: 0 none, 1-4 houses, 5 hotel. */
  level?: number;
  /** Accessible label of the buildings, e.g. "2 houses" or "Hotel". */
  buildLabel?: string;
}

export default function OwnerPlate({ owner, side }: { owner: TileOwner; side: EdgeSide }) {
  const rot = side === "left" ? " rot-left" : side === "right" ? " rot-right" : "";
  const level = owner.level ?? 0;
  const hotel = level >= 5;
  return (
    <span
      data-owner-plate=""
      role="img"
      aria-label={level > 0 && owner.buildLabel ? `${owner.label}, ${owner.buildLabel}` : owner.label}
      className={`owner-plate${level > 0 ? " has-building" : ""}`}
      style={{ backgroundColor: owner.color }}
    >
      <span className={`owner-plate-pic${rot}`}>
        <CharacterToken characterId={owner.characterId} size="fill" />
      </span>
      {level > 0 && (
        <span className={`owner-build${rot}${hotel ? " is-hotel" : ""}`} data-buildings={hotel ? "hotel" : String(level)}>
          <span className="owner-build-icon">{hotel ? <HotelIcon /> : <HouseIcon />}</span>
          {!hotel && level > 1 && <span className="owner-build-count">{level}×</span>}
        </span>
      )}
    </span>
  );
}
