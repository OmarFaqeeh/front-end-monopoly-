// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const calls: unknown[][] = [];
vi.mock("@/lib/gameClient", () => {
  const rec = (name: string) => async (...a: unknown[]) => (calls.push([name, ...a]), null);
  return {
    bidAuction: rec("bid"),
    withdrawAuction: rec("withdraw"),
    mortgageTile: rec("mortgage"),
    unmortgageTile: rec("unmortgage"),
    payDebt: rec("payDebt"),
    declareBankruptcy: rec("declareBankruptcy"),
    buildOn: rec("build"),
    proposeTrade: rec("propose"),
    acceptTrade: rec("accept"),
    rejectTrade: rec("reject"),
    cancelTrade: rec("cancel"),
    startGame: rec("start"),
    rollDice: rec("roll"),
    buyProperty: rec("buy"),
    skipProperty: rec("skip"),
    payJailFine: rec("jailPay"),
    stayInJail: rec("jailStay"),
    resignGame: rec("resign"),
  };
});

import Board from "@/components/board/Board";
import AuctionModal from "@/components/game/AuctionModal";
import DebtBanner from "@/components/game/DebtBanner";
import PlayerPicker from "@/components/trade/PlayerPicker";
import SettingsPanel from "@/components/room/SettingsPanel";
import { mortgageCheck, mortgageableTiles } from "@/lib/mortgage";
import { buildCheck } from "@/lib/build";
import { roomSettingsSchema, DEFAULT_SETTINGS } from "@/shared/settings";
import type { GameSnapshot } from "@/shared/events";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import { snapshot } from "./helpers/game";

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const players = [
  { id: "a", nickname: "Omar", characterId: "c01", isHost: true },
  { id: "b", nickname: "Sara", characterId: "c11", isHost: false },
  { id: "c", nickname: "Max", characterId: "c07", isHost: false, isBot: true },
];

function game(over: Partial<GameSnapshot> = {}, rules: Partial<GameSnapshot["rules"]> = {}): GameSnapshot {
  const s = snapshot({
    players: ["a", "b", "c"].map((id, i) => ({ id, characterId: ["c01", "c11", "c07"][i]!, cash: 1000, position: 0, inJail: false, jailTurns: 0, bankrupt: false })),
  });
  return { ...s, rules: { ...s.rules, ...rules }, ...over };
}
const show = (g: GameSnapshot, busy = false) => useGameStore.setState({ active: true, snapshot: g, display: g, busy });
const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="en" messages={en}>{ui}</NextIntlClientProvider>);

beforeEach(() => {
  calls.length = 0;
  useGameStore.getState().reset();
  useRoomStore.setState({ meId: "a", players, stage: "lobby", selectedTile: null, settings: { ...DEFAULT_SETTINGS } });
});
afterEach(cleanup);

describe("settings contract", () => {
  it("has no privateRoom key and rejects it; defaults match the spec", () => {
    expect(DEFAULT_SETTINGS).toEqual({ maxPlayers: 4, allowBots: false, boardMap: "classic", doubleRentSets: false, oasisJackpot: false, auctions: true, noRentInDetention: false, mortgage: false, evenBuild: false, startingCash: 1500 });
    expect(roomSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, privateRoom: true }).success).toBe(false);
    expect(roomSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, startingCash: 1234 }).success).toBe(false);
    expect(roomSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, maxPlayers: 9 }).success).toBe(false);
  });

  it("the panel has no private-room row; in a game it is read-only for everyone with the locked note", () => {
    useRoomStore.setState({ stage: "lobby" });
    wrap(<SettingsPanel />);
    expect(screen.queryByText(/Private room/i)).toBeNull();
    expect(screen.getAllByRole("switch").every((s) => !(s as HTMLButtonElement).disabled)).toBe(true); // the host can edit in the lobby
    cleanup();

    show(game());
    wrap(<SettingsPanel />);
    expect(screen.getByText("Rules are locked once the game starts")).toBeInTheDocument();
    expect(screen.getAllByRole("switch").every((s) => (s as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getAllByRole("combobox").every((s) => (s as HTMLSelectElement).disabled)).toBe(true);
  });
});

