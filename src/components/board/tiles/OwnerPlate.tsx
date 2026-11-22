// Shown instead of the price once a tile is bought: a larger rectangle filled with the owner's color, with the owner's
// picture once in the middle. It sits where the price was (outer edge), clear of the tile name. On the side tiles the
// content is rotated, so the picture is turned back to stay upright.
import CharacterToken from "@/components/room/CharacterToken";
import type { EdgeSide } from "./TileFrame";

export interface TileOwner {
  characterId: string | null;
  /** The owner's color (hex from the character manifest). */
  color: string;
  /** Accessible label, e.g. "Owned by Sara". */
  label: string;
}

export default function OwnerPlate({ owner, side }: { owner: TileOwner; side: EdgeSide }) {
  return (
    <span
      data-owner-plate=""
      role="img"
      aria-label={owner.label}
      className="owner-plate"
      style={{ backgroundColor: owner.color }}
    >
      <span className={`owner-plate-pic${side === "left" ? " rot-left" : side === "right" ? " rot-right" : ""}`}>
        <CharacterToken characterId={owner.characterId} size="fill" />
      </span>
    </span>
  );
}
