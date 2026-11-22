// Name fitting for tile names: never break inside a word; shrink the font to fit the longest word.
import type { CSSProperties } from "react";

/**
 * - Names of 9 or more characters use the smaller base size (max(9px, 1.0 board-width %)).
 * - The font is further limited so the longest word fits the tile's short side (--word = its length),
 *   which means it can fall under 9px on very small boards instead of being cut or broken.
 */
export function nameStyle(name: string): { className: string; style: CSSProperties } {
  const longestWord = Math.max(...name.split(/\s+/).map((w) => w.length));
  return {
    className: name.length >= 9 ? "is-long" : "",
    style: { ["--word" as string]: longestWord } as CSSProperties,
  };
}
