// One place to format money (currency symbol for now).
export function formatMoney(n: number, opts?: { suffix?: boolean }): string {
  // Suffix style: number, a space, then the symbol ("60 $"). Digits are never mirrored.
  return opts?.suffix ? `${n} $` : `$${n}`;
}
