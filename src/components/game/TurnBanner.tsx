"use client";
// Banner above the board: "Your turn", "{name}'s turn" or "Waiting for {name} to roll".
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function TurnBanner() {
  const t = useTranslations("game.turn");
  const display = useGameStore((s) => s.display);
  const meId = useRoomStore((s) => s.meId);
  const name = useRoomStore((s) => s.players.find((p) => p.id === display?.currentPlayerId)?.nickname ?? "");
  if (!display || display.phase === "gameOver") return null;

  const mine = display.currentPlayerId === meId;
  const text = mine ? t("yours") : display.phase === "awaitingRoll" ? t("waitingRoll", { name }) : t("of", { name });

  return (
    <div
      data-turn-banner={mine ? "mine" : "other"}
      className={clsx(
        "mx-auto mb-3 inline-flex items-center rounded-full border px-5 py-1.5 text-sm font-semibold",
        mine ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface-raised text-ink-muted",
      )}
    >
      {text}
    </div>
  );
}
