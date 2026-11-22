import { describe, expect, it } from "vitest";
import { BOARD_LAYOUT } from "@/config/boardLayout";
import { TILE_INFO } from "@/config/tileInfo";
import en from "@/messages/en.json";

type Messages = { board: { info: Record<string, string>; countries: Record<string, string>; tiles: Record<string, string> } };
const messages = en as unknown as Messages;

describe("tile info coverage", () => {
  it("has info and text for all 40 tiles", () => {
    expect(TILE_INFO).toHaveLength(40);
    for (const info of TILE_INFO) {
      const key = info.descKey.replace("board.info.", "");
      expect(messages.board.info[key], `description for tile ${info.index}`).toBeTruthy();
    }
  });

  it("has a name for every tile and a country for every flag", () => {
    for (const tile of BOARD_LAYOUT) {
      expect(messages.board.tiles[`t${String(tile.index).padStart(2, "0")}`]).toBeTruthy();
      if (tile.flag) expect(messages.board.countries[tile.flag]).toBeTruthy();
    }
  });

  it("describes every property", () => {
    const props = BOARD_LAYOUT.filter((t) => t.kind === "property");
    expect(props.length).toBe(22);
    for (const p of props) {
      const key = `t${String(p.index).padStart(2, "0")}`;
      expect(messages.board.info[key]!.length).toBeGreaterThan(20);
    }
  });
});
