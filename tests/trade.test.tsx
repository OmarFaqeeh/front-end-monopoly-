// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const calls: unknown[][] = [];
vi.mock("@/lib/gameClient", () => ({
  proposeTrade: async (...a: unknown[]) => (calls.push(["propose", ...a]), null),
  acceptTrade: async (...a: unknown[]) => (calls.push(["accept", ...a]), null),
  rejectTrade: async (...a: unknown[]) => (calls.push(["reject", ...a]), null),
  cancelTrade: async (...a: unknown[]) => (calls.push(["cancel", ...a]), null),
  resignGame: async () => (calls.push(["resign"]), null),
}));

import WithdrawButton from "@/components/game/WithdrawButton";
import PlayerPicker from "@/components/trade/PlayerPicker";
import TradeCard from "@/components/trade/TradeCard";
import TradeDialog from "@/components/trade/TradeDialog";
import TradeToast from "@/components/trade/TradeToast";
import { GameQueue, type QueueDeps } from "@/lib/gameQueue";
import { applyBatch } from "@/shared/display";
import type { GameEvent, GameSnapshot, TradeOffer } from "@/shared/events";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import { manualSleep, snapshot } from "./helpers/game";

const players = [
  { id: "a", nickname: "Omar", characterId: "c01", isHost: true },
  { id: "b", nickname: "Sara", characterId: "c11", isHost: false },
  { id: "c", nickname: "Lina", characterId: "c07", isHost: false },
];

