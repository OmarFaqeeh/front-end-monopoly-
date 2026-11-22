"use client";
// raisingFunds: a payment is due and cash is not enough. The debtor sees what they owe and who is owed, the tiles they can
// mortgage (with the cash each gives), "Pay debt" (enabled when cash covers it) and "Declare bankruptcy". Others only see
// who is raising funds.
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { BOARD_LAYOUT } from "@/config/boardLayout";
import { declareBankruptcy, mortgageTile, payDebt } from "@/lib/gameClient";
import { formatMoney } from "@/lib/money";
import { mortgageValue } from "@/shared/rent";
import { mortgageableTiles } from "@/lib/mortgage";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

const money = (n: number) => formatMoney(n, { suffix: true });

export default function DebtBanner() {
  const t = useTranslations();
  const display = useGameStore((s) => s.display);
  const busy = useGameStore((s) => s.busy);
  const meId = useRoomStore((s) => s.meId);
  const players = useRoomStore((s) => s.players);
  const debt = display?.phase === "raisingFunds" ? display.pendingDebt : null;
  if (!display || !debt) return null;

  const debtorId = display.currentPlayerId;
  const debtor = players.find((p) => p.id === debtorId);
  const mine = debtorId === meId;
  const creditor = debt.creditorId ? (players.find((p) => p.id === debt.creditorId)?.nickname ?? "") : t("debt.bank");
  const me = display.players.find((p) => p.id === meId);
  const tiles = mine && meId ? mortgageableTiles(display, meId) : [];

  if (!mine) {
    return (
      <p className="relative text-center text-ink-muted" style={{ fontSize: "calc(var(--b) * 0.0135)" }} role="status" data-debt="other">
        {t("debt.other", { name: debtor?.nickname ?? "" })}
      </p>
    );
  }
  return (
    <div className="relative flex w-[min(92%,26rem)] flex-col gap-2 rounded-2xl border border-danger bg-danger-soft/60 p-3" role="alert" data-debt="mine">
      <p className="text-center font-semibold text-ink">{t("debt.owe", { amount: money(debt.amount), creditor })}</p>
      <p className="text-center text-xs text-ink-muted tabular-nums">{t("debt.cash", { amount: money(me?.cash ?? 0) })}</p>
      {tiles.length > 0 && (
        <ul className="flex max-h-32 flex-wrap justify-center gap-1.5 overflow-y-auto">
          {tiles.map((i) => (
            <li key={i}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void mortgageTile(i)}
                data-mortgage-tile={i}
                className="cursor-pointer rounded-lg border border-line bg-surface-raised px-2 py-1 text-xs font-semibold text-ink transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t(BOARD_LAYOUT[i]!.nameKey)} (+{money(mortgageValue(BOARD_LAYOUT[i]!.price!))})
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="gold" size="sm" disabled={busy || (me?.cash ?? 0) < debt.amount} onClick={() => void payDebt()}>
          {t("debt.pay")}
        </Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void declareBankruptcy()}>
          {t("debt.bankrupt")}
        </Button>
      </div>
    </div>
  );
}
