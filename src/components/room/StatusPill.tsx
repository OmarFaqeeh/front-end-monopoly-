"use client";
// Status pill: pulsing dot, "Waiting for players" and the seated / max count.
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function StatusPill() {
  const t = useTranslations("room.status");
  const count = useRoomStore((s) => s.players.length);
  const max = useRoomStore((s) => s.settings.maxPlayers);
  const inGame = useGameStore((s) => s.display !== null);
  if (inGame) return null; // the turn banner takes over once the game starts

  return (
    <div
      role="status"
      className="inline-flex items-center gap-3 self-start rounded-full border border-accent/50 bg-accent-soft px-4 py-2 text-sm font-semibold text-ink"
    >
      <span aria-hidden="true" className="dot-pulse size-2.5 rounded-full bg-accent-strong" />
      {t("waiting")}
      <span className="tabular-nums">
        {count} / {max}
      </span>
    </div>
  );
}
