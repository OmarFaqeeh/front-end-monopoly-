"use client";
// Left column header: small wordmark, sound toggle, help (how to play) and Leave.
import { CircleHelp, LogOut, Sparkles, SparklesIcon, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonClass } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { setMotionPref, useReducedMotionPref } from "@/lib/motion";
import { leaveRoom } from "@/lib/roomClient";
import { useRoomStore } from "@/store/roomStore";

export default function RoomHeader() {
  const t = useTranslations();
  const router = useRouter();
  const soundOn = useRoomStore((s) => s.soundOn);
  const toggleSound = useRoomStore((s) => s.toggleSound);
  const reduced = useReducedMotionPref();

  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/" className="font-heading text-xl font-semibold tracking-[0.14em] text-gold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        {t("landing.wordmark.latin")}
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? t("room.header.soundOn") : t("room.header.soundOff")}
          className={buttonClass("quiet", "sm", "btn-square")}
        >
          {soundOn ? <Volume2 size={18} strokeWidth={1.5} /> : <VolumeX size={18} strokeWidth={1.5} />}
        </button>
        <button
          type="button"
          onClick={() => setMotionPref(reduced ? "full" : "reduced")}
          aria-pressed={!reduced}
          aria-label={reduced ? t("room.header.motionOff") : t("room.header.motionOn")}
          title={reduced ? t("room.header.motionOff") : t("room.header.motionOn")}
          className={buttonClass("quiet", "sm", "btn-square")}
        >
          {reduced ? <SparklesIcon size={18} strokeWidth={1.5} className="opacity-50" /> : <Sparkles size={18} strokeWidth={1.5} />}
        </button>
        <Link href="/#how" aria-label={t("room.header.help")} className={buttonClass("quiet", "sm", "btn-square")}>
          <CircleHelp size={18} strokeWidth={1.5} />
        </Link>
        <button
          type="button"
          aria-label={t("room.header.leave")}
          onClick={() => {
            void leaveRoom().finally(() => router.push("/"));
          }}
          className={buttonClass("quiet", "sm", "btn-square")}
        >
          <LogOut size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
