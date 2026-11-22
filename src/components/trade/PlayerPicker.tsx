"use client";
// "Trade with...": a modal listing every other ACTIVE player as a card (picture, name, cash, number of properties, Bot
// badge). Choosing one closes it and opens the trade editor with that partner. Players you cannot trade with right now
// (an auction or a debt is being settled) are shown disabled with the reason. Centered on desktop, a bottom sheet on
// phones; Esc and a click outside close it; Tab stays inside and focus returns to the "+" button; arrow keys move.
import clsx from "clsx";
import { Bot, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import PlayerAvatar from "@/components/room/PlayerAvatar";
import { formatMoney } from "@/lib/money";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function PlayerPicker() {
  const t = useTranslations("trade.picker");
  const titleId = useId();
  const ui = useGameStore((s) => s.tradeUi);
  const display = useGameStore((s) => s.display);
  const meId = useRoomStore((s) => s.meId);
  const players = useRoomStore((s) => s.players);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const open = ui?.kind === "picker" && !!display;
  const close = () => useGameStore.getState().patch({ tradeUi: null });

  // Remember what had the focus, move it into the dialog, give it back on close.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>("[data-partner]:not(:disabled)") ?? panel.current?.querySelector<HTMLElement>("button");
    first?.focus();
    return () => {
      const el = opener.current as HTMLElement | null;
      if (el && document.contains(el)) el.focus();
    };
  }, [open]);

  if (!open || !display) return null;

  const blocked = display.phase === "auction" ? t("reasonAuction") : display.phase === "raisingFunds" ? t("reasonDebt") : null;
  const others = display.players.filter((p) => p.id !== meId && !p.bankrupt);
  const owned = (id: string) => Object.values(display.properties).filter((p) => p.ownerId === id).length;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    const cards = [...(panel.current?.querySelectorAll<HTMLElement>("[data-partner]:not(:disabled)") ?? [])];
    const focusables = [...(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [])];
    const at = cards.indexOf(document.activeElement as HTMLElement);
    if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key) && cards.length) {
      e.preventDefault();
      const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
      cards[(Math.max(at, 0) + (at < 0 ? 0 : step) + cards.length) % cards.length]?.focus();
    } else if (e.key === "Tab" && focusables.length) {
      // focus trap
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        focusables[focusables.length - 1]!.focus();
      } else if (!e.shiftKey && i === focusables.length - 1) {
        e.preventDefault();
        focusables[0]!.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 backdrop-blur-sm sm:items-center sm:p-6"
      onPointerDown={(e) => e.target === e.currentTarget && close()}
      onKeyDown={onKeyDown}
      data-player-picker=""
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="picker-panel max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-accent/50 bg-surface-raised p-5 shadow-card sm:max-w-xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-heading text-2xl font-semibold text-ink">
              {t("title")}
            </h2>
            {blocked && <p className="mt-1 text-sm text-ink-muted">{blocked}</p>}
          </div>
          <button type="button" onClick={close} aria-label={t("close")} className="btn btn-quiet btn-sm btn-square shrink-0">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {others.length === 0 ? (
          <p className="py-6 text-center text-ink-muted">{t("empty")}</p>
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2" role="list">
            {others.map((p) => {
              const who = players.find((r) => r.id === p.id);
              const disabled = blocked !== null;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    data-partner={p.id}
                    disabled={disabled}
                    onClick={() => useGameStore.getState().patch({ tradeUi: { kind: "compose", partnerId: p.id } })}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-sunken/70 p-3 text-start transition-colors duration-200",
                      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-accent hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    )}
                  >
                    <PlayerAvatar characterId={p.characterId} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-ink">{who?.nickname ?? "?"}</span>
                        {who?.isBot && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[11px] font-bold text-ink">
                            <Bot size={12} strokeWidth={1.5} aria-hidden="true" />
                            {t("bot")}
                          </span>
                        )}
                      </span>
                      <span className="block text-sm text-ink-muted tabular-nums">{formatMoney(p.cash, { suffix: true })}</span>
                      <span className="block text-xs text-ink-muted">{t("properties", { count: owned(p.id) })}</span>
                      {disabled && <span className="mt-0.5 block text-xs font-semibold text-ink">{blocked}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
