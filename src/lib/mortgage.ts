// Client-side mirror of the mortgage rules (which tiles can be mortgaged and whether a build/mortgage button is enabled).
// The server re-checks everything.
import type { GameErrorCode, GameSnapshot } from "@/shared/events";
import { GROUPS, mortgageValue, tileAt, unmortgageCost } from "@/shared/rent";

/** Tiles the player could mortgage: owned, not mortgaged, no buildings on the tile or anywhere in its group. */
export function mortgageableTiles(game: GameSnapshot, ownerId: string): number[] {
  const out: number[] = [];
  for (const [k, prop] of Object.entries(game.properties)) {
    const i = Number(k);
    if (prop.ownerId !== ownerId || prop.mortgaged || prop.level > 0) continue;
    const tile = tileAt(i);
    if (tile.kind === "property" && (GROUPS[tile.group!] ?? []).some((j) => (game.properties[j]?.level ?? 0) > 0)) continue;
    out.push(i);
  }
  return out;
}

const PHASES = ["awaitingRoll", "awaitingDecision", "awaitingJailChoice", "raisingFunds"];

/** Why the player cannot mortgage (or unmortgage) this tile right now, or null when the server will accept it. */
export function mortgageCheck(game: GameSnapshot, playerId: string, tileIndex: number, action: "mortgage" | "unmortgage"): GameErrorCode | null {
  if (!game.rules.mortgage) return "MORTGAGE_DISABLED";
  if (game.phase === "gameOver") return "WRONG_PHASE";
  const prop = game.properties[tileIndex];
  if (!prop || prop.ownerId !== playerId) return "NOT_OWNER";
  if (game.currentPlayerId !== playerId) return "NOT_YOUR_TURN";
  if (!PHASES.includes(game.phase)) return "WRONG_PHASE";
  const cash = game.players.find((p) => p.id === playerId)?.cash ?? 0;
  if (action === "mortgage") return prop.mortgaged || !mortgageableTiles(game, playerId).includes(tileIndex) ? "NOT_MORTGAGEABLE" : null;
  if (!prop.mortgaged) return "NOT_MORTGAGED";
  return cash < unmortgageCost(tileAt(tileIndex).price!) ? "INSUFFICIENT_FUNDS" : null;
}

export { mortgageValue, unmortgageCost };
