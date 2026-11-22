"use client";
// Reusable zone that lays out several character tokens: size, rows and overlap come from tokenLayout(count).
// Sizes use container units (cqh) of the zone, so everything scales with the board. No Start-tile code here.
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import CharacterToken from "@/components/room/CharacterToken";
import { splitRows, tokenLayout } from "@/lib/tokenSize";
import type { RoomPlayer } from "@/store/roomStore";

interface Tip {
  x: number;
  y: number;
  text: string;
}

export default function TokenZone({
  players,
  className,
  style,
  focusable = true,
}: {
  /** Seat order: host first; later seats are drawn on top of earlier ones. */
  players: readonly RoomPlayer[];
  className?: string;
  style?: React.CSSProperties;
  /** Pawns inside a tile button must not be tab stops. */
  focusable?: boolean;
}) {
  const reduce = useReducedMotion();
  const [tip, setTip] = useState<Tip | null>(null);
  const { sizePct, rows, overlapPct } = tokenLayout(players.length);
  const lines = splitRows(players, rows);
  const size = `calc(100cqh * ${sizePct / 100})`;
  // A pawn glides from tile to tile over about one step of the walk (slow, smooth, no bounce).
  const transition = reduce ? { duration: 0 } : { duration: 0.5, ease: [0.45, 0, 0.25, 1] as [number, number, number, number] };

  const show = useCallback((el: HTMLElement, text: string) => {
    const r = el.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, text });
  }, []);

  let seat = 0;
  return (
    <div
      className={className}
      style={{ containerType: "size", overflow: "visible", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...style }}
    >
      {lines.map((line, row) => (
        <div key={row} className="flex w-full items-end justify-center" style={{ height: `${100 / rows}%` }}>
          {line.map((p, i) => {
            const z = ++seat;
            return (
              <motion.div
                key={p.id}
                layout
                layoutId={`pawn-${p.id}`}
                data-pawn={p.id}
                transition={transition}
                tabIndex={focusable ? 0 : -1}
                role="group"
                aria-label={p.nickname}
                onPointerEnter={(e) => show(e.currentTarget, p.nickname)}
                onPointerLeave={() => setTip(null)}
                onFocus={(e) => show(e.currentTarget, p.nickname)}
                onBlur={() => setTip(null)}
                className="relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                style={{
                  width: size,
                  height: size,
                  zIndex: z,
                  marginInlineStart: i === 0 ? 0 : `calc(${size} * ${-overlapPct / 100})`,
                }}
              >
                <CharacterToken characterId={p.characterId} size="fill" />
              </motion.div>
            );
          })}
        </div>
      ))}
      {tip &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 text-xs font-semibold whitespace-nowrap text-surface shadow-card"
            style={{ left: tip.x, top: tip.y - 6 }}
          >
            {tip.text}
          </span>,
          document.body,
        )}
    </div>
  );
}
