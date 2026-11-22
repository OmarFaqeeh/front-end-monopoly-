"use client";
// Six digit boxes: numeric keypad, auto-advance, backspace goes back, paste fills all, auto-submit on the 6th digit.
// Digits always stay left-to-right (dir="ltr" on the row), in every locale.
import clsx from "clsx";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

export default function SixDigitInput({
  onComplete,
  disabled,
  invalid,
  describedBy,
  label,
  autoFocus,
}: {
  onComplete: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Returns the aria-label of box n (1-based). */
  label: (n: number) => string;
  autoFocus?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function commit(next: string[]) {
    setDigits(next);
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  }

  function fill(from: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (!only) return;
    const next = [...digits];
    let i = from;
    for (const ch of only) {
      if (i >= LENGTH) break;
      next[i++] = ch;
    }
    commit(next);
    refs.current[Math.min(i, LENGTH - 1)]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) next[i] = "";
      else if (i > 0) {
        next[i - 1] = "";
        refs.current[i - 1]?.focus();
      }
      setDigits(next);
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LENGTH - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fill(0, e.clipboardData.getData("text"));
  }

  return (
    <div dir="ltr" className="flex justify-center gap-1.5 min-[360px]:gap-2 sm:gap-3" role="group">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={LENGTH}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={label(i + 1)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) fill(i, v);
            else if (v) {
              const next = [...digits];
              next[i] = v;
              commit(next);
              if (i < LENGTH - 1) refs.current[i + 1]?.focus();
            }
          }}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          className={clsx(
            "size-10 min-[360px]:size-12 rounded-[14px] border bg-surface-raised text-center font-mono text-2xl font-semibold text-ink transition-colors duration-200 focus:border-accent focus:ring-[3px] focus:ring-accent/25 focus:outline-none disabled:opacity-60 sm:size-14",
            invalid ? "border-danger" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