/** a owns 1 and 3, b owns 6 (with a house) and 8, c owns nothing. */
function game(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  const base = snapshot({
    players: [
      { id: "a", characterId: "c01", cash: 1000, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
      { id: "b", characterId: "c11", cash: 800, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
      { id: "c", characterId: "c07", cash: 500, position: 0, inJail: false, jailTurns: 0, bankrupt: false },
    ],
  });
  base.properties = { 1: { ownerId: "a", level: 0 }, 3: { ownerId: "a", level: 0 }, 6: { ownerId: "b", level: 1 }, 8: { ownerId: "b", level: 0 } };
  return { ...base, ...overrides };
}
const offer = (o: Partial<TradeOffer> = {}): TradeOffer => ({ id: "T1", fromId: "a", toId: "b", give: { tiles: [1], cash: 100 }, get: { tiles: [8], cash: 0 }, status: "pending", ...o });

const show = (g = game()) => useGameStore.setState({ active: true, snapshot: g, display: g, busy: false });
const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="en" messages={en}>{ui}</NextIntlClientProvider>);

beforeEach(() => {
  calls.length = 0;
  useGameStore.getState().reset();
  useRoomStore.setState({ meId: "a", players, stage: "lobby" });
});
afterEach(cleanup);

describe("trade box", () => {
  it("the + opens a popup with the OTHER active players; picking one closes it and opens the offer editor", () => {
    show(game({ players: game().players.map((p) => (p.id === "c" ? { ...p, bankrupt: true } : p)) }));
    wrap(
      <>
        <TradeCard />
        <PlayerPicker />
      </>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New trade" }));
    const dialog = screen.getByRole("dialog", { name: "Trade with..." });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("Sara");
    expect(dialog).not.toHaveTextContent("Omar"); // not yourself
    expect(dialog).not.toHaveTextContent("Lina"); // not a player who is out
    expect(dialog).toHaveTextContent("800 $");
    expect(dialog).toHaveTextContent("2 properties"); // Sara owns 6 and 8
    // the trade box itself no longer lists players
    expect(document.querySelector("[data-trade-card] [data-partner]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Sara/ }));
    expect(useGameStore.getState().tradeUi).toEqual({ kind: "compose", partnerId: "b" });
  });

  it("is disabled when nobody else is left, and shows an empty note", () => {
    show(game({ players: [game().players[0]!] }));
    wrap(<TradeCard />);
    expect(screen.getByRole("button", { name: "New trade" })).toBeDisabled();
    expect(screen.getByText("No active trades")).toBeInTheDocument();
  });

  it("lists every offer (also ones between others) with its status; offers for you are highlighted; click opens it", () => {
    show(game({ trades: [offer({ id: "T1", status: "accepted" }), offer({ id: "T2", fromId: "b", toId: "c", give: { tiles: [], cash: 50 }, get: { tiles: [], cash: 0 } }), offer({ id: "T3", fromId: "c", toId: "a", give: { tiles: [], cash: 20 }, get: { tiles: [], cash: 0 } })] }));
    wrap(<TradeCard />);
    expect(screen.getByRole("button", { name: "Open offer from Omar to Sara" })).toHaveAttribute("data-trade-status", "accepted");
    expect(screen.getByRole("button", { name: "Open offer from Sara to Lina" })).toBeInTheDocument(); // not addressed to me, still visible
    const mine = screen.getByRole("button", { name: "Open offer from Lina to Omar" });
    expect(mine).toHaveTextContent("Needs your answer");
    fireEvent.click(screen.getByRole("button", { name: "Open offer from Sara to Lina" }));
    expect(useGameStore.getState().tradeUi).toEqual({ kind: "view", tradeId: "T2" });
  });
});

describe("offer editor", () => {
  const open = () => {
    show();
    useGameStore.setState({ tradeUi: { kind: "compose", partnerId: "b" } });
    wrap(<TradeDialog />);
  };

  it("shows my side on the right and theirs on the left, each with budget, properties and a cash slider", () => {
    open();
    const mine = document.querySelector("[data-trade-side='mine']")!;
    const theirs = document.querySelector("[data-trade-side='theirs']")!;
    expect(mine).toHaveTextContent("Omar");
    expect(mine).toHaveTextContent("Budget 1000 $");
    expect(theirs).toHaveTextContent("Sara");
    expect(theirs).toHaveTextContent("Budget 800 $");
    expect(mine.querySelectorAll("[data-trade-tile]")).toHaveLength(2);
    expect(theirs.querySelectorAll("[data-trade-tile]")).toHaveLength(2);
    const sideOrder = [...document.querySelectorAll("[data-trade-side]")].map((e) => e.getAttribute("data-trade-side"));
    expect(sideOrder).toEqual(["mine", "theirs"]); // mine first in the DOM, shown on the right (row-reverse)
    expect(screen.getByRole("slider", { name: "Cash you give" })).toHaveAttribute("max", "1000");
    expect(screen.getByRole("slider", { name: "Cash you ask for" })).toHaveAttribute("max", "800");
  });

  it("a property with buildings cannot be selected", () => {
    open();
    const built = document.querySelector("[data-trade-side='theirs'] [data-trade-tile='6']") as HTMLButtonElement;
    expect(built).toBeDisabled();
    expect(built).toHaveTextContent("Has buildings");
  });

  it("send is disabled until something is offered, then sends exactly what was chosen", async () => {
    open();
    const send = screen.getByRole("button", { name: "Send offer" });
    expect(send).toBeDisabled();
    fireEvent.click(document.querySelector("[data-trade-side='mine'] [data-trade-tile='1']")!);
    fireEvent.click(document.querySelector("[data-trade-side='mine'] [data-trade-tile='3']")!);
    fireEvent.click(document.querySelector("[data-trade-side='theirs'] [data-trade-tile='8']")!);
    fireEvent.change(screen.getByRole("slider", { name: "Cash you give" }), { target: { value: "150" } });
    expect(screen.getAllByText("150 $").length).toBeGreaterThan(0);
    expect(send).toBeEnabled();
    fireEvent.click(send);
    await waitFor(() => expect(calls).toEqual([["propose", "b", { tiles: [1, 3], cash: 150 }, { tiles: [8], cash: 0 }]]));
    await waitFor(() => expect(useGameStore.getState().tradeUi).toBeNull()); // closes after sending
  });

  it("a cash-only offer is allowed; selecting a tile twice deselects it", async () => {
    open();
    fireEvent.change(screen.getByRole("slider", { name: "Cash you ask for" }), { target: { value: "200" } });
    const chip = document.querySelector("[data-trade-side='mine'] [data-trade-tile='1']")!;
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-checked", "true");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("button", { name: "Send offer" }));
    await waitFor(() => expect(calls).toEqual([["propose", "b", { tiles: [], cash: 0 }, { tiles: [], cash: 200 }]]));
  });

  it("discard closes without sending", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(calls).toEqual([]);
    expect(useGameStore.getState().tradeUi).toBeNull();
  });
});

describe("looking at an offer", () => {
  const view = (meId: string, o: TradeOffer = offer()) => {
    useRoomStore.setState({ meId });
    show(game({ trades: [o] }));
    useGameStore.setState({ tradeUi: { kind: "view", tradeId: o.id } });
    wrap(<TradeDialog />);
  };

  it("the recipient sees the offer and can accept or decline it", async () => {
    view("b");
    expect(screen.getByRole("dialog", { name: "Offer from Omar to Sara" })).toBeInTheDocument();
    // the sender (Omar) is on the right-hand side of the layout, but it is NOT my side: I am the recipient (Sara)
    expect(document.querySelector("[data-trade-side='mine']")).toHaveTextContent("Sara");
    expect(document.querySelector("[data-trade-side='theirs']")).toHaveTextContent("Omar");
    expect(document.querySelectorAll("[data-trade-tile]")).toHaveLength(2); // only the traded tiles: 1 (given) and 8 (asked)
    expect(screen.getByText("Gives 100 $")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(calls).toEqual([["accept", "T1"]]));
    cleanup();
    calls.length = 0;
    view("b");
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    await waitFor(() => expect(calls).toEqual([["reject", "T1"]]));
  });

  it("the sender can only cancel it", async () => {
    view("a");
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel offer" }));
    await waitFor(() => expect(calls).toEqual([["cancel", "T1"]]));
  });

  it("anybody else can only look at it (no accept, decline or cancel)", () => {
    view("c");
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel offer" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Close" }).length).toBeGreaterThan(0);
  });

  it("an answered offer shows its status and offers no actions, even to the recipient", () => {
    view("b", offer({ status: "rejected" }));
    expect(document.querySelector("[data-trade-status='rejected']")).toHaveTextContent("Declined");
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  });

  it("an offer that no longer exists says so", () => {
    useRoomStore.setState({ meId: "b" });
    show(game({ trades: [] }));
    useGameStore.setState({ tradeUi: { kind: "view", tradeId: "gone" } });
    wrap(<TradeDialog />);
    expect(screen.getByText("That offer no longer exists.")).toBeInTheDocument();
  });
});

