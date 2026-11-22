"use client";
// Accessible switch (44x24): brand when on, line color when off.
import clsx from "clsx";

export default function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
        checked ? "bg-brand" : "bg-line",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "absolute top-0.5 size-5 rounded-full bg-surface-raised shadow-card transition-[inset-inline-start] duration-200 motion-reduce:transition-none",
          checked ? "start-[22px]" : "start-0.5",
        )}
      />
    </button>
  );
}
