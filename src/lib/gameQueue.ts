// Serial animation queue for game events. Each batch from the server ("game:events") is played one event after
// another: the DISPLAYED state (store.display) advances through the shared reducer while the dice, pawn steps, cards
// and money counters animate. Buttons for the next actor stay disabled until the queue is empty (store.busy).
// A missed seq, a reconnect or an empty batch takes the snapshot as the whole truth without replaying.
import { GAME_TIMING, REDUCED_MOTION_FACTOR, type GameTiming } from "@/config/gameTiming";
import { applyEvent } from "@/shared/display";
import type { GameEvent, GameEventsPayload, GameSnapshot } from "@/shared/events";
import { useGameStore, type Announcement } from "@/store/gameStore";
import type { SoundName } from "./sound";

/** Codes of the system lines shown in the chat (text lives in messages: game.system.<code>). */
export type SystemCode = "bought" | "rent" | "tax" | "card" | "jail" | "builtHouse" | "builtHotel" | "start" | "jailPaid" | "bankrupt" | "tradeOffer" | "tradeAccepted" | "tradeRejected" | "tradeCancelled" | "auctionWon" | "oasis" | "mortgaged" | "unmortgaged" | "rentWaivedDetention" | "rentWaivedMortgaged" | "botJoined" | "botLeft" | "botMadeRoom" | "afkRemoved";
export type SystemParams = Record<string, string | number>;

export interface QueueDeps {
  /** Resolves after `ms` (injected so tests do not wait). */
  sleep: (ms: number) => Promise<void>;
  play: (name: SoundName) => void;
  reduced: () => boolean;
  meId: () => string | null;
  nameOf: (playerId: string) => string;
  system: (code: SystemCode, params: SystemParams) => void;
  timing?: GameTiming;
}

type Store = typeof useGameStore;

const sameState = (a: GameSnapshot | null, b: GameSnapshot | null) => {
  if (!a || !b) return a === b;
  return JSON.stringify({ ...a, seq: 0 }) === JSON.stringify({ ...b, seq: 0 });
};

export class GameQueue {
  private batches: GameEventsPayload[] = [];
  private running = false;
  private generation = 0;
  private received = 0;
  private counter = 0;
  private readonly timing: GameTiming;

  constructor(
    private readonly deps: QueueDeps,
    private readonly store: Store = useGameStore,
  ) {
    this.timing = deps.timing ?? GAME_TIMING;
  }

  /** Stops playing, drops pending batches and forgets the sequence (leaving a room, a new game). */
  reset(): void {
    this.generation++;
    this.batches = [];
    this.running = false;
    this.received = 0;
  }

  /** The seq the queue has received so far (tests). */
  get lastReceivedSeq(): number {
    return this.received;
  }

  /** Take a snapshot as the whole truth: cancels what is playing, shows the snapshot at once. */
  adopt(snapshot: GameSnapshot): void {
    this.generation++;
    this.batches = [];
    this.running = false;
    this.received = snapshot.seq;
    this.store.getState().adopt(snapshot);
    this.store.getState().patch({ busy: false });
  }

  /** A "game:events" message. */
  push(payload: GameEventsPayload): void {
    if (payload.seq <= this.received) return; // duplicate or old
    if (payload.events.length === 0 || payload.seq !== this.received + 1) {
      // Nothing to replay, or a batch was missed: show the snapshot.
      this.adopt(payload.snapshot);
      return;
    }
    this.received = payload.seq;
    this.store.getState().patch({ snapshot: payload.snapshot, lastSeq: payload.seq, busy: true });
    this.batches.push(payload);
    void this.run();
  }

  private async wait(ms: number, gen: number): Promise<boolean> {
    const scaled = this.deps.reduced() ? Math.round(ms * REDUCED_MOTION_FACTOR) : ms;
    await this.deps.sleep(scaled);
    return gen === this.generation;
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    const gen = this.generation;
    while (this.batches.length > 0) {
      const batch = this.batches.shift()!;
      const alive = await this.playBatch(batch, gen);
      if (!alive) return; // reset or adopted meanwhile: the new owner of the queue continues
      const display = this.store.getState().display;
      if (display) this.store.getState().patch({ display: { ...display, seq: batch.seq } });
    }
    if (gen !== this.generation) return;
    this.running = false;
    // Self-heal: whatever the events did, the final display must be the authoritative snapshot.
    const { display, snapshot } = this.store.getState();
    this.store.getState().patch({ busy: false, ...(snapshot && !sameState(display, snapshot) ? { display: snapshot } : {}) });
  }

