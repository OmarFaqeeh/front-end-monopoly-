// Tile info: which translation keys describe each tile. Text lives in messages (board.info.tNN).
import { BOARD_LAYOUT, type FlagCode, type TileKind } from "./boardLayout";

export interface TileInfo {
  index: number;
  kind: TileKind;
  /** Translation key of the description (board.info.tNN). */
  descKey: string;
  /** Translation key of the country name (properties only). */
  countryKey?: string;
}

export const COUNTRY_KEY = (flag: FlagCode) => `board.countries.${flag}`;

export const TILE_INFO: readonly TileInfo[] = BOARD_LAYOUT.map((t) => ({
  index: t.index,
  kind: t.kind,
  descKey: `board.info.t${String(t.index).padStart(2, "0")}`,
  countryKey: t.flag ? COUNTRY_KEY(t.flag) : undefined,
}));

export function tileInfo(index: number): TileInfo {
  const info = TILE_INFO[index];
  if (!info) throw new RangeError(`Unknown tile: ${index}`);
  return info;
}
