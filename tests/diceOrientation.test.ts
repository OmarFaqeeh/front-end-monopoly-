import { describe, expect, it } from "vitest";
import { FACE_NORMALS, faceUpQuaternion, oppositeValue, rotateVec, upValue } from "@/lib/diceOrientation";
import { planRoll, rollHeight, rollOrientation } from "@/lib/diceRoll";

const near = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]!) < 1e-6);

describe("dice orientation", () => {
  it("maps the face-n normal to +Y for all six values, for any yaw", () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (const yaw of [0, 0.7, 2.1, 5.5]) {
        expect(near(rotateVec(faceUpQuaternion(n, yaw), FACE_NORMALS[n]!), [0, 1, 0])).toBe(true);
      }
    }
  });

  it("has opposite faces that sum to 7 and opposite normals", () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(n + oppositeValue(n)).toBe(7);
      const a = FACE_NORMALS[n]!;
      const b = FACE_NORMALS[oppositeValue(n)]!;
      expect(near(a, b.map((v) => -v))).toBe(true);
    }
  });

  it("rejects invalid values", () => {
    expect(() => faceUpQuaternion(0)).toThrow(RangeError);
    expect(() => faceUpQuaternion(7)).toThrow(RangeError);
  });
});

describe("dice roll timeline", () => {
  it("ends exactly on the requested value", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (const k of [2, 3, 4]) {
        const plan = planRoll(n, rand, k);
        const end = rollOrientation(plan, 1);
        expect(upValue(end)).toBe(n);
        expect(near(rotateVec(end, FACE_NORMALS[n]!), [0, 1, 0])).toBe(true);
      }
    }
  });

  it("tosses up to about 0.9 with two decreasing bounces and rests at 0", () => {
    const heights = Array.from({ length: 101 }, (_, i) => rollHeight(i / 100));
    expect(Math.max(...heights)).toBeCloseTo(0.9, 1);
    expect(rollHeight(0)).toBe(0);
    expect(rollHeight(1)).toBe(0);
    expect(rollHeight(0.64)).toBeCloseTo(0.25, 1);
    expect(rollHeight(0.85)).toBeCloseTo(0.08, 1);
  });
});
