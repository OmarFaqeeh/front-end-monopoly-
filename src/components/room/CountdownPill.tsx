"use client";
// Host-only pill while alone: "Room closes in 1:42 if nobody joins" (clock-skew safe via the server offset).
import { Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { formatCountdown, remainingMs } from "@/lib/countdown";
import { useRoomStore } from "@/store/roomStore";

export default function CountdownPill() {
  const t = useTranslations("room");
  const expiresAt = useRoomStore((s) => s.expiresAt);
  const offset = useRoomStore((s) => s.clockOffset);
  const isHost = useRoomStore((s) => s.players.find((p) => p.id === s.meId)?.isHost ?? false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAt == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!isHost || expiresAt == null) return null;
  const time = formatCountdown(remainingMs(expiresAt, offset, now));

  return (
    <div
      role="timer"
      aria-live="off"
      className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-ink shadow-card"
    >
      <Hourglass size={16} strokeWidth={1.5} aria-hidden="true" className="text-brand-strong" />
      <span>{t("countdown", { time })}</span>
    </div>
  );
}
