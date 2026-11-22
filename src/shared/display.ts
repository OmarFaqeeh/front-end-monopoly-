// Pure reducer that rebuilds the game snapshot from events, one event at a time. The front uses it to advance the
// DISPLAYED state step by step (animations); the back uses it in a contract test: after every batch of events the
// displayed state must equal the authoritative snapshot. Unknown events are ignored.
import type { AuctionState, GameEvent, GameSnapshot, PlayerGameState, TradeOffer, TradeStatus } from "./events.js";

const JAIL_TILE = 10;

/** How many trade offers a game keeps (finished ones are dropped first, oldest first). Engine and reducer share this. */
export const MAX_TRADES = 40;

export function trimTrades(trades: TradeOffer[]): TradeOffer[] {
  let out = trades;
  while (out.length > MAX_TRADES) {
    const drop = out.findIndex((t) => t.status !== "pending");
    out = out.filter((_, i) => i !== (drop >= 0 ? drop : 0));
  }
  return out;
}

export function setTradeStatus(trades: TradeOffer[], id: string, status: TradeStatus): TradeOffer[] {
  return trades.map((t) => (t.id === id ? { ...t, status } : t));
}

/** Pending offers that involve a player who is out of the game are cancelled. */
export function cancelTradesOf(trades: TradeOffer[], playerId: string): TradeOffer[] {
  return trades.map((t) => (t.status === "pending" && (t.fromId === playerId || t.toId === playerId) ? { ...t, status: "cancelled" as const } : t));
}

/** A player leaves the auction (withdraws, resigns, goes bankrupt). If they led the bidding the lead is cleared. */
export function auctionWithout(auction: AuctionState, playerId: string): AuctionState {
  return {
    ...auction,
    withdrawnIds: auction.withdrawnIds.includes(playerId) ? [...auction.withdrawnIds] : [...auction.withdrawnIds, playerId],
    highestBidderId: auction.highestBidderId === playerId ? null : auction.highestBidderId,
  };
}

function mapPlayer(state: GameSnapshot, id: string, fn: (p: PlayerGameState) => PlayerGameState): GameSnapshot {
  if (!state.players.some((p) => p.id === id)) return state;
  return { ...state, players: state.players.map((p) => (p.id === id ? fn(p) : p)) };
}

