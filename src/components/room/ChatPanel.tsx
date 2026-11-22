"use client";
// Chat panel: live messages over the room socket, shown as ornate framed bubbles with the time of each message.
import clsx from "clsx";
import { MessageSquare, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Card from "@/components/ui/Card";
import { accentColor } from "@/config/characters";
import { formatMoney } from "@/lib/money";
import { sendChatMessage } from "@/lib/roomClient";
import PlayerAvatar from "./PlayerAvatar";
import { useRoomStore } from "@/store/roomStore";

const MAX_LENGTH = 200;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel() {
  const t = useTranslations("room.chat");
  const tAll = useTranslations();
  const messages = useRoomStore((s) => s.messages);
  const meId = useRoomStore((s) => s.meId);
  const joined = useRoomStore((s) => s.stage === "lobby");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    setError(null);
    const code = await sendChatMessage(clean);
    setSending(false);
    if (code === null) setText("");
    else setError(code === "RATE_LIMITED" ? t("rateLimited") : t("failed"));
  }

  return (
    <Card className="flex h-full min-h-72 flex-col overflow-hidden">
      <h3 className="border-b border-line px-5 py-3.5 font-semibold text-ink">{t("title")}</h3>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-ink-muted">
          <MessageSquare size={28} strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      ) : (
        <ul ref={listRef} aria-live="polite" className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
          {messages.map((m) => {
            if (m.system) {
              // System line from an event code: muted, centered, no avatar. Tile names and amounts are resolved here.
              const p: Record<string, string | number> = { ...m.system.params };
              if (typeof p.tileIndex === "number") p.tile = tAll(`board.tiles.t${String(p.tileIndex).padStart(2, "0")}`);
              if (typeof p.amount === "number") p.amount = formatMoney(Math.abs(p.amount), { suffix: true });
              if (typeof p.deck === "string") p.deck = tAll(`game.deck.${p.deck}`).toLowerCase();
              return (
                <li key={m.id} data-system={m.system.code} className="text-center text-xs text-ink-muted">
                  {tAll(`game.system.${m.system.code}`, p)}
                </li>
              );
            }
            const mine = m.playerId === meId;
            return (
              <li key={m.id} className={clsx("flex items-end gap-2.5 text-sm", mine && "flex-row-reverse")}>
                <PlayerAvatar characterId={m.characterId} size="sm" />
                <div
                  className={clsx("chat-bubble min-w-0 max-w-[85%]", mine && "is-mine")}
                  style={mine ? undefined : { ["--tone" as string]: accentColor(m.characterId ?? "") }}
                >
                  {!mine && (
                    <p className="truncate text-xs font-semibold" style={{ color: "var(--tone)" }}>
                      {m.name}
                    </p>
                  )}
                  <p className="break-words whitespace-pre-wrap text-ink">{m.text}</p>
                  <time dateTime={new Date(m.at).toISOString()} className="mt-0.5 block text-end text-[11px] text-ink-muted tabular-nums">
                    {formatTime(m.at)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="border-t border-line p-3">
        {error && (
          <p role="alert" className="mb-2 text-xs text-ink-muted">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!joined}
            maxLength={MAX_LENGTH}
            placeholder={joined ? t("placeholder") : t("joinToChat")}
            aria-label={joined ? t("placeholder") : t("joinToChat")}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface-sunken px-3 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!joined || !text.trim() || sending}
            aria-label={t("send")}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand text-on-brand transition-colors duration-200 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>
      </form>
    </Card>
  );
}
