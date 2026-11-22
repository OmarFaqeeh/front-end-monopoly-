// Corner tiles: blurred emblem backdrop, sharp emblem, name, caption. Start has two zones: the label zone on
// top (never covered) and a token zone below that holds the seated characters, sized by tokenLayout().
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { emblemFor, glowToken } from "@/components/board/emblems";
import EmblemBackdrop from "@/components/board/EmblemBackdrop";
import TokenZone from "@/components/board/TokenZone";
import { KIND_BACKDROP_STRENGTH, type TileData } from "@/config/boardLayout";
import type { RoomPlayer } from "@/store/roomStore";

/** Fade of the backdrop toward the board center, per corner index. */
const CORNER_DIR: Record<number, string> = {
  0: "to bottom right",
  10: "to bottom left",
  20: "to top left",
  30: "to top right",
};

const NAME_STYLE = { fontSize: "max(10px, calc(var(--b) * 0.0135))", textShadow: "0 0 6px var(--surface-raised)" } as const;
const CAPTION_STYLE = { fontSize: "max(8px, calc(var(--b) * 0.0095))" } as const;

/**
 * Start: a top zone (emblem, label, caption) that is never covered, and a token zone of up to 42% of the tile
 * below it with a 4px gap. A grid guarantees the clearance: the label and caption rows keep their content height,
 * the emblem row takes what is left (and shrinks to 70% when tokens are seated), the token row is at most 42%.
 */
function StartContent({ emblem, name, caption, players }: { emblem: ReactNode; name: string; caption: string; players: RoomPlayer[] }) {
  const reduce = useReducedMotion();
  const seated = players.length > 0;
  const transition = { duration: reduce ? 0 : 0.2, ease: "easeOut" as const };
  // Host first (seat order); later seats draw on top.
  const ordered = [...players].sort((a, b) => Number(b.isHost) - Number(a.isHost));

  return (
    <motion.div
      className="absolute inset-0 grid justify-items-center px-[4cqw] pt-[4cqw] pb-px text-center"
      initial={false}
      animate={{ ["--tz" as string]: seated ? "42%" : "0%" }}
      transition={transition}
      style={{ gridTemplateRows: "minmax(0, 1fr) auto auto minmax(0, var(--tz, 0%))" }}
    >
      <div className="row-start-1 flex min-h-0 w-full items-center justify-center">
        <motion.span
          className="block"
          initial={false}
          animate={{ maxHeight: seated ? "38.5cqw" : "55cqw", maxWidth: seated ? "38.5cqw" : "55cqw" }}
          transition={transition}
          style={{ height: "100%", aspectRatio: "1" }}
        >
          {emblem}
        </motion.span>
      </div>
      <span className="row-start-2 mt-[1cqw] leading-tight font-bold text-balance text-ink" style={NAME_STYLE}>
        {name}
      </span>
      <span className="start-caption row-start-3 mt-[0.5cqw] leading-tight text-ink-muted" style={CAPTION_STYLE}>
        {caption}
      </span>
      <motion.div className="row-start-4 min-h-0 w-full" initial={false} animate={{ paddingTop: seated ? 4 : 0 }} transition={transition}>
        {seated && <TokenZone players={ordered} className="size-full" />}
      </motion.div>
    </motion.div>
  );
}

export default function CornerTile({ tile, name, players }: { tile: TileData; name: string; players: RoomPlayer[] }) {
  const t = useTranslations("board.corners");
  const emblem = emblemFor(tile);
  if (!emblem) return null;

  const danger = tile.kind === "goToDetention";
  const glow = `radial-gradient(circle at 50% 42%, color-mix(in srgb, var(${glowToken(tile)}) 35%, transparent) 0%, transparent 62%)`;
  const caption = tile.kind === "start" ? t("startCaption") : tile.kind === "detention" ? t("detentionCaption") : null;

  return (
    <div
      className={clsx("tile-cell tile-surface size-full", danger && "bg-danger-soft!")}
      style={{ backgroundImage: glow }}
    >
      <EmblemBackdrop emblem={emblem} dir={CORNER_DIR[tile.index]} strength={KIND_BACKDROP_STRENGTH[tile.kind] ?? 1} />
      {tile.kind === "start" && caption ? (
        <StartContent emblem={emblem} name={name} caption={caption} players={players} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center px-[4cqw] pt-[8cqw] text-center">
          <span className="block shrink-0" style={{ width: "55cqw", height: "55cqw" }}>
            {emblem}
          </span>
          <span className="mt-[3cqw] leading-tight font-bold text-balance text-ink" style={NAME_STYLE}>
            {name}
          </span>
          {caption && (
            <span className="mt-[1cqw] leading-tight text-ink-muted" style={CAPTION_STYLE}>
              {caption}
            </span>
          )}
          {tile.kind === "detention" && (
            <span
              className="mt-auto mb-[6cqw] h-[14cqw] w-[84cqw] shrink-0 rounded-[0.4em] border border-dashed border-line"
              aria-label={t("passing")}
            />
          )}
        </div>
      )}
    </div>
  );
}
