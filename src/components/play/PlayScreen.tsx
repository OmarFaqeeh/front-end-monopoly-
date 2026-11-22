"use client";
// /play: six digit boxes; after the 6th digit the room is checked and, if joinable, the room page opens.
import { CircleAlert, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SixDigitInput from "@/components/ui/SixDigitInput";
import { useRouter } from "@/i18n/navigation";
import { ApiError, lookupRoom } from "@/lib/api";
import { setPrefill } from "@/lib/roomSession";
import { useUiStore } from "@/store/uiStore";

const KNOWN = new Set(["ROOM_NOT_FOUND", "ROOM_FULL", "GAME_STARTED", "RATE_LIMITED", "NETWORK_ERROR"]);

export default function PlayScreen() {
  const t = useTranslations();
  const router = useRouter();
  const { nickname, hydrated, loadNickname } = useUiStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    loadNickname();
  }, [loadNickname]);

  // The nickname was entered on the landing page; without it, go back there.
  useEffect(() => {
    if (hydrated && !nickname) router.replace({ pathname: "/", query: { need: "nickname" } });
  }, [hydrated, nickname, router]);

  async function check(code: string) {
    setBusy(true);
    setError(null);
    try {
      const info = await lookupRoom(code);
      if (!info.joinable) {
        setError(info.reason ?? "ROOM_NOT_FOUND");
        setAttempt((a) => a + 1);
        return;
      }
      setPrefill(code, nickname);
      router.push(`/room/${code}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "NETWORK_ERROR");
      setAttempt((a) => a + 1);
    } finally {
      setBusy(false);
    }
  }

  const message = error ? t(`errors.${KNOWN.has(error) ? error : "UNKNOWN"}`) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg p-6 text-center sm:p-10">
        <h1 className="font-heading text-4xl font-semibold text-balance text-ink">{t("play.title")}</h1>
        <p className="mt-3 text-ink-muted">{t("play.hint")}</p>
        <div className="mt-8">
          <SixDigitInput
            key={attempt}
            autoFocus
            disabled={busy}
            invalid={!!error}
            describedBy={error ? "play-error" : undefined}
            label={(n) => t("play.digit", { n })}
            onComplete={check}
          />
        </div>
        <div className="mt-5 min-h-12" aria-live="polite">
          {busy && <p className="text-sm text-ink-muted">{t("play.checking")}</p>}
          {message && (
            <p
              id="play-error"
              role="alert"
              className="inline-flex items-center gap-2 rounded-lg border border-danger bg-surface-raised px-3 py-2 text-sm text-danger"
            >
              <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              {message}
            </p>
          )}
        </div>
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push("/")} icon={<Home size={16} strokeWidth={1.5} />}>
            {t("play.back")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
