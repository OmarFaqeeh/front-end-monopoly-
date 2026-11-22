"use client";
// Tile info card: anchored popover on tablet/desktop, bottom sheet on phones. Not modal.
import clsx from "clsx";
import { Hotel, House, Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import CharacterToken from "@/components/room/CharacterToken";
import { BOARD_LAYOUT, type TileData } from "@/config/boardLayout";
import { tileInfo } from "@/config/tileInfo";
import { tileSide } from "@/lib/boardGrid";
import { buildCheck } from "@/lib/build";
import { buildOn, mortgageTile, unmortgageTile } from "@/lib/gameClient";
import { mortgageCheck } from "@/lib/mortgage";
import { formatMoney } from "@/lib/money";
import { RULES, harborRent, mortgageValue, rentLevels, unmortgageCost } from "@/shared/rent";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import EmblemBackdrop from "./EmblemBackdrop";
import FlagBackdrop from "./FlagBackdrop";
import { emblemFor } from "./emblems";
import { FLAGS } from "./flags";

const CARD_W = 300;
const GAP = 12;
const MARGIN = 8;

const money = (n: number) => formatMoney(n, { suffix: true });

const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isNarrow = () => window.matchMedia("(max-width: 639px)").matches;

interface Placement {
  left: number;
  top: number;
  maxHeight: number;
  arrow: { edge: "top" | "bottom" | "left" | "right"; offset: number };
}

function FlagBadge({ code, size, ring }: { code: NonNullable<TileData["flag"]>; size: number; ring?: boolean }) {
  const Flag = FLAGS[code];
  return (
    <span
      className={clsx("flex shrink-0 overflow-hidden rounded-full ring-2", ring ? "ring-accent" : "ring-surface-raised")}
      style={{ width: size, height: size }}
    >
      <Flag />
    </span>
  );
}

/** A stat box. With `build` it is a button: clicking it builds (the House and Hotel boxes of your own property). */
function Stat({
  icon,
  label,
  value,
  build,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  build?: { kind: "house" | "hotel"; disabled: boolean; ariaLabel: string; onBuild: () => void };
}) {
  const inner = (
    <>
      <span className="text-brand-strong" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[11px] tracking-wide text-ink-muted uppercase">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </>
  );
  const base = "flex flex-1 flex-col items-center gap-1 rounded-xl border border-line bg-surface-sunken/70 px-2 py-2.5 text-center";
  if (!build) return <div className={base}>{inner}</div>;
  return (
    <button
      type="button"
      data-build={build.kind}
      aria-label={build.ariaLabel}
      disabled={build.disabled}
      onClick={build.onBuild}
      className={clsx(
        base,
        "transition-colors duration-200",
        build.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer border-accent/60 hover:bg-accent-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      {inner}
    </button>
  );
}

export default function TileInfoCard({
  index,
  boardRef,
  onClose,
}: {
  index: number;
  boardRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const t = useTranslations();
  const tile = BOARD_LAYOUT[index]!;
  const info = tileInfo(index);
  const players = useRoomStore((s) => s.players);
  const meId = useRoomStore((s) => s.meId);
  const display = useGameStore((s) => s.display);
  const busy = useGameStore((s) => s.busy);
  const ownership = display?.properties[index];
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow, () => false);
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const name = t(tile.nameKey);
  const owner = ownership ? players.find((p) => p.id === ownership.ownerId) : undefined;

  // Focus moves to the close button on open; back to the tile on close.
  useEffect(() => {
    closeRef.current?.focus();
    const tileEl = boardRef.current?.querySelector<HTMLElement>(`[data-tile="${index}"]`);
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body) tileEl?.focus();
    };
  }, [index, boardRef]);

  // Esc closes; a pointer press outside the card (and outside any tile) closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("[data-tile]") || cardRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [onClose]);

  // Anchored placement (tablet/desktop): toward the board center, clamped inside the board.
  useEffect(() => {
    const board = boardRef.current;
    const card = cardRef.current;
    if (!board || !card || narrow) return;
    const measure = () => {
      const tileEl = board.querySelector<HTMLElement>(`[data-tile="${index}"]`);
      if (!tileEl) return;
      const b = board.getBoundingClientRect();
      const r = tileEl.getBoundingClientRect();
      const tl = r.left - b.left;
      const tt = r.top - b.top;
      const cx = tl + r.width / 2;
      const cy = tt + r.height / 2;
      const maxHeight = b.height - MARGIN * 2;
      const h = Math.min(card.offsetHeight, maxHeight);
      const side = tileSide(index);
      const below = side === "top" || index === 0 || index === 10;
      const above = side === "bottom" || index === 20 || index === 30;
      let left: number;
      let top: number;
      let edge: Placement["arrow"]["edge"];
      if (below) {
        left = cx - CARD_W / 2;
        top = tt + r.height + GAP;
        edge = "top";
      } else if (above) {
        left = cx - CARD_W / 2;
        top = tt - GAP - h;
        edge = "bottom";
      } else if (side === "left") {
        left = tl + r.width + GAP;
        top = cy - h / 2;
        edge = "left";
      } else {
        left = tl - GAP - CARD_W;
        top = cy - h / 2;
        edge = "right";
      }
      left = Math.min(Math.max(left, MARGIN), b.width - CARD_W - MARGIN);
      top = Math.min(Math.max(top, MARGIN), b.height - h - MARGIN);
      const offset = edge === "top" || edge === "bottom" ? cx - left : cy - top;
      setPlacement({ left, top, maxHeight, arrow: { edge, offset: Math.min(Math.max(offset, 22), (edge === "top" || edge === "bottom" ? CARD_W : h) - 22) } });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    ro.observe(card);
    return () => ro.disconnect();
  }, [index, boardRef, narrow]);

  const emblem = emblemFor(tile);
  const isProperty = tile.kind === "property";
  const price = tile.price;
  const levels = isProperty && price != null ? rentLevels(price) : null;
  const rowKeys = ["base", "h1", "h2", "h3", "h4", "hotel"] as const;
  const activeRow = ownership ? Math.min(ownership.level, 5) : -1;
  const setTiles = isProperty ? BOARD_LAYOUT.filter((x) => x.group === tile.group) : [];

  const desc = t(info.descKey, {
    amount: money(tile.kind === "start" ? RULES.passStartSalary : (tile.amount ?? 0)),
    fine: money(RULES.jailFine),
    turns: RULES.maxJailTurns,
  });

  // Build menu: only for the owner of this property while a game runs. Enabled exactly when the server will accept it.
  const mineHere = !!display && !!ownership && ownership.ownerId === meId && isProperty;
  const houseBlock = mineHere ? buildCheck(display, meId!, index, "house") : null;
  const hotelBlock = mineHere ? buildCheck(display, meId!, index, "hotel") : null;
  const hintCode = mineHere ? (ownership.level >= 4 ? (hotelBlock ?? null) : (houseBlock ?? null)) : null;
  const hintKey = hintCode ? (`game.build.hints.${hintCode}`) : null;

  // Mortgage controls (only when the rule is on and the tile is mine).
  const mine = !!display && !!ownership && ownership.ownerId === meId && tile.price != null;
  const showMortgage = mine && display!.rules.mortgage;
  const mortgageBlock = showMortgage ? mortgageCheck(display!, meId!, index, ownership!.mortgaged ? "unmortgage" : "mortgage") : null;
  const mortgageHint = mortgageBlock && mortgageBlock !== "MORTGAGE_DISABLED" ? `mortgage.hints.${mortgageBlock}` : null;

  const body = (
    <>
      {tile.flag ? (
        <FlagBackdrop flag={tile.flag} side="top" strength={0.5} />
      ) : (
        emblem && <EmblemBackdrop emblem={emblem} side="top" strength={0.5} />
      )}

      <div className="relative flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {tile.flag ? (
            <FlagBadge code={tile.flag} size={48} />
          ) : (
            <span className="block size-12 shrink-0">{emblem}</span>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="font-heading text-2xl leading-tight font-semibold text-ink">
              {name}
            </h2>
            {info.countryKey && <p className="text-sm text-ink-muted">{t(info.countryKey)}</p>}
          </div>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("board.card.close")}
          className="btn btn-quiet btn-sm btn-square shrink-0"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {isProperty && (
        <div className="relative mt-3 flex items-center gap-2" aria-label={t("board.card.set")}>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-ink ring-1 ring-line" style={{ backgroundColor: `color-mix(in srgb, var(--group-${tile.group}) 45%, transparent)` }}>
            {t("board.card.set")}
          </span>
          <span className="flex items-center gap-1.5">
            {setTiles.map((s) => (
              <FlagBadge key={s.index} code={s.flag!} size={22} ring={s.index === index} />
            ))}
          </span>
          <span className="ms-auto h-3 w-6 rounded-full" style={{ backgroundColor: `var(--group-${tile.group})` }} aria-hidden="true" />
        </div>
      )}

      <p className="relative mt-3 text-sm leading-relaxed text-ink">{desc}</p>

      {levels && (
        <table className="relative mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-wide text-ink-muted uppercase">
              <th className="pb-1 font-semibold">{t("board.card.when")}</th>
              <th className="pb-1 text-end font-semibold">{t("board.card.rent")}</th>
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((k, i) => (
              <tr key={k} className={clsx(i === activeRow && "bg-accent-soft text-on-accent")}>
                <td className="py-1.5 pe-2 text-ink">{t(`board.card.rows.${k}`)}</td>
                <td className="py-1.5 text-end">
                  <span className="font-bold text-ink tabular-nums">{money(levels[i]!)}</span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(levels[i]! / levels[5]!) * 100}%` }} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tile.kind === "harbor" && (
        <table className="relative mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-wide text-ink-muted uppercase">
              <th className="pb-1 font-semibold">{t("board.card.harborsOwned")}</th>
              <th className="pb-1 text-end font-semibold">{t("board.card.rent")}</th>
            </tr>
          </thead>
          <tbody>
            {RULES.harborRents.map((_, i) => (
              <tr key={i}>
                <td className="py-1.5 text-ink">{t("board.card.harborCount", { count: i + 1 })}</td>
                <td className="py-1.5 text-end font-bold text-ink tabular-nums">{money(harborRent(i + 1))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {price != null && (
        <div className="relative mt-4 flex gap-2">
          <Stat icon={<Tag size={16} strokeWidth={1.5} />} label={t("board.card.stats.price")} value={money(price)} />
          {isProperty && (
            <>
              <Stat
                icon={<House size={16} strokeWidth={1.5} />}
                label={t("board.card.stats.house")}
                value={money(RULES.houseCost)}
                build={mineHere ? { kind: "house", disabled: busy || houseBlock !== null, ariaLabel: t("game.build.house", { cost: money(RULES.houseCost) }), onBuild: () => void buildOn(index, "house") } : undefined}
              />
              <Stat
                icon={<Hotel size={16} strokeWidth={1.5} />}
                label={t("board.card.stats.hotel")}
                value={money(RULES.hotelCost)}
                build={mineHere ? { kind: "hotel", disabled: busy || hotelBlock !== null, ariaLabel: t("game.build.hotel", { cost: money(RULES.hotelCost) }), onBuild: () => void buildOn(index, "hotel") } : undefined}
              />
            </>
          )}
        </div>
      )}

      {mineHere && (
        <div className="relative mt-2" data-build-menu="">
          {hintKey && (
            <p className="text-[13px] leading-snug text-ink-muted" data-build-hint={hintCode}>
              {t(hintKey)}
            </p>
          )}
        </div>
      )}

      {isProperty && display?.rules.doubleRentSets && <p className="relative mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-ink">{t("board.card.doubleRent")}</p>}
      {(isProperty || tile.kind === "harbor" || tile.kind === "utility") && display?.rules.noRentInDetention && (
        <p className="relative mt-2 text-[13px] leading-snug text-ink-muted" data-note="noRentDetention">{t("board.card.noRentDetention")}</p>
      )}
      {ownership?.mortgaged && <p className="relative mt-2 text-[13px] font-semibold text-ink" data-note="mortgaged">{t("mortgage.info")}</p>}
      {showMortgage && (
        <div className="relative mt-3" data-mortgage-menu="">
          <button
            type="button"
            className="btn btn-outline btn-sm w-full"
            disabled={busy || mortgageBlock !== null}
            data-mortgage-action={ownership!.mortgaged ? "unmortgage" : "mortgage"}
            onClick={() => void (ownership!.mortgaged ? unmortgageTile(index) : mortgageTile(index))}
          >
            <span>
              {ownership!.mortgaged
                ? t("mortgage.unmortgage", { amount: money(unmortgageCost(tile.price!)) })
                : t("mortgage.mortgage", { amount: money(mortgageValue(tile.price!)) })}
            </span>
          </button>
          {mortgageHint && <p className="mt-1 text-[13px] leading-snug text-ink-muted">{t(mortgageHint)}</p>}
        </div>
      )}

      {isProperty && (
        <div className="relative mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm">
          <span className="text-ink-muted">{owner ? t("game.build.ownedBy", { name: "" }).replace(/\s+$/, "") : t("board.card.owner")}</span>
          {owner ? (
            <span className="ms-auto flex items-center gap-2 font-semibold text-ink">
              <CharacterToken characterId={owner.characterId} size="sm" />
              {owner.nickname}
            </span>
          ) : (
            <span className="ms-auto font-semibold text-ink">{t("board.card.unowned")}</span>
          )}
        </div>
      )}
    </>
  );

  const common = {
    ref: cardRef,
    role: "dialog" as const,
    "aria-modal": false as const,
    "aria-labelledby": titleId,
  };

  if (narrow) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-40 bg-ink/40" aria-hidden="true" />
        <div
          {...common}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-[20px] border border-accent/40 bg-surface-raised/95 px-5 pt-3 pb-6 shadow-card backdrop-blur-md"
        >
          <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
          <div className="relative overflow-hidden">{body}</div>
        </div>
      </>,
      document.body,
    );
  }

  const arrow = placement?.arrow;
  return (
    <div
      {...common}
      className={clsx(
        "absolute z-20 overflow-visible rounded-2xl border border-accent/40 bg-surface-raised/92 shadow-card backdrop-blur-md",
        !placement && "opacity-0",
      )}
      style={{ width: CARD_W, left: placement?.left ?? 0, top: placement?.top ?? 0, maxHeight: placement?.maxHeight }}
    >
      {arrow && (
        <span
          aria-hidden="true"
          className="absolute size-3 rotate-45 border border-accent/40 bg-surface-raised"
          style={{
            ...(arrow.edge === "top" && { top: -7, left: arrow.offset - 6, borderRight: 0, borderBottom: 0 }),
            ...(arrow.edge === "bottom" && { bottom: -7, left: arrow.offset - 6, borderLeft: 0, borderTop: 0 }),
            ...(arrow.edge === "left" && { left: -7, top: arrow.offset - 6, borderRight: 0, borderTop: 0 }),
            ...(arrow.edge === "right" && { right: -7, top: arrow.offset - 6, borderLeft: 0, borderBottom: 0 }),
          }}
        />
      )}
      <div className="relative max-h-[inherit] overflow-y-auto overflow-x-hidden rounded-2xl p-4" style={{ maxHeight: placement?.maxHeight }}>
        {body}
      </div>
    </div>
  );
}