describe("incoming offer card", () => {
  it("appears for an offer sent to me; accept and decline answer it right away; View opens the window", async () => {
    useRoomStore.setState({ meId: "b" });
    show(game({ trades: [offer()] }));
    useGameStore.setState({ incomingTrade: "T1" });
    wrap(<TradeToast />);
    expect(screen.getByRole("alert")).toHaveTextContent("Omar sent you a trade offer");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(calls).toEqual([["accept", "T1"]]));
    cleanup();

    useGameStore.setState({ incomingTrade: "T1", tradeUi: null });
    wrap(<TradeToast />);
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(useGameStore.getState().tradeUi).toEqual({ kind: "view", tradeId: "T1" });
    expect(useGameStore.getState().incomingTrade).toBeNull();
  });

  it("is not shown once the offer was answered, and can be dismissed (the offer stays in the list)", () => {
    useRoomStore.setState({ meId: "b" });
    show(game({ trades: [offer({ status: "accepted" })] }));
    useGameStore.setState({ incomingTrade: "T1" });
    wrap(<TradeToast />);
    expect(screen.queryByRole("alert")).toBeNull();
    cleanup();

    show(game({ trades: [offer()] }));
    useGameStore.setState({ incomingTrade: "T1" });
    wrap(<TradeToast />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(useGameStore.getState().incomingTrade).toBeNull();
    expect(useGameStore.getState().display!.trades).toHaveLength(1);
  });
});

