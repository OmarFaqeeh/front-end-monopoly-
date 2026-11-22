// Character manifest (public/characters/characters.json is the only place character hex colors live)
// plus the mapping from a character's dominant color to the nearest theme player token.
import manifestJson from "../../public/characters/characters.json";

export interface CharacterEntry {
  id: string;
  nameKey: string;
  dominantColor: string;
  /** The character's own color (chosen from its art): picker hover, avatar glow, owner strip, chat. */
  color: string;
  /** Image file under /characters (art only). */
  file?: string;
  source: "temp" | "art";
}

export const CHARACTERS = manifestJson as CharacterEntry[];

/** Mirrors --player-1..12 in styles/theme.css; used only to find the nearest accent token. */
const PLAYER_TOKEN_HEX = [
  "#4f6fa8", "#c95b52", "#5e9c6e", "#e0925a", "#8a6bb0", "#2f6b7c",
  "#e3c65a", "#c97b9b", "#7fb3c8", "#a67c6d", "#9ab85a", "#6f7f8f",
];

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Number 1..12 of the nearest player-N token to a hex color. */
export function nearestPlayerToken(hex: string): number {
  const [r, g, b] = rgb(hex);
  let best = 0;
  let bestD = Infinity;
  PLAYER_TOKEN_HEX.forEach((t, i) => {
    const [tr, tg, tb] = rgb(t);
    const d = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best + 1;
}

export function characterById(id: string | undefined): CharacterEntry {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]!;
}

/** The character's own color (hex from the manifest): chat names and bubbles, avatar glow, owner strip, picker hover. */
export function accentColor(id: string | undefined): string {
  return characterById(id).color;
}
