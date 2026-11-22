"use client";
// The pawns of a running game, drawn ABOVE the board and moved with real coordinates: each pawn glides from one
// tile center to the next (one step of the walk at a time) instead of jumping between tiles. Pawns that stand on the
// same tile share it with the adaptive tokenLayout sizes.
import { motion } from "framer-motion";
import CharacterToken from "@/components/room/CharacterToken";
import { GAME_TIMING } from "@/config/gameTiming";
import { useReducedMotionPref } from "@/lib/motion";
import { pawnSlots } from "@/lib/pawnPlace";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function PawnLayer() {
  const reduce = useReducedMotionPref();
  const display = useGameStore((s) => s.display);
  const roomPlayers = useRoomStore((s) => s.players);
  if (!display) return null;

  const active = display.players.filter((p) => !p.bankrupt);
  const byTile = new Map<number, string[]>();
  for (const p of active) byTile.set(p.position, [...(byTile.get(p.position) ?? []), p.id]);

  return (
    <div className="pointer-events-none absolute inset-[0.4cqw] z-10" data-pawn-layer="">
      {active.map((p) => {
        const mates = byTile.get(p.position)!;
        const slot = pawnSlots(p.position, mates.length)[mates.indexOf(p.id)]!;
        // A walk step glides tile to tile; the jump to detention is a quicker, eased glide.
        const duration = reduce ? 0 : (GAME_TIMING.stepMs / 1000) * 0.9;
        const nick = roomPlayers.find((r) => r.id === p.id)?.nickname ?? "";
        return (
          <motion.div
            key={p.id}
            data-pawn={p.id}
            data-tile-index={p.position}
            role="img"
            aria-label={nick}
            className="absolute"
            style={{ x: "-50%", y: "-50%", width: `${slot.size}%`, aspectRatio: "1" }}
            initial={false}
            animate={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.size}%` }}
            transition={{ duration, ease: [0.45, 0, 0.2, 1] }}
          >
            <span key={p.position} className="pawn-hop block size-full">
              <CharacterToken characterId={p.characterId} size="fill" />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
