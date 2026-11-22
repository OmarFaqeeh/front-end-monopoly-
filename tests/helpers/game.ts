// Helpers for the game UI tests: snapshots, events and a controllable sleep.
import { applyBatch } from "@/shared/display";
import { DEFAULT_RULES } from "@/shared/settings";
import type { GameEvent, GameSnapshot } from "@/shared/events";

export function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: "awaitingRoll",
    currentPlayerId: "a",
    turnNumber: 1,
    players: [
      { id: "a", characterId: "c01", cash: 1500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
      { id: "b", characterId: "c02", cash: 1500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
    ],
    properties: {},
    rules: { ...DEFAULT_RULES },
    oasisPool: 0,
    auction: null,
    pendingDebt: null,
    trades: [],
    lastRoll: null,
    pendingDecision: null,
    seq: 0,
    winnerPlayerId: null,
    ...overrides,
  };
}

/** a rolls 3 and lands on tile 3 (unowned): the batch the server would send, with the matching snapshot. */
export function rollToTile3(from: GameSnapshot): { events: GameEvent[]; snapshot: GameSnapshot; seq: number } {
  const events: GameEvent[] = [
    { type: "DICE_ROLLED", playerId: "a", values: [1, 2], total: 3 },
    { type: "MOVED", playerId: "a", from: 0, to: 3, path: [1, 2, 3] },
    { type: "LANDED", playerId: "a", tileIndex: 3, pending: { kind: "buy", tileIndex: 3, price: 50 } },
  ];
  const seq = from.seq + 1;
  return { events, snapshot: applyBatch(from, events, seq)!, seq };
}

/** A sleep the test controls: every call records its duration and waits until release() is called. */
export function manualSleep() {
  const calls: number[] = [];
  const waiting: (() => void)[] = [];
  const settle = async () => {
    for (let k = 0; k < 10; k++) await Promise.resolve();
  };
  return {
    calls,
    sleep: (ms: number) => {
      calls.push(ms);
      return new Promise<void>((resolve) => waiting.push(resolve));
    },
    /** Resolve the oldest pending sleep (times > 0) and let the queue run until it waits again. */
    async release(times = 1) {
      if (times === 0) await settle();
      for (let i = 0; i < times; i++) {
        waiting.shift()?.();
        await settle();
      }
    },
    get pending() {
      return waiting.length;
    },
    async flush(max = 300) {
      await settle();
      for (let i = 0; i < max && waiting.length; i++) {
        waiting.shift()!();
        await settle();
      }
    },
  };
}
