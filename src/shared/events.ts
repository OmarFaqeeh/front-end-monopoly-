// Shared contract between back and front: tile kinds, game snapshot and the typed event union.
// Events carry codes and numbers only, never text. This file is copied into back/src/shared and front/src/shared
// by scripts/sync-shared.mjs: edit it ONLY here at the repository root.

export type TileKind = "start" | "property" | "vault" | "tax" | "harbor" | "fortune" | "detention" | "utility" | "oasis" | "goToDetention";

export interface BoardTile {
  index: number;
  kind: TileKind;
  /** Country group 1..8 (properties only). */
  group?: number;
  price?: number;
  /** Tax amount (tax tiles only). */
  amount?: number;
}

import type { GameRules } from "./settings.js";

export type { GameRules } from "./settings.js";

export type Phase = "awaitingRoll" | "awaitingDecision" | "awaitingJailChoice" | "auction" | "raisingFunds" | "gameOver";
export type DeckName = "fortune" | "vault";
export type MoneyReason = "start" | "rent_in" | "rent_out" | "tax" | "card" | "buy" | "build" | "jail_fine" | "bankruptcy_in" | "trade" | "auction" | "oasis" | "mortgage" | "unmortgage" | "afk_removed";
export type BuildKind = "house" | "hotel";

export interface PlayerGameState {
  id: string;
  characterId: string | null;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
}

export interface PropertyState {
  ownerId: string;
  /** 0 = no buildings, 1..4 houses, 5 = hotel. */
  level: number;
  /** Mortgaged: collects no rent and cannot be built on. Absent means not mortgaged. */
  mortgaged?: boolean;
}

/** The running auction of an unowned tile (only one at a time). */
export interface AuctionState {
  tileIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  /** Players who left the auction (they cannot bid again). */
  withdrawnIds: string[];
  /** Server time (ms) when the auction ends unless somebody bids. */
  endsAt: number;
  /** Server time (ms) when endsAt was set: lets a client correct for clock differences. */
  serverNow: number;
}

/** A payment the current player cannot make from cash alone: they must mortgage tiles, pay, or go bankrupt. */
export interface PendingDebt {
  amount: number;
  /** The player who is owed the money, or null for the bank. */
  creditorId: string | null;
  reason: "rent" | "tax" | "card" | "jail_fine";
}

/** One side of a trade: tiles and cash. */
export interface TradeSide {
  tiles: number[];
  cash: number;
}

export type TradeStatus = "pending" | "accepted" | "rejected" | "cancelled";

/** An offer between two players. `give` is what the proposer hands over, `get` is what the proposer asks for. */
export interface TradeOffer {
  id: string;
  fromId: string;
  toId: string;
  give: TradeSide;
  get: TradeSide;
  status: TradeStatus;
}

export interface PendingDecision {
  kind: "buy";
  tileIndex: number;
  price: number;
}

export interface LastRoll {
  values: [number, number];
  total: number;
}

/** What clients receive (and what the display reducer must reproduce). Never contains the seed or the decks. */
export interface GameSnapshot {
  phase: Phase;
  currentPlayerId: string | null;
  turnNumber: number;
  /** Players in turn order. */
  players: PlayerGameState[];
  properties: Record<number, PropertyState>;
  /** The rules this game runs with (copied from the room settings at the start, frozen). */
  rules: GameRules;
  /** The Oasis jackpot (always 0 unless the rule is on). */
  oasisPool: number;
  auction: AuctionState | null;
  pendingDebt: PendingDebt | null;
  /** Trade offers of this game (everybody can look at all of them), oldest first. */
  trades: TradeOffer[];
  lastRoll: LastRoll | null;
  pendingDecision: PendingDecision | null;
  seq: number;
  winnerPlayerId: string | null;
}

