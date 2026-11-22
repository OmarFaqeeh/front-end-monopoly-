import { describe, expect, it } from "vitest";
import { isCorner, ringCell, RING_SIZE, tileSide } from "@/lib/boardGrid";

describe("boardGrid", () => {
  it("maps all 40 indices to unique cells on the outer ring of the 11x11 grid", () => {
    const seen = new Set<string>();
    for (let i = 0; i < RING_SIZE; i++) {
      const { row, col } = ringCell(i);
      expect(row).toBeGreaterThanOrEqual(1);
      expect(row).toBeLessThanOrEqual(11);
      expect(col).toBeGreaterThanOrEqual(1);
      expect(col).toBeLessThanOrEqual(11);
      expect(row === 1 || row === 11 || col === 1 || col === 11).toBe(true);
      seen.add(`${row},${col}`);
    }
    expect(seen.size).toBe(40);
  });

  it("puts the corners in the right cells", () => {
    expect(ringCell(0)).toEqual({ row: 1, col: 1 });
    expect(ringCell(10)).toEqual({ row: 1, col: 11 });
    expect(ringCell(20)).toEqual({ row: 11, col: 11 });
    expect(ringCell(30)).toEqual({ row: 11, col: 1 });
  });

  it("runs clockwise: right column top to bottom, bottom row right to left, left column bottom to top", () => {
    expect(ringCell(11)).toEqual({ row: 2, col: 11 });
    expect(ringCell(19)).toEqual({ row: 10, col: 11 });
    expect(ringCell(21)).toEqual({ row: 11, col: 10 });
    expect(ringCell(29)).toEqual({ row: 11, col: 2 });
    expect(ringCell(31)).toEqual({ row: 10, col: 1 });
    expect(ringCell(39)).toEqual({ row: 2, col: 1 });
  });

  it("classifies sides and corners", () => {
    expect([0, 10, 20, 30].every(isCorner)).toBe(true);
    expect(tileSide(5)).toBe("top");
    expect(tileSide(15)).toBe("right");
    expect(tileSide(25)).toBe("bottom");
    expect(tileSide(35)).toBe("left");
    expect(tileSide(0)).toBe("corner");
  });

  it("rejects invalid indices", () => {
    expect(() => ringCell(-1)).toThrow(RangeError);
    expect(() => ringCell(40)).toThrow(RangeError);
    expect(() => ringCell(1.5)).toThrow(RangeError);
  });
});
