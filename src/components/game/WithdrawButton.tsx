"use client";
// "Withdraw" under the players: you leave the game (everything you own goes back to the bank) and the game goes on
// without you. The last player standing wins. A confirmation avoids a click by mistake.
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { resignGame } from "@/lib/gameClient";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function WithdrawButton() {
  const t = useTranslations("game.withdraw");
  const display = useGameStore((s) => s.display);
  const meId = useRoomStore((s) => s.meId);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!display || display.phase === "gameOver") return null;
  const me = display.players.find((p) => p.id === meId);
  if (!me) return null;
  if (me.bankrupt) return <p className="mt-3 border-t border-line pt-3 text-center text-sm text-ink-muted">{t("done")}</p>;

  return (
    <div className="mt-3 border-t border-line pt-3">
      {!asking ? (
        <button
          type="button"
          onClick={() => setAsking(true)}
          data-withdraw=""
          aria-label={t("button")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors duration-200 hover:bg-danger-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
          {t("button")}
        </button>
      ) : (
        <div role="alertdialog" aria-label={t("title")} data-withdraw-confirm="" className="rounded-xl border border-danger bg-danger-soft/50 p-3">
          <p className="text-sm font-semibold text-ink">{t("title")}</p>
          <p className="mt-1 text-xs text-ink-muted">{t("body")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setAsking(false)}>
              {t("keep")}
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void resignGame().finally(() => {
                  setBusy(false);
                  setAsking(false);
                });
              }}
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