export type GameEvent =
  | { type: "GAME_STARTED"; players: { id: string; characterId: string | null; cash: number }[]; rules: GameRules }
  | { type: "TURN_STARTED"; playerId: string; turnNumber: number; phase: "awaitingRoll" | "awaitingJailChoice" }
  | { type: "DICE_ROLLED"; playerId: string; values: [number, number]; total: number }
  | { type: "MOVED"; playerId: string; from: number; to: number; path: number[] }
  | { type: "PASSED_START"; playerId: string }
  | { type: "LANDED"; playerId: string; tileIndex: number; pending: PendingDecision | null }
  | { type: "MONEY_CHANGED"; playerId: string; delta: number; newCash: number; reason: MoneyReason }
  | { type: "RENT_PAID"; fromId: string; toId: string; tileIndex: number; amount: number }
  | { type: "TAX_PAID"; playerId: string; tileIndex: number; amount: number }
  | { type: "CARD_DRAWN"; playerId: string; deck: DeckName; cardId: string; amount: number }
  | { type: "SENT_TO_JAIL"; playerId: string; from: number }
  | { type: "JAIL_PAID"; playerId: string; amount: number }
  | { type: "JAIL_STAYED"; playerId: string; jailTurns: number }
  | { type: "PROPERTY_BOUGHT"; playerId: string; tileIndex: number; price: number }
  | { type: "PROPERTY_SKIPPED"; playerId: string; tileIndex: number }
  | { type: "BUILT"; playerId: string; tileIndex: number; level: number; kind: BuildKind; cost: number }
  | { type: "BANKRUPT"; playerId: string; creditorId: string | null; reason?: "afk" }
  | { type: "TRADE_PROPOSED"; trade: TradeOffer }
  | { type: "PROPERTY_TRANSFERRED"; tileIndex: number; fromId: string; toId: string }
  | { type: "TRADE_ACCEPTED"; tradeId: string }
  | { type: "TRADE_REJECTED"; tradeId: string }
  | { type: "TRADE_CANCELLED"; tradeId: string }
  | { type: "PROPERTY_RELEASED"; playerId: string; tiles: number[] }
  | { type: "OASIS_POOL_CHANGED"; pool: number; delta: number }
  | { type: "OASIS_COLLECTED"; playerId: string; amount: number }
  | { type: "RENT_WAIVED"; fromId: string; toId: string; tileIndex: number; reason: "mortgaged" | "owner_in_detention" }
  | { type: "AUCTION_STARTED"; auction: AuctionState }
  | { type: "AUCTION_BID"; playerId: string; amount: number; endsAt: number; serverNow: number }
  | { type: "AUCTION_WITHDRAWN"; playerId: string }
  | { type: "AUCTION_ENDED"; tileIndex: number; winnerId: string | null; price: number }
  | { type: "PROPERTY_MORTGAGED"; playerId: string; tileIndex: number; amount: number }
  | { type: "PROPERTY_UNMORTGAGED"; playerId: string; tileIndex: number; cost: number }
  | { type: "DEBT_STARTED"; playerId: string; amount: number; creditorId: string | null; reason: PendingDebt["reason"] }
  | { type: "DEBT_PAID"; playerId: string; amount: number }
  | { type: "TURN_ENDED"; playerId: string }
  | { type: "GAME_OVER"; winnerPlayerId: string };

export type GameEventType = GameEvent["type"];

/** Error codes the engine and the server can answer with. */
export type GameErrorCode =
  | "NOT_HOST"
  | "NEED_2_PLAYERS"
  | "NOT_YOUR_TURN"
  | "WRONG_PHASE"
  | "GAME_NOT_STARTED"
  | "GAME_ALREADY_STARTED"
  | "DUPLICATE_ACTION"
  | "NOT_ALLOWED_IN_GAME"
  | "INSUFFICIENT_FUNDS"
  | "SET_INCOMPLETE"
  | "NOT_OWNER"
  | "MAX_LEVEL"
  | "HOTEL_NEEDS_4_HOUSES"
  | "MUST_PAY_TO_LEAVE"
  | "INVALID_TILE"
  | "PLAYER_NOT_IN_GAME"
  | "TRADE_INVALID"
  | "TRADE_NOT_FOUND"
  | "TRADE_NOT_PENDING"
  | "NOT_TRADE_PARTY"
  | "TRADE_HAS_BUILDINGS"
  | "TOO_MANY_TRADES"
  | "TRADE_MORTGAGED"
  | "MORTGAGE_DISABLED"
  | "AUCTIONS_DISABLED"
  | "NOT_MORTGAGEABLE"
  | "NOT_MORTGAGED"
  | "GROUP_MORTGAGED"
  | "UNEVEN_BUILD"
  | "AUCTION_INVALID_BID"
  | "AUCTION_WITHDRAWN"
  | "NOT_IN_DEBT"
  | "DEBT_NOT_COVERED";

/** Payload of the "game:events" socket message. */
export interface GameEventsPayload {
  events: GameEvent[];
  snapshot: GameSnapshot;
  seq: number;
  /** Who must act and by when (server clock); a player who does nothing by then is removed for inactivity. */
  turnTimer?: TurnTimer | null;
}

export interface TurnTimer {
  playerId: string;
  endsAt: number;
  serverNow: number;
}
