"use client";
// Shown when the room cannot be entered (not found, full, game started, server unreachable).
import { CircleAlert, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { useRoomStore } from "@/store/roomStore";

const KNOWN = new Set(["ROOM_NOT_FOUND", "ROOM_FULL", "GAME_STARTED", "RATE_LIMITED", "NETWORK_ERROR"]);

export default function RoomErrorScreen() {
  const t = useTranslations();
  const router = useRouter();
  const code = useRoomStore((s) => s.errorCode) ?? "UNKNOWN";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-surface/95 p-4 backdrop-blur-sm">
      <div role="alert" className="w-full max-w-md rounded-[20px] border border-line bg-surface-raised p-8 text-center shadow-card">
        <CircleAlert size={32} strokeWidth={1.5} aria-hidden="true" className="mx-auto text-danger" />
        <h1 className="font-heading mt-4 text-3xl font-semibold text-ink">{t(`errors.${KNOWN.has(code) ? code : "UNKNOWN"}`)}</h1>
        <div className="mt-6">
          <Button variant="gold" size="lg" icon={<Home size={16} strokeWidth={1.5} />} onClick={() => router.push("/")}>
            {t("room.errorScreen.back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
