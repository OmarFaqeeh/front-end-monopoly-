"use client";
// Character picker overlay (file name kept): preview, grid of characters (radio group), "Join room".
import clsx from "clsx";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { CHARACTERS } from "@/config/characters";
import { confirmCharacter } from "@/lib/roomClient";
import { useRoomStore } from "@/store/roomStore";
import CharacterToken from "./CharacterToken";

const COLUMNS = 4;

export default function ColorPicker() {
  const t = useTranslations("room");
  const nickname = useRoomStore((s) => s.nickname);
  const draft = useRoomStore((s) => s.draftCharacter);
  const players = useRoomStore((s) => s.players);
  const select = useRoomStore((s) => s.selectCharacter);
  const meId = useRoomStore((s) => s.meId);
  const errorCode = useRoomStore((s) => s.errorCode);
  const te = useTranslations("errors");
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const taken = new Set(players.filter((p) => p.id !== meId).map((p) => p.characterId));

  async function join() {
    setBusy(true);
    await confirmCharacter();
    setBusy(false);
  }
  const ids = CHARACTERS.map((c) => c.id);
  const focusable = draft ?? ids.find((id) => !taken.has(id)) ?? ids[0]!;

  function move(from: number, delta: number) {
    const n = ids.length;
    let next = from;
    for (let i = 0; i < n; i++) {
      next = (((next + delta) % n) + n) % n;
      if (!taken.has(ids[next]!)) break;
    }
    select(ids[next]!);
    refs.current[next]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS };
    const delta = map[e.key];
    if (delta == null) return;
    e.preventDefault();
    move(index, delta);
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-6">
      <div
        role="dialog"
        aria-label={t("picker.title")}
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-[20px] border border-accent/40 bg-surface-raised/90 shadow-card backdrop-blur-md"
      >
        <div className="flex shrink-0 flex-col items-center gap-2 px-4 pt-4 sm:gap-3 sm:px-6 sm:pt-6">
          <h2 className="font-heading text-xl font-semibold text-ink sm:text-3xl">{t("picker.title")}</h2>
          <div className="flex max-w-full items-center gap-3 sm:flex-col sm:gap-1">
            <CharacterToken
              characterId={draft ?? ids[0]}
              size="lg"
              mood="happy"
              float
              className={clsx("max-sm:!size-14", draft == null && "opacity-25")}
            />
            <p className="max-w-full truncate font-semibold text-ink">{nickname}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          <div role="radiogroup" aria-label={t("picker.group")} className="grid grid-cols-3 gap-3 p-1 sm:grid-cols-4">
            {CHARACTERS.map((c, i) => {
              const isTaken = taken.has(c.id);
              const selected = draft === c.id;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={isTaken ? `${t(`characters.${c.id}`)}, ${t("picker.taken")}` : t(`characters.${c.id}`)}
                  disabled={isTaken}
                  tabIndex={c.id === focusable ? 0 : -1}
                  onClick={() => select(c.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  style={{ ["--c" as string]: c.color }}
                  className={clsx(
                    "char-card relative flex aspect-square items-center justify-center rounded-2xl border border-line bg-surface-sunken transition-[transform,background-color,border-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
                    selected ? "scale-[1.06] outline-[3px] outline-offset-[3px] outline-ink" : "hover:-translate-y-0.5",
                  )}
                >
                  <CharacterToken characterId={c.id} size="md" bounce={selected} glow={selected ? c.color : undefined} />
                  {selected && (
                    <span className="absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-surface">
                      <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  )}
                  {isTaken && (
                    <span className="absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-danger text-surface">
                      <X size={13} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-line px-4 py-3 sm:px-6 sm:py-4">
          {errorCode && (
            <p role="alert" className="mb-2 text-center text-sm text-danger">
              {te(["CHARACTER_TAKEN", "NETWORK_ERROR", "RATE_LIMITED"].includes(errorCode) ? errorCode : "UNKNOWN")}
            </p>
          )}
          <Button variant="gold" size="lg" block arrow disabled={draft == null || busy} onClick={join} className="max-sm:h-13">
            {t("picker.join")}
          </Button>
        </div>
      </div>
    </div>
  );
}
