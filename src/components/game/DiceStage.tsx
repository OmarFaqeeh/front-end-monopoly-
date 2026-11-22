"use client";
// The dice in the board center during a game. They toss on every DICE_ROLLED (values come from the server). When
// they settle, ONLY this panel zooms to about 1.35x for the hold time and shows the result big: "You rolled 7" with
// "4 + 3" small; then it returns to normal. No page zoom. Under reduced motion there is no tumble and no zoom.
import clsx from "clsx";
import { useTranslations } from "next-intl";
import DicePair from "@/components/board/DicePair";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function DiceStage() {
  const t = useTranslations("game");
  const dice = useGameStore((s) => s.dice);
  const zoom = useGameStore((s) => s.zoom);
  const meId = useRoomStore((s) => s.meId);
  const name = useRoomStore((s) => s.players.find((p) => p.id === zoom?.playerId)?.nickname ?? "");

  return (
    <div className={clsx("dice-stage relative flex flex-col items-center", zoom && "is-zoomed")} data-zoomed={zoom ? "true" : "false"}>
      <DicePair values={dice.values} rollKey={dice.rollKey} wide size="calc(var(--b) * 0.075)" />
      <div
        className="dice-result pointer-events-none absolute top-full flex flex-col items-center text-center"
        style={{ opacity: zoom ? 1 : 0, marginTop: "calc(var(--b) * -0.012)" }}
        aria-hidden={zoom ? undefined : true}
      >
        {zoom && (
          <>
            <span className="font-heading font-semibold whitespace-nowrap text-gold" style={{ fontSize: "calc(var(--b) * 0.022)" }}>
              {zoom.playerId === meId ? t("youRolled", { total: zoom.total }) : t("rolled", { name, total: zoom.total })}
            </span>
            <span className="text-ink-muted tabular-nums" style={{ fontSize: "calc(var(--b) * 0.0125)" }}>
              {t("sum", { a: zoom.values[0], b: zoom.values[1] })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