export function applyEvent(state: GameSnapshot | null, event: GameEvent | { type: string }): GameSnapshot | null {
  const e = event as GameEvent;
  if (e.type === "GAME_STARTED") {
    return {
      phase: "awaitingRoll",
      currentPlayerId: null,
      turnNumber: 0,
      players: e.players.map((p) => ({ id: p.id, characterId: p.characterId, cash: p.cash, position: 0, inJail: false, jailTurns: 0, bankrupt: false })),
      properties: {},
      rules: { ...e.rules },
      oasisPool: 0,
      auction: null,
      pendingDebt: null,
      trades: [],
      lastRoll: null,
      pendingDecision: null,
      seq: 0,
      winnerPlayerId: null,
    };
  }
  if (!state) return state;

  switch (e.type) {
    case "TURN_STARTED":
      return { ...state, currentPlayerId: e.playerId, turnNumber: e.turnNumber, phase: e.phase, pendingDecision: null };
    case "DICE_ROLLED":
      return { ...state, lastRoll: { values: [e.values[0], e.values[1]], total: e.total } };
    case "MOVED":
      return mapPlayer(state, e.playerId, (p) => ({ ...p, position: e.to }));
    case "LANDED":
      return e.pending ? { ...state, phase: "awaitingDecision", pendingDecision: { ...e.pending } } : state;
    case "MONEY_CHANGED":
      return mapPlayer(state, e.playerId, (p) => ({ ...p, cash: e.newCash }));
    case "SENT_TO_JAIL":
      return mapPlayer(state, e.playerId, (p) => ({ ...p, position: JAIL_TILE, inJail: true, jailTurns: 0 }));
    case "JAIL_PAID":
      return { ...mapPlayer(state, e.playerId, (p) => ({ ...p, inJail: false, jailTurns: 0 })), phase: "awaitingRoll" };
    case "JAIL_STAYED":
      return mapPlayer(state, e.playerId, (p) => ({ ...p, jailTurns: e.jailTurns }));
    case "PROPERTY_BOUGHT":
      return { ...state, properties: { ...state.properties, [e.tileIndex]: { ownerId: e.playerId, level: 0, mortgaged: false } }, pendingDecision: null };
    case "PROPERTY_SKIPPED":
      return { ...state, pendingDecision: null };
    case "BUILT":
      return state.properties[e.tileIndex]
        ? { ...state, properties: { ...state.properties, [e.tileIndex]: { ...state.properties[e.tileIndex]!, level: e.level } } }
        : state;
    case "BANKRUPT": {
      const properties = Object.fromEntries(Object.entries(state.properties).filter(([, v]) => v.ownerId !== e.playerId)) as GameSnapshot["properties"];
      const next = mapPlayer(state, e.playerId, (p) => ({ ...p, bankrupt: true, inJail: false, jailTurns: 0 }));
      return {
        ...next,
        properties,
        trades: cancelTradesOf(state.trades, e.playerId),
        auction: state.auction ? auctionWithout(state.auction, e.playerId) : null,
        pendingDecision: state.currentPlayerId === e.playerId ? null : state.pendingDecision,
        pendingDebt: state.currentPlayerId === e.playerId ? null : state.pendingDebt && state.pendingDebt.creditorId === e.playerId ? { ...state.pendingDebt, creditorId: null } : state.pendingDebt,
      };
    }
    case "TRADE_PROPOSED":
      return { ...state, trades: trimTrades([...state.trades, { ...e.trade, give: { ...e.trade.give, tiles: [...e.trade.give.tiles] }, get: { ...e.trade.get, tiles: [...e.trade.get.tiles] } }]) };
    case "PROPERTY_TRANSFERRED":
      return state.properties[e.tileIndex] ? { ...state, properties: { ...state.properties, [e.tileIndex]: { ...state.properties[e.tileIndex]!, ownerId: e.toId } } } : state;
    case "PROPERTY_RELEASED": {
      // Every tile of the player becomes unowned, clean (no buildings, no mortgage).
      const properties = { ...state.properties };
      for (const i of e.tiles) if (properties[i]?.ownerId === e.playerId) delete properties[i];
      return { ...state, properties };
    }
    case "OASIS_POOL_CHANGED":
      return { ...state, oasisPool: e.pool };
    case "AUCTION_STARTED":
      return { ...state, phase: "auction", pendingDecision: null, auction: { ...e.auction, withdrawnIds: [...e.auction.withdrawnIds] } };
    case "AUCTION_BID":
      return state.auction ? { ...state, auction: { ...state.auction, currentBid: e.amount, highestBidderId: e.playerId, endsAt: e.endsAt, serverNow: e.serverNow } } : state;
    case "AUCTION_WITHDRAWN":
      return state.auction ? { ...state, auction: auctionWithout(state.auction, e.playerId) } : state;
    case "AUCTION_ENDED":
      return {
        ...state,
        auction: null,
        properties: e.winnerId ? { ...state.properties, [e.tileIndex]: { ownerId: e.winnerId, level: 0, mortgaged: false } } : state.properties,
      };
    case "PROPERTY_MORTGAGED":
      return state.properties[e.tileIndex] ? { ...state, properties: { ...state.properties, [e.tileIndex]: { ...state.properties[e.tileIndex]!, mortgaged: true } } } : state;
    case "PROPERTY_UNMORTGAGED":
      return state.properties[e.tileIndex] ? { ...state, properties: { ...state.properties, [e.tileIndex]: { ...state.properties[e.tileIndex]!, mortgaged: false } } } : state;
    case "DEBT_STARTED":
      return { ...state, phase: "raisingFunds", pendingDebt: { amount: e.amount, creditorId: e.creditorId, reason: e.reason } };
    case "DEBT_PAID":
      return { ...state, pendingDebt: null };
    case "TRADE_ACCEPTED":
      return { ...state, trades: setTradeStatus(state.trades, e.tradeId, "accepted") };
    case "TRADE_REJECTED":
      return { ...state, trades: setTradeStatus(state.trades, e.tradeId, "rejected") };
    case "TRADE_CANCELLED":
      return { ...state, trades: setTradeStatus(state.trades, e.tradeId, "cancelled") };
    case "GAME_OVER":
      return { ...state, phase: "gameOver", winnerPlayerId: e.winnerPlayerId, pendingDecision: null, pendingDebt: null, auction: null };
    default:
      // PASSED_START, RENT_PAID, TAX_PAID, CARD_DRAWN, TURN_ENDED carry no state, and unknown events are ignored.
      return state;
  }
}

/** Applies a whole batch and stamps the batch's seq. */
export function applyBatch(state: GameSnapshot | null, events: readonly (GameEvent | { type: string })[], seq: number): GameSnapshot | null {
  let next = state;
  for (const ev of events) next = applyEvent(next, ev);
  return next ? { ...next, seq } : next;
}
