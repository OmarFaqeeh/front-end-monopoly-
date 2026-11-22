// Pure helpers mapping a ring index (0 to 39, clockwise from the top-left corner) to the 11x11 grid.
export const RING_SIZE = 40;
export const GRID_SIZE = 11;
export const CORNER_INDEXES = [0, 10, 20, 30] as const;

export type TileSide = "corner" | "top" | "right" | "bottom" | "left";
export interface GridCell {
  /** 1-based grid row. */
  row: number;
  /** 1-based grid column. */
  col: number;
}

function assertIndex(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= RING_SIZE) {
    throw new RangeError(`Tile index out of range: ${index}`);
  }
}

/** 0..10 top row (left to right), 11..19 right column, 20..30 bottom row (right to left), 31..39 left column (bottom to top). */
export function ringCell(index: number): GridCell {
  assertIndex(index);
  if (index <= 10) return { row: 1, col: index + 1 };
  if (index <= 19) return { row: index - 9, col: 11 };
  if (index <= 30) return { row: 11, col: 11 - (index - 20) };
  return { row: 11 - (index - 30), col: 1 };
}

export function isCorner(index: number): boolean {
  assertIndex(index);
  return (CORNER_INDEXES as readonly number[]).includes(index);
}

export function tileSide(index: number): TileSide {
  assertIndex(index);
  if (isCorner(index)) return "corner";
  if (index < 10) return "top";
  if (index < 20) return "right";
  if (index < 30) return "bottom";
  return "left";
}
