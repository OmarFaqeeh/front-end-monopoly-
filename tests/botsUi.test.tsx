// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const removed: string[] = [];
vi.mock("@/lib/roomClient", async (orig) => ({
  ...(await orig<typeof import("@/lib/roomClient")>()),
  removeBot: async (id: string) => (removed.push(id), null),
}));
vi.mock("@/lib/gameClient", () => ({ resignGame: async () => null }));

import PlayersCard from "@/components/room/PlayersCard";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import { snapshot } from "./helpers/game";

const players = [
  { id: "a", nickname: "Omar", characterId: "c01", isHost: true },
  { id: "b", nickname: "Jason", characterId: "c03", isHost: false, isBot: true },
  { id: "c", nickname: "Sara", characterId: "c11", isHost: false },
];
const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="en" messages={en}>{ui}</NextIntlClientProvider>);

beforeEach(() => {
  removed.length = 0;
  useGameStore.getState().reset();
  useRoomStore.setState({ meId: "a", players, stage: "lobby", botRefillAt: null, clockOffset: 0 });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("bots in the players card", () => {
  it("shows a Bot badge on bot rows only", () => {
    wrap(<PlayersCard />);
    expect(document.querySelectorAll("[data-bot-badge]")).toHaveLength(1);
    expect(document.querySelector("[data-player-row='b'] [data-bot-badge]")).toHaveTextContent("Bot");
    expect(document.querySelector("[data-player-row='c'] [data-bot-badge]")).toBeNull();
  });

  it("the host gets an X on bot rows (and only there) that removes the bot; it has an aria label and a tooltip", async () => {
    wrap(<PlayersCard />);
    const x = screen.getByRole("button", { name: "Remove Jason" });
    expect(x).toHaveAttribute("title", "Remove bot");
    expect(document.querySelectorAll("[data-remove-bot]")).toHaveLength(1); // not on humans
    fireEvent.click(x);
    await waitFor(() => expect(removed).toEqual(["b"]));
    // it is revealed on hover or keyboard focus (the row is a group); on touch screens it is always visible
    expect(x.className).toContain("group-hover:opacity-100");
    expect(x.className).toContain("group-focus-within:opacity-100");
    expect(x.className).toContain("[@media(hover:none)]:opacity-100");
  });

  it("guests never get the X, and nobody gets it once the game started", () => {
    useRoomStore.setState({ meId: "c" });
    wrap(<PlayersCard />);
    expect(document.querySelector("[data-remove-bot]")).toBeNull();
    cleanup();
    useRoomStore.setState({ meId: "a" });
    const g = snapshot({ players: ["a", "b", "c"].map((id, i) => ({ id, characterId: ["c01", "c03", "c11"][i]!, cash: 1500, position: 0, inJail: false, jailTurns: 0, bankrupt: false })) });
    useGameStore.setState({ active: true, snapshot: g, display: g });
    wrap(<PlayersCard />);
    expect(document.querySelector("[data-remove-bot]")).toBeNull();
    expect(document.querySelectorAll("[data-bot-badge]")).toHaveLength(1); // in a game bots look like players with the badge
  });

  it("shows 'A bot joins in Ns' while a refill is pending and counts down", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    useRoomStore.setState({ botRefillAt: Date.now() + 10_000 });
    wrap(<PlayersCard />);
    expect(screen.getByText("A bot joins in 10s")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(4_000));
    expect(screen.getByText("A bot joins in 6s")).toBeInTheDocument();
    act(() => useRoomStore.setState({ botRefillAt: null }));
    expect(document.querySelector("[data-bot-refill]")).toBeNull();
  });
});
