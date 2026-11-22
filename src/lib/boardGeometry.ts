// SVG geometry of the board ring (used by the loading animation): tile rects in a square viewBox.
import { ringCell, RING_SIZE } from "./boardGrid";

const CORNER_WEIGHT = 1.47;
const TOTAL_UNITS = 2 * CORNER_WEIGHT + 9;

export interface TileRect {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function tracks(size: number): number[] {
  const u = size / TOTAL_UNITS;
  const edges = [0];
  for (let i = 0; i < 11; i++) {
    const weight = i === 0 || i === 10 ? CORNER_WEIGHT : 1;
    edges.push(edges[i]! + weight * u);
  }
  return edges;
}

export function tileRects(size: number, gap = 0.8): TileRect[] {
  const e = tracks(size);
  return Array.from({ length: RING_SIZE }, (_, index) => {
    const { row, col } = ringCell(index);
    return {
      index,
      x: e[col - 1]! + gap / 2,
      y: e[row - 1]! + gap / 2,
      w: e[col]! - e[col - 1]! - gap,
      h: e[row]! - e[row - 1]! - gap,
    };
  });
}

/** Clockwise rectangular path through the middle of the ring, starting at the top-left corner. */
export function ringPath(size: number): string {
  const a = (CORNER_WEIGHT * size) / TOTAL_UNITS / 2;
  const b = size - a;
  return `M${a} ${a} H${b} V${b} H${a} Z`;
}