describe("trade partner popup", () => {
  const open = (g = game()) => {
    show(g);
    useGameStore.setState({ tradeUi: { kind: "picker" } });
    return wrap(<PlayerPicker />);
  };

  it("lists active players with picture, cash, property count and a Bot badge", () => {
    open(game({ properties: { 1: { ownerId: "c", level: 0 }, 3: { ownerId: "c", level: 0 } } }));
    const bot = document.querySelector("[data-partner='c']")!;
    expect(bot).toHaveTextContent("Max");
    expect(bot).toHaveTextContent("Bot");
    expect(bot).toHaveTextContent("1000 $");
    expect(bot).toHaveTextContent("2 properties");
    expect(document.querySelector("[data-partner='b']")).not.toHaveTextContent("Bot");
  });

  it("is disabled with a reason during an auction or a debt", () => {
    open(game({ phase: "auction", auction: { tileIndex: 6, currentBid: 0, highestBidderId: null, withdrawnIds: [], endsAt: Date.now() + 9999, serverNow: Date.now() } }));
    expect(document.querySelector("[data-partner='b']")).toBeDisabled();
    expect(screen.getAllByText("Not available during an auction").length).toBeGreaterThan(0);
    cleanup();
    open(game({ phase: "raisingFunds", pendingDebt: { amount: 50, creditorId: null, reason: "tax" } }));
    expect(document.querySelector("[data-partner='c']")).toBeDisabled();
    expect(screen.getAllByText("Not available while a debt is being settled").length).toBeGreaterThan(0);
  });

  it("Esc and a click on the backdrop close it; the arrow keys move between cards; Tab stays inside", () => {
    open();
    const cards = () => [...document.querySelectorAll<HTMLElement>("[data-partner]")];
    expect(cards()[0]).toHaveFocus(); // focus moves into the dialog
    fireEvent.keyDown(cards()[0]!, { key: "ArrowDown" });
    expect(cards()[1]).toHaveFocus();
    fireEvent.keyDown(cards()[1]!, { key: "ArrowDown" });
    expect(cards()[0]).toHaveFocus(); // wraps
    fireEvent.keyDown(cards()[0]!, { key: "ArrowUp" });
    expect(cards()[1]).toHaveFocus();
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    fireEvent.keyDown(close, { key: "Tab" }); // last focusable: wraps to the first
    fireEvent.keyDown(cards()[0]!, { key: "Escape" });
    expect(useGameStore.getState().tradeUi).toBeNull();

    open();
    fireEvent.pointerDown(document.querySelector("[data-player-picker]")!);
    expect(useGameStore.getState().tradeUi).toBeNull();
  });

  it("is a labelled modal dialog and gives the focus back to the + when it closes", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    open();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    act(() => useGameStore.setState({ tradeUi: null }));
    expect(opener).toHaveFocus();
    opener.remove();
  });
});

