"use client";
// One board tile placed on the 11x11 grid; a real button once the board is interactive. During a game it also
// carries the pawns standing on it, the owner badge and the building markers (all read from the displayed state).
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { accentColor } from "@/config/characters";
import type { TileData } from "@/config/boardLayout";
import { ringCell, tileSide } from "@/lib/boardGrid";
import { formatMoney } from "@/lib/money";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore, type RoomPlayer } from "@/store/roomStore";
import { FLAGS } from "./flags";
import CornerTile from "./tiles/CornerTile";
import PropertyTile from "./tiles/PropertyTile";
import type { TileOwner } from "./tiles/OwnerPlate";
import { CardTile, HarborTile, TaxTile, UtilityTile } from "./tiles/SpecialTiles";

export default function Tile({
  tile,
  interactive,
  selected,
  players,
  onTileSelect,
}: {
  tile: TileData;
  interactive: boolean;
  selected: boolean;
  /** Seated players (lobby): shown on Start until the game begins. */
  players: RoomPlayer[];
  onTileSelect?: (index: number) => void;
}) {
  const t = useTranslations();
  const name = t(tile.nameKey);
  const { row, col } = ringCell(tile.index);
  const side = tileSide(tile.index);
  const amount = tile.price ?? tile.amount;
  const label = amount != null ? `${name}, ${formatMoney(amount, { suffix: true })}` : name;

  // Primitive selectors so a tile re-renders only when something on THIS tile changes.
  const inGame = useGameStore((s) => s.display !== null);
  const propSig = useGameStore((s) => {
    const p = s.display?.properties[tile.index];
    return p ? `${p.ownerId}:${p.level}:${p.mortgaged ? 1 : 0}` : "";
  });
  const oasisPool = useGameStore((s) => (tile.kind === "oasis" && s.display?.rules.oasisJackpot ? s.display.oasisPool : -1));
  const roomPlayers = useRoomStore((s) => s.players);
  const releasing = useGameStore((s) => s.releasing.includes(tile.index));

  const [ownerId, levelText, mortgagedText] = propSig ? propSig.split(":") : ["", "0", "0"];
  const mortgaged = mortgagedText === "1";
  const owner = ownerId ? roomPlayers.find((p) => p.id === ownerId) : undefined;
  const level = Number(levelText);
  // A bought tile shows the owner's plate (their color + picture) instead of the price. The owner may have left: accent color.
  const tileOwner: TileOwner | undefined = ownerId
    ? { characterId: owner?.characterId ?? null, color: owner ? accentColor(owner.characterId ?? undefined) : "#d9a24c", label: t("game.build.ownedBy", { name: owner?.nickname ?? "" }), level, buildLabel: level >= 5 ? t("board.card.rows.hotel") : level > 0 ? t("board.card.rows.h" + level) : "" }
    : undefined;

  let body: React.ReactNode;
  if (side === "corner") {
    // Lobby: the seated players stand on Start. In a game the pawns live in the PawnLayer above the board.
    body = <CornerTile tile={tile} name={name} players={tile.kind === "start" && !inGame ? players : []} />;
  } else if (tile.kind === "property") {
    body = <PropertyTile tile={tile} side={side} name={name} owner={tileOwner} />;
  } else if (tile.kind === "harbor") {
    body = <HarborTile tile={tile} side={side} name={name} owner={tileOwner} />;
  } else if (tile.kind === "utility") {
    body = <UtilityTile tile={tile} side={side} name={name} owner={tileOwner} />;
  } else if (tile.kind === "tax") {
    body = <TaxTile tile={tile} side={side} name={name} />;
  } else {
    body = <CardTile tile={tile} side={side} name={name} />;
  }

  // The flag always hangs over the tile's inner edge (bought or not): half on the card, half outside, at full size.
  const OutFlag = tile.kind === "property" && tile.flag && side !== "corner" ? FLAGS[tile.flag] : null;
  const overlays = (
    <>
      {OutFlag && side !== "corner" && (
        <span className={`tile-flag-out is-${side}`} data-flag-out="" aria-hidden="true">
          <OutFlag />
        </span>
      )}
      {mortgaged && (
        <div className="mortgaged-overlay pointer-events-none absolute inset-0 z-10 flex items-end justify-center" data-mortgaged="">
          <span className="mortgaged-badge">{t("mortgage.badge")}</span>
        </div>
      )}
      {oasisPool >= 0 && (
        <span className="oasis-chip pointer-events-none absolute inset-x-0 bottom-[6%] z-10 mx-auto w-fit" data-oasis-chip={oasisPool}>
          {t("oasis.chip", { amount: formatMoney(oasisPool, { suffix: true }) })}
        </span>
      )}
    </>
  );

  const style = { gridRow: row, gridColumn: col };
  const fade = releasing ? " tile-releasing" : "";

  if (!interactive) {
    return (
      <div className={"relative min-h-0 min-w-0" + fade} style={style} aria-label={label} role="group">
        {body}
        {overlays}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-tile={tile.index}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={selected}
      className={clsx("tile-btn tile-interactive relative min-h-0 min-w-0", selected && "tile-selected", releasing && "tile-releasing")}
      style={style}
      onClick={() => onTileSelect?.(tile.index)}
    >
      {body}
      {overlays}
    </button>
  );
}