  private apply(ev: GameEvent | { type: string }): void {
    const s = this.store.getState();
    this.store.getState().patch({ display: applyEvent(s.display, ev) });
  }

  private announce(announcement: Announcement): void {
    this.store.getState().patch({ announce: announcement });
  }

  /** Plays one batch; resolves false when the queue was reset while playing. */
  private async playBatch(batch: GameEventsPayload, gen: number): Promise<boolean> {
    const { events } = batch;
    const t = this.timing;
    const me = this.deps.meId();
    const name = (id: string) => this.deps.nameOf(id);
    const get = () => this.store.getState();
    const set = (p: Parameters<ReturnType<Store["getState"]>["patch"]>[0]) => get().patch(p);

    for (let i = 0; i < events.length; i++) {
      if (gen !== this.generation) return false;
      const ev = events[i]!;
      try {
        switch (ev.type) {
          case "DICE_ROLLED": {
            set({ dice: { values: [ev.values[0], ev.values[1]], rollKey: get().dice.rollKey + 1, playerId: ev.playerId } });
            this.deps.play("diceRattle");
            if (!(await this.wait(t.diceRollMs, gen))) return false;
            this.deps.play("diceThud");
            this.apply(ev);
            set({ zoom: { playerId: ev.playerId, values: [ev.values[0], ev.values[1]], total: ev.total } });
            this.announce({ code: "rolled", params: { name: name(ev.playerId), total: ev.total } });
            if (!(await this.wait(t.zoomHoldMs, gen))) return false;
            set({ zoom: null });
            break;
          }
          case "MOVED": {
            // The pawn jumps straight to its destination (one hop), no tile-by-tile walk.
            this.apply(ev);
            this.deps.play("step");
            if (!(await this.wait(t.stepMs, gen))) return false;
            break;
          }
          case "MONEY_CHANGED": {
            // Consecutive money changes (rent: payer and owner) animate together, once.
            const group: Extract<GameEvent, { type: "MONEY_CHANGED" }>[] = [ev];
            while (events[i + 1]?.type === "MONEY_CHANGED") group.push(events[++i] as Extract<GameEvent, { type: "MONEY_CHANGED" }>);
            for (const m of group) {
              this.apply(m);
              const id = ++this.counter;
              set({ floats: [...get().floats, { id, playerId: m.playerId, delta: m.delta }] });
              setTimeout(() => get().dismissFloat(id), 3400);
              if (m.reason === "start") this.deps.system("start", { name: name(m.playerId), amount: m.delta });
            }
            const mine = group.find((m) => m.playerId === me);
            if (mine) this.deps.play(mine.delta > 0 ? "gain" : "loss");
            if (!(await this.wait(t.moneyWaitMs, gen))) return false;
            break;
          }
          case "CARD_DRAWN": {
            this.apply(ev);
            set({ card: { playerId: ev.playerId, deck: ev.deck, cardId: ev.cardId, amount: ev.amount } });
            this.deps.play("cardFlip");
            this.deps.system("card", { name: name(ev.playerId), deck: ev.deck });
            if (!(await this.wait(t.cardMs, gen))) return false;
            set({ card: null });
            break;
          }
          case "SENT_TO_JAIL": {
            this.deps.play("jail");
            set({ jumping: ev.playerId });
            this.apply(ev);
            this.deps.system("jail", { name: name(ev.playerId) });
            if (!(await this.wait(t.jumpMs, gen))) return false;
            set({ jumping: null });
            break;
          }
          case "PROPERTY_BOUGHT": {
            this.apply(ev);
            this.deps.play("buy");
            this.deps.system("bought", { name: name(ev.playerId), tileIndex: ev.tileIndex, amount: ev.price });
            if (!(await this.wait(t.beatMs, gen))) return false;
            break;
          }
          case "BUILT": {
            this.apply(ev);
            this.deps.play("build");
            this.deps.system(ev.kind === "hotel" ? "builtHotel" : "builtHouse", { name: name(ev.playerId), tileIndex: ev.tileIndex });
            if (!(await this.wait(t.beatMs, gen))) return false;
            break;
          }
          case "PROPERTY_RELEASED": {
            // The owner badges, houses and mortgage marks fade out first, then the tiles become unowned.
            set({ releasing: ev.tiles });
            if (!(await this.wait(t.releaseFadeMs, gen))) return false;
            this.apply(ev);
            set({ releasing: [] });
            break;
          }
          case "BANKRUPT": {
            this.apply(ev);
            this.deps.play("bankrupt");
            if (ev.reason === "afk") {
              const released = events.find((x) => x.type === "PROPERTY_RELEASED" && x.playerId === ev.playerId);
              this.deps.system("afkRemoved", { name: name(ev.playerId), count: released?.type === "PROPERTY_RELEASED" ? released.tiles.length : 0 });
              if (!(await this.wait(t.beatMs * 2, gen))) return false;
              break;
            }
            this.deps.system("bankrupt", { name: name(ev.playerId) });
            set({ toast: { id: ++this.counter, playerId: ev.playerId } });
            if (!(await this.wait(t.beatMs * 2, gen))) return false;
            break;
          }
          case "TRADE_PROPOSED": {
            this.apply(ev);
            this.deps.system("tradeOffer", { from: name(ev.trade.fromId), to: name(ev.trade.toId) });
            if (ev.trade.toId === me) {
              set({ incomingTrade: ev.trade.id });
              this.deps.play("offer");
            }
            break;
          }
          case "TRADE_ACCEPTED":
          case "TRADE_REJECTED":
          case "TRADE_CANCELLED": {
            const trade = get().display?.trades.find((x) => x.id === ev.tradeId);
            this.apply(ev);
            if (trade) {
              const code = ev.type === "TRADE_ACCEPTED" ? "tradeAccepted" : ev.type === "TRADE_REJECTED" ? "tradeRejected" : "tradeCancelled";
              this.deps.system(code, { from: name(trade.fromId), to: name(trade.toId) });
            }
            if (get().incomingTrade === ev.tradeId) set({ incomingTrade: null });
            if (ev.type === "TRADE_ACCEPTED") this.deps.play("buy");
            break;
          }
          case "AUCTION_STARTED":
            this.apply(ev);
            set({ iBid: false, auctionClockOffset: ev.auction.serverNow - Date.now() });
            this.deps.play("bid");
            break;
          case "AUCTION_BID":
            this.apply(ev);
            set({ auctionClockOffset: ev.serverNow - Date.now() });
            this.deps.play("bid");
            break;
          case "AUCTION_ENDED": {
            this.apply(ev);
            set({ iBid: false, auctionToast: { id: ++this.counter, winnerId: ev.winnerId, tileIndex: ev.tileIndex, price: ev.price } });
            if (ev.winnerId) {
              this.deps.system("auctionWon", { name: name(ev.winnerId), tileIndex: ev.tileIndex, amount: ev.price });
              this.deps.play("auctionWon");
            }
            if (!(await this.wait(t.beatMs, gen))) return false;
            break;
          }
          case "OASIS_COLLECTED":
            this.deps.system("oasis", { name: name(ev.playerId), amount: ev.amount });
            this.deps.play("jackpot");
            break;
          case "PROPERTY_MORTGAGED":
          case "PROPERTY_UNMORTGAGED":
            this.apply(ev);
            this.deps.play(ev.type === "PROPERTY_MORTGAGED" ? "mortgage" : "unmortgage");
            this.deps.system(ev.type === "PROPERTY_MORTGAGED" ? "mortgaged" : "unmortgaged", { name: name(ev.playerId), tileIndex: ev.tileIndex });
            break;
          case "RENT_WAIVED":
            this.deps.system(ev.reason === "mortgaged" ? "rentWaivedMortgaged" : "rentWaivedDetention", { name: name(ev.toId), tileIndex: ev.tileIndex });
            break;
          case "RENT_PAID":
            this.deps.system("rent", { from: name(ev.fromId), to: name(ev.toId), amount: ev.amount });
            break;
          case "TAX_PAID":
            this.deps.system("tax", { name: name(ev.playerId), amount: ev.amount });
            break;
          case "JAIL_PAID":
            this.apply(ev);
            this.deps.system("jailPaid", { name: name(ev.playerId), amount: ev.amount });
            break;
          case "TURN_ENDED":
            this.deps.play("endTurn");
            if (!(await this.wait(t.endTurnPauseMs, gen))) return false;
            break;
          case "TURN_STARTED":
            this.apply(ev);
            if (ev.playerId === me) this.deps.play("yourTurn");
            this.announce(ev.playerId === me ? { code: "yourTurn", params: {} } : { code: "turnOf", params: { name: name(ev.playerId) } });
            break;
          case "GAME_OVER":
            this.apply(ev);
            this.announce({ code: "wins", params: { name: name(ev.winnerPlayerId) } });
            break;
          default:
            // LANDED, PASSED_START, JAIL_STAYED, PROPERTY_SKIPPED, and any event type this client does not know.
            this.apply(ev);
        }
      } catch (e) {
        console.error("[game] could not play event", ev?.type, e);
      }
    }
    return gen === this.generation;
  }
}
