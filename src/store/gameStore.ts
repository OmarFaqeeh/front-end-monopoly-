// Game store. `snapshot` is the authoritative state from the server; `display` is what the UI shows and advances event
// by event through the animation queue (lib/gameQueue.ts), so numbers, pawns and buttons follow the animations.
import { create } from "zustand";
import type { DeckName, GameSnapshot } from "@/shared/events";

export interface DiceAnim {
  values: [number, number];
  /** Incremented on every roll: the dice component tosses when it changes. */
  rollKey: number;
  playerId: string | null;
}

export interface ZoomResult {
  playerId: string;
  values: [number, number];
  total: number;
}

export interface CardAnim {
  playerId: string;
  deck: DeckName;
  cardId: string;
  amount: number;
}

export interface MoneyFloat {
  id: number;
  playerId: string;
  delta: number;
}

export interface BankruptToast {
  id: number;
  playerId: string;
}

/** The trade window: choosing a partner, writing an offer, or looking at an existing one. */
export type TradeUi = { kind: "picker" } | { kind: "compose"; partnerId: string } | { kind: "view"; tradeId: string };

export interface Announcement {
  code: "yourTurn" | "turnOf" | "rolled" | "wins";
  params: Record<string, string | number>;
}

interface GameState {
  /** A game is running (or just finished) in this room. */
  active: boolean;
  snapshot: GameSnapshot | null;
  display: GameSnapshot | null;
  /** seq of the last batch applied (events or snapshot). */
  lastSeq: number;
  /** The animation queue is playing: the next actor's buttons stay disabled. */
  busy: boolean;
  dice: DiceAnim;
  zoom: ZoomResult | null;
  card: CardAnim | null;
  floats: MoneyFloat[];
  toast: BankruptToast | null;
  /** A trade offer addressed to the viewer that just arrived (shown as a small card until answered or dismissed). */
  incomingTrade: string | null;
  /** serverNow - Date.now() when the last auction deadline arrived: makes the timer bar clock-skew safe. */
  auctionClockOffset: number;
  /** I placed a bid in the current auction (to tell "Outbid" from "no bid yet"). */
  iBid: boolean;
  /** Result of the last auction ("{name} won {tile} for {price}" or no bids). */
  auctionToast: { id: number; winnerId: string | null; tileIndex: number; price: number } | null;
  tradeUi: TradeUi | null;
  /** What the aria-live region announces (translated by the component). */
  announce: Announcement | null;
  /** Players whose pawn just jumped to detention (CSS class hook), by player id. */
  jumping: string | null;
  /** Tiles fading out (released after an inactivity removal) before the display drops their owner. */
  releasing: number[];
  /** Who must act and the local time (ms) when the idle removal happens; null when nobody is timed. */
  turnTimer: { playerId: string; endsAtLocal: number } | null;
  /** Last error code of a rejected action (shown briefly near the buttons). */
  actionError: string | null;

  reset: () => void;
  /** Take a snapshot as the whole truth (game start, reconnect, missed batch): no replay. */
  adopt: (snapshot: GameSnapshot) => void;
  patch: (partial: Partial<GameState>) => void;
  dismissFloat: (id: number) => void;
}

const initialDice: DiceAnim = { values: [1, 1], rollKey: 0, playerId: null };

const initial = {
  active: false,
  snapshot: null as GameSnapshot | null,
  display: null as GameSnapshot | null,
  lastSeq: 0,
  busy: false,
  dice: initialDice,
  zoom: null as ZoomResult | null,
  card: null as CardAnim | null,
  floats: [] as MoneyFloat[],
  toast: null as BankruptToast | null,
  incomingTrade: null as string | null,
  auctionClockOffset: 0,
  iBid: false,
  auctionToast: null as { id: number; winnerId: string | null; tileIndex: number; price: number } | null,
  tradeUi: null as TradeUi | null,
  announce: null as Announcement | null,
  jumping: null as string | null,
  releasing: [] as number[],
  turnTimer: null as { playerId: string; endsAtLocal: number } | null,
  actionError: null as string | null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initial,
  reset: () => set({ ...initial, dice: { ...initialDice } }),
  adopt: (snapshot) =>
    set((s) => ({
      active: true,
      snapshot,
      display: snapshot,
      lastSeq: snapshot.seq,
      zoom: null,
      card: null,
      floats: [],
      toast: null,
      incomingTrade: null,
      dice: snapshot.lastRoll ? { values: snapshot.lastRoll.values, rollKey: s.dice.rollKey, playerId: null } : s.dice,
    })),
  patch: (partial) => set(partial),
  dismissFloat: (id) => set((s) => ({ floats: s.floats.filter((f) => f.id !== id) })),
}));

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __gameStore?: typeof useGameStore }).__gameStore = useGameStore;
}
