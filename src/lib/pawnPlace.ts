// Pure placement of pawns over the board: where a tile's center is (percent of the board grid) and where each of
// several pawns standing on the same tile sits, using the same tokenLayout rule as everywhere else.
import { ringCell } from "./boardGrid";
import { splitRows, tokenLayout } from "./tokenSize";

/** Grid tracks of the board: corner, 9 tiles, corner (see components/board/Board.tsx). */
const TRACKS = [1.47, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.47];
const TOTAL = TRACKS.reduce((a, b) => a + b, 0);
/** One normal tile as a percentage of the grid side. */
export const TILE_UNIT = 100 / TOTAL;

const starts = TRACKS.map((_, i) => TRACKS.slice(0, i).reduce((a, b) => a + b, 0));

/** Center of a tile as percentages of the grid (x from the left, y from the top). */
export function tileCenter(index: number): { x: number; y: number } {
  const { row, col } = ringCell(index);
  const cx = starts[col - 1]! + TRACKS[col - 1]! / 2;
  const cy = starts[row - 1]! + TRACKS[row - 1]! / 2;
  return { x: (cx / TOTAL) * 100, y: (cy / TOTAL) * 100 };
}

export interface PawnSlot {
  x: number;
  y: number;
  /** Pawn diameter as a percentage of the grid side. */
  size: number;
}

/** Slots for `count` pawns on one tile (index 0 = first seat). Single pawn: the tile center. */
export function pawnSlots(tile: number, count: number): PawnSlot[] {
  const c = tileCenter(tile);
  const { sizePct, rows, overlapPct } = tokenLayout(count);
  const size = TILE_UNIT * 0.72 * (sizePct / 100);
  const lines = splitRows(Array.from({ length: count }, (_, i) => i), rows);
  const out: PawnSlot[] = [];
  lines.forEach((line, r) => {
    line.forEach((seat, i) => {
      const step = size * (1 - overlapPct / 100);
      out[seat] = {
        x: c.x + (i - (line.length - 1) / 2) * step,
        y: c.y + (r - (lines.length - 1) / 2) * size * 0.92,
        size,
      };
    });
  });
  return out;
}

/** Number of ring steps between two tiles going forward (0 to 39). */
export function ringDistance(from: number, to: number): number {
  return (((to - from) % 40) + 40) % 40;
}
