"use client";
// A property in a trade: flag (or harbor / utility icon), name and price. Selectable in the offer editor.
import clsx from "clsx";
import { Anchor, Check, Droplets, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { FLAGS } from "@/components/board/flags";
import { BOARD_LAYOUT } from "@/config/boardLayout";
import { formatMoney } from "@/lib/money";

export default function TileChip({
  index,
  selected,
  disabled,
  disabledReason,
  onToggle,
  color,
}: {
  index: number;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  /** Selection color (the side's player color). */
  color?: string;
  /** Without it the chip is read-only. */
  onToggle?: () => void;
}) {
  const t = useTranslations();
  const tile = BOARD_LAYOUT[index]!;
  const Flag = tile.flag ? FLAGS[tile.flag] : null;
  const Icon = tile.kind === "harbor" ? Anchor : tile.icon === "droplets" ? Droplets : Sun;
  const name = t(tile.nameKey);

  const body = (
    <>
      <span className="flex size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-surface-raised" aria-hidden="true">
        {Flag ? <Flag /> : <Icon size={18} strokeWidth={1.5} className="m-auto text-brand-strong" />}
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-sm font-semibold text-ink">{name}</span>
        <span className="block truncate text-xs text-ink-muted">{disabled && disabledReason ? disabledReason : formatMoney(tile.price ?? 0, { suffix: true })}</span>
      </span>
      {selected && <Check size={16} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-ink" />}
    </>
  );
  const base = "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors duration-200";
  const style = { ["--c" as string]: color ?? "var(--accent)" };
  const tone = selected ? "trade-chip-selected" : "border-line bg-surface-sunken/70";

  if (!onToggle) {
    return (
      <div className={clsx(base, tone)} style={style} data-trade-tile={index}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!selected}
      aria-label={name}
      disabled={disabled}
      onClick={onToggle}
      data-trade-tile={index}
      style={style}
      className={clsx(base, tone, disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent")}
    >
      {body}
    </button>
  );
}
