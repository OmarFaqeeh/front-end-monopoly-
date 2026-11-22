// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const calls: string[] = [];
vi.mock("@/lib/gameClient", () => ({
  rollDice: () => void calls.push("roll"),
  buyProperty: () => void calls.push("buy"),
  skipProperty: () => void calls.push("skip"),
  payJailFine: () => void calls.push("jailPay"),
  stayInJail: () => void calls.push("jailStay"),
  startGame: () => void calls.push("start"),
  buildOn: (tile: number, kind: string) => void calls.push(`build:${tile}:${kind}`),
}));

import Board from "@/components/board/Board";
import CenterControls from "@/components/game/CenterControls";
import MoneyCounter from "@/components/game/MoneyCounter";
import PlayersCard from "@/components/room/PlayersCard";
import { buildCheck } from "@/lib/build";
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
  { id: "b", nickname: "Sara", characterId: "c02", isHost: false },
];

beforeEach(() => {
  calls.length = 0;
  useGameStore.getState().reset();
  useRoomStore.setState({ meId: "a", players, stage: "lobby", selectedTile: null });
});
afterEach(cleanup);

const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="en" messages={en}>{ui}</NextIntlClientProvider>);
const show = (s = snapshot(), busy = false) => useGameStore.setState({ active: true, snapshot: s, display: s, busy });

