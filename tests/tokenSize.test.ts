import { describe, expect, it } from "vitest";
import { splitRows, tokenLayout } from "@/lib/tokenSize";

describe("tokenLayout", () => {
  it("returns the table values for 1 to 8", () => {
    expect(tokenLayout(1)).toEqual({ sizePct: 100, rows: 1, overlapPct: 0 });
    expect(tokenLayout(2)).toEqual({ sizePct: 78, rows: 1, overlapPct: 6 });
    expect(tokenLayout(3)).toEqual({ sizePct: 64, rows: 1, overlapPct: 14 });
    expect(tokenLayout(4)).toEqual({ sizePct: 56, rows: 1, overlapPct: 18 });
    expect(tokenLayout(5)).toEqual({ sizePct: 46, rows: 2, overlapPct: 12 });
    expect(tokenLayout(6)).toEqual({ sizePct: 46, rows: 2, overlapPct: 12 });
    expect(tokenLayout(7)).toEqual({ sizePct: 40, rows: 2, overlapPct: 16 });
    expect(tokenLayout(8)).toEqual({ sizePct: 40, rows: 2, overlapPct: 16 });
  });

  it("never increases the size as the count grows", () => {
    let prev = Infinity;
    for (let n = 1; n <= 12; n++) {
      const { sizePct } = tokenLayout(n);
      expect(sizePct).toBeLessThanOrEqual(prev);
      prev = sizePct;
    }
  });

  it("reuses the 7 to 8 row above 8 and the single-token row at 0", () => {
    expect(tokenLayout(9)).toEqual(tokenLayout(8));
    expect(tokenLayout(20)).toEqual(tokenLayout(7));
    expect(tokenLayout(0)).toEqual(tokenLayout(1));
  });

  it("fits every row inside the zone (rows x size <= 100%)", () => {
    for (let n = 1; n <= 8; n++) {
      const { rows, sizePct } = tokenLayout(n);
      expect(rows * sizePct).toBeLessThanOrEqual(100);
    }
  });

  it("splits tokens into the given number of rows", () => {
    expect(splitRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2, 3], [4, 5]]);
    expect(splitRows([1, 2], 1)).toEqual([[1, 2]]);
    expect(splitRows([], 2)).toEqual([]);
  });
});
