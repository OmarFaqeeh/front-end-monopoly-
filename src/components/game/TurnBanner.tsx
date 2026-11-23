"use client";
// Banner above the board: "Your turn", "{name}'s turn" or "Waiting for {name} to roll".
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

/** Seconds left until the idle removal of the player on turn (ticks once a second); null when nobody is timed. */
function useIdleCountdown(currentId: string | null | undefined): number | null {
  const timer = useGameStore((s) => s.turnTimer);
  const [now, setNow] = useState(() => Date.now());
  const active = !!timer && timer.playerId === currentId;
  useEffect(() => {
    if (!active) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active, timer?.endsAtLocal]);
  return active ? Math.max(0, Math.ceil((timer.endsAtLocal - now) / 1000)) : null;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function TurnBanner() {
  const t = useTranslations("game.turn");
  const display = useGameStore((s) => s.display);
  const meId = useRoomStore((s) => s.meId);
  const name = useRoomStore((s) => s.players.find((p) => p.id === display?.currentPlayerId)?.nickname ?? "");
  const left = useIdleCountdown(display?.currentPlayerId);
  if (!display || display.phase === "gameOver") return null;

  const mine = display.currentPlayerId === meId;
  const text = mine ? t("yours") : display.phase === "awaitingRoll" ? t("waitingRoll", { name }) : t("of", { name });

  const urgent = left !== null && left <= 30;

  return (
    <div
      data-turn-banner={mine ? "mine" : "other"}
      data-idle-left={left ?? undefined}
      className={clsx(
        "mx-auto mb-3 inline-flex items-center rounded-full border px-5 py-1.5 text-sm font-semibold",
        mine ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface-raised text-ink-muted",
        urgent && "border-danger bg-danger-soft text-ink",
      )}
    >
      {text}
      {left !== null && (
        <span className="ms-3 tabular-nums" data-idle-clock="" aria-label={t("idleAria", { name })}>
          {clock(left)}
        </span>
      )}
      {mine && urgent && <span className="ms-3 font-normal">{t("idleWarning")}</span>}
    </div>
  );
}
