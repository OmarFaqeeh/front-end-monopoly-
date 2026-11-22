"use client";
// A player's cash: the number counts to its new value over 900 ms and a small "+200 $" / "-50 $" floats up and
// fades next to it (success / danger token colors). Under reduced motion the number changes at once and only the
// color flashes. The value shown always comes from the displayed state (MONEY_CHANGED.newCash).
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { GAME_TIMING } from "@/config/gameTiming";
import { formatMoney } from "@/lib/money";
import { useGameStore } from "@/store/gameStore";

/** Counts from the previous value to `value` over `ms` (instant when ms is 0). */
export function useCountTo(value: number, ms: number): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    const start = from.current;
    if (ms <= 0 || start === value) {
      from.current = value;
      frame.current = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(frame.current);
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(start + (value - start) * eased);
      from.current = current;
      setShown(current);
      if (p < 1) frame.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, ms]);

  return shown;
}

export default function MoneyCounter({ playerId, value, className }: { playerId: string; value: number; className?: string }) {
  const floats = useGameStore((s) => s.floats);
  const mine = floats.filter((f) => f.playerId === playerId);
  const shown = useCountTo(value, GAME_TIMING.moneyMs * 0.6);
  const last = mine.at(-1);

  return (
    <span className={clsx("relative inline-block tabular-nums", className)} data-cash-for={playerId} data-cash={value}>
      <span key={last?.id ?? "idle"} className={clsx(last && (last.delta > 0 ? "money-flash-gain" : "money-flash-loss"))}>
        {formatMoney(shown, { suffix: true })}
      </span>
      {mine.map((f) => (
        <span
          key={f.id}
          aria-hidden="true"
          className={clsx("money-float pointer-events-none absolute end-0 bottom-full mb-0.5 text-sm font-bold whitespace-nowrap", f.delta > 0 ? "text-success" : "text-danger")}
        >
          {f.delta > 0 ? "+" : "-"}
          {formatMoney(Math.abs(f.delta), { suffix: true })}
        </span>
      ))}
    </span>
  );
}
