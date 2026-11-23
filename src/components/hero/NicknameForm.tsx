"use client";
// Hero panel: nickname, Play now (join by Room ID), "or" divider, create a private room, microcopy.
import { CircleAlert, KeyRound, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { ApiError, createRoom, warmUpBackend } from "@/lib/api";
import { saveCredentials } from "@/lib/roomSession";
import { useUiStore } from "@/store/uiStore";

export const NICKNAME_INPUT_ID = "nickname-input";

const noopSubscribe = () => () => {};
const NICKNAME = /^[\p{L}\p{M}\p{N} _-]{1,16}$/u;
const needsNickname = () => new URLSearchParams(window.location.search).get("need") === "nickname";

export default function NicknameForm() {
  useEffect(() => {
    warmUpBackend();
    const id = setInterval(warmUpBackend, 4 * 60_000);
    return () => clearInterval(id);
  }, []);
  const t = useTranslations("landing");
  const te = useTranslations("errors");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { nickname, loadNickname, setNickname } = useUiStore();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? nickname;
  const [error, setError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  // Arriving from a guarded page (/room/{code} without a nickname) shows the error and focuses the input.
  const sentBack = useSyncExternalStore(noopSubscribe, needsNickname, () => false);
  const showError = error || !!apiError || (sentBack && !dismissed && value.trim().length === 0);

  useEffect(() => {
    loadNickname();
  }, [loadNickname]);

  useEffect(() => {
    if (sentBack) inputRef.current?.focus();
  }, [sentBack]);

  function validNickname(): string | null {
    const clean = value.trim();
    if (NICKNAME.test(clean)) return clean;
    setError(true);
    const field = fieldRef.current;
    if (field) {
      // Restart the CSS shake without remounting the input (keeps focus).
      field.classList.remove("shake-once");
      void field.offsetWidth;
      field.classList.add("shake-once");
    }
    inputRef.current?.focus();
    return null;
  }

  /** Play: the nickname is entered here, the Room ID on the next page. */
  function play(e: FormEvent) {
    e.preventDefault();
    const clean = validNickname();
    if (!clean) return;
    setNickname(clean);
    router.push("/play");
  }

  async function createPrivate() {
    const clean = validNickname();
    if (!clean || busy) return;
    setNickname(clean);
    setBusy(true);
    setApiError(null);
    try {
      const room = await createRoom(clean);
      saveCredentials(room.code, { playerId: room.playerId, playerToken: room.playerToken });
      router.push(`/room/${room.code}`);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "NETWORK_ERROR";
      if (code === "NICKNAME_INVALID") setError(true);
      else setApiError(code);
      setBusy(false);
    }
  }

  const micro = ["free", "noSignup", "players"] as const;

  return (
    <div className="enter-up mt-8 flex w-full max-w-md flex-col items-center [animation-delay:900ms]">
      <div className="w-full rounded-[20px] border border-(--hero-gold-2)/30 bg-(--hero-ink)/55 p-6 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.7)] backdrop-blur-md">
        <form onSubmit={play} noValidate className="flex flex-col gap-3">
          <label htmlFor={NICKNAME_INPUT_ID} className="sr-only">
            {t("nicknameLabel")}
          </label>
          <div ref={fieldRef} className="relative">
            <User
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-4 my-auto text-(--hero-text)/70"
            />
            <input
              ref={inputRef}
              id={NICKNAME_INPUT_ID}
              type="text"
              value={value}
              maxLength={32}
              autoComplete="nickname"
              placeholder={t("nicknamePlaceholder")}
              aria-invalid={showError}
              aria-describedby={showError ? "nickname-error" : undefined}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(false);
                setApiError(null);
                setDismissed(true);
              }}
              className="h-14 w-full rounded-[14px] border border-(--hero-text)/18 bg-(--hero-text)/8 ps-12 pe-4 text-start text-base text-(--hero-text) transition-shadow duration-200 placeholder:text-(--hero-text)/70 focus:border-(--hero-gold-2) focus:ring-[3px] focus:ring-(--hero-gold-2)/25 focus:outline-none"
            />
          </div>
          {showError && (
            <p
              id="nickname-error"
              role="alert"
              className="inline-flex items-center gap-2 rounded-lg border border-danger bg-surface-raised px-3 py-2 text-sm text-danger"
            >
              <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              {apiError ? te(["RATE_LIMITED", "NETWORK_ERROR", "INTERNAL"].includes(apiError) ? apiError : "UNKNOWN") : sentBack && !error ? t("needNickname") : t("nicknameError")}
            </p>
          )}
          <Button type="submit" variant="gold" size="lg" block arrow>
            {t("play")}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-sm text-(--hero-text)/80" aria-hidden="true">
          <span className="h-px flex-1 bg-(--hero-text)/20" />
          {t("or")}
          <span className="h-px flex-1 bg-(--hero-text)/20" />
        </div>

        <Button
          variant="outline"
          size="lg"
          block
          icon={<KeyRound size={16} strokeWidth={1.5} />}
          disabled={busy}
          onClick={createPrivate}
        >
          {t("createPrivate")}
        </Button>
      </div>

      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-(--hero-text)/85">
        {micro.map((k, i) => (
          <li key={k} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-(--hero-gold-2)/70" />}
            {t(`micro.${k}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
