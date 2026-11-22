"use client";
// The auction, over the board for everybody: the property, the current bid and its leader, a timer bar driven by the
// server's deadline (endsAt, corrected for clock differences with serverNow), quick-bid buttons and Withdraw.
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FLAGS } from "@/components/board/flags";
import PlayerAvatar from "@/components/room/PlayerAvatar";
import Button from "@/components/ui/Button";
import { BOARD_LAYOUT } from "@/config/boardLayout";
import { bidAuction, withdrawAuction } from "@/lib/gameClient";
import { formatMoney } from "@/lib/money";
import { RULES } from "@/shared/rent";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

const money = (n: number) => formatMoney(n, { suffix: true });
const QUICK = [10, 50, 100] as const;

/** Milliseconds left, using the server clock offset measured when the deadline arrived. */
function useRemaining(endsAt: number | null, offset: number): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [endsAt, offset]);
  return endsAt === null || now === 0 ? 0 : Math.max(0, endsAt - now);
}

export default function AuctionModal() {
  const t = useTranslations();
  const display = useGameStore((s) => s.display);
  const offset = useGameStore((s) => s.auctionClockOffset);
  const iBid = useGameStore((s) => s.iBid);
  const error = useGameStore((s) => s.actionError);
  const meId = useRoomStore((s) => s.meId);
  const players = useRoomStore((s) => s.players);
  const a = display?.phase === "auction" ? display.auction : null;
  const left = useRemaining(a?.endsAt ?? null, offset);
  if (!display || !a) return null;

  const tile = BOARD_LAYOUT[a.tileIndex]!;
  const Flag = tile.flag ? FLAGS[tile.flag] : null;
  const me = display.players.find((p) => p.id === meId);
  const leader = players.find((p) => p.id === a.highestBidderId);
  const withdrawn = !!meId && a.withdrawnIds.includes(meId);
  const iLead = a.highestBidderId === meId;
  const canBid = !!me && !me.bankrupt && !withdrawn && !iLead;
  const window = Math.max(1, a.endsAt - a.serverNow);
  const pct = Math.min(100, (left / window) * 100);
  const status = withdrawn ? t("auction.withdrew") : iLead ? t("auction.leading") : iBid && a.currentBid > 0 ? t("auction.outbid") : null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/45 p-2 backdrop-blur-[2px]" data-auction="">
      <div role="dialog" aria-modal="true" aria-label={t("auction.title")} className="w-full max-w-[min(92%,26rem)] rounded-3xl border border-accent/60 bg-surface-raised p-4 shadow-card">
        <p className="text-center text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{t("auction.title")}</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="flex size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-surface-raised" aria-hidden="true">
            {Flag ? <Flag /> : null}
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-xl font-semibold text-ink">{t(tile.nameKey)}</p>
            <p className="text-xs text-ink-muted">{t("auction.listPrice", { price: money(tile.price ?? 0) })}</p>
          </div>
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-ink-muted">{t("auction.currentBid")}</p>
          <p className="font-heading text-3xl font-bold text-gold tabular-nums" data-current-bid={a.currentBid}>
            {a.currentBid > 0 ? money(a.currentBid) : t("auction.noBids")}
          </p>
          <div className="mt-1 flex min-h-8 items-center justify-center gap-2 text-sm text-ink">
            {leader ? (
              <>
                <PlayerAvatar characterId={leader.characterId} size="xs" />
                <span className="font-semibold">{leader.nickname}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={t("auction.timer")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} data-auction-timer="">
          <div className={clsx("h-full rounded-full transition-[width] duration-100 ease-linear", pct < 25 ? "bg-danger" : "bg-accent")} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-center text-xs text-ink-muted tabular-nums">{t("auction.seconds", { seconds: Math.ceil(left / 1000) })}</p>

        {status && (
          <p role="status" className={clsx("mt-2 text-center text-sm font-semibold", iLead ? "text-success" : "text-ink-muted")} data-auction-status="">
            {status}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {QUICK.map((step) => {
            const amount = Math.max(RULES.auctionMinBid, a.currentBid + step);
            return (
              <Button key={step} variant="gold" size="sm" disabled={!canBid || amount > (me?.cash ?? 0)} onClick={() => void bidAuction(amount)} data-quick-bid={step}>
                +{step}
              </Button>
            );
          })}
          <Button variant="outline" size="sm" disabled={!canBid} onClick={() => void withdrawAuction()} data-withdraw-auction="">
            {t("auction.withdraw")}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-muted tabular-nums">{t("auction.yourCash", { amount: money(me?.cash ?? 0) })}</p>
        {error && (
          <p role="alert" className="mt-1 text-center text-xs text-danger">
            {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.UNKNOWN")}
          </p>
        )}
      </div>
    </div>
  );
}
