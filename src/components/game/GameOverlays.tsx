"use client";
// Overlays that sit above the whole room: the winner screen, the bankruptcy toast and the aria-live announcer.
import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { leaveRoom } from "@/lib/roomClient";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export function GameOverOverlay() {
  const t = useTranslations("game.over");
  const router = useRouter();
  const display = useGameStore((s) => s.display);
  const busy = useGameStore((s) => s.busy);
  const winner = useRoomStore((s) => s.players.find((p) => p.id === display?.winnerPlayerId));
  if (!display || display.phase !== "gameOver" || busy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("label")} data-game-over="">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-accent/50 bg-surface-raised p-8 text-center shadow-card">
        <Trophy size={44} strokeWidth={1.5} className="text-gold" aria-hidden="true" />
        <h2 className="font-heading text-3xl font-semibold text-ink">{t("wins", { name: winner?.nickname ?? "" })}</h2>
        <Button
          variant="gold"
          size="md"
          onClick={() => {
            void leaveRoom().finally(() => router.push("/"));
          }}
        >
          {t("back")}
        </Button>
      </div>
    </div>
  );
}

export function BankruptToast() {
  const t = useTranslations("game");
  const toast = useGameStore((s) => s.toast);
  const name = useRoomStore((s) => s.players.find((p) => p.id === toast?.playerId)?.nickname ?? "");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => useGameStore.getState().patch({ toast: null }), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  return (
    <div role="status" data-toast="bankrupt" className="fixed start-1/2 top-5 z-50 -translate-x-1/2 rounded-full border border-danger bg-danger-soft px-5 py-2 text-sm font-semibold text-ink shadow-card">
      {t("toastBankrupt", { name })}
    </div>
  );
}

/** Visually hidden live region: announces turns, rolls and the winner to screen readers. */
export function GameAnnouncer() {
  const t = useTranslations("game");
  const announce = useGameStore((s) => s.announce);
  let text = "";
  if (announce) {
    const p = announce.params;
    if (announce.code === "yourTurn") text = t("turn.yours");
    else if (announce.code === "turnOf") text = t("turn.of", p);
    else if (announce.code === "rolled") text = t("rolled", p);
    else text = t("over.wins", p);
  }
  return (
    <p className="sr-only" role="status" aria-live="polite" data-announcer="">
      {text}
    </p>
  );
}
