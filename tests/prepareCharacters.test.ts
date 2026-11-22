import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { detectRows, dominantColor, splitSheet } from "../scripts/prepare-characters.mjs";

const root = path.resolve(import.meta.dirname, "..");
const charDir = path.join(root, "public", "characters");
const sheetPath = path.join(root, "characters-incoming", "sheet.png");

/** Synthetic sheet: flat background, 3 colored blobs in two rows, plus one tiny speck that must be dropped. */
async function syntheticSheet() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="600" height="400" fill="#20202a"/>
    <circle cx="120" cy="110" r="70" fill="#d6453d"/>
    <circle cx="320" cy="100" r="60" fill="#2f6faf"/>
    <circle cx="200" cy="290" r="65" fill="#7a8f3a"/>
    <circle cx="560" cy="380" r="3" fill="#ffffff"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

describe("prepare-characters (generic sheets)", () => {
  it("splits a synthetic sheet into the expected count in reading order", async () => {
    const parts = await splitSheet(await syntheticSheet());
    expect(parts).toHaveLength(3);
    const colors = await Promise.all(parts.map(dominantColor));
    expect(colors[0]!.startsWith("#d")).toBe(true);
    expect(colors[1]!.startsWith("#2")).toBe(true);
    for (const p of parts) {
      const m = await sharp(p).metadata();
      expect(m.height!).toBeLessThanOrEqual(512);
      expect(m.hasAlpha).toBe(true);
    }
  });
});

describe("the attached 4x3 sheet", () => {
  it("has exactly 3 character rows (title and button ignored)", async () => {
    const rows = await detectRows(sheetPath, { rows: 3 });
    expect(rows).toHaveLength(3);
    expect(rows[0]!.y).toBeGreaterThan(100); // below the title text
    expect(rows[2]!.y + rows[2]!.h).toBeLessThan(1060); // above the button
  });

  it("produced 12 cutouts with transparent corners", async () => {
    for (let i = 1; i <= 12; i++) {
      const file = path.join(charDir, `c${String(i).padStart(2, "0")}.png`);
      expect(fs.existsSync(file), file).toBe(true);
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(info.height).toBeLessThanOrEqual(512);
      const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3]!;
      expect(alphaAt(0, 0)).toBe(0);
      expect(alphaAt(info.width - 1, 0)).toBe(0);
      expect(alphaAt(0, info.height - 1)).toBe(0);
      expect(alphaAt(info.width - 1, info.height - 1)).toBe(0);
    }
  });

  it("has a manifest of 12 unique art entries", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(charDir, "characters.json"), "utf8")) as {
      id: string;
      file?: string;
      source: string;
      dominantColor: string;
    }[];
    expect(manifest).toHaveLength(12);
    expect(new Set(manifest.map((m) => m.id)).size).toBe(12);
    for (const m of manifest) {
      expect(m.source).toBe("art");
      expect(m.file).toBe(`${m.id}.png`);
      expect(m.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
