// Client-side mirror of the engine's building rules, used only to enable or disable the build buttons and to pick a
// hint. The server is still the authority: it re-checks everything.
import type { BuildKind, GameErrorCode, GameSnapshot } from "@/shared/events";
import { GROUPS, RULES, tileAt } from "@/shared/rent";

/** Returns the reason the player cannot build `kind` on the tile, or null when the server will accept it. */
export function buildCheck(game: GameSnapshot, playerId: string, tileIndex: number, kind: BuildKind): GameErrorCode | null {
  if (game.phase === "gameOver") return "WRONG_PHASE";
  const tile = tileAt(tileIndex);
  const prop = game.properties[tileIndex];
  if (tile.kind !== "property" || !prop || prop.ownerId !== playerId) return "NOT_OWNER";
  if (game.currentPlayerId !== playerId) return "NOT_YOUR_TURN";
  const group = GROUPS[tile.group!] ?? [];
  if (!group.every((i) => game.properties[i]?.ownerId === playerId)) return "SET_INCOMPLETE";
  const cash = game.players.find((p) => p.id === playerId)?.cash ?? 0;
  if (group.some((i) => game.properties[i]?.mortgaged)) return "GROUP_MORTGAGED";
  const levels = group.map((i) => game.properties[i]?.level ?? 0);
  if (kind === "house") {
    if (prop.level >= RULES.maxHouses) return "MAX_LEVEL";
    if (game.rules.evenBuild && prop.level > Math.min(...levels)) return "UNEVEN_BUILD";
    return cash < RULES.houseCost ? "INSUFFICIENT_FUNDS" : null;
  }
  if (prop.level >= 5) return "MAX_LEVEL";
  if (RULES.hotelRequiresFourHouses && prop.level < RULES.maxHouses) return "HOTEL_NEEDS_4_HOUSES";
  if (game.rules.evenBuild && Math.min(...levels) < RULES.maxHouses) return "UNEVEN_BUILD";
  return cash < RULES.hotelCost ? "INSUFFICIENT_FUNDS" : null;
}
