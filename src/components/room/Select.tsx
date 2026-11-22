"use client";
// Styled native select with a chevron.
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: number;
  label: string;
}

export default function Select({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: number;
  options: SelectOption[];
  onChange: (next: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <select
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 min-w-24 cursor-pointer appearance-none rounded-xl border border-line bg-surface-raised ps-3 pe-9 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.5}
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-3 my-auto text-ink-muted"
      />
    </span>
  );
}
