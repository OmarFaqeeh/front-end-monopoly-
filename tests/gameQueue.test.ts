import { beforeEach, describe, expect, it } from "vitest";
import { GAME_TIMING } from "@/config/gameTiming";
import { GameQueue, type QueueDeps } from "@/lib/gameQueue";
import { applyBatch } from "@/shared/display";
import type { GameEvent } from "@/shared/events";
import { useGameStore } from "@/store/gameStore";
import { manualSleep, rollToTile3, snapshot } from "./helpers/game";

const store = () => useGameStore.getState();

function setup(opts: { reduced?: boolean; me?: string } = {}) {
  const sleeper = manualSleep();
  const played: string[] = [];
  const system: [string, Record<string, unknown>][] = [];
  const deps: QueueDeps = {
    sleep: sleeper.sleep,
    play: (n) => played.push(n),
    reduced: () => opts.reduced ?? false,
    meId: () => opts.me ?? "a",
    nameOf: (id) => (id === "a" ? "Omar" : "Sara"),
    system: (code, params) => system.push([code, params]),
  };
  const queue = new GameQueue(deps);
  const start = snapshot();
  queue.adopt(start);
  return { queue, sleeper, played, system, start };
}

beforeEach(() => {
  useGameStore.getState().reset();
});

describe("GameQueue", () => {
  it("shows the dice, then walks the pawn tile by tile, and the end state equals the snapshot", async () => {
    const { queue, sleeper, start, played } = setup();
    const batch = rollToTile3(start);
    queue.push(batch);
    expect(store().busy).toBe(true);

    // 1. dice are tossing: the roll has NOT been applied to the display yet
    await sleeper.release(0);
    expect(store().dice.rollKey).toBe(1);
    expect(store().dice.values).toEqual([1, 2]);
    expect(store().display!.lastRoll).toBeNull();
    expect(sleeper.calls[0]).toBe(GAME_TIMING.diceRollMs);

    // 2. dice settled: zoom with the result, lastRoll shown
    await sleeper.release();
    expect(store().zoom).toMatchObject({ playerId: "a", total: 3 });
    expect(store().display!.lastRoll!.total).toBe(3);
    expect(sleeper.calls[1]).toBe(GAME_TIMING.zoomHoldMs);

    // 3. the result was shown, THEN the pawn jumps straight to its destination (no tile-by-tile walk)
    await sleeper.release();
    expect(store().zoom).toBeNull();
    expect(store().display!.players[0]!.position).toBe(3);
    expect(sleeper.calls[2]).toBe(GAME_TIMING.stepMs);

    // 4. still busy until the last event is played
    expect(store().busy).toBe(true);
    await sleeper.flush();
    expect(store().busy).toBe(false);
    expect(store().display!.phase).toBe("awaitingDecision");
    expect(store().display!.pendingDecision).toEqual({ kind: "buy", tileIndex: 3, price: 50 });
    expect(store().display).toEqual(batch.snapshot);
    expect(played).toEqual(["diceRattle", "diceThud", "step"]);
  });

  it("plays batches in order and keeps buttons disabled (busy) until the queue is empty", async () => {
    const { queue, sleeper, start } = setup();
    const first = rollToTile3(start);
    const buy: GameEvent[] = [
      { type: "MONEY_CHANGED", playerId: "a", delta: -50, newCash: 1450, reason: "buy" },
      { type: "PROPERTY_BOUGHT", playerId: "a", tileIndex: 3, price: 50 },
      { type: "TURN_ENDED", playerId: "a" },
      { type: "TURN_STARTED", playerId: "b", turnNumber: 2, phase: "awaitingRoll" },
    ];
    const second = { events: buy, snapshot: applyBatch(first.snapshot, buy, 2)!, seq: 2 };
    queue.push(first);
    queue.push(second);
    expect(store().busy).toBe(true);
    await sleeper.flush();
    expect(store().busy).toBe(false);
    expect(store().display).toEqual(second.snapshot);
    expect(store().display!.properties[3]).toEqual({ ownerId: "a", level: 0, mortgaged: false });
    expect(store().display!.currentPlayerId).toBe("b");
    expect(store().lastSeq).toBe(2);
  });

  it("animates the money change: cash follows newCash, a float appears, and the right sound plays", async () => {
    const { queue, sleeper, start, played, system } = setup();
    const events: GameEvent[] = [
      { type: "PASSED_START", playerId: "a" },
      { type: "MONEY_CHANGED", playerId: "a", delta: 200, newCash: 1700, reason: "start" },
    ];
    queue.push({ events, snapshot: applyBatch(start, events, 1)!, seq: 1 });
    await sleeper.release(0);
    expect(store().display!.players[0]!.cash).toBe(1700);
    expect(store().floats).toMatchObject([{ playerId: "a", delta: 200 }]);
    expect(played).toContain("gain");
    expect(system).toEqual([["start", { name: "Omar", amount: 200 }]]);
    expect(sleeper.calls[0]).toBe(GAME_TIMING.moneyWaitMs); // the float lasts ~3 s but never blocks the game
    await sleeper.flush();
  });

  it("groups consecutive money changes (rent) into one animation beat", async () => {
    const { queue, sleeper, start } = setup();
    const events: GameEvent[] = [
      { type: "MONEY_CHANGED", playerId: "a", delta: -30, newCash: 1470, reason: "rent_out" },
      { type: "MONEY_CHANGED", playerId: "b", delta: 30, newCash: 1530, reason: "rent_in" },
      { type: "RENT_PAID", fromId: "a", toId: "b", tileIndex: 3, amount: 30 },
    ];
    queue.push({ events, snapshot: applyBatch(start, events, 1)!, seq: 1 });
    await sleeper.release(0);
    expect(sleeper.calls).toEqual([GAME_TIMING.moneyWaitMs]); // one short wait for both
    expect(store().floats).toHaveLength(2);
    await sleeper.flush();
  });

  it("shows a card for the card time, then clears it", async () => {
    const { queue, sleeper, start, played } = setup();
    const events: GameEvent[] = [{ type: "CARD_DRAWN", playerId: "a", deck: "fortune", cardId: "F02", amount: 120 }];
    queue.push({ events, snapshot: applyBatch(start, events, 1)!, seq: 1 });
    await sleeper.release(0);
    expect(store().card).toMatchObject({ cardId: "F02", amount: 120 });
    expect(sleeper.calls[0]).toBe(GAME_TIMING.cardMs);
    expect(played).toContain("cardFlip");
    await sleeper.flush();
    expect(store().card).toBeNull();
  });

  it("cuts every wait to 40% under reduced motion", async () => {
    const { queue, sleeper, start } = setup({ reduced: true });
    queue.push(rollToTile3(start));
    await sleeper.release(0);
    expect(sleeper.calls[0]).toBe(Math.round(GAME_TIMING.diceRollMs * 0.4));
    await sleeper.flush();
    expect(sleeper.calls.slice(0, 3)).toEqual([500, 800, 280]);
  });

  it("ignores unknown events safely and still ends on the snapshot", async () => {
    const { queue, sleeper, start } = setup();
    const events = [{ type: "SOMETHING_NEW", foo: 1 }, { type: "MONEY_CHANGED", playerId: "a", delta: -50, newCash: 1450, reason: "buy" }] as unknown as GameEvent[];
    const snap = applyBatch(start, events, 1)!;
    queue.push({ events, snapshot: snap, seq: 1 });
    await sleeper.flush();
    expect(store().busy).toBe(false);
    expect(store().display).toEqual(snap);
  });

  it("heals a display that disagrees with the snapshot once the queue is empty", async () => {
    const { queue, sleeper, start } = setup();
    const events: GameEvent[] = [{ type: "TURN_ENDED", playerId: "a" }];
    const truth = snapshot({ seq: 1, currentPlayerId: "b", players: [{ ...start.players[0]!, cash: 1111 }, start.players[1]!] });
    queue.push({ events, snapshot: truth, seq: 1 });
    await sleeper.flush();
    expect(store().display).toEqual(truth);
  });

  it("adopts the snapshot without replaying when a batch was missed, and ignores duplicates", () => {
    const { queue, sleeper, start } = setup();
    const gap = snapshot({ seq: 5, currentPlayerId: "b" });
    queue.push({ events: [{ type: "TURN_ENDED", playerId: "a" }], snapshot: gap, seq: 5 }); // seq 2..4 missed
    expect(sleeper.pending).toBe(0); // nothing is played
    expect(store().display).toEqual(gap);
    expect(store().busy).toBe(false);
    expect(queue.lastReceivedSeq).toBe(5);

    queue.push(rollToTile3(start)); // an old seq (1) arrives again
    expect(store().display).toEqual(gap);
    expect(sleeper.pending).toBe(0);
  });

  it("an empty batch (state correction) is adopted at once", () => {
    const { queue, start } = setup();
    const fixed = snapshot({ seq: 1, players: [{ ...start.players[0]!, cash: 10 }, start.players[1]!] });
    queue.push({ events: [], snapshot: fixed, seq: 1 });
    expect(store().display!.players[0]!.cash).toBe(10);
  });

  it("a reconnect snapshot cancels what is playing", async () => {
    const { queue, sleeper, start } = setup();
    queue.push(rollToTile3(start));
    await sleeper.release(0);
    const sync = snapshot({ seq: 9, currentPlayerId: "b" });
    queue.adopt(sync);
    expect(store().busy).toBe(false);
    await sleeper.flush();
    expect(store().display).toEqual(sync); // the cancelled batch changed nothing more
    expect(store().zoom).toBeNull();
  });

  it("announces turns, plays the your-turn bell and shows the bankruptcy toast", async () => {
    const { queue, sleeper, start, played } = setup({ me: "b" });
    const events: GameEvent[] = [
      { type: "BANKRUPT", playerId: "a", creditorId: "b" },
      { type: "TURN_STARTED", playerId: "b", turnNumber: 2, phase: "awaitingRoll" },
    ];
    queue.push({ events, snapshot: applyBatch(start, events, 1)!, seq: 1 });
    await sleeper.release(0);
    expect(store().toast).toMatchObject({ playerId: "a" });
    await sleeper.flush();
    expect(played).toEqual(["bankrupt", "yourTurn"]);
    expect(store().announce).toEqual({ code: "yourTurn", params: {} });
  });

  it("a removal for inactivity fades the released tiles first, then drops the owner; chat says how many are free; no bankruptcy toast", async () => {
    const sleeper = manualSleep();
    const system: [string, Record<string, unknown>][] = [];
    const queue = new GameQueue({ sleep: sleeper.sleep, play: () => {}, reduced: () => false, meId: () => "b", nameOf: (id) => (id === "a" ? "Omar" : "Sara"), system: (c, p) => system.push([c, p]) });
    const start = snapshot({ properties: { 3: { ownerId: "a", level: 2, mortgaged: false }, 5: { ownerId: "a", level: 0, mortgaged: true } } });
    queue.adopt(start);
    const events: GameEvent[] = [
      { type: "PROPERTY_RELEASED", playerId: "a", tiles: [3, 5] },
      { type: "MONEY_CHANGED", playerId: "a", delta: -400, newCash: 0, reason: "afk_removed" },
      { type: "BANKRUPT", playerId: "a", creditorId: null, reason: "afk" },
      { type: "TURN_STARTED", playerId: "b", turnNumber: 2, phase: "awaitingRoll" },
    ];
    queue.push({ events, snapshot: applyBatch(start, events, 1)!, seq: 1 });
    await sleeper.release(0);
    expect(store().releasing).toEqual([3, 5]); // fading: the display still shows the owner
    expect(store().display!.properties[3]).toMatchObject({ ownerId: "a" });
    expect(sleeper.calls[0]).toBe(GAME_TIMING.releaseFadeMs);
    await sleeper.release();
    expect(store().releasing).toEqual([]);
    expect(store().display!.properties[3]).toBeUndefined();
    expect(store().display!.properties[5]).toBeUndefined();
    await sleeper.flush();
    expect(system).toContainEqual(["afkRemoved", { name: "Omar", count: 2 }]);
    expect(system.some(([c]) => c === "bankrupt")).toBe(false);
    expect(store().toast).toBeNull();
    expect(store().display).toEqual(applyBatch(start, events, 1));
  });
});
