"use client";
// A small card that appears when someone sends YOU an offer: view it, accept it or decline it right away. Ignoring it is
// fine: the offer stays in the trade list under the players and can be answered later.
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import PlayerAvatar from "@/components/room/PlayerAvatar";
import Button from "@/components/ui/Button";
import { acceptTrade, rejectTrade } from "@/lib/gameClient";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function TradeToast() {
  const t = useTranslations("trade");
  const id = useGameStore((s) => s.incomingTrade);
  const trade = useGameStore((s) => s.display?.trades.find((x) => x.id === id));
  const from = useRoomStore((s) => s.players.find((p) => p.id === trade?.fromId));
  const dialogOpen = useGameStore((s) => s.tradeUi?.kind === "view" || s.tradeUi?.kind === "compose");
  const dismiss = () => useGameStore.getState().patch({ incomingTrade: null });
  if (!id || !trade || trade.status !== "pending" || dialogOpen) return null;

  return (
    <div
      role="alert"
      data-trade-toast=""
      className="fixed end-4 bottom-4 z-40 flex w-[min(92vw,22rem)] flex-col gap-3 rounded-2xl border border-accent/60 bg-surface-raised p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <PlayerAvatar characterId={from?.characterId} size="md" />
        <p className="min-w-0 flex-1 pt-1 font-semibold text-ink">{t("toast.title", { name: from?.nickname ?? "" })}</p>
        <button type="button" onClick={dismiss} aria-label={t("toast.dismiss")} className="btn btn-quiet btn-sm btn-square shrink-0">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dismiss();
            useGameStore.getState().patch({ tradeUi: { kind: "view", tradeId: trade.id } });
          }}
        >
          {t("toast.view")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => void rejectTrade(trade.id).then(dismiss)}>
          {t("dialog.reject")}
        </Button>
        <Button variant="gold" size="sm" onClick={() => void acceptTrade(trade.id).then(dismiss)}>
          {t("dialog.accept")}
        </Button>
      </div>
    </div>
  );
}