describe("withdraw button", () => {
  it("asks for confirmation, then withdraws", async () => {
    show();
    wrap(<WithdrawButton />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(calls).toEqual([]); // nothing yet
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Withdraw from the game?");
    fireEvent.click(screen.getByRole("button", { name: "Keep playing" }));
    expect(calls).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, withdraw" }));
    await waitFor(() => expect(calls).toEqual([["resign"]]));
  });

  it("after withdrawing it only says so, and it is gone when the game is over", () => {
    const g = game();
    show({ ...g, players: g.players.map((p) => (p.id === "a" ? { ...p, bankrupt: true } : p)) });
    wrap(<WithdrawButton />);
    expect(screen.queryByRole("button", { name: "Withdraw" })).toBeNull();
    expect(screen.getByText("You withdrew from the game")).toBeInTheDocument();
    cleanup();
    show({ ...g, phase: "gameOver", winnerPlayerId: "b" });
    const { container } = wrap(<WithdrawButton />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("trade events in the animation queue", () => {
  function setup(me = "b") {
    const sleeper = manualSleep();
    const played: string[] = [];
    const system: [string, Record<string, unknown>][] = [];
    const deps: QueueDeps = {
      sleep: sleeper.sleep,
      play: (n) => played.push(n),
      reduced: () => false,
      meId: () => me,
      nameOf: (id) => players.find((p) => p.id === id)?.nickname ?? id,
      system: (code, params) => system.push([code, params]),
    };
    const queue = new GameQueue(deps);
    const start = game();
    queue.adopt(start);
    return { queue, sleeper, played, system, start };
  }

  it("an offer to me raises the incoming card and the offer sound; an offer to someone else does not", async () => {
    const { queue, sleeper, played, system, start } = setup("b");
    const proposed: GameEvent[] = [{ type: "TRADE_PROPOSED", trade: offer() }];
    queue.push({ events: proposed, snapshot: applyBatch(start, proposed, 1)!, seq: 1 });
    await sleeper.flush();
    expect(useGameStore.getState().incomingTrade).toBe("T1");
    expect(played).toEqual(["offer"]);
    expect(system).toEqual([["tradeOffer", { from: "Omar", to: "Sara" }]]);
    expect(useGameStore.getState().display!.trades).toHaveLength(1);

    const elsewhere = setup("c");
    elsewhere.queue.push({ events: proposed, snapshot: applyBatch(elsewhere.start, proposed, 1)!, seq: 1 });
    await elsewhere.sleeper.flush();
    expect(useGameStore.getState().incomingTrade).toBeNull();
    expect(elsewhere.played).toEqual([]);
  });

  it("an accepted offer moves the properties and the cash in the displayed state and the end equals the snapshot", async () => {
    const { queue, sleeper, system, start } = setup("b");
    const pending = applyBatch(start, [{ type: "TRADE_PROPOSED", trade: offer() }], 1)!;
    queue.adopt(pending);
    useGameStore.getState().patch({ incomingTrade: "T1" });
    const events: GameEvent[] = [
      { type: "PROPERTY_TRANSFERRED", tileIndex: 1, fromId: "a", toId: "b" },
      { type: "PROPERTY_TRANSFERRED", tileIndex: 8, fromId: "b", toId: "a" },
      { type: "MONEY_CHANGED", playerId: "a", delta: -100, newCash: 900, reason: "trade" },
      { type: "MONEY_CHANGED", playerId: "b", delta: 100, newCash: 900, reason: "trade" },
      { type: "TRADE_ACCEPTED", tradeId: "T1" },
    ];
    const snap = applyBatch(pending, events, 2)!;
    queue.push({ events, snapshot: snap, seq: 2 });
    await sleeper.flush();
    const display = useGameStore.getState().display!;
    expect(display.properties[1]!.ownerId).toBe("b");
    expect(display.properties[8]!.ownerId).toBe("a");
    expect(display.players.map((p) => p.cash)).toEqual([900, 900, 500]);
    expect(display.trades[0]!.status).toBe("accepted");
    expect(display).toEqual(snap);
    expect(useGameStore.getState().incomingTrade).toBeNull(); // answered: the card goes away
    expect(system.at(-1)).toEqual(["tradeAccepted", { from: "Omar", to: "Sara" }]);
  });

  it("decline and cancel are announced too", async () => {
    const { queue, sleeper, system, start } = setup("c");
    const pending = applyBatch(start, [{ type: "TRADE_PROPOSED", trade: offer({ id: "T1" }) }, { type: "TRADE_PROPOSED", trade: offer({ id: "T2" }) }], 1)!;
    queue.adopt(pending);
    const events: GameEvent[] = [{ type: "TRADE_REJECTED", tradeId: "T1" }, { type: "TRADE_CANCELLED", tradeId: "T2" }];
    queue.push({ events, snapshot: applyBatch(pending, events, 2)!, seq: 2 });
    await sleeper.flush();
    expect(system.map((s) => s[0])).toEqual(["tradeRejected", "tradeCancelled"]);
    expect(useGameStore.getState().display!.trades.map((x) => x.status)).toEqual(["rejected", "cancelled"]);
  });
});
