// Pure board and rent helpers driven by board.json and rules.json (the single source of truth for back and front).
import board from "./board.json" with { type: "json" };
import rules from "./rules.json" with { type: "json" };
import type { BoardTile } from "./events.js";

export const BOARD: readonly BoardTile[] = board as unknown as BoardTile[];
export const RULES = rules;

export const GROUPS: Record<number, number[]> = (() => {
  const out: Record<number, number[]> = {};
  for (const t of BOARD) if (t.kind === "property" && t.group != null) (out[t.group] ??= []).push(t.index);
  return out;
})();

export const HARBOR_TILES: number[] = BOARD.filter((t) => t.kind === "harbor").map((t) => t.index);
export const UTILITY_TILES: number[] = BOARD.filter((t) => t.kind === "utility").map((t) => t.index);

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** price x 0.10 rounded to the nearest even number. */
export function baseRent(price: number): number {
  return roundTo(price * RULES.baseRentFactor, 2);
}

/** Base rent, then 1 to 4 houses and a hotel (6 values; index = building level). */
export function rentLevels(price: number): [number, number, number, number, number, number] {
  const rest = RULES.rentMultipliers.map((f) => roundTo(price * f, RULES.rentRounding));
  return [baseRent(price), rest[0]!, rest[1]!, rest[2]!, rest[3]!, rest[4]!];
}

export function propertyRent(price: number, level: number): number {
  return rentLevels(price)[Math.min(Math.max(level, 0), 5)]!;
}

export function harborRent(owned: number): number {
  return RULES.harborRents[Math.min(Math.max(owned, 1), RULES.harborRents.length) - 1]!;
}

export function utilityRent(diceTotal: number, owned: number): number {
  return diceTotal * RULES.utilityMultipliers[Math.min(Math.max(owned, 1), RULES.utilityMultipliers.length) - 1]!;
}

export function tileAt(index: number): BoardTile {
  const tile = BOARD[index];
  if (!tile) throw new RangeError(`Unknown tile: ${index}`);
  return tile;
}

/** Cash a mortgage pays out: half the price, rounded down. */
export const mortgageValue = (price: number): number => Math.floor(price / 2);
/** Cost to lift a mortgage: half the price plus 10 %, rounded up (integer math). */
export const unmortgageCost = (price: number): number => Math.ceil((price * 11) / 20);

export const isBuyable = (tile: BoardTile): boolean => tile.kind === "property" || tile.kind === "harbor" || tile.kind === "utility";
