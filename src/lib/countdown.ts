// Countdown helpers (clock-skew safe: the server sends expiresAt and serverNow).
/** m:ss for a remaining time in ms (never negative). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Remaining ms until the server deadline, using the offset measured when the snapshot arrived. */
export function remainingMs(expiresAt: number, clockOffset: number, now = Date.now()): number {
  return Math.max(0, expiresAt - (now + clockOffset));
}
