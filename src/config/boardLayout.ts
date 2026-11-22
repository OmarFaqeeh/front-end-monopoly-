// Board layout for the UI. Kind, group, price and tax amount come from the shared board.json (the single source of
// truth with the back-end); this file only adds presentation: flag per group, icon, backdrop strength, translation keys.
import type { TileKind } from "@/shared/events";
import { BOARD } from "@/shared/rent";

export type { TileKind } from "@/shared/events";

export type FlagCode = "AR" | "JO" | "EG" | "TR" | "ES" | "JP" | "MA" | "AE";
export type TileIcon = "sun" | "droplets" | "landmark" | "stamp";

export interface TileData {
  index: number;
  kind: TileKind;
  nameKey: string;
  /** Color group 1 to 8 (properties only). */
  group?: number;
  flag?: FlagCode;
  price?: number;
  /** Tax amount. */
  amount?: number;
  icon?: TileIcon;
  /** Multiplier for the blurred flag backdrop (properties only). */
  backdropStrength?: number;
}

const key = (i: number) => `board.tiles.t${String(i).padStart(2, "0")}`;

/**
 * Per-flag backdrop strength (1 = default opacity 0.30 light / 0.38 dark). Lower a value only if
 * name/price text drops under 4.5:1 on that flag. Checked for all 8 flags in both themes: worst case
 * with the legibility scrim is 7.46:1, so every flag stays at 1.
 */
export const FLAG_BACKDROP_STRENGTH: Record<FlagCode, number> = {
  AR: 1,
  JO: 1,
  EG: 1,
  TR: 1,
  ES: 1,
  JP: 1,
  MA: 1,
  AE: 1,
};

/** Optional backdrop strength per tile kind (emblem tiles). 1 = opacity 0.30 light / 0.38 dark. */
export const KIND_BACKDROP_STRENGTH: Partial<Record<TileKind, number>> = {
  vault: 1,
  fortune: 1,
  harbor: 1,
  utility: 1,
  tax: 1,
  start: 1,
  detention: 1,
  goToDetention: 1,
  oasis: 1,
};

/** Country flag of each color group 1..8. */
const GROUP_FLAG: Record<number, FlagCode> = { 1: "JO", 2: "AR", 3: "EG", 4: "TR", 5: "ES", 6: "JP", 7: "MA", 8: "AE" };
const TILE_ICON: Record<number, TileIcon> = { 4: "landmark", 12: "sun", 28: "droplets", 38: "stamp" };

export const BOARD_LAYOUT: readonly TileData[] = BOARD.map((b) => {
  const flag = b.group != null ? GROUP_FLAG[b.group] : undefined;
  const icon = TILE_ICON[b.index];
  return {
    index: b.index,
    kind: b.kind,
    nameKey: key(b.index),
    ...(b.group != null && { group: b.group }),
    ...(flag && { flag, backdropStrength: FLAG_BACKDROP_STRENGTH[flag] }),
    ...(b.price != null && { price: b.price }),
    ...(b.amount != null && { amount: b.amount }),
    ...(icon && { icon }),
  };
});
