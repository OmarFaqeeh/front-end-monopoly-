"use client";
// Guest step 1 (always for invite links): enter a name (prefilled from the last visit), then join the room.
import { CircleAlert, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { joinAsGuest } from "@/lib/roomClient";
import { useRoomStore } from "@/store/roomStore";
import { useUiStore } from "@/store/uiStore";

const NICKNAME = /^[\p{L}\p{M}\p{N} _-]{1,16}$/u;

export default function NameStep() {
  const t = useTranslations();
  const initial = useRoomStore((s) => s.nickname);
  const setNickname = useUiStore((s) => s.setNickname);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = value.trim();
    if (!NICKNAME.test(clean)) {
      setError("NICKNAME_INVALID");
      return;
    }
    setBusy(true);
    const result = await joinAsGuest(clean);
    setBusy(false);
    if (result) setError(result);
    else setNickname(clean);
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-6">
      <form
        onSubmit={submit}
        noValidate
        aria-label={t("room.name.title")}
        className="flex w-full max-w-sm flex-col gap-4 rounded-[20px] border border-accent/40 bg-surface-raised/90 p-6 shadow-card backdrop-blur-md sm:p-7"
      >
        <div className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">{t("room.name.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("room.name.subtitle")}</p>
        </div>
        <label htmlFor="guest-nickname" className="sr-only">
          {t("room.name.label")}
        </label>
        <div className="relative">
          <User size={18} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 my-auto text-ink-muted" />
          <input
            id="guest-nickname"
            autoFocus
            value={value}
            maxLength={40}
            autoComplete="nickname"
            placeholder={t("room.name.placeholder")}
            aria-invalid={!!error}
            aria-describedby={error ? "guest-nickname-error" : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="h-14 w-full rounded-[14px] border border-line bg-surface-sunken ps-12 pe-4 text-start text-base text-ink focus:border-accent focus:ring-[3px] focus:ring-accent/25 focus:outline-none"
          />
        </div>
        {error && (
          <p id="guest-nickname-error" role="alert" className="inline-flex items-center gap-2 rounded-lg border border-danger bg-surface-raised px-3 py-2 text-sm text-danger">
            <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            {t(`errors.${["NICKNAME_INVALID", "NICKNAME_TAKEN", "RATE_LIMITED", "NETWORK_ERROR"].includes(error) ? error : "UNKNOWN"}`)}
          </p>
        )}
        <Button type="submit" variant="gold" size="lg" block arrow disabled={busy}>
          {busy ? t("room.name.joining") : t("room.name.continue")}
        </Button>
      </form>
    </div>
  );
}
