"use client";
// The trade box under the players: a "+" to start a trade (pick a player first) and the list of every offer in the game.
// Anybody can open any offer to look at it; only the recipient can accept or decline it.
import clsx from "clsx";
import { ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import PlayerAvatar from "@/components/room/PlayerAvatar";
import Card from "@/components/ui/Card";
import { formatMoney } from "@/lib/money";
import type { TradeOffer, TradeSide } from "@/shared/events";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

function sideText(t: ReturnType<typeof useTranslations>, side: TradeSide): string {
  const parts: string[] = [];
  if (side.tiles.length) parts.push(t("trade.lands", { count: side.tiles.length }));
  if (side.cash) parts.push(formatMoney(side.cash, { suffix: true }));
  return parts.length ? parts.join(" + ") : t("trade.nothing");
}

export default function TradeCard() {
  const t = useTranslations();
  const display = useGameStore((s) => s.display);
  const ui = useGameStore((s) => s.tradeUi);
  const meId = useRoomStore((s) => s.meId);
  if (!display) return null;

  const me = display.players.find((p) => p.id === meId);
  const others = display.players.filter((p) => p.id !== meId && !p.bankrupt);
  // The "+" stays available during an auction or a debt: the popup then shows each player disabled with the reason.
  const canStart = !!me && !me.bankrupt && display.phase !== "gameOver" && others.length > 0;
  const pickerOpen = ui?.kind === "picker";
  const set = (tradeUi: typeof ui) => useGameStore.getState().patch({ tradeUi });
  const trades = [...display.trades].reverse();

  return (
    <Card className="p-5" data-trade-card="">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{t("trade.title")}</h3>
        <button
          type="button"
          onClick={() => set(pickerOpen ? null : { kind: "picker" })}
          disabled={!canStart}
          aria-label={t("trade.add")}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          data-trade-add=""
          className={clsx(
            "flex size-9 items-center justify-center rounded-xl border border-accent/60 bg-accent-soft/50 text-ink transition-colors duration-200",
            canStart ? "cursor-pointer hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" : "cursor-not-allowed opacity-40",
          )}
        >
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {trades.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-sm text-ink-muted">{t("trade.empty")}</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pe-1">
          {trades.map((x) => (
            <TradeRow key={x.id} trade={x} meId={meId} onOpen={() => set({ kind: "view", tradeId: x.id })} t={t} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function TradeRow({ trade, meId, onOpen, t }: { trade: TradeOffer; meId: string | null; onOpen: () => void; t: ReturnType<typeof useTranslations> }) {
  const players = useRoomStore((s) => s.players);
  const from = players.find((p) => p.id === trade.fromId);
  const to = players.find((p) => p.id === trade.toId);
  const needsMe = trade.status === "pending" && trade.toId === meId;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        data-trade-row={trade.id}
        data-trade-status={trade.status}
        aria-label={t("trade.open", { from: from?.nickname ?? "", to: to?.nickname ?? "" })}
        className={clsx(
          "w-full cursor-pointer rounded-xl border px-3 py-2 text-start transition-colors duration-200 hover:bg-accent-soft/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          needsMe ? "border-accent bg-accent-soft/40" : "border-line bg-surface-sunken/60",
        )}
      >
        <span className="flex items-center gap-2">
          <PlayerAvatar characterId={from?.characterId} size="xs" />
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-ink-muted" />
          <PlayerAvatar characterId={to?.characterId} size="xs" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {from?.nickname} → {to?.nickname}
          </span>
          <span
            className={clsx(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-ink",
              trade.status === "pending" && "bg-accent-soft",
              trade.status === "accepted" && "bg-brand-soft",
              (trade.status === "rejected" || trade.status === "cancelled") && "bg-danger-soft",
            )}
          >
            {t(`trade.status.${trade.status}`)}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs text-ink-muted">
          {sideText(t, trade.give)} ⇄ {sideText(t, trade.get)}
        </span>
        {needsMe && <span className="mt-1 block text-xs font-bold text-ink">{t("trade.needsAnswer")}</span>}
      </button>
    </li>
  );
}
