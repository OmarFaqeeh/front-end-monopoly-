"use client";
// Dismissible banner on the landing page after a room was closed (?closed=expired|allleft|restart).
import { Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const read = () => new URLSearchParams(window.location.search).get("closed") ?? "";
const KNOWN = ["expired", "allleft", "restart"];

export default function ClosedBanner() {
  const t = useTranslations("landing");
  const reason = useSyncExternalStore(noopSubscribe, read, () => "");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !KNOWN.includes(reason)) return null;

  return (
    <div
      role="status"
      className="absolute inset-x-4 top-20 z-20 mx-auto flex max-w-lg items-start gap-3 rounded-[14px] border border-accent/50 bg-surface-raised px-4 py-3 text-sm text-ink shadow-card"
    >
      <Info size={18} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-strong" />
      <p className="flex-1">{t(`closed.${reason}`)}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("dismiss")}
        className="btn btn-quiet btn-sm btn-square -my-1 shrink-0"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