describe("center controls by phase", () => {
  it("awaitingRoll: the current player gets a gold Roll button, others see who is rolling", () => {
    show();
    wrap(<CenterControls />);
    fireEvent.click(screen.getByRole("button", { name: "Roll the dice" }));
    expect(calls).toEqual(["roll"]);
    cleanup();
    useRoomStore.setState({ meId: "b" });
    wrap(<CenterControls />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Waiting for Omar to roll")).toBeInTheDocument();
  });

  it("every button is disabled while the animation queue is busy", () => {
    show(snapshot(), true);
    wrap(<CenterControls />);
    expect(screen.getByRole("button", { name: "Roll the dice" })).toBeDisabled();
  });

  it("awaitingDecision: Buy for {price} and Skip; Buy is disabled with a note when cash is short", () => {
    const s = snapshot({ phase: "awaitingDecision", pendingDecision: { kind: "buy", tileIndex: 6, price: 90 } });
    show(s);
    wrap(<CenterControls />);
    fireEvent.click(screen.getByRole("button", { name: "Buy for 90 $" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(calls).toEqual(["buy", "skip"]);
    cleanup();

    const poor = snapshot({
      phase: "awaitingDecision",
      pendingDecision: { kind: "buy", tileIndex: 39, price: 400 },
      players: [{ ...s.players[0]!, cash: 100 }, s.players[1]!],
    });
    show(poor);
    wrap(<CenterControls />);
    expect(screen.getByRole("button", { name: "Buy for 400 $" })).toBeDisabled();
    expect(screen.getByText("Not enough cash")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip" })).toBeEnabled();
  });

  it("awaitingJailChoice: pay or stay; after 3 stays only pay, with the note", () => {
    const base = snapshot({ phase: "awaitingJailChoice" });
    show({ ...base, players: [{ ...base.players[0]!, inJail: true, position: 10, jailTurns: 1 }, base.players[1]!] });
    wrap(<CenterControls />);
    fireEvent.click(screen.getByRole("button", { name: "Pay 50 $ and leave" }));
    fireEvent.click(screen.getByRole("button", { name: "Stay in detention" }));
    expect(calls).toEqual(["jailPay", "jailStay"]);
    cleanup();

    show({ ...base, players: [{ ...base.players[0]!, inJail: true, position: 10, jailTurns: 3 }, base.players[1]!] });
    wrap(<CenterControls />);
    expect(screen.queryByRole("button", { name: "Stay in detention" })).toBeNull();
    expect(screen.getByRole("button", { name: "Pay 50 $ and leave" })).toBeEnabled();
    expect(screen.getByText("You must pay to leave after 3 turns")).toBeInTheDocument();
  });

  it("shows nothing once the game is over", () => {
    show(snapshot({ phase: "gameOver", winnerPlayerId: "a" }));
    wrap(<CenterControls />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("money counter", () => {
  it("counts to the new value and shows a floating +200 $ / -50 $", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
    try {
      const view = wrap(<MoneyCounter playerId="a" value={1500} />);
      expect(screen.getByText("1500 $")).toBeInTheDocument();
      act(() => useGameStore.setState({ floats: [{ id: 1, playerId: "a", delta: 200 }] }));
      view.rerender(
        <NextIntlClientProvider locale="en" messages={en}>
          <MoneyCounter playerId="a" value={1700} />
        </NextIntlClientProvider>,
      );
      expect(screen.getByText("+200 $")).toHaveClass("text-success");
      act(() => void vi.advanceTimersByTime(600));
      const mid = Number(screen.getByText(/^\d+ \$$/).textContent!.replace(/\D/g, ""));
      expect(mid).toBeGreaterThan(1500);
      expect(mid).toBeLessThan(1700);
      act(() => void vi.advanceTimersByTime(1500));
      expect(screen.getByText("1700 $")).toBeInTheDocument();
      expect(document.querySelector("[data-cash-for='a']")).toHaveAttribute("data-cash", "1700");

      act(() => useGameStore.setState({ floats: [{ id: 2, playerId: "a", delta: -50 }] }));
      expect(screen.getByText("-50 $")).toHaveClass("text-danger");
    } finally {
      vi.useRealTimers();
    }
  });

  it("only shows floats of its own player", () => {
    useGameStore.setState({ floats: [{ id: 1, playerId: "b", delta: 30 }] });
    wrap(<MoneyCounter playerId="a" value={1500} />);
    expect(screen.queryByText("+30 $")).toBeNull();
  });
});

describe("players card in a game", () => {
  it("replaces Change appearance with each player's cash, rings the current player and dims the bankrupt", () => {
    const s = snapshot();
    show({ ...s, players: [{ ...s.players[0]!, cash: 1234 }, { ...s.players[1]!, cash: 0, bankrupt: true }] });
    wrap(<PlayersCard />);
    expect(screen.queryByRole("button", { name: /Change appearance/ })).toBeNull();
    expect(screen.getByText("1234 $")).toBeInTheDocument();
    expect(document.querySelector("[data-player-row='a']")).toHaveAttribute("data-current", "true");
    expect(document.querySelector("[data-player-row='b']")).not.toHaveAttribute("data-current");
    expect(screen.getByText("Bankrupt")).toBeInTheDocument();
  });

  it("keeps Change appearance in the lobby", () => {
    wrap(<PlayersCard />);
    expect(screen.getByRole("button", { name: /Change appearance/ })).toBeInTheDocument();
  });
});

describe("build rules and the build menu", () => {
  const owning = (tiles: number[], level = 0, cash = 1500, current = "a") => {
    const s = snapshot({ currentPlayerId: current });
    s.players[0]!.cash = cash;
    for (const t of tiles) s.properties[t] = { ownerId: "a", level };
    return s;
  };

  it("buildCheck mirrors the engine rules", () => {
    expect(buildCheck(owning([1]), "a", 1, "house")).toBe("SET_INCOMPLETE");
    expect(buildCheck(owning([1, 3]), "a", 1, "house")).toBeNull();
    expect(buildCheck(owning([1, 3]), "a", 1, "hotel")).toBe("HOTEL_NEEDS_4_HOUSES");
    expect(buildCheck(owning([1, 3], 4), "a", 1, "house")).toBe("MAX_LEVEL");
    expect(buildCheck(owning([1, 3], 4), "a", 1, "hotel")).toBeNull();
    expect(buildCheck(owning([1, 3], 5), "a", 1, "hotel")).toBe("MAX_LEVEL");
    expect(buildCheck(owning([1, 3], 0, 100), "a", 1, "house")).toBe("INSUFFICIENT_FUNDS");
    expect(buildCheck(owning([1, 3], 4, 299), "a", 1, "hotel")).toBe("INSUFFICIENT_FUNDS");
    expect(buildCheck(owning([1, 3], 0, 1500, "b"), "a", 1, "house")).toBe("NOT_YOUR_TURN");
    expect(buildCheck(owning([1, 3]), "a", 5, "house")).toBe("NOT_OWNER"); // a harbor
    expect(buildCheck({ ...owning([1, 3]), phase: "gameOver" }, "a", 1, "house")).toBe("WRONG_PHASE");
  });

  /** Renders the board with this state and opens the info card of tile 1 (selection is reset between renders). */
  const openTile1 = (s: ReturnType<typeof snapshot>, busy = false) => {
    useRoomStore.setState({ selectedTile: null });
    show(s, busy);
    wrap(<Board interactive players={[]} />);
    fireEvent.click(document.querySelector("[data-tile='1']")!);
  };

  it("shows enabled house and hotel buttons with the costs when the rules allow, and sends build", async () => {
    openTile1(owning([1, 3], 4));
    const hotel = await screen.findByRole("button", { name: "Build a hotel (300 $)" });
    const house = screen.getByRole("button", { name: "Build a house (150 $)" });
    expect(hotel).toBeEnabled();
    expect(house).toBeDisabled(); // 4 houses is the house cap
    fireEvent.click(hotel);
    expect(calls).toEqual(["build:1:hotel"]);
  });

  it("disables both with the right hint for an incomplete set, a missing 4th house and the queue being busy", async () => {
    openTile1(owning([1]));
    expect(await screen.findByRole("button", { name: "Build a house (150 $)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Build a hotel (300 $)" })).toBeDisabled();
    expect(screen.getByText("Own every property of this country to build")).toBeInTheDocument();
    cleanup();

    openTile1(owning([1, 3], 2));
    expect(await screen.findByRole("button", { name: "Build a house (150 $)" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Build a hotel (300 $)" })).toBeDisabled();
    cleanup();

    openTile1(owning([1, 3], 2), true);
    expect(await screen.findByRole("button", { name: "Build a house (150 $)" })).toBeDisabled();
    cleanup();

    openTile1(owning([1, 3], 5));
    expect(await screen.findByRole("button", { name: "Build a hotel (300 $)" })).toBeDisabled();
    expect(screen.getByText("Maximum level reached")).toBeInTheDocument();
  });

  it("highlights the current rent row and offers no build menu on someone else's property", async () => {
    openTile1(owning([1, 3], 2));
    await screen.findByRole("dialog");
    const row = screen.getByText("With 2 houses").closest("tr")!;
    expect(row.className).toContain("bg-accent-soft");
    cleanup();

    const theirs = snapshot();
    theirs.properties[1] = { ownerId: "b", level: 0 };
    openTile1(theirs);
    await screen.findByRole("dialog");
    expect(document.querySelector("[data-build-menu]")).toBeNull();
    expect(screen.getByText("Sara")).toBeInTheDocument(); // owner shown
  });
});

const toRgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

describe("board marks", () => {
  it("shows pawns on their tile (tokenLayout sizes), the owner badge and the buildings", async () => {
    const s = snapshot();
    s.players = [
      { ...s.players[0]!, position: 5 },
      { ...s.players[1]!, position: 5 },
    ];
    s.properties[6] = { ownerId: "b", level: 3 };
    s.properties[39] = { ownerId: "a", level: 5 };
    show(s);
    const { container } = wrap(<Board interactive={false} players={[]} />);

    // both pawns stand on tile 5 and share it: each is smaller than a lone pawn (tokenLayout)
    const pawns = [...container.querySelectorAll<HTMLElement>("[data-pawn]")];
    expect(pawns).toHaveLength(2);
    expect(pawns.map((p) => p.dataset.tileIndex)).toEqual(["5", "5"]);
    const shared = Number.parseFloat(pawns[0]!.style.width);
    cleanup();
    show({ ...s, players: [{ ...s.players[0]!, position: 5 }, { ...s.players[1]!, position: 9 }] });
    const alone = wrap(<Board interactive={false} players={[]} />).container.querySelectorAll<HTMLElement>("[data-pawn]");
    expect(Number.parseFloat(alone[0]!.style.width)).toBeGreaterThan(shared);
    cleanup();
    show(s);
    const again = wrap(<Board interactive={false} players={[]} />).container;
    // a bought tile shows the owner's plate (their color + picture once) instead of the price
    const strips = [...again.querySelectorAll<HTMLElement>("[data-owner-plate]")];
    expect(strips).toHaveLength(2);
    expect(strips.every((p) => p.querySelectorAll("img").length === 1)).toBe(true);
    expect(again.querySelector("[data-owner-badge]")).toBeNull();
    const colorOf = (id: string) => (id === "a" ? "#4d4d58" : "#e0b84e");
    expect(strips.map((x) => x.style.backgroundColor).sort()).toEqual([colorOf("a"), colorOf("b")].map(toRgb).sort());
    // 3 houses on tile 6, a hotel on tile 39
    expect(again.querySelector("[data-buildings='3']")?.querySelectorAll("svg")).toHaveLength(3);
    expect(again.querySelector("[data-buildings='hotel']")).not.toBeNull();
  });

  it("a harbor and a utility show the owner's plate in place of the price too; unowned tiles keep their price", () => {
    const s = snapshot();
    s.properties[5] = { ownerId: "a", level: 0 };
    s.properties[12] = { ownerId: "b", level: 0 };
    show(s);
    const { container } = wrap(<Board interactive={false} players={[]} />);
    const plateOf = (i: number) => container.querySelector(`[aria-label^="${i === 5 ? "Aqaba" : "Solar"}"] [data-owner-plate]`);
    expect(plateOf(5)).not.toBeNull();
    expect(plateOf(12)).not.toBeNull();
    expect(container.querySelectorAll("[data-owner-plate]")).toHaveLength(2);
    expect(container.querySelector('[aria-label^="Aqaba"]')!.textContent).not.toContain("200 $"); // the price is gone
    expect(container.querySelector('[aria-label^="Tokyo"]')!.textContent).toContain("270 $"); // an unowned tile still shows it
  });

  it("a bankrupt player has no pawn and their properties are not shown as owned", () => {
    const s = snapshot();
    s.players = [{ ...s.players[0]!, position: 5, bankrupt: true }, { ...s.players[1]!, position: 5 }];
    show(s);
    const { container } = wrap(<Board interactive={false} players={[]} />);
    expect(container.querySelectorAll("[data-pawn]")).toHaveLength(1);
  });
});

describe("lobby start button", () => {
  it("the host can start with 2 players, others wait for the host", async () => {
    wrap(<Board interactive players={players as never} />);
    const start = screen.getByRole("button", { name: /Start game/ });
    expect(start).toBeEnabled();
    fireEvent.click(start);
    await waitFor(() => expect(calls).toEqual(["start"]));
    cleanup();

    useRoomStore.setState({ meId: "b" });
    wrap(<Board interactive players={players as never} />);
    expect(screen.queryByRole("button", { name: /Start game/ })).toBeNull();
    expect(screen.getByText("Waiting for the host to start")).toBeInTheDocument();
  });
});
