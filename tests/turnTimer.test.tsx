// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TurnBanner from "@/components/game/TurnBanner";
import en from "@/messages/en.json";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import { snapshot } from "./helpers/game";

const wrap = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <TurnBanner />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  useGameStore.getState().reset();
  useRoomStore.setState({ meId: "a", players: [{ id: "a", nickname: "Omar", characterId: "c01", isHost: true }, { id: "b", nickname: "Sara", characterId: "c11", isHost: false }] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("idle countdown in the turn banner", () => {
  it("counts down for the player on turn, turns urgent in the last 30 s and warns the player themself", () => {
    const g = snapshot();
    useGameStore.setState({ active: true, snapshot: g, display: g, turnTimer: { playerId: g.currentPlayerId!, endsAtLocal: Date.now() + 125_000 } });
    const { container } = wrap();
    act(() => void vi.advanceTimersByTime(1100));
    const banner = container.querySelector("[data-turn-banner]")!;
    expect(banner.querySelector("[data-idle-clock]")).toHaveTextContent("2:04");
    expect(banner.className).not.toContain("border-danger");
    act(() => void vi.advanceTimersByTime(100_000));
    expect(banner.querySelector("[data-idle-clock]")).toHaveTextContent("0:24");
    expect(banner.className).toContain("border-danger");
    expect(banner).toHaveTextContent("Play now or you will be removed"); // meId is the player on turn
  });

  it("shows nothing when nobody is timed or the timer belongs to someone else", () => {
    const g = snapshot();
    useGameStore.setState({ active: true, snapshot: g, display: g, turnTimer: null });
    const { container } = wrap();
    expect(container.querySelector("[data-idle-clock]")).toBeNull();
    act(() => useGameStore.setState({ turnTimer: { playerId: "someone-else", endsAtLocal: Date.now() + 60_000 } }));
    expect(container.querySelector("[data-idle-clock]")).toBeNull();
  });
});
