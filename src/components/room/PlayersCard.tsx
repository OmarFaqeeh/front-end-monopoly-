"use client";
// Players card: one row per seated player with token, nickname and host badge. In the lobby the player's own row has
// "Change appearance"; once the game starts it is replaced by each player's cash, the current player's row gets a gold
// ring and bankrupt players are dimmed.
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Bot, Crown, Palette, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import MoneyCounter from "@/components/game/MoneyCounter";
import WithdrawButton from "@/components/game/WithdrawButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { removeBot } from "@/lib/roomClient";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import PlayerAvatar from "./PlayerAvatar";

/** "A bot joins in 7s": counts down to the server's refill time. */
function RefillHint() {
  const t = useTranslations("room.players");
  const at = useRoomStore((s) => s.botRefillAt);
  const offset = useRoomStore((s) => s.clockOffset);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (at === null) return;
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [at, offset]);
  if (at === null || now === 0) return null;
  return (
    <p className="mt-3 text-center text-xs text-ink-muted tabular-nums" role="status" data-bot-refill="">
      {t("botJoins", { n: Math.max(0, Math.ceil((at - now) / 1000)) })}
    </p>
  );
}

export default function PlayersCard() {
  const t = useTranslations("room.players");
  const tg = useTranslations("game");
  const players = useRoomStore((s) => s.players);
  const changeAppearance = useRoomStore((s) => s.changeAppearance);
  const stage = useRoomStore((s) => s.stage);
  const meId = useRoomStore((s) => s.meId);
  const display = useGameStore((s) => s.display);
  const isHost = players.find((p) => p.id === meId)?.isHost ?? false;

  // In a game the list follows the turn order.
  const order = display?.players.map((p) => p.id) ?? [];
  const rows = display ? [...players].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) : players;

  return (
    <Card className="p-5">
      <h3 className="mb-3 text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">{t("title")}</h3>
      {rows.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-4 text-sm text-ink-muted">
          <UserPlus size={20} strokeWidth={1.5} aria-hidden="true" />
          {t("emptySeat")}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((p) => {
            const game = display?.players.find((g) => g.id === p.id);
            const isCurrent = !!display && display.currentPlayerId === p.id && display.phase !== "gameOver";
            return (
              <li
                key={p.id}
                data-player-row={p.id}
                data-current={isCurrent ? "true" : undefined}
                className={clsx("group flex items-center gap-3 py-2.5", isCurrent && "-mx-2 rounded-xl px-2 ring-2 ring-accent ring-inset bg-accent-soft/40", game?.bankrupt && "opacity-50")}
              >
                <PlayerAvatar characterId={p.characterId} size="sm" />
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="min-w-0 max-w-full truncate font-semibold text-ink">{p.nickname}</span>
                  {p.isBot && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-ink" data-bot-badge="">
                      <Bot size={12} strokeWidth={1.5} aria-hidden="true" />
                      {t("bot")}
                    </span>
                  )}
                  {p.isHost && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-ink">
                      <Crown size={12} strokeWidth={1.5} aria-hidden="true" />
                      {t("host")}
                    </span>
                  )}
                  {game?.bankrupt && <span className="text-xs font-semibold text-danger">{tg("bankruptBadge")}</span>}
                </div>
                {p.isBot && isHost && !display && (
                  <button
                    type="button"
                    onClick={() => void removeBot(p.id)}
                    aria-label={t("removeAria", { name: p.nickname })}
                    title={t("removeBot")}
                    data-remove-bot={p.id}
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-danger-soft hover:text-ink focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent [@media(hover:none)]:opacity-100"
                  >
                    <X size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
                {game ? (
                  <span className="shrink-0 font-semibold text-ink" aria-label={tg("cash", { name: p.nickname })}>
                    <MoneyCounter playerId={p.id} value={game.cash} />
                  </span>
                ) : (
                  p.id === meId && (
                    <Button
                      variant="quiet"
                      size="sm"
                      className="shrink-0 whitespace-nowrap"
                      icon={<Palette size={16} strokeWidth={1.5} />}
                      onClick={changeAppearance}
                      disabled={stage === "pickCharacter"}
                    >
                      <span className="max-[419px]:sr-only">{t("change")}</span>
                    </Button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
      <RefillHint />
      <WithdrawButton />
    </Card>
  );
}