describe("auction modal", () => {
  const auctionGame = (over: Partial<NonNullable<GameSnapshot["auction"]>> = {}, cash = 1000) =>
    game({
      phase: "auction",
      players: game().players.map((p) => (p.id === "a" ? { ...p, cash } : p)),
      auction: { tileIndex: 6, currentBid: 0, highestBidderId: null, withdrawnIds: [], endsAt: Date.now() + 10_000, serverNow: Date.now(), ...over },
    });

  it("shows the tile, the bid, the leader, the timer and sends quick bids on top of the current bid", async () => {
    show(auctionGame({ currentBid: 40, highestBidderId: "b" }));
    wrap(<AuctionModal />);
    expect(screen.getByRole("dialog", { name: "Auction" })).toBeInTheDocument();
    expect(screen.getByText("Patagonia")).toBeInTheDocument();
    expect(document.querySelector("[data-current-bid]")).toHaveTextContent("40 $");
    expect(screen.getByText("Sara")).toBeInTheDocument();
    expect(document.querySelector("[data-auction-timer]")).toHaveAttribute("role", "progressbar");
    fireEvent.click(screen.getByRole("button", { name: "+10" }));
    fireEvent.click(screen.getByRole("button", { name: "+50" }));
    fireEvent.click(screen.getByRole("button", { name: "+100" }));
    await waitFor(() => expect(calls).toEqual([["bid", 50], ["bid", 90], ["bid", 140]]));
  });

  it("the first bid starts at 10; buttons that would exceed your cash are disabled", () => {
    show(auctionGame({}, 60));
    wrap(<AuctionModal />);
    expect(screen.getByText("No bids yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+10" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "+50" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "+100" })).toBeDisabled();
  });

  it("tells you when you lead, when you are outbid, and when you withdrew", () => {
    show(auctionGame({ currentBid: 30, highestBidderId: "a" }));
    wrap(<AuctionModal />);
    expect(screen.getByText("You are the highest bidder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+10" })).toBeDisabled(); // you cannot outbid yourself
    cleanup();

    useGameStore.setState({ iBid: true });
    show(auctionGame({ currentBid: 60, highestBidderId: "b" }));
    wrap(<AuctionModal />);
    expect(screen.getByText("Outbid")).toBeInTheDocument();
    cleanup();

    show(auctionGame({ withdrawnIds: ["a"], currentBid: 20, highestBidderId: "b" }));
    wrap(<AuctionModal />);
    expect(screen.getByText("You withdrew")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });

  it("Withdraw sends the action; nothing is shown outside an auction", async () => {
    show(auctionGame());
    wrap(<AuctionModal />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(calls).toEqual([["withdraw"]]));
    cleanup();
    show(game());
    const { container } = wrap(<AuctionModal />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("debt banner", () => {
  const debtGame = (cash: number, creditorId: string | null = null) =>
    game(
      {
        phase: "raisingFunds",
        currentPlayerId: "a",
        pendingDebt: { amount: 200, creditorId, reason: creditorId ? "rent" : "tax" },
        players: game().players.map((p) => (p.id === "a" ? { ...p, cash } : p)),
        properties: { 37: { ownerId: "a", level: 0, mortgaged: false }, 39: { ownerId: "a", level: 0, mortgaged: false }, 1: { ownerId: "a", level: 1 }, 3: { ownerId: "a", level: 0 } },
      },
      { mortgage: true },
    );

  it("shows what you owe and to whom, the tiles you can mortgage (never ones with buildings), pay and bankruptcy", async () => {
    show(debtGame(100, "b"));
    wrap(<DebtBanner />);
    expect(screen.getByRole("alert")).toHaveTextContent("You owe 200 $ to Sara");
    const offered = [...document.querySelectorAll("[data-mortgage-tile]")].map((e) => e.getAttribute("data-mortgage-tile"));
    expect(offered.sort()).toEqual(["37", "39"]); // 1 and 3 are in a set with a house
    expect(screen.getByRole("button", { name: "Pay debt" })).toBeDisabled(); // 100 < 200
    fireEvent.click(document.querySelector("[data-mortgage-tile='39']")!);
    fireEvent.click(screen.getByRole("button", { name: "Declare bankruptcy" }));
    await waitFor(() => expect(calls).toEqual([["mortgage", 39], ["declareBankruptcy"]]));
  });

  it("Pay debt is enabled once cash covers it; a debt to the bank says so; others only see who is raising funds", async () => {
    show(debtGame(250));
    wrap(<DebtBanner />);
    expect(screen.getByRole("alert")).toHaveTextContent("to the bank");
    fireEvent.click(screen.getByRole("button", { name: "Pay debt" }));
    await waitFor(() => expect(calls).toEqual([["payDebt"]]));
    cleanup();
    useRoomStore.setState({ meId: "b" });
    show(debtGame(100));
    wrap(<DebtBanner />);
    expect(screen.getByText("Omar is raising funds")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("mortgage on the tile card and the board", () => {
  const mine = (rules: Partial<GameSnapshot["rules"]>, props: GameSnapshot["properties"], over: Partial<GameSnapshot> = {}) =>
    game({ currentPlayerId: "a", properties: props, ...over }, rules);
  const open = (g: GameSnapshot, tile = 37) => {
    useRoomStore.setState({ selectedTile: null });
    show(g);
    wrap(<Board interactive players={[]} />);
    fireEvent.click(document.querySelector(`[data-tile='${tile}']`)!);
  };

  it("offers Mortgage (+half the price) and, once mortgaged, Unmortgage (-price/2 +10%)", async () => {
    open(mine({ mortgage: true }, { 37: { ownerId: "a", level: 0, mortgaged: false } }));
    const btn = await screen.findByRole("button", { name: "Mortgage (+175 $)" });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    await waitFor(() => expect(calls).toEqual([["mortgage", 37]]));
    cleanup();
    open(mine({ mortgage: true }, { 37: { ownerId: "a", level: 0, mortgaged: true } }));
    expect(await screen.findByRole("button", { name: "Unmortgage (-193 $)" })).toBeEnabled();
    expect(screen.getByText("Mortgaged: no rent and no building")).toBeInTheDocument();
  });

  it("is hidden when the rule is off, disabled with a hint for buildings, and never for other players' tiles", async () => {
    open(mine({ mortgage: false }, { 37: { ownerId: "a", level: 0 } }));
    await screen.findByRole("dialog");
    expect(document.querySelector("[data-mortgage-menu]")).toBeNull();
    cleanup();
    open(mine({ mortgage: true }, { 37: { ownerId: "a", level: 1 }, 39: { ownerId: "a", level: 0 } }));
    expect(await screen.findByRole("button", { name: "Mortgage (+175 $)" })).toBeDisabled();
    expect(screen.getByText(/cannot be mortgaged/)).toBeInTheDocument();
    cleanup();
    open(mine({ mortgage: true }, { 37: { ownerId: "b", level: 0 } }));
    await screen.findByRole("dialog");
    expect(document.querySelector("[data-mortgage-menu]")).toBeNull();
  });

  it("a mortgaged tile shows a gray overlay and badge on the board", () => {
    show(mine({ mortgage: true }, { 5: { ownerId: "b", level: 0, mortgaged: true } }));
    const { container } = wrap(<Board interactive={false} players={[]} />);
    expect(container.querySelectorAll("[data-mortgaged]")).toHaveLength(1);
    expect(container.querySelector("[data-mortgaged]")).toHaveTextContent("Mortgaged");
  });

  it("mirrors the engine: mortgageCheck and mortgageableTiles", () => {
    const g = mine({ mortgage: true }, { 1: { ownerId: "a", level: 0 }, 3: { ownerId: "a", level: 2 }, 5: { ownerId: "a", level: 0, mortgaged: true }, 12: { ownerId: "a", level: 0 } });
    expect(mortgageableTiles(g, "a").sort((x, y) => x - y)).toEqual([12]); // 1 and 3 share a set with buildings, 5 is already mortgaged
    expect(mortgageCheck(g, "a", 12, "mortgage")).toBeNull();
    expect(mortgageCheck(g, "a", 5, "unmortgage")).toBeNull();
    expect(mortgageCheck(g, "a", 5, "mortgage")).toBe("NOT_MORTGAGEABLE");
    expect(mortgageCheck(g, "b", 12, "mortgage")).toBe("NOT_OWNER");
    expect(mortgageCheck({ ...g, rules: { ...g.rules, mortgage: false } }, "a", 12, "mortgage")).toBe("MORTGAGE_DISABLED");
    expect(mortgageCheck({ ...g, phase: "auction" }, "a", 12, "mortgage")).toBe("WRONG_PHASE");
  });
});

describe("rules in the tile card, the board and the build menu", () => {
  const open = (g: GameSnapshot, tile: number) => {
    useRoomStore.setState({ selectedTile: null });
    show(g);
    wrap(<Board interactive players={[]} />);
    fireEvent.click(document.querySelector(`[data-tile='${tile}']`)!);
  };

  it("notes for double rent and no rent in detention appear only when the rules are on", async () => {
    open(game({}, { doubleRentSets: true, noRentInDetention: true }), 6);
    expect(await screen.findByText("Own the whole set: base rent is doubled")).toBeInTheDocument();
    expect(screen.getByText("Owner in detention collects no rent")).toBeInTheDocument();
    cleanup();
    open(game({}, { doubleRentSets: false, noRentInDetention: false }), 6);
    await screen.findByRole("dialog");
    expect(screen.queryByText("Own the whole set: base rent is doubled")).toBeNull();
    expect(screen.queryByText("Owner in detention collects no rent")).toBeNull();
  });

  it("the Oasis tile shows the live jackpot only when the rule is on", () => {
    show(game({ oasisPool: 340 }, { oasisJackpot: true }));
    const on = wrap(<Board interactive={false} players={[]} />);
    expect(on.container.querySelector("[data-oasis-chip]")).toHaveTextContent("Jackpot 340 $");
    expect(on.container.querySelector("[data-oasis-line]")).toHaveTextContent("Oasis jackpot: 340 $"); // and a line in the board center
    cleanup();
    show(game({ oasisPool: 0 }, { oasisJackpot: false }));
    const off = wrap(<Board interactive={false} players={[]} />);
    expect(off.container.querySelector("[data-oasis-chip]")).toBeNull();
    expect(off.container.querySelector("[data-oasis-line]")).toBeNull();
  });

  it("buildCheck knows even build and mortgaged groups", () => {
    const base = game({ currentPlayerId: "a" }, { evenBuild: true });
    const set = (levels: number[], mortgaged = false): GameSnapshot["properties"] => ({
      6: { ownerId: "a", level: levels[0]!, mortgaged },
      8: { ownerId: "a", level: levels[1]!, mortgaged: false },
      9: { ownerId: "a", level: levels[2]!, mortgaged: false },
    });
    expect(buildCheck({ ...base, properties: set([1, 0, 0]) }, "a", 6, "house")).toBe("UNEVEN_BUILD");
    expect(buildCheck({ ...base, properties: set([0, 0, 0]) }, "a", 6, "house")).toBeNull();
    expect(buildCheck({ ...base, properties: set([4, 4, 3]) }, "a", 6, "hotel")).toBe("UNEVEN_BUILD");
    expect(buildCheck({ ...base, properties: set([4, 4, 4]) }, "a", 6, "hotel")).toBeNull();
    expect(buildCheck({ ...base, rules: { ...base.rules, evenBuild: false }, properties: set([1, 0, 0]) }, "a", 6, "house")).toBeNull();
    expect(buildCheck({ ...base, properties: set([0, 0, 0], true) }, "a", 8, "house")).toBe("GROUP_MORTGAGED");
  });
});
