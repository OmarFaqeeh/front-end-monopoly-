"use client";
// The trade window. Compose: pick what you give and what you ask for (properties from both sides and cash with a
// slider, like trimming a clip) and send it. View: look at any offer; the recipient can accept or decline it, the sender
// can cancel it. Your side is on the right, the other player's on the left. Accepting swaps the properties and moves the
// cash on the server.
import clsx from "clsx";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import PlayerAvatar from "@/components/room/PlayerAvatar";
import { accentColor } from "@/config/characters";
import { acceptTrade, cancelTrade, proposeTrade, rejectTrade } from "@/lib/gameClient";
import { formatMoney } from "@/lib/money";
import type { GameSnapshot, TradeOffer, TradeSide } from "@/shared/events";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore, type RoomPlayer } from "@/store/roomStore";
import TileChip from "./TileChip";

const money = (n: number) => formatMoney(n, { suffix: true });
const STEP = 10;

/** Properties a player owns that can be traded (no buildings), plus those that cannot (shown disabled). */
function ownedTiles(game: GameSnapshot, ownerId: string): { index: number; level: number }[] {
  return Object.entries(game.properties)
    .filter(([, p]) => p.ownerId === ownerId)
    .map(([k, p]) => ({ index: Number(k), level: p.level }))
    .sort((a, b) => a.index - b.index);
}

function CashBar({
  label,
  value,
  max,
  color,
  onChange,
  readOnly,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="rounded-xl border border-line bg-surface-sunken/70 px-3 py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs text-ink-muted">
        <span>{label}</span>
        <span className="text-sm font-bold text-ink tabular-nums" data-cash-offer="">
          {money(value)}
        </span>
      </div>
      <input
        type="range"
        className="trade-range"
        min={0}
        max={Math.max(max, 0)}
        step={STEP}
        value={value}
        disabled={readOnly || max <= 0}
        aria-label={label}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{ ["--pct" as string]: `${pct}%`, ["--c" as string]: color }}
      />
    </div>
  );
}

