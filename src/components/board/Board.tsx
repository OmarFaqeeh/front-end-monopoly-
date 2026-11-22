"use client";
// The board: a square 11x11 CSS grid (outer ring of 40 tiles + 9x9 center), all built from DOM components.
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { BOARD_LAYOUT } from "@/config/boardLayout";
import { useRoomStore, type RoomPlayer } from "@/store/roomStore";
import AuctionModal from "@/components/game/AuctionModal";
import BoardCenter from "./BoardCenter";
import PawnLayer from "./PawnLayer";
import Tile from "./Tile";
import TileInfoCard from "./TileInfoCard";

const TRACKS = "1.47fr repeat(9, 1fr) 1.47fr";

export default function Board({
  interactive,
  players,
  onTileSelect,
}: {
  interactive: boolean;
  players: RoomPlayer[];
  onTileSelect?: (index: number) => void;
}) {
  const t = useTranslations("board");
  const boardRef = useRef<HTMLDivElement>(null);
  const selectedTile = useRoomStore((s) => s.selectedTile);
  const selectTile = useRoomStore((s) => s.selectTile);

  const handleSelect = (index: number) => {
    selectTile(index);
    onTileSelect?.(index);
  };

  return (
    <div
      ref={boardRef}
      role="group"
      aria-label={t("label")}
      className="relative mx-auto border border-accent/35 bg-surface-sunken"
      style={{
        width: "min(100%, var(--board-max, 92vh), 1100px)",
        aspectRatio: "1 / 1",
        containerType: "size",
        borderRadius: "1.2%",
      }}
    >
      <div
        className="absolute inset-[0.4cqw] grid"
        style={{
          ["--b" as string]: "100cqw",
          gridTemplateColumns: TRACKS,
          gridTemplateRows: TRACKS,
          gap: "0.25cqw",
        }}
      >
        {BOARD_LAYOUT.map((tile) => (
          <Tile
            key={tile.index}
            tile={tile}
            interactive={interactive}
            selected={interactive && selectedTile === tile.index}
            players={players}
            onTileSelect={handleSelect}
          />
        ))}
        <BoardCenter />
      </div>
      <PawnLayer />
      <AuctionModal />
      {interactive && selectedTile != null && (
        <TileInfoCard key={selectedTile} index={selectedTile} boardRef={boardRef} onClose={() => selectTile(null)} />
      )}
    </div>
  );
}
