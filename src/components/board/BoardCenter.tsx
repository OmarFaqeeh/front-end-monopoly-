"use client";
// Board center: faint lattice, small wordmark. Lobby: welcome dice, the joined line, the host's Start button (the
// others see "Waiting for the host to start"). Game: the dice panel, the card popup and the controls of the actor.
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import CardPopup from "@/components/game/CardPopup";
import CenterControls from "@/components/game/CenterControls";
import DebtBanner from "@/components/game/DebtBanner";
import DiceStage from "@/components/game/DiceStage";
import GeometricPattern from "@/components/landing/GeometricPattern";
import Button from "@/components/ui/Button";
import { startGame } from "@/lib/gameClient";
import { formatMoney } from "@/lib/money";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import DicePair from "./DicePair";

/** A small line under the controls with the live Oasis jackpot (only when the rule is on). */
function OasisLine() {
  const t = useTranslations("oasis");
  const on = useGameStore((s) => s.display?.rules.oasisJackpot ?? false);
  const pool = useGameStore((s) => s.display?.oasisPool ?? 0);
  if (!on) return null;
  return (
    <p className="relative text-ink-muted tabular-nums" style={{ fontSize: "calc(var(--b) * 0.0125)" }} data-oasis-line="">
      {t("line", { amount: formatMoney(pool, { suffix: true }) })}
    </p>
  );
}

export default function BoardCenter() {
  const t = useTranslations();
  const code = useRoomStore((s) => s.code);
  const stage = useRoomStore((s) => s.stage);
  const players = useRoomStore((s) => s.players);
  const maxPlayers = useRoomStore((s) => s.settings.maxPlayers);
  const meId = useRoomStore((s) => s.meId);
  const inGame = useGameStore((s) => s.display !== null);
  const actionError = useGameStore((s) => s.actionError);
  const joined = stage === "lobby";
  const isHost = players.find((p) => p.id === meId)?.isHost ?? false;
  const canStart = players.length >= 2;
  const [dice, setDice] = useState({ a: 4, b: 2, key: 0 });
  const roll = () =>
    setDice((d) => ({ a: 1 + Math.floor(Math.random() * 6), b: 1 + Math.floor(Math.random() * 6), key: d.key + 1 }));

  // One welcome toss when the player joins (lobby only).
  useEffect(() => {
    if (!joined || inGame) return;
    const id = window.setTimeout(roll, 500);
    return () => window.clearTimeout(id);
  }, [joined, inGame]);

  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-col items-center justify-center"
      style={{ gridRow: "2 / 11", gridColumn: "2 / 11", gap: "calc(var(--b) * 0.012)" }}
    >
      <GeometricPattern id="board-center" className="!opacity-[0.08]" />
      <p
        className="font-heading relative font-semibold tracking-[0.14em] text-gold uppercase opacity-70"
        style={{ fontSize: "calc(var(--b) * 0.03)" }}
      >
        {t("landing.wordmark.latin")}
      </p>

      {joined && inGame && (
        <>
          <div className="relative" style={{ marginBlock: "calc(var(--b) * -0.01)", paddingBottom: "calc(var(--b) * 0.03)" }}>
            <DiceStage />
          </div>
          <CenterControls />
          <DebtBanner />
          <OasisLine />
          <CardPopup />
        </>
      )}

      {joined && !inGame && (
        <>
          <div className="relative" style={{ marginBlock: "calc(var(--b) * -0.01)" }}>
            <DicePair values={[dice.a, dice.b]} rollKey={dice.key} size="calc(var(--b) * 0.075)" interactive onRequestRoll={roll} />
          </div>
          <p className="relative text-ink-muted" style={{ fontSize: "calc(var(--b) * 0.014)" }}>
            {t("room.joined", { code: code ?? "" })}
          </p>
          {isHost ? (
            <div className="relative flex flex-col items-center gap-2">
              <Button variant="gold" size="md" arrow disabled={!canStart} onClick={() => void startGame()}>
                {t("room.start")}
              </Button>
              {!canStart && (
                <p className="text-ink-muted" style={{ fontSize: "calc(var(--b) * 0.0125)" }}>
                  {t("room.hint.waiting", { count: players.length, max: maxPlayers })}
                </p>
              )}
              {actionError && (
                <p role="alert" className="text-danger" style={{ fontSize: "calc(var(--b) * 0.0125)" }}>
                  {t.has(`errors.${actionError}`) ? t(`errors.${actionError}`) : t("errors.UNKNOWN")}
                </p>
              )}
            </div>
          ) : (
            <p className="relative text-ink-muted" style={{ fontSize: "calc(var(--b) * 0.0125)" }}>
              {t("game.waitingForHost")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