function Column({
  player,
  game,
  isMe,
  tiles,
  selected,
  onToggle,
  cashLabel,
  cashValue,
  cashMax,
  onCash,
  readOnly,
  title,
}: {
  player: RoomPlayer | undefined;
  game: GameSnapshot;
  isMe: boolean;
  tiles: { index: number; level: number }[];
  selected: number[];
  onToggle?: (index: number) => void;
  cashLabel: string;
  cashValue: number;
  cashMax: number;
  onCash?: (v: number) => void;
  readOnly: boolean;
  title: string;
}) {
  const t = useTranslations("trade.dialog");
  const color = accentColor(player?.characterId ?? undefined);
  const cash = game.players.find((p) => p.id === player?.id)?.cash ?? 0;
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3" aria-label={title} data-trade-side={isMe ? "mine" : "theirs"}>
      <CashBar label={cashLabel} value={cashValue} max={cashMax} color={color} onChange={onCash} readOnly={readOnly} />
      <div className="flex items-center gap-3 rounded-xl px-1">
        <PlayerAvatar characterId={player?.characterId} size="md" />
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-semibold text-ink">
            {player?.nickname ?? "?"}
            {isMe && <span className="ms-2 text-xs font-semibold text-ink-muted">({t("youLabel")})</span>}
          </p>
          <p className="text-xs text-ink-muted tabular-nums">{t("budget", { amount: money(cash) })}</p>
        </div>
      </div>
      <div className="flex min-h-24 flex-col gap-1.5 overflow-y-auto pe-1" style={{ maxHeight: "min(40vh, 320px)" }}>
        {tiles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm text-ink-muted">{t("noLands")}</p>
        ) : (
          tiles.map((x) => (
            <TileChip
              key={x.index}
              index={x.index}
              color={color}
              selected={selected.includes(x.index)}
              disabled={x.level > 0}
              disabledReason={t("hasBuildings")}
              onToggle={onToggle && !readOnly ? () => onToggle(x.index) : undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function TradeDialog() {
  const t = useTranslations();
  const ui = useGameStore((s) => s.tradeUi);
  const game = useGameStore((s) => s.display);
  const meId = useRoomStore((s) => s.meId);
  const players = useRoomStore((s) => s.players);
  const close = () => useGameStore.getState().patch({ tradeUi: null });

  useEffect(() => {
    if (!ui) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ui]);

  if (!ui || ui.kind === "picker" || !game || !meId) return null;
  const key = ui.kind === "compose" ? `compose-${ui.partnerId}` : `view-${ui.tradeId}`;
  return <Inner key={key} ui={ui} game={game} meId={meId} players={players} onClose={close} t={t} />;
}

function Inner({
  ui,
  game,
  meId,
  players,
  onClose,
  t,
}: {
  ui: { kind: "compose"; partnerId: string } | { kind: "view"; tradeId: string };
  game: GameSnapshot;
  meId: string;
  players: RoomPlayer[];
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const busyAnim = useGameStore((s) => s.busy);
  const trade: TradeOffer | undefined = ui.kind === "view" ? game.trades.find((x) => x.id === ui.tradeId) : undefined;
  const fromId = ui.kind === "compose" ? meId : (trade?.fromId ?? meId);
  const toId = ui.kind === "compose" ? ui.partnerId : (trade?.toId ?? meId);
  const person = (id: string) => players.find((p) => p.id === id);
  const cashOf = (id: string) => game.players.find((p) => p.id === id)?.cash ?? 0;

  const [give, setGive] = useState<TradeSide>({ tiles: [], cash: 0 });
  const [get, setGet] = useState<TradeSide>({ tiles: [], cash: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compose = ui.kind === "compose";
  const shownGive = compose ? give : (trade?.give ?? give);
  const shownGet = compose ? get : (trade?.get ?? get);
  const pending = trade?.status === "pending";
  const iAmRecipient = !!trade && trade.toId === meId;
  const iAmSender = !!trade && trade.fromId === meId;

  const toggle = (side: "give" | "get", index: number) => {
    const set = side === "give" ? setGive : setGet;
    set((s) => ({ ...s, tiles: s.tiles.includes(index) ? s.tiles.filter((x) => x !== index) : [...s.tiles, index].sort((a, b) => a - b) }));
  };

  const mineTiles = useMemo(() => {
    const all = ownedTiles(game, fromId);
    return compose ? all : all.filter((x) => shownGive.tiles.includes(x.index));
  }, [game, fromId, compose, shownGive.tiles]);
  const theirTiles = useMemo(() => {
    const all = ownedTiles(game, toId);
    return compose ? all : all.filter((x) => shownGet.tiles.includes(x.index));
  }, [game, toId, compose, shownGet.tiles]);

  const empty = shownGive.tiles.length + shownGet.tiles.length === 0 && shownGive.cash === 0 && shownGet.cash === 0;

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const code = await action();
    setBusy(false);
    if (code === null) onClose();
    else setError(t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.UNKNOWN"));
  }

  const names = { from: person(fromId)?.nickname ?? "", to: person(toId)?.nickname ?? "" };
  const title = compose ? t("trade.dialog.composeTitle", { name: names.to }) : t("trade.dialog.viewTitle", names);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/55 p-3 backdrop-blur-sm sm:p-6"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      data-trade-dialog={compose ? "compose" : "view"}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="my-auto w-full max-w-4xl rounded-3xl border border-accent/50 bg-surface-raised p-4 shadow-card sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-semibold text-ink">{title}</h2>
            {trade && (
              <span
                data-trade-status={trade.status}
                className={clsx(
                  "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                  trade.status === "pending" && "bg-accent-soft text-ink",
                  trade.status === "accepted" && "bg-brand-soft text-ink",
                  (trade.status === "rejected" || trade.status === "cancelled") && "bg-danger-soft text-ink",
                )}
              >
                {t(`trade.status.${trade.status}`)}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t("trade.dialog.close")} className="btn btn-quiet btn-sm btn-square shrink-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {ui.kind === "view" && !trade ? (
          <p className="py-8 text-center text-ink-muted">{t("errors.TRADE_NOT_FOUND")}</p>
        ) : (
          // First in the DOM = the sender (right on screen), second = the recipient (left).
          <div className="flex flex-col gap-5 md:flex-row-reverse md:gap-6">
            <Column
              player={person(fromId)}
              game={game}
              isMe={fromId === meId}
              tiles={mineTiles}
              selected={shownGive.tiles}
              onToggle={(i) => toggle("give", i)}
              cashLabel={compose ? t("trade.dialog.youGive") : t("trade.dialog.gives", { amount: money(shownGive.cash) })}
              cashValue={shownGive.cash}
              cashMax={compose ? cashOf(fromId) : Math.max(shownGive.cash, 0)}
              onCash={(v) => setGive((s) => ({ ...s, cash: v }))}
              readOnly={!compose}
              title={names.from}
            />
            <Column
              player={person(toId)}
              game={game}
              isMe={toId === meId}
              tiles={theirTiles}
              selected={shownGet.tiles}
              onToggle={(i) => toggle("get", i)}
              cashLabel={compose ? t("trade.dialog.youAsk") : t("trade.dialog.asks", { amount: money(shownGet.cash) })}
              cashValue={shownGet.cash}
              cashMax={compose ? cashOf(toId) : Math.max(shownGet.cash, 0)}
              onCash={(v) => setGet((s) => ({ ...s, cash: v }))}
              readOnly={!compose}
              title={names.to}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <div className="sticky bottom-[-1rem] z-10 -mx-1 mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-raised px-1 pb-1 pt-4 sm:static sm:mx-0 sm:px-0">
          {compose ? (
            <>
              <Button variant="quiet" size="md" onClick={onClose}>
                {t("trade.dialog.discard")}
              </Button>
              <Button variant="gold" size="md" disabled={busy || empty} onClick={() => void run(() => proposeTrade(toId, give, get))}>
                {busy ? t("trade.dialog.sending") : t("trade.dialog.send")}
              </Button>
            </>
          ) : pending && iAmRecipient ? (
            <>
              <Button variant="outline" size="md" disabled={busy} onClick={() => void run(() => rejectTrade(trade!.id))}>
                {t("trade.dialog.reject")}
              </Button>
              <Button variant="gold" size="md" disabled={busy || busyAnim} onClick={() => void run(() => acceptTrade(trade!.id))}>
                {t("trade.dialog.accept")}
              </Button>
            </>
          ) : pending && iAmSender ? (
            <Button variant="outline" size="md" disabled={busy} onClick={() => void run(() => cancelTrade(trade!.id))}>
              {t("trade.dialog.cancelOffer")}
            </Button>
          ) : (
            <Button variant="outline" size="md" onClick={onClose}>
              {t("trade.dialog.close")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
