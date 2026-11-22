"use client";
// A Fortune or Vault card flips in over the board center showing its text and amount for the card time.
import clsx from "clsx";
import { Sparkles, Vault } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import { useGameStore } from "@/store/gameStore";

export default function CardPopup() {
  const t = useTranslations("game");
  const card = useGameStore((s) => s.card);
  if (!card) return null;
  const gain = card.amount >= 0;
  const amount = formatMoney(Math.abs(card.amount), { suffix: true });

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" data-card={card.cardId}>
      <div
        role="status"
        className={clsx(
          "card-flip flex flex-col items-center gap-2 rounded-2xl border-2 bg-surface-raised px-5 py-4 text-center shadow-card",
          card.deck === "fortune" ? "border-accent" : "border-brand",
        )}
        style={{ width: "calc(var(--b) * 0.3)" }}
      >
        <span className="inline-flex items-center gap-1.5 font-heading font-semibold tracking-[0.12em] text-gold uppercase" style={{ fontSize: "calc(var(--b) * 0.014)" }}>
          {card.deck === "fortune" ? <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" /> : <Vault size={16} strokeWidth={1.5} aria-hidden="true" />}
          {t("card.label", { deck: t(`deck.${card.deck}`) })}
        </span>
        <p className="text-ink" style={{ fontSize: "calc(var(--b) * 0.0165)", lineHeight: 1.3 }}>
          {t(`cards.${card.deck}.${card.cardId}`)}
        </p>
        <p className={clsx("font-bold tabular-nums", gain ? "text-success" : "text-danger")} style={{ fontSize: "calc(var(--b) * 0.026)" }}>
          {gain ? t("card.gain", { amount }) : t("card.loss", { amount })}
        </p>
      </div>
    </div>
  );
}
