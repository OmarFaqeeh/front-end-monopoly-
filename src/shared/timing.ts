// Animation durations (ms) of the game, shared so the SERVER knows how long a client needs to play an event batch
// (bots wait for that before acting). The front plays its queue with these exact numbers (front/src/config/gameTiming.ts).
import type { GameEvent } from "./events.js";

export const GAME_TIMING = {
  diceRollMs: 1250,
  /** The result stays on screen this long ("You rolled 7") before the pawn moves. */
  zoomHoldMs: 2000,
  /** The pawn's single jump to its destination. */
  stepMs: 700,
  cardMs: 2600,
  /** A gain or loss floats next to the cash and fades over this long (about 3 seconds), WITHOUT blocking the game... */
  moneyMs: 3200,
  /** ...the queue only waits this long for it, so a purchase or a payment never makes the game lag. */
  moneyWaitMs: 450,
  endTurnPauseMs: 350,
  /** Short beat after a purchase, a building or a bankruptcy. */
  beatMs: 150,
  /** Jump to the detention tile. */
  jumpMs: 700,
  /** Tiles released after an inactivity removal fade out over this long. */
  releaseFadeMs: 450,
} as const;

/** Under reduced motion every wait is cut to this share. */
export const REDUCED_MOTION_FACTOR = 0.4;

export type GameTiming = typeof GAME_TIMING;

/** How long a client needs to play these events one after another (the same rules as the front's animation queue). */
export function estimateAnimationMs(events: readonly GameEvent[], timing: GameTiming = GAME_TIMING): number {
  let total = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    switch (e.type) {
      case "DICE_ROLLED":
        total += timing.diceRollMs + timing.zoomHoldMs;
        break;
      case "MOVED":
        total += timing.stepMs;
        break;
      case "MONEY_CHANGED":
        while (events[i + 1]?.type === "MONEY_CHANGED") i++; // consecutive changes animate together
        total += timing.moneyWaitMs;
        break;
      case "CARD_DRAWN":
        total += timing.cardMs;
        break;
      case "SENT_TO_JAIL":
        total += timing.jumpMs;
        break;
      case "PROPERTY_BOUGHT":
      case "BUILT":
      case "AUCTION_ENDED":
        total += timing.beatMs;
        break;
      case "PROPERTY_RELEASED":
        total += timing.releaseFadeMs;
        break;
      case "BANKRUPT":
        total += timing.beatMs * 2;
        break;
      case "TURN_ENDED":
        total += timing.endTurnPauseMs;
        break;
      default:
        break;
    }
  }
  return total;
}
