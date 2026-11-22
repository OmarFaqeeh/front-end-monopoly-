"use client";
// Buttons in the board center for the player whose turn it is, per phase; everybody else sees who is acting.
// All buttons stay disabled while the animation queue is playing (store.busy).
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { buyProperty, payJailFine, rollDice, skipProperty, stayInJail } from "@/lib/gameClient";
import { formatMoney } from "@/lib/money";
import { RULES } from "@/shared/rent";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

const FONT = { fontSize: "calc(var(--b) * 0.0135)" } as const;

export default function CenterControls() {
  const t = useTranslations();
  const display = useGameStore((s) => s.display);
  const busy = useGameStore((s) => s.busy);
  const actionError = useGameStore((s) => s.actionError);
  const showingRoll = useGameStore((s) => s.zoom !== null);
  const meId = useRoomStore((s) => s.meId);
  const players = useRoomStore((s) => s.players);
  if (!display || display.phase === "gameOver") return null;

  const current = display.players.find((p) => p.id === display.currentPlayerId);
  const currentName = players.find((p) => p.id === display.currentPlayerId)?.nickname ?? "";
  const mine = display.currentPlayerId === meId && current && !current.bankrupt;
  const pending = display.pendingDecision;

  const note = (text: string) => (
    <p className="relative text-center text-ink-muted" style={FONT} role="status">
      {text}
    </p>
  );
  const error = actionError ? (
    <p role="alert" className="relative text-center text-danger" style={FONT}>
      {t.has(`errors.${actionError}`) ? t(`errors.${actionError}`) : t("errors.UNKNOWN")}
    </p>
  ) : null;

  let body: React.ReactNode = null;
  if (display.phase === "awaitingRoll") {
    body = mine ? (
      <Button variant="gold" size="md" arrow disabled={busy} onClick={() => void rollDice()}>
        {t("game.roll")}
      </Button>
    ) : (
      note(t("game.turn.waitingRoll", { name: currentName }))
    );
  } else if (display.phase === "awaitingDecision" && pending) {
    const price = pending.price;
    const cash = current?.cash ?? 0;
    body = mine ? (
      <div className="relative flex flex-col items-center gap-2">
        <p className="text-center font-semibold text-ink" style={FONT}>
          {t(`board.tiles.t${String(pending.tileIndex).padStart(2, "0")}`)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="gold" size="md" disabled={busy || cash < price} onClick={() => void buyProperty()}>
            {t("game.buy", { price: formatMoney(price, { suffix: true }) })}
          </Button>
          <Button variant="outline" size="md" disabled={busy} onClick={() => void skipProperty()}>
            {t("game.skip")}
          </Button>
        </div>
        {cash < price && note(t("game.noCash"))}
      </div>
    ) : (
      note(t("game.deciding", { name: currentName }))
    );
  } else if (display.phase === "awaitingJailChoice") {
    const forced = (current?.jailTurns ?? 0) >= RULES.maxJailTurns;
    const cash = current?.cash ?? 0;
    body = mine ? (
      <div className="relative flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="gold" size="md" disabled={busy || (!forced && cash < RULES.jailFine)} onClick={() => void payJailFine()}>
            {t("game.jail.pay", { fine: formatMoney(RULES.jailFine, { suffix: true }) })}
          </Button>
          {!forced && (
            <Button variant="outline" size="md" disabled={busy} onClick={() => void stayInJail()}>
              {t("game.jail.stay")}
            </Button>
          )}
        </div>
        {forced && note(t("game.jail.mustPay"))}
      </div>
    ) : (
      note(t("game.jail.waiting", { name: currentName }))
    );
  }

  return (
    <div
      className="relative flex flex-col items-center gap-2 transition-opacity duration-300"
      style={{ opacity: showingRoll ? 0 : 1 }}
      data-controls={display.phase}
      data-busy={busy ? "true" : "false"}
    >
      {body}
      {error}
    </div>
  );
}
